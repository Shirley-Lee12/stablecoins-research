# API 设计说明（API Design）

## 路由清单（`artifacts/api-server/src/routes/`）

### `health.ts`
| 方法 | 路径 | 鉴权 |
|---|---|---|
| GET | `/api/healthz` | 无 |

### `auth.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | 创建账号（`email_verified=false`），密码 ≥8 位且含大小写字母，bcrypt(12) 哈希；生成 6 位验证码发邮件，发信失败则回滚用户行 |
| POST | `/api/auth/verify-email` | 无 | 校验验证码（10 分钟有效），通过则置 `email_verified=true` 并直接返回 JWT |
| POST | `/api/auth/resend-verification` | 无 | 重发验证码；账号不存在或已验证也返回同样的成功提示（不泄露账号是否存在） |
| POST | `/api/auth/login` | 无 | 校验密码；`email_verified=false` 时拒绝登录（403 + `requiresVerification: true`），否则返回 JWT（30 天有效） |
| GET | `/api/auth/me` | `requireAuth` | 返回当前用户信息 |
| POST | `/api/auth/forgot-password` | 无 | 生成重置 token（1 小时有效），通过邮件发送重置链接（`FRONTEND_URL` 拼接），不在响应体里返回 token |
| POST | `/api/auth/reset-password` | 无 | 消费 token，设置新密码 |

JWT payload：`{ userId, email, name, role }`，签名密钥读 `config.ts` 的 `env.JWT_SECRET`（zod 校验必填，无 fallback）。`ADMIN_BOOTSTRAP_EMAILS`（逗号分隔）命中的邮箱注册时直接给 `admin` 角色。

### `resources.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/resources` | `optionalAuth` | 按角色返回不同可见性集合（见下方"可见性规则"），支持 `source_type`、`tags`（旧版自由标签）、`facetTag`（新版 facet 标签 slug）、`search`、（仅 admin）`status` 过滤；每条资源附带 `facetedTags`（见下方"标签自动打标"） |
| GET | `/api/resources/recent` | `optionalAuth` | 仅返回 approved，按时间倒序，`limit` 参数 |
| GET | `/api/resources/:id` | `optionalAuth` | 单条详情，同样受可见性规则约束，同样附带 `facetedTags` |
| POST | `/api/resources/import` | `requireAuth` | 单条 URL/DOI 解析，不写库（见下方"AI 导入流程"） |
| POST | `/api/resources/import/batch` | `requireAuth` | 同上，批量（≤20 条 URL），SSE 流式返回每条解析进度 |
| POST | `/api/resources/import/pdf` | `requireAuth` | 单个 PDF（multipart，字段 `file`，≤15MB）解析，不写库 |
| POST | `/api/resources/import/pdf/batch` | `requireAuth` | 同上，批量（≤20 个 PDF，字段 `files`），SSE 流式返回 |
| POST | `/api/resources` | `requireAuth` | 创建；admin 创建即 `approved`，非 admin 创建为 `pending`；按标题/DOI 查重，命中返回 409 |
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

### `admin.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/admin/users` | `requireAuth` + `requireAdmin` | 用户列表，不返回 `passwordHash` |
| PATCH | `/api/admin/users/:id` | `requireAuth` + `requireAdmin` | 改角色 `{ role: 'user' | 'admin' }`；不能给自己降级 |
| GET | `/api/admin/settings/status` | `requireAuth` + `requireAdmin` | **只读**配置状态面板。所有配置来自服务器 `.env`（见 [`architecture.md`](./architecture.md) 环境变量表），这里只是把当前生效值暴露给前端确认；密钥（`JWT_SECRET`、`LLM_API_KEY`、`SMTP_PASS`）只返回掩码（末 4 位），**没有对应的 PATCH/写接口**——改配置只能改 `.env` 后重启服务 |
| POST | `/api/admin/tags/retag` | `requireAuth` + `requireAdmin` | 触发 `retagResources()` 重新打标，见下方"标签自动打标"。Body 可选 `{ resourceIds?: number[] }`，不传则对全库重跑；同步执行，库大时较慢（每条资源约 2 次 LLM 调用） |

