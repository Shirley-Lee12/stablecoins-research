# 数据库结构与 ER 关系（Database）

Drizzle ORM，连接 Supabase Postgres（`DATABASE_URL`）。Schema 源文件在 `lib/db/src/schema/*.ts`，统一从 `lib/db/src/schema/index.ts` 重新导出。

## 表结构

### `users`（`users.ts`）
```
id            serial PRIMARY KEY
email         text UNIQUE NOT NULL
name          text NOT NULL
password_hash text NOT NULL
role          user_role_enum NOT NULL DEFAULT 'user'   -- 'user' | 'admin'
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()
```

### `password_reset_tokens`（`users.ts`）
```
id         serial PRIMARY KEY
user_id    integer REFERENCES users(id) ON DELETE CASCADE
token      text UNIQUE NOT NULL
expires_at timestamptz NOT NULL
used       boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```
重置 token 有效期 1 小时；忘记密码接口在响应体里直接返回 token（没有接邮件服务，生产环境需要补充 SMTP）。

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

## ER 关系图（文字版）

```
users 1───* password_reset_tokens
users 1───* resources            (resources.created_by)
institutions 1───* authors        (authors.institution_id)
resources *───* authors            via resource_authors
our_research                      （独立表，不与其他表关联）
```

## 枚举全集

| 枚举 | 取值 | 用途 |
|---|---|---|
| `source_type` | `Paper`、`Report`、`Gov Document`、`News`、`Experts & Scholars` | `resources.source_type`，**必须精确使用这些字符串**（含空格、大小写） |
| `resource_status` | `pending`、`approved`、`rejected` | `resources.status`，内容审核工作流，详见 [`requirements.md`](./requirements.md) |
| `user_role` | `user`、`admin` | `users.role`，权限模型 |

## `resources.authors` ↔ `authors` 表的同步机制

`resources.authors` 是一个自由文本数组（前端直接编辑的字段），`authors` / `resource_authors` 是结构化的学者档案。两者通过 `artifacts/api-server/src/routes/authors.ts` 里的 `syncResourceAuthors(resourceId, authorNames)` 函数保持同步：每次创建/编辑 `resources.authors` 后都要调用它——按姓名 upsert 到 `authors` 表，并重建该 resource 在 `resource_authors` 里的关联行。**新增任何写 `resources.authors` 的代码路径时，必须同步调用这个函数**，否则学者档案和文献会脱钩。

## Schema 变更流程（操作规则，CLAUDE.md 中也有引用）

1. 编辑/新增 `lib/db/src/schema/<name>.ts`
2. 从 `lib/db/src/schema/index.ts` 重新导出
3. `pnpm run typecheck:libs`（`lib/db` 是 TS composite 项目，API server 读的是编译产物的类型声明，不是源码——跳过这一步会导致 `TS2305` "no exported member" 报错）
4. `pnpm --filter @workspace/api-server run typecheck`
5. `pnpm --filter @workspace/db run generate` 生成迁移 SQL，`migrate` 应用（生产环境安全）；`push` 仅限本地开发且需要 TTY
