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

- Express 5 + TypeScript，使用 esbuild（`build.mjs`）打包为 ESM 格式的 `dist/index.mjs`；构建时同时复制 PDF.js worker 到 `dist/pdf.worker.mjs`。
- 中间件链（`src/app.ts`）：`pino-http` 日志 → CORS 白名单 → 安全响应头 → 有大小限制的 JSON/表单解析 → 挂载 `/api` 路由。开发环境默认只额外允许 `localhost:5173` 和 `127.0.0.1:5173`，生产环境来源必须配置在 `CORS_ORIGIN`。
- 路由文件位于 `src/routes/*.ts`，在 `src/routes/index.ts` 中集中注册：`health`、`auth`、`resources`、`our_research`、`authors`、`admin`、`upload`、`tags`。
- 环境变量集中在 `src/config.ts`（zod 校验），启动时缺失任何必填项会直接抛错退出，不允许散落的 `process.env.X` 读取。
- `src/lib/llm.ts` 封装 LLM 调用（按 `env.LLM_PROVIDER` 切换供应商，目前只实现 `gemini`）：`generateJson()`/`generateJsonFromPdf()` 用于内容抽取；`embedText()` 用于标签打标的 embedding 相似度匹配（Gemini `gemini-embedding-001`）；`generateJsonWithSearch()` 用 Gemini 内置 Google Search grounding 做兜底网页搜索（上传管线反查链接用，无需额外搜索 API）。
- `src/lib/scholar/` 封装学术检索（U.1）：`crossref.ts`/`openalex.ts`/`semanticscholar.ts`/`doi.ts`/`unpaywall.ts` 各自包一个学术 API，统一返回 `ScholarResult`；`matching.ts` 提供标题/作者匹配的共享算法；`resolveLink.ts`（U.2）是反查链接的编排层。
- `src/lib/tagging.ts` 的 `computeTagsForText()`（核心打标函数）+ `retagResources()`（可重跑的全库打标）；`src/lib/verify.ts` 的 `verifyResource()`（U.4 核对）；`src/lib/resourceStatus.ts` 的 `determineResourceStatus()`（U.5 状态判定）；`src/lib/pdfExtract.ts` 的 `extractPdfText()`（本地 `pdf-parse` 抽字，OCR 兜底暂未启用）。详细管线设计见 [`api-design.md`](./api-design.md) "新版上传管线"。
- `src/lib/mailer.ts` 根据 `EMAIL_PROVIDER` 通过 Brevo 或 Microsoft Graph HTTPS API 发信，避免部署平台封锁 SMTP 端口。以上所有 lib 模块都只读 `config.ts` 的 `env`，不查数据库配置表。
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
| `/experts` | `experts.tsx` | 专家学者兼容路由（不在主导航展示；主要入口在资源页） |
| `/author/:id` | `author.tsx` | 学者个人主页 |
| `/regulatory` | `regulatory.tsx` | 监管现状 |
| `/quantitative`（及子路由 dimension-a/b） | `quantitative.tsx` | 量化指标 |
| `/market-data`（及子路由 price-tracking/trading-volume） | `market-data.tsx` | 市场数据 |
| `/admin` | `admin-center.tsx` | 管理中心（用户管理 + 文献审核，仅 admin） |
| `/reset-password` | `reset-password.tsx` | 密码重置 |
| — | `not-found.tsx` / `placeholder.tsx` | 404 / 占位页 |

> “专家学者”（Experts & Scholars）不在主导航单独展示，而是 `/academic-resources` 资源类型区域中的一个入口。它不是文献的 `source_type`；文献来源类型仍使用 7 个固定枚举。

### 导入管线（2026-08-22）