### `tags.ts`
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/tags` | 无 | 公开只读，返回全部 `status='active'` 的标签（`id/slug/nameEn/nameZh/facet/region`），供前端侧栏标签筛选用。`candidate` 状态的标签不在这里返回——那是管理员审核用的，不对外暴露 |

### `upload.ts`（新版上传管线，U.1–U.6）
| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/resources/upload/manual` | `requireAuth` | 手填入口（同步）。Body 是用户已填好的六要素，跳过抽取/反查，直接打标 + 核对，**不写库**，返回 `{ draft, tagIds, tags, report, foundInScholarlyDb }` |
| POST | `/api/resources/upload/url` | `requireAuth` | 单条 URL/DOI 入口（同步）。Body `{ url, sourceType? }`，跑完整流水线（抓页面→LLM抽取→反查链接→打标→核对），**不写库**，返回同上结构 |
| POST | `/api/resources/upload/confirm` | `requireAuth` | 上面两个同步入口的确认/落库接口。Body 是（可能被用户编辑过的）最终六要素 + `tagIds: number[]`，调用 `determineResourceStatus()` 算出最终 `status` 后插入 `resources` + `resource_tags`（`source='auto'`），并调用 `syncResourceAuthors` |
| POST | `/api/resources/upload/jobs/pdf` | `requireAuth` | PDF 入口（异步，单个或批量都走这里）。multipart 字段 `files`（1–20 个，≤15MB/个），立即为每个文件建一行 `upload_jobs`（`status=queued`）并返回 `{ jobIds }`；服务端在同一进程内继续异步处理，不依赖客户端连接存活 |
| POST | `/api/resources/upload/jobs/url-batch` | `requireAuth` | 批量 URL 入口（异步）。Body `{ urls: string[], sourceType? }`（≤20 条），同上模式建 `upload_jobs` 行后立即返回 |
| GET | `/api/resources/upload/jobs` | `requireAuth` | 列出当前用户自己的全部 `upload_jobs`（不分页，按 createdAt 倒序），供前端轮询展示队列进度 |
| GET | `/api/resources/upload/jobs/:id` | `requireAuth`，仅 owner | 单个任务详情（含 `result`） |
| POST | `/api/resources/upload/jobs/:id/confirm` | `requireAuth`，仅 owner | 任务必须是 `ready_for_review` 状态；同 `/upload/confirm` 一样落库，成功后删除该 `upload_jobs` 行 |
| DELETE | `/api/resources/upload/jobs/:id` | `requireAuth`，仅 owner | 丢弃任务，不落库 |

### 路由注册
`src/routes/index.ts` 集中挂载：`health`、`auth`、`resources`、`our_research`、`authors`、`admin`、`upload`、`tags`。新增路由文件后必须在这里注册，否则不会生效。

## AI 导入流程（旧版，`resources.ts`，URL / DOI / PDF 三个入口，均不写库）

> **现状（2026-06-30）**：这是 Part 4 之前就已存在的导入路径，前端 `academic-resources.tsx` 的 `UploadCenterModal` **已不再调用它**（改调下方"新版上传管线"）。这组端点本身没有删除（还能直接 curl 调用），但已经是技术债，不建议新功能继续接入；新版管线多了 Crossref/OpenAlex/Semantic Scholar 多源反查、embedding 打标、逐字段核对报告，能力是旧版的超集。

**核心原则：两步走，解析与持久化分离，永不自动写库。** 三个入口（`/import`、`/import/batch`、`/import/pdf`、`/import/pdf/batch`）解析完都只把结果返回给前端，用户在可编辑的确认弹窗里改完，显式调用 `POST /api/resources` 才真正持久化（此时才会触发 `syncResourceAuthors`）。

