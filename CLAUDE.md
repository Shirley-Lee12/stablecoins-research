# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件只保存**长期有效的开发规则**（项目宪法）。具体的架构、数据库设计、API 细节、产品需求等会随项目演进变化的内容，记录在 [`docs/`](./docs/) 目录中——更新产品需求或设计细节时，优先改 `docs/`，不要把这些内容堆进本文件。

## 项目定位

ZIBS（浙江大学国际联合商学院）稳定币研究中心的双语（中/英）学术研究平台。详细产品背景见 [`docs/requirements.md`](./docs/requirements.md)。

## 模块职责边界（pnpm workspaces）

- `artifacts/api-server` —— Express 5 后端，只负责 `/api/*`
- `artifacts/stablecoin-hub` —— React + Vite 前端
- `artifacts/mockup-sandbox` —— 设计沙盒，不进生产
- `lib/db` —— Drizzle ORM schema + Supabase 连接，是数据库结构的唯一真源
- `lib/api-spec` —— OpenAPI 规范，是 API 契约的唯一真源
- `lib/api-client-react` / `lib/api-zod` —— 由 `lib/api-spec` 通过 Orval 生成，不手写
- `scripts` —— 工具脚本

详细目录结构与各模块内部细节见 [`docs/architecture.md`](./docs/architecture.md)。

## 常用命令

```bash
# 全量 typecheck（完成任务前必须跑）
pnpm run typecheck

# 仅 typecheck libs —— 任何 lib/db schema 改动后，必须先跑这个再 typecheck api-server
pnpm run typecheck:libs

# build（typecheck + build 全部包）
pnpm run build

# 运行 API server（端口 5000）
pnpm --filter @workspace/api-server run dev

# 运行前端
pnpm --filter @workspace/stablecoin-hub run dev

# 修改 lib/api-spec/openapi.yaml 后，重新生成 API hooks + Zod schema
pnpm --filter @workspace/api-spec run codegen

# DB schema 改动
pnpm --filter @workspace/db run generate   # 生成迁移 SQL
pnpm --filter @workspace/db run migrate    # 应用迁移（生产安全）
pnpm --filter @workspace/db run push       # 仅本地开发，需要 TTY
```

仓库目前没有测试套件——验证手段是 `pnpm run typecheck` / `pnpm run build`。

**不要在根目录跑 `pnpm dev`** —— 用各包的 `--filter` 命令（本仓库在 Replit workflows 下运行）。

只用 pnpm —— 根目录 `preinstall` 脚本会拒绝 npm/yarn。

## 开发原则（不可违反）

1. **新增 API 路由**必须同时：创建路由文件 + 在 `artifacts/api-server/src/routes/index.ts` 注册。漏注册路由不会生效。
2. **任何 `lib/db/src/schema/` 改动**，必须先 `pnpm run typecheck:libs` 再跑 api-server 的 typecheck —— `lib/db` 是 TS composite 项目，api-server 读的是编译产物的类型声明而非源码，跳过会导致 `TS2305` 报错。
3. **AI 辅助内容导入**（如 `/api/resources/import`）必须遵循"解析 → 前端可编辑确认 → 用户显式触发持久化"两步模式，AI 解析结果不允许直接写库。未来新增的 AI 导入功能也要遵循这个模式。
4. **写 `resources.authors` 字段的任何代码路径**，必须同步调用 `syncResourceAuthors()` 维护 `authors`/`resource_authors` 表，否则学者档案会与文献脱钩。细节见 [`docs/database.md`](./docs/database.md)。

## 编码规范

- 服务端**禁止 `console.log`** —— 路由处理函数里用 `req.log`，其他地方用 `logger` 单例。
- 鉴权用自定义 JWT（`jose`）+ bcrypt —— **不是** session cookie，**不是** Clerk。不要给 CORS 加 `credentials: true`，不要引入 cookie-based session。
- 前端所有用户可见文案必须包 `t(en, zh)`（来自 `useLanguage()`），禁止硬编码单一语言字符串。
- 主题切换是 class-based（`<html>` 加/去 `dark` class），不要改用 Tailwind 的 `darkMode: 'media'`。

## 数据库设计原则

- `resources.source_type` 存语言无关 slug，7 个：`journal_article`、`working_paper`、`conference_paper`、`thesis`、`report`、`gov_document`、`news`（专家学者不算资源类型，属于 authors 模块）。前端按当前语言显示 nameZh/nameEn，不要把 sourceType 存成中英文字符串。详见 [`docs/planning/08-sourceType最终枚举.md`](./docs/planning/08-sourceType最终枚举.md)。
- `resources.status` 枚举有 5 个值：`pending`/`approved`/`rejected`（早期审核工作流三态）+ `needs_review`/`failed`（上传管线 U.5 后补的两态）。是内容审核工作流的核心字段，不是普通状态位——改动相关逻辑前必须确认不会破坏审核语义，详见 [`docs/requirements.md`](./docs/requirements.md) 和 [`docs/api-design.md`](./docs/api-design.md)。**`failed` 目前应用代码从不会真正赋给任何一行**——硬性必填字段（标题/作者/年份）缺失时，`persistConfirmedDraft()` 会直接拒绝这次确认（400），不会插入一条 `status='failed'` 的资源；`failed` 只属于 `upload_jobs.status`，枚举里保留这个值只是历史遗留，不代表会被用到。
- Schema 变更标准流程：编辑 schema 文件 → 在 `lib/db/src/schema/index.ts` 重新导出 → `typecheck:libs` → api-server `typecheck` → `generate`/`migrate`。

## 测试要求

仓库无测试套件。验证一律以 `pnpm run typecheck` 和 `pnpm run build` 为准；UI 改动需实际跑前端验证交互。

## 不可违反的业务规则

- **禁止使用金色** —— 主色调统一为海洋蓝（ocean blue）。
- **禁止使用 emoji** —— 除非用户明确要求。
- 双语字符串永远通过 `t(en, zh)`，不允许只写一种语言。

## 详细文档索引

| 文件 | 内容 |
|---|---|
| [`docs/requirements.md`](./docs/requirements.md) | 产品需求、目标用户、审核工作流业务逻辑 |
| [`docs/architecture.md`](./docs/architecture.md) | 系统架构、目录结构、前端页面/context 细节、环境变量 |
| [`docs/database.md`](./docs/database.md) | 数据库表结构、ER 关系、枚举全集 |
| [`docs/api-design.md`](./docs/api-design.md) | 路由清单、AI 导入流程细节、OpenAPI/codegen 现状 |
| [`docs/ui-guidelines.md`](./docs/ui-guidelines.md) | 主题/配色实现细节、导航结构、i18n |
| [`docs/roadmap.md`](./docs/roadmap.md) | 开发计划（待补充） |
