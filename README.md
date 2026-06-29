# ZIBS 稳定币研究中心 · 研究平台

浙江大学国际联合商学院（ZIBS）稳定币研究中心的双语（中/英）学术研究平台。用于发布研究成果、策展全球稳定币相关文献，并向学术访问者展示监管与市场数据。

> 给开发者/协作者的快速上手参考。详细的开发规则见 [`CLAUDE.md`](./CLAUDE.md)，详细的架构/数据库/API/产品设计见 [`docs/`](./docs/)。

## 技术栈

| 层 | 技术 |
|---|---|
| 运行环境 | Node.js 24, pnpm workspaces |
| 后端 | Express 5, TypeScript 5.9, esbuild |
| 前端 | React + Vite, Tailwind CSS, shadcn/ui, Wouter（路由） |
| 数据库 | PostgreSQL (Supabase) + Drizzle ORM |
| 鉴权 | 自定义 JWT（jose）+ bcrypt —— Bearer token，不用 cookie |
| API 代码生成 | Orval（OpenAPI → React Query hooks + Zod schema） |

## 目录速览

```
artifacts/
  api-server/       Express 5 后端  → /api/*
  stablecoin-hub/   React + Vite 前端 → /
  mockup-sandbox/   设计沙盒（生产环境忽略）
lib/
  db/               Drizzle ORM schema + Supabase 连接
  api-spec/         OpenAPI 规范（codegen 的唯一真源）
  api-client-react/ Orval 生成的 React Query hooks
  api-zod/          Orval 生成的 Zod schema
scripts/            工具脚本
docs/               架构、数据库、API、产品需求等详细文档
```

## 常用命令

```bash
# 全量 typecheck
pnpm run typecheck

# 仅 typecheck libs（lib/db schema 改动后必须先跑这个）
pnpm run typecheck:libs

# build（typecheck + build 全部包）
pnpm run build

# 运行 API server（端口 5000）
pnpm --filter @workspace/api-server run dev

# 运行前端
pnpm --filter @workspace/stablecoin-hub run dev

# 修改 lib/api-spec/openapi.yaml 后重新生成 hooks + Zod schema
pnpm --filter @workspace/api-spec run codegen

# DB schema 改动
pnpm --filter @workspace/db run generate   # 生成迁移 SQL
pnpm --filter @workspace/db run migrate    # 应用迁移
pnpm --filter @workspace/db run push       # 仅本地开发，需要 TTY
```

只用 pnpm（根目录 `preinstall` 脚本会拒绝 npm/yarn）；不要在根目录跑 `pnpm dev`，用各包的 `--filter` 命令。仓库目前没有测试套件，验证靠 `typecheck`/`build`。

## 深入阅读

- 开发规则与不可违反的约束 → [`CLAUDE.md`](./CLAUDE.md)
- 产品需求与业务逻辑 → [`docs/requirements.md`](./docs/requirements.md)
- 系统架构、目录细节、前端 context hooks → [`docs/architecture.md`](./docs/architecture.md)
- 数据库表结构与 ER 关系 → [`docs/database.md`](./docs/database.md)
- API 路由清单与设计细节 → [`docs/api-design.md`](./docs/api-design.md)
- 页面设计规范（主题/配色/导航/i18n） → [`docs/ui-guidelines.md`](./docs/ui-guidelines.md)
- 开发计划 → [`docs/roadmap.md`](./docs/roadmap.md)