LLM 调用统一走 `src/lib/llm.ts`：`generateJson(prompt, maxTokens?)`（纯文本 prompt）和 `generateJsonFromPdf(buffer, prompt, maxTokens?)`（PDF 原生多模态，靠 Gemini 自带的文档理解，不需要单独 OCR 步骤），两者都按 `env.LLM_PROVIDER` 切换供应商（目前只实现 `gemini`，`anthropic` 分支会抛"未实现"）。`resources.ts` 不直接 import 任何供应商 SDK。

### URL / DOI 入口（`POST /api/resources/import`、`/import/batch`）
1. 从 URL 里提取 DOI（正则匹配 `10.xxxx/...`），命中则先查 Crossref 公开 API（`api.crossref.org/works/{doi}`）拿结构化的 title/authors/url/摘要/发表日期——这一步不依赖抓取页面，所以 SSRN/Elsevier 等反爬网站也能拿到基础元数据
2. 同时尝试直接 fetch 页面（10s 超时，UA 标识 `ZIBSBot/1.0`，优先 fetch Crossref 给出的 url）：剥离 `<script>`/`<style>`/标签、压缩空白、截断到 8000 字符（batch 模式 6000）；返回非 2xx 或剥离后正文 <200 字符则判定为"被反爬拦截"（`fetchBlocked`）
3. 若既没有 DOI 又抓取失败 → 直接 422 返回，提示用户改用"上传 PDF"或"手动添加"，不调用 LLM 兜底瞎猜
4. 否则调用 `generateJson()` 让 LLM 从页面正文里补全 `{ title, authors[], abstract, tags[], sourceType, publishedDate }`；Crossref 已给出的字段优先用 Crossref 的（更可靠），LLM 结果只补 Crossref 没有的部分（主要是 abstract/tags，以及没有 DOI 时的 title/authors）
5. `sourceType` 必须落在 `["Paper","Report","Gov Document","News","Experts & Scholars"]` 内，否则回退到请求传入的 hint；`tags` 经 `sanitizeTags()` 收窄到closed vocabulary（`STABLECOIN_TAGS`，最多 3 个）+ 最多 1 个自由词，合计 ≤4 个

batch 版本用 SSE（`text/event-stream`）逐条推送 `{ index, url, status: 'parsing'|'done'|'error', data?, error? }`，每条间隔 500ms 避免触发限流，单批最多 20 个 URL。

### PDF 入口（`POST /api/resources/import/pdf`、`/import/pdf/batch`）
1. `multer` 内存存储接收 PDF（仅 `application/pdf`，单文件 ≤15MB，绝不落盘/落库二进制本身）
2. 整份 PDF 连同 prompt 一起送进 `generateJsonFromPdf()`（Gemini 原生多模态，扫描件也能靠模型自带 OCR 读出），要求返回 `{ title, authors[], abstract, tags[], sourceType, doi, publishedDate }`
3. 如果 PDF 上印了 DOI → 用它去查 Crossref 拿规范化的 url/abstract/发表日期补全；没印 DOI 但解析出了标题 → 退而用 Crossref 的标题模糊搜索（词重叠度 ≥70% 才采信，避免挂错论文的 DOI）

batch 版本同样走 SSE，逐文件推送进度，单批最多 20 个文件。

**未来任何新增的 AI 辅助录入功能，都要遵循"解析 → 前端确认 → 显式持久化"这个模式**，不允许 AI 解析结果直接落库。

## 新版上传管线（U.1–U.6，`routes/upload.ts` + `lib/scholar/` + `lib/verify.ts` + `lib/resourceStatus.ts` + `lib/pdfExtract.ts`）

三入口共用一条核心管线：**抽取 → 反查链接 → 打标 → 核对**。手填/单条 URL 同步跑完整条链路（不落库，确认后才落库）；批量 URL/PDF（含单个 PDF）走 `upload_jobs` 异步任务（见 [`database.md`](./database.md) `upload_jobs` 表说明），结果同样要等用户确认才落库——具体的同步/异步划分原因见 [`roadmap.md`](./roadmap.md) 第四部分"架构决策"。

