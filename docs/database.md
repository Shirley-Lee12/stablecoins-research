# 数据库结构与 ER 关系（Database）

Drizzle ORM，连接 Supabase Postgres（`DATABASE_URL`）。Schema 源文件在 `lib/db/src/schema/*.ts`，统一从 `lib/db/src/schema/index.ts` 重新导出。

## 表结构

### `users`（`users.ts`）
```
id              serial PRIMARY KEY
email           text UNIQUE NOT NULL
name            text NOT NULL
password_hash   text NOT NULL
role            user_role_enum NOT NULL DEFAULT 'user'   -- 'user' | 'admin'
email_verified  boolean NOT NULL DEFAULT true
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```
新注册用户 `email_verified` 初始为 `false`，登录前必须通过验证码校验（见下方 `email_verification_codes`）；default `true` 是为了让历史/手动插入的用户行不被追溯性锁住。

### `password_reset_tokens`（`users.ts`）
```
id         serial PRIMARY KEY
user_id    integer REFERENCES users(id) ON DELETE CASCADE
token      text UNIQUE NOT NULL
expires_at timestamptz NOT NULL
used       boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```
重置 token 有效期 1 小时，通过邮件（`src/lib/mailer.ts` → `sendPasswordResetEmail`）发送重置链接，不在 API 响应体里直接返回 token。

### `email_verification_codes`（`users.ts`）
```
id         serial PRIMARY KEY
user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE
code       text NOT NULL          -- 6 位数字验证码
expires_at timestamptz NOT NULL
used       boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```
验证码有效期 10 分钟，通过邮件（`sendVerificationCodeEmail`）发送。注册时若发信失败会回滚刚插入的 `users` 行，让用户能干净地重新注册。

### `resources`（`resources.ts`）—— 全球文献库
```
id          serial PRIMARY KEY
title       text NOT NULL
authors     text[] NOT NULL DEFAULT '{}'
source_type source_type_enum NOT NULL DEFAULT 'Paper'
url         text
doi         text
abstract    text
tags        text[] NOT NULL DEFAULT '{}'
status      resource_status_enum NOT NULL DEFAULT 'pending'   -- 'pending' | 'approved' | 'rejected'
created_by  integer REFERENCES users(id) ON DELETE SET NULL
created_at  timestamptz NOT NULL DEFAULT now()
```

### `our_research`（`our_research.ts`）—— ZIBS 自有研究
```
id               serial PRIMARY KEY
title            text NOT NULL
file_url         text
abstract         text
key_innovations  text[] NOT NULL DEFAULT '{}'
tags             text[] NOT NULL DEFAULT '{}'
uploaded_at      timestamptz NOT NULL DEFAULT now()
```

### `institutions`（`authors.ts`）
```
id         serial PRIMARY KEY
name       text UNIQUE NOT NULL
country    text
created_at timestamptz NOT NULL DEFAULT now()
```

### `authors`（`authors.ts`）—— 学者档案
```
id                  serial PRIMARY KEY
name                text NOT NULL
institution_id      integer REFERENCES institutions(id) ON DELETE SET NULL
research_interests  text[] NOT NULL DEFAULT '{}'
bio                 text
created_at          timestamptz NOT NULL DEFAULT now()
UNIQUE (name, institution_id)
```

### `resource_authors`（`authors.ts`）—— resources ↔ authors 多对多关联表
```
id          serial PRIMARY KEY
resource_id integer NOT NULL REFERENCES resources(id) ON DELETE CASCADE
author_id   integer NOT NULL REFERENCES authors(id) ON DELETE CASCADE
UNIQUE (resource_id, author_id)
```

### `tags`（`tags.ts`）—— 结构化标签（替代 `resources.tags` 自由文本数组）
```
id         serial PRIMARY KEY
slug       text UNIQUE NOT NULL
name_en    text NOT NULL
name_zh    text NOT NULL
facet      tag_facet_enum NOT NULL    -- 'theme' | 'jurisdiction' | 'asset'
definition text                       -- 定义句，theme facet 做 embedding 相似度匹配用
region     text                       -- 'Americas'|'Europe'|'APAC'|'Middle East'|'Africa'|'Global'，仅 jurisdiction facet 使用
status     tag_status_enum NOT NULL DEFAULT 'active'   -- 'active' | 'candidate'
created_at timestamptz NOT NULL DEFAULT now()
```
种子数据：`scripts/src/seed-tags.ts`（`pnpm --filter @workspace/scripts run seed-tags`，按 slug 幂等），33 个 theme + 16 个 jurisdiction + 15 个 asset，全部 `status=active`。`candidate` 状态的行由 `retagResources()`（见下）在打标时自动创建，不在种子脚本里。

### `resource_tags`（`tags.ts`）—— resources ↔ tags 多对多关联表
```
id          serial PRIMARY KEY
resource_id integer NOT NULL REFERENCES resources(id) ON DELETE CASCADE
tag_id      integer NOT NULL REFERENCES tags(id) ON DELETE CASCADE
source      resource_tag_source_enum NOT NULL DEFAULT 'auto'   -- 'auto' | 'manual'
UNIQUE (resource_id, tag_id)
```
`source='manual'` 的行（管理员手动加的标签）永远不会被 `retagResources()` 重跑覆盖；重跑只清空重建 `source='auto'` 的行。由于 `(resource_id, tag_id)` 是唯一约束（不区分 source），同一对资源-标签只能存在一条记录——manual 优先于 auto：重跑时如果某个 auto 匹配命中的标签已经有 manual 记录，insert 会因唯一冲突被 `onConflictDoNothing` 跳过，manual 记录原样保留。

