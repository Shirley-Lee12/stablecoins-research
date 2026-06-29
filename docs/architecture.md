# 系统架构（Architecture）

## Monorepo 目录结构

```
artifacts/
  api-server/       Express 5 后端  → /api/*
  stablecoin-hub/   React + Vite 前端 → /
  mockup-sandbox/   设计沙盒（生产环境忽略）
lib/
  db/               Drizzle ORM schema + Supabase Postgres 连接
  api-spec/         OpenAPI 规范（codegen 的唯一真源）
  api-client-react/ Orval 生成的 React Query hooks
  api-zod/          根据 OpenAPI 规范自动生成的 Zod schema
scripts/            工具脚本
```

## 后端（`artifacts/api-server`）

- Express 5 + TypeScript，使用 esbuild（`build.mjs`）打包为 `dist/index.mjs`（CJS）。
- 中间件链（`src/app.ts`）：`pino-http` 日志 → CORS（`CORS_ORIGIN` 环境变量限制生产环境来源，未设置则放行所有来源）→ `express.json()` → 挂载 `/api` 路由。
- 路由文件位于 `src/routes/*.ts`，在 `src/routes/index.ts` 中集中注册：`health`、`auth`、`resources`、`our_research`、`authors`。
- 鉴权中间件（定义在 `src/routes/auth.ts`，被其他路由文件导入）：
  - `requireAuth` —— 校验 Bearer JWT，401 if 无效/缺失。
  - `optionalAuth` —— 有 token 则解析挂到 `req.user`，无 token 不报错（用于按角色区分可见性的接口，如 `GET /api/resources`）。
  - `requireAdmin` —— 要求 `req.user.role === "admin"`，403 否则。

## 数据库

详见 [`database.md`](./database.md)。

## API 设计

详见 [`api-design.md`](./api-design.md)。

## 前端（`artifacts/stablecoin-hub`）

技术栈：React + Vite + Tailwind + shadcn/ui（Radix 组件）+ Wouter 路由。

### 页面路由（`src/pages/`，导航定义在 `src/components/layout.tsx` 的 `NAV_ITEMS` / `ROUTE_LABELS`）

| 路由 | 文件 | 说明 |
|---|---|---|
| `/` | `home-overview.tsx` | 中心概览 |
| `/dashboard` | `dashboard.tsx` | 数据仪表盘 |
| `/about-stablecoins`（及四个子路由：history/types/applications/regulatory-evolution） | — | 关于稳定币 |
| `/research` | `research.tsx` | ZIBS 自有研究 |
| `/academic-resources` | `academic-resources.tsx` | 全球文献库（主资源页） |
| `/experts` | `experts.tsx` | 专家学者列表 |
| `/author/:id` | `author.tsx` | 学者个人主页 |
| `/regulatory` | `regulatory.tsx` | 监管现状 |
| `/quantitative`（及子路由 dimension-a/b） | `quantitative.tsx` | 量化指标 |
| `/market-data`（及子路由 price-tracking/trading-volume） | `market-data.tsx` | 市场数据 |
| `/admin` | `admin-center.tsx` | 管理中心（用户管理 + 文献审核，仅 admin） |
| `/reset-password` | `reset-password.tsx` | 密码重置 |
| — | `not-found.tsx` / `placeholder.tsx` | 404 / 占位页 |

> "专家学者"（Experts & Scholars）不是独立的侧边栏导航项的同时，也是 `source_type` 的一个枚举取值，用于 `/academic-resources` 内的来源类型过滤。

### Context hooks（`src/lib/`）

- **`useAuth()`**（`auth-context.tsx`）—— `{ user, token, isLoading, login, register, logout, forgotPassword, resetPassword }`。`user.role` 为 `'user' | 'admin'`。token 和 user 持久化到 `localStorage`（key: `auth-token` / `auth-user`）。对旧 token（签发于 role 字段加入之前）做了 `role` 回填兼容。
- **`useLanguage()`**（`language-context.tsx`）—— `{ language, setLanguage, t(en, zh) }`。`language` 持久化到 `localStorage` key `app-lang`，默认 `en`。
- **`useTheme()`**（`theme-context.tsx`）—— `{ theme, toggleTheme }`。初始值读 `localStorage` key `app-theme`，否则回退 `prefers-color-scheme`；之后纯靠 class 切换（在 `<html>` 上加/去 `dark` class），不再跟随系统媒体查询变化。

### API 调用

- Orval 生成的 hooks（`lib/api-client-react`）用于已经写入 `lib/api-spec/openapi.yaml` 的接口。
- `/api/resources`、`/api/our-research`、`/api/authors` 这类较新接口直接用 `fetch` / React Query `useQuery`，未进 OpenAPI spec。
- API base URL：开发环境用 `import.meta.env.BASE_URL`（Replit 代理路径），生产环境用 `VITE_API_BASE_URL`（Vercel → Render）。

## 环境变量

| 变量 | 用途 |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL 连接串 |
| `SESSION_SECRET` / `JWT_SECRET` | JWT 签名密钥（服务端优先读 `JWT_SECRET`，否则回退 `SESSION_SECRET`） |
| `GOOGLE_API_KEY` | `/api/resources/import` 用的 Gemini API key |
| `CORS_ORIGIN` | 生产环境允许的前端来源（Render） |
| `VITE_API_BASE_URL` | 生产环境前端访问后端的地址（Vercel → Render） |