- **抽取**（`extractFromText()`，`routes/upload.ts` 内部）：单次 `generateJson()` 调用，把页面文字/PDF 文字（`lib/pdfExtract.ts` 的 `extractPdfText()`，本地 `pdf-parse` 抽字，文字量不足走 `ocrFallback()`——当前是占位，直接抛"OCR 未启用"）抽成 `{ title, authors, year, abstract, doi, sourceType }`。
- **反查链接**（`lib/scholar/resolveLink.ts` 的 `resolveLink()`）：`cleanTitle()` 清洗 PDF 图注污染 → Crossref/OpenAlex/Semantic Scholar 多源瀑布 → 必要时用作者姓氏增强查询再搜一轮 → `isConfidentMatch()`（标题 Jaccard 重合度 ≥0.4 + 作者姓氏交叉 +年份接近，**已知作者时候选必须也列出作者，没列直接拒绝**，防止标题词面相似但其实是另一篇论文）→ 都查不到则退化为 `generateJsonWithSearch()`（Gemini Google Search grounding，`lib/llm.ts`，无需额外搜索 API key；prompt 显式禁止返回 `vertexaisearch.cloud.google.com` 跳转链接）。
- **打标**（`lib/tagging.ts` 的 `computeTagsForText()`，与 `retagResources()` 共用同一个核心函数）：
  - **theme**（33 个种子）：`embedText()`（`lib/llm.ts`，Gemini `gemini-embedding-001`——注意不是 `text-embedding-004`，那个模型名已经下线了）把 `title+abstract` 和每个 active 标签的 `definition` 转成向量算 cosine 相似度，≥0.5 的最多取 4 个；标签向量每次 `loadTagVocabulary()` 调用只算一次。
  - **asset / jurisdiction**（15+16 个种子）：受控实体匹配，`nameEn`/`slug`/括号别名 + 人工维护的缩写表（`JURISDICTION_ALIASES`），单词边界正则（防 "UST" 误中 "trust"）。
  - **候选队列**：额外调一次 `generateJson()` 抽文本里提到的稳定币/辖区名称，对不上任何已有 `tags.slug` 的就新建 `status='candidate'` 行。
- **核对**（`lib/verify.ts` 的 `verifyResource()`）：标题非空、DOI 解析+标题一致性、URL 可达性、作者/年份交叉、摘要是否填写，输出 `{ field, status: '✅'|'⚠️'|'❌', detail }[]`。
- **状态判定**（`lib/resourceStatus.ts` 的 `determineResourceStatus()`）：硬必填（标题+≥1作者+年份）缺 → `failed`；核对报告有 ⚠️/❌ → `needs_review`；全过 → `pending`/`approved`（看是否 admin）。

`retagResources(resourceIds?)`（`lib/tagging.ts`）是面向**已入库资源**的全库/指定重跑工具，跟上传管线走的是同一套 `computeTagsForText()`，但落库方式不同——重跑只清空重建该资源 `resource_tags.source='auto'` 的行，`source='manual'` 的行永不触碰（同一 `(resource_id, tag_id)` 唯一约束下，manual 记录会让对应的 auto insert 因冲突被跳过，manual 天然优先）。调用入口：`POST /api/admin/tags/retag`。

## OpenAPI / Codegen 现状

- `lib/api-spec/openapi.yaml` 是生成 React Query hooks（`lib/api-client-react`）和 Zod schema（`lib/api-zod`）的唯一真源，通过 Orval 生成。
- `resources`、`our-research`、`authors` 这三个较新模块的接口**还未完整进入 spec**，前端用直连 `fetch`/`useQuery` 调用。
- 新增/修改路由时：如果希望有生成的 hooks 可用，要同步更新 `openapi.yaml` 并跑 `pnpm --filter @workspace/api-spec run codegen`；否则前端只能手写 fetch 调用（目前 resources/our-research/authors 就是这种状态，应视为待技术债，不是长期目标状态）。
