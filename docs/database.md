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
id                  serial PRIMARY KEY
title               text NOT NULL
authors             text[] NOT NULL DEFAULT '{}'
source_type         source_type_enum NOT NULL DEFAULT 'journal_article'
url                 text
doi                 text
abstract            text
tags                text[] NOT NULL DEFAULT '{}'          -- 旧版自由标签，逐步被 tags/resource_tags 结构化标签取代
keywords            text[] NOT NULL DEFAULT '{}'          -- 文献自带的关键词，自由文本，不是受控词表（区别于 tags）
keywords_source     text                                   -- 'extracted'(原文提取) | 'generated'(AI生成) | 'manual'(用户手填)，为空只能对应 keywords=[]
status              resource_status_enum NOT NULL DEFAULT 'pending'   -- 七值枚举，见下方"枚举全集"表
created_by          integer REFERENCES users(id) ON DELETE SET NULL
created_at          timestamptz NOT NULL DEFAULT now()
published_date      text                                   -- 文献自身发表日期（自由文本，如"2021"或"2021-07-20"），不同于 created_at
rejection_reason_id integer REFERENCES rejection_reasons(id) ON DELETE SET NULL
rejection_note      text
reviewed_by         integer REFERENCES users(id) ON DELETE SET NULL
reviewed_at         timestamptz
admin_edited        boolean NOT NULL DEFAULT false          -- 管理员是否直接编辑过字段（docs/planning/15 §2.4，粗粒度标记）
```
`keywords`/`keywords_source`（docs/planning/15 §5）：题录导入(CNKI K1/EndNote %K/NoteExpress Keywords) 与 PDF/URL 抽取的"关键词:"/"Keywords:"章节 → `extracted`；用户手填或事后编辑（`PATCH /api/resources/:id` 带 `keywords` 字段，无论编辑者是所有者还是管理员）→ `manual`；原文没有关键词章节且用户没手填时，允许（非强制）LLM 从摘要提炼 3-5 个 → `generated`，前端必须给 `generated` 来源打上明显的"AI生成"标注。六要素完整性判定里，`keywords` 只要非空就算满足，不区分来源。

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
category   text                       -- 六大类 slug（如 types_mechanisms），仅 theme facet 使用，见 docs/planning/15 §3.2/§3.3
status     tag_status_enum NOT NULL DEFAULT 'active'   -- 'active' | 'candidate'
created_at timestamptz NOT NULL DEFAULT now()
```
种子数据：`scripts/src/seed-tags.ts`（`pnpm --filter @workspace/scripts run seed-tags`，按 slug 幂等），37 个 theme + 16 个 jurisdiction + 15 个 asset，全部 `status=active`。`candidate` 状态的行由 `retagResources()`（见下）在打标时自动创建，不在种子脚本里。theme 标签的 `category` 由 `scripts/src/backfill-tag-categories.ts` 一次性回填（`pnpm --filter @workspace/scripts run backfill-tag-categories`，按 slug 幂等，只更新 `category IS NULL` 的行）。

理论背景标签（docs/planning/16）：33 个稳定币专属主题标签之外，另加 4 个理论背景标签——`shadow-banking`/`money-market-funds`（归入 `types_mechanisms`）、`crypto-asset-foundations`/`blockchain-foundations`（归入 `tech_infrastructure`），theme 总数 33→37。背景：`off_topic` 判定只看"主题标签有没有命中"，稳定币研究大量借鉴影子银行/货币市场基金/加密资产/区块链基础理论，这类背景文献天然命中不了原来 33 个稳定币专属标签，会被误判跑题；修法不是放宽 `off_topic` 阈值，是承认这四类背景领域本身该是正式标签。`off_topic` 判定逻辑本身没有改动——`loadTagVocabulary()`/`computeTagsForText()` 全程从 `tags` 表动态读取 `facet='theme' AND status='active'` 的行，没有任何地方硬编码标签数量，词表扩大后自动生效。

### `resource_tags`（`tags.ts`）—— resources ↔ tags 多对多关联表
```
id          serial PRIMARY KEY
resource_id integer NOT NULL REFERENCES resources(id) ON DELETE CASCADE
tag_id      integer NOT NULL REFERENCES tags(id) ON DELETE CASCADE
source      resource_tag_source_enum NOT NULL DEFAULT 'auto'   -- 'auto' | 'manual'
score       numeric(5,4)             -- 加权（标题60%+摘要40%）后的相似度分数，仅 theme facet 的 auto 行有值；从未计算过分数的 manual 行为 null（auto 行被管理员改成 manual 后分数保留，不清空）。用于列表页选取"最核心一级标签"，见 docs/planning/15 §3.5/§3.6
UNIQUE (resource_id, tag_id)
```
`source='manual'` 的行（管理员手动加的标签）永远不会被 `retagResources()` 重跑覆盖；重跑只清空重建 `source='auto'` 的行。由于 `(resource_id, tag_id)` 是唯一约束（不区分 source），同一对资源-标签只能存在一条记录——manual 优先于 auto：重跑时如果某个 auto 匹配命中的标签已经有 manual 记录，insert 会因唯一冲突被 `onConflictDoNothing` 跳过，manual 记录原样保留。

> **当前状态（2026-07-03）**：表结构 + 种子数据已就绪，T.5（前端按 facet 渲染）已完成，`GET /api/resources`/`GET /api/resources/:id` 已返回 `facetedTags`（含 `category`/`score`）。新上传管线（U.6）每次确认入库都会写入 `resource_tags`（`source='auto'`）。`retagResources()`/`POST /api/admin/tags/retag` 用于词表变更后的全库重打标，目前库里还没有真实资源数据，尚未实际触发过。`resources.tags text[]` 仍保留作为旧资源的兼容兜底（前端卡片优先显示 `facetedTags`，没有才回退显示它）。主题标签相似度打分改为标题+摘要加权（`TITLE_WEIGHT`/`ABSTRACT_WEIGHT` 常量，`artifacts/api-server/src/lib/tagging.ts`），资源列表侧边栏的 theme facet 改为按 `category` 折叠的两级树（默认全部折叠）。

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
| `source_type` | `journal_article`、`working_paper`、`conference_paper`、`thesis`、`report`、`gov_document`、`news` | `resources.source_type`，语言无关 slug，**必须精确使用这些字符串**；前端按当前语言映射 nameZh/nameEn 展示，详见 [`08-sourceType最终枚举.md`](./planning/08-sourceType最终枚举.md) |
| `resource_status` | `incomplete`、`disputed`、`off_topic`、`duplicate`、`pending`、`approved`、`rejected` | `resources.status`，七值状态机（docs/planning/15 §0.9），只有 `approved` 出现在公开 Resources 页面，详见 [`database.md`](#resources-resourcests--全球文献库) 上方表定义和 [`requirements.md`](./requirements.md) |
| `user_role` | `user`、`admin` | `users.role`，权限模型 |
| `upload_job_type` | `pdf`、`url`、`citation`、`title` | `upload_jobs.type`——`citation` 是题录导入(docs/planning/06/14)，`title` 是文件夹批量导入里没有 URL/DOI、走标题搜索路径的条目(docs/planning/14 §3.3) |
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