- 入口包括手动填写、DOI/URL、PDF、结构化题录、Word/Markdown 参考文献列表，以及文件夹批量导入。
- DOI（包括裸 DOI）优先并行查询 OpenAlex、Semantic Scholar、Crossref 与 doi.org，再合并可信度最高且最完整的题名、作者、年份、摘要和规范链接；出版商页面无法访问时，不会丢弃已取得的可信元数据。
- 关键词优先级为：原文提取 > 用户填写 > AI 根据题名和可信摘要生成。只有题名时也会生成 3–5 个可编辑关键词，但不会虚构摘要。
- LLM 的 JSON 输出统一做结构校验，空响应、截断或格式错误最多自动重试 3 次。
- Word/Markdown 列表先拆分并推断每条的 7 类资源类型，再由用户做一次整批预览；处理完成后可“一键提交全部完整条目”，不完整条目保留在队列中补充。
- 服务端限制：单个 PDF 最大 15MB、每批最多 5 个；单用户最多 25 个活跃任务、24 小时最多 100 个任务；前端会将较大的文件夹自动分批。
- 排队或处理中超过 30 分钟的任务会自动标记为中断，避免永久卡住。扫描版 PDF 的 OCR 暂未启用，仍可能需要人工补录。
- 2026-08-22 已清空此前所有历史/测试 `upload_jobs`（134 条），正式 `resources` 数据保持 10 条不变。

### Context hooks（`src/lib/`）

- **`useAuth()`**（`auth-context.tsx`）—— `{ user, token, isLoading, login, register, logout, forgotPassword, resetPassword }`。`user.role` 为 `'user' | 'admin'`。token 和 user 持久化到 `localStorage`（key: `auth-token` / `auth-user`）。对旧 token（签发于 role 字段加入之前）做了 `role` 回填兼容。
- **`useLanguage()`**（`language-context.tsx`）—— `{ language, setLanguage, t(en, zh) }`。`language` 持久化到 `localStorage` key `app-lang`，默认 `en`。
- **`useTheme()`**（`theme-context.tsx`）—— `{ theme, toggleTheme }`。初始值读 `localStorage` key `app-theme`，否则回退 `prefers-color-scheme`；之后纯靠 class 切换（在 `<html>` 上加/去 `dark` class），不再跟随系统媒体查询变化。

### API 调用

- Orval 生成的 hooks（`lib/api-client-react`）用于已经写入 `lib/api-spec/openapi.yaml` 的接口。
- `/api/resources`、`/api/our-research`、`/api/authors` 这类较新接口直接用 `fetch` / React Query `useQuery`，未进 OpenAPI spec。
- API base URL：开发环境用 `import.meta.env.BASE_URL`（Replit 代理路径），生产环境用 `VITE_API_BASE_URL`（Vercel → Render）。

## 环境变量

所有变量在 `artifacts/api-server/src/config.ts` 用 zod 集中校验（唯一真源），缺失必填项会在启动时直接 crash。完整列表 + 注释见根目录 [`.env.example`](../.env.example)。**所有密钥只存在于 `.env`，不进数据库，不进 git。**

| 变量 | 用途 |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） |
| `ADMIN_BOOTSTRAP_EMAILS` | 逗号分隔邮箱列表，命中则注册时自动给 `admin` 角色 |
| `LLM_PROVIDER` | `gemini`（已实现）\| `anthropic`（占位，未实现） |
| `LLM_API_KEY` / `LLM_MODEL` | AI 辅助导入用的模型 key / 模型名 |
| `EMAIL_PROVIDER` | 注册验证码 / 密码重置邮件提供商：`brevo` 或 `microsoft_graph` |
| `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | Brevo 模式的 HTTPS API 配置 |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_REFRESH_TOKEN` / `MICROSOFT_FROM_EMAIL` | Microsoft Graph 模式的 Outlook OAuth 配置 |
| `SCHOLAR_CONTACT_EMAIL` | Crossref/OpenAlex 礼貌池 + Unpaywall 必填的联系邮箱（上传管线 U.1 用，见 [`api-design.md`](./api-design.md)） |
| `SEMANTIC_SCHOLAR_API_KEY` | 可选，提升 Semantic Scholar 限流额度，不填用免费档 |
| `FRONTEND_URL` | 拼装邮件里的链接（如密码重置链接）用 |
| `CORS_ORIGIN` | 生产环境允许的前端来源；不设置则开发环境放行所有来源 |
| `LOG_LEVEL` | pino 日志级别 |
| `VITE_API_BASE_URL` | （前端 Vite 变量，非 api-server）生产环境前端访问后端的地址（Vercel → Render） |

管理后台 `/admin` 的"系统配置"标签页是这些变量的**只读状态展示**（`GET /api/admin/settings/status`），密钥只显示掩码（如 `••••3f2a`），不支持在线编辑——改配置必须改服务器的 `.env` 并重启。