> **当前状态（2026-06-30）**：表结构 + 种子数据已就绪，T.5（前端按 facet 渲染）已完成，`GET /api/resources`/`GET /api/resources/:id` 已返回 `facetedTags`。新上传管线（U.6）每次确认入库都会写入 `resource_tags`（`source='auto'`）。`retagResources()`/`POST /api/admin/tags/retag` 用于词表变更后的全库重打标，目前库里还没有真实资源数据，尚未实际触发过。`resources.tags text[]` 仍保留作为旧资源的兼容兜底（前端卡片优先显示 `facetedTags`，没有才回退显示它）。

### `upload_jobs`（`upload_jobs.ts`）—— 批量/PDF 上传的异步进度记录（不是已导入的资源）
```
id         serial PRIMARY KEY
type       upload_job_type_enum NOT NULL      -- 'pdf' | 'url'
status     upload_job_status_enum NOT NULL DEFAULT 'queued'   -- 'queued' | 'processing' | 'ready_for_review' | 'failed'
input      jsonb NOT NULL    -- { fileName, sourceTypeHint } 或 { url, sourceTypeHint }；PDF 二进制从不写入这里
result     jsonb             -- 流水线跑完后的候选数据（draft + tags + 核对报告），处理中为 null
error      text
created_by integer NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**这张表不受"AI 解析结果不允许直接写库"规则约束的对象始终不是 `resources`**——`upload_jobs` 只是给批量/PDF 这种"耗时且可能关闭页面"的场景提供进度持久化（前端轮询 `GET /api/resources/upload/jobs`），`result` 里的候选数据只有用户在确认弹窗里点击确认（`POST /api/resources/upload/jobs/:id/confirm`）后才会变成真正的 `resources` 行，随后该 `upload_jobs` 行被删除。单条手填/DOI·URL 走纯内存同步流水线，完全不经过这张表。

## ER 关系图（文字版）

```
users 1───* password_reset_tokens
users 1───* email_verification_codes
users 1───* resources            (resources.created_by)
users 1───* upload_jobs           (upload_jobs.created_by)
institutions 1───* authors        (authors.institution_id)
resources *───* authors            via resource_authors
resources *───* tags               via resource_tags
our_research                      （独立表，不与其他表关联）
```

## 枚举全集

| 枚举 | 取值 | 用途 |
|---|---|---|
| `source_type` | `Paper`、`Report`、`Gov Document`、`News`、`Experts & Scholars` | `resources.source_type`，**必须精确使用这些字符串**（含空格、大小写） |
| `resource_status` | `pending`、`approved`、`rejected`、`needs_review`、`failed` | `resources.status`，内容审核工作流 + 上传管线核对结果，详见 [`requirements.md`](./requirements.md) 和 [`api-design.md`](./api-design.md) |
| `user_role` | `user`、`admin` | `users.role`，权限模型 |
| `upload_job_type` | `pdf`、`url` | `upload_jobs.type` |
| `upload_job_status` | `queued`、`processing`、`ready_for_review`、`failed` | `upload_jobs.status`，与 `resource_status` 是两套独立枚举，不要混用 |
| `tag_facet` | `theme`、`jurisdiction`、`asset` | `tags.facet`，标签三大分面，详见 [`roadmap.md`](./roadmap.md) Part 3 |
| `tag_status` | `active`、`candidate` | `tags.status`，`active` 进正式聚合，`candidate` 是 AI 打标时映射不进任何 active 标签的候选词，等人工审核 |
| `resource_tag_source` | `auto`、`manual` | `resource_tags.source`，区分 AI 重打标生成的关联 vs 管理员手动添加的关联，重跑时只覆盖 `auto` |

## `resources.authors` ↔ `authors` 表的同步机制

`resources.authors` 是一个自由文本数组（前端直接编辑的字段），`authors` / `resource_authors` 是结构化的学者档案。两者通过 `artifacts/api-server/src/routes/authors.ts` 里的 `syncResourceAuthors(resourceId, authorNames)` 函数保持同步：每次创建/编辑 `resources.authors` 后都要调用它——按姓名 upsert 到 `authors` 表，并重建该 resource 在 `resource_authors` 里的关联行。**新增任何写 `resources.authors` 的代码路径时，必须同步调用这个函数**，否则学者档案和文献会脱钩。

## Schema 变更流程（操作规则，CLAUDE.md 中也有引用）

1. 编辑/新增 `lib/db/src/schema/<name>.ts`
2. 从 `lib/db/src/schema/index.ts` 重新导出
3. `pnpm run typecheck:libs`（`lib/db` 是 TS composite 项目，API server 读的是编译产物的类型声明，不是源码——跳过这一步会导致 `TS2305` "no exported member" 报错）
4. `pnpm --filter @workspace/api-server run typecheck`
5. `pnpm --filter @workspace/db run generate` 生成迁移 SQL，`migrate` 应用（生产环境安全）；`push` 仅限本地开发且需要 TTY
