# API 设计说明（API Design）

## 路由清单（`artifacts/api-server/src/routes/`）

### `health.ts`
| 方法 | 路径 | 鉴权 |
|---|---|---|
| GET | `/api/healthz` | 无 |

### `auth.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | 创建账号，密码 ≥8 位，bcrypt(12) 哈希 |
| POST | `/api/auth/login` | 无 | 返回 JWT（30 天有效） |
| GET | `/api/auth/me` | `requireAuth` | 返回当前用户信息 |
| POST | `/api/auth/forgot-password` | 无 | 生成重置 token（1 小时有效），**直接在响应体返回**（无邮件服务） |
| POST | `/api/auth/reset-password` | 无 | 消费 token，设置新密码 |

JWT payload：`{ userId, email, name, role }`，签名密钥读 `JWT_SECRET`，否则回退 `SESSION_SECRET`。

### `resources.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/resources` | `optionalAuth` | 按角色返回不同可见性集合（见下方"可见性规则"），支持 `source_type`、`tags`、`search`、（仅 admin）`status` 过滤 |
| GET | `/api/resources/recent` | `optionalAuth` | 仅返回 approved，按时间倒序，`limit` 参数 |
| GET | `/api/resources/:id` | `optionalAuth` | 单条详情，同样受可见性规则约束 |
| POST | `/api/resources/import` | `requireAuth` | Gemini 单条 URL 解析，不写库（见下方"AI 导入流程"） |
| POST | `/api/resources/import/batch` | `requireAuth` | 同上，批量（≤20 条），SSE 流式返回每条解析进度 |
| POST | `/api/resources` | `requireAuth` | 创建；admin 创建即 `approved`，非 admin 创建为 `pending` |
| PATCH | `/api/resources/:id/approve` | `requireAuth` + `requireAdmin` | 审核：`{ status: 'approved' | 'rejected' }` |
| PATCH | `/api/resources/:id` | `requireAuth` | admin 或条目所有者可编辑；非 admin 编辑后状态重置为 `pending` |
| DELETE | `/api/resources/:id` | `requireAuth` | admin 或所有者可删除 |

**可见性规则**（`GET /api/resources` / `GET /api/resources/:id`）：
- 未登录 → 只能看 `status = 'approved'`
- 登录的普通用户 → `approved` 的条目 ∪ 自己创建的条目（任意状态）
- admin → 全部，可选 `?status=` 过滤

### `our_research.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/our-research` | 无 | `tag`、`search` 过滤 |
| GET | `/api/our-research/:id` | 无 | 单条详情 |
| POST | `/api/our-research` | `requireAuth` + `requireAdmin` | 创建 |
| DELETE | `/api/our-research/:id` | `requireAuth` + `requireAdmin` | 删除 |

### `authors.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/authors` | 无 | 列表，含机构名 + 关联的（approved）文献计数，`search` 按姓名过滤 |

同文件还导出 `syncResourceAuthors()`，被 `resources.ts` 在创建/编辑时调用，详见 [`database.md`](./database.md) 中的同步机制说明。

### 路由注册
`src/routes/index.ts` 集中挂载：`health`、`auth`、`resources`、`our_research`（authors 路由也需确认已挂载——新增路由文件后必须在此注册，否则不会生效）。

## AI 导入流程（`POST /api/resources/import`、`/import/batch`）

**核心原则：两步走，解析与持久化分离，永不自动写库。**

1. 前端传入 `{ url, source_type? }`
2. 服务端 fetch 该 URL（10s 超时，UA 标识为 `ZIBSBot/1.0`），剥离 `<script>`/`<style>`/标签，压缩空白，截断到 8000 字符（batch 模式截断到 6000）；fetch 失败则提示"页面无法获取，凭 URL 和训练知识推断"
3. 调用 `gemini-2.5-flash`（`@google/generative-ai`，需要 `GOOGLE_API_KEY`），`responseMimeType: "application/json"`，要求返回 `{ title, authors[], abstract, tags[], sourceType }`
4. `sourceType` 必须落在 `["Paper","Report","Gov Document","News","Experts & Scholars"]` 内，否则回退到请求传入的 hint
5. **直接返回解析结果给前端，不写数据库**
6. 前端用可编辑的确认弹窗展示，用户确认后才调用 `POST /api/resources` 真正持久化（此时才会触发 `syncResourceAuthors`）

batch 版本（`/import/batch`）用 SSE（`text/event-stream`）逐条推送 `{ index, url, status: 'parsing'|'done'|'error', data?, error? }`，每条之间间隔 500ms 避免触发 Gemini 限流，单批最多 20 个 URL。

**未来任何新增的 AI 辅助录入功能，都要遵循"解析 → 前端确认 → 显式持久化"这个模式**，不允许 AI 解析结果直接落库。

## OpenAPI / Codegen 现状

- `lib/api-spec/openapi.yaml` 是生成 React Query hooks（`lib/api-client-react`）和 Zod schema（`lib/api-zod`）的唯一真源，通过 Orval 生成。
- `resources`、`our-research`、`authors` 这三个较新模块的接口**还未完整进入 spec**，前端用直连 `fetch`/`useQuery` 调用。
- 新增/修改路由时：如果希望有生成的 hooks 可用，要同步更新 `openapi.yaml` 并跑 `pnpm --filter @workspace/api-spec run codegen`；否则前端只能手写 fetch 调用（目前 resources/our-research/authors 就是这种状态，应视为待技术债，不是长期目标状态）。
