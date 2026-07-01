# Code 说明 11 ── 批量导入前:完整 Schema 审阅

> 目的:库里目前没有真实数据,是审阅和修正 schema 成本最低的时刻。请逐项对照本清单产出一份审阅报告(不是随便描述,是**逐条给结论**),报告交回后由用户和 Chat 一起过一遍再决定要不要动手改。
> **本轮只审阅+报告,不擅自修改 schema**——除非是明显的、无争议的清理(比如确认某字段完全没被任何代码引用),否则改动前先汇报。

---

## 一、全表清单 + 逐表字段审阅

请列出当前 `lib/db/src/schema/` 下**每一张表**的完整字段清单(字段名、类型、可空性、默认值),包括但不限于:

- `users`
- `resources`
- `tags` / `resource_tags`
- `upload_jobs`
- `email_verification_codes`
- `our_research`
- 以及任何本清单没列到、但实际存在的表

对每张表,逐字段回答:

1. **这个字段目前有没有代码在读/写它?**(грep 全仓确认,不要凭印象)
2. **有没有"当初设计时以为要用、现在完全没有代码引用"的僵尸字段?** 逐个列出来
3. **有没有代码里在用、但 schema 里没有正式声明的字段?**(比如通过 `as any` 之类绕过类型检查在用的)

---

## 二、关键决策落地核查(对照之前的规划文档,确认真落地了没有)

逐条核查以下几个**之前讨论过、但没有专门验证过是否真的落地**的决策:

### 2.1 sourceType
- 确认 `resources.sourceType` 的枚举值就是 08 号文档定案的 7 个 slug(`journal_article/working_paper/conference_paper/thesis/report/gov_document/news`),没有任何遗留的旧值(`Paper/Report/Gov Document/News/Experts & Scholars`)
- 确认 `CLAUDE.md` 里的"数据库设计原则"章节和这 7 个 slug 一致

### 2.2 机构作者兜底(09号收尾第二项)
- 确认最终采用的方案是:**没有新增 `authorRaw` 独立字段**,而是在抽取 prompt 里加了"找不到个人作者时用发布机构名兜底"的规则,写入的仍是现有的 `authors` 字段/表
- 请明确回答:现在 `resources` 表里到底是 `authors: text[]`,还是已经有独立的 authors 关联表?机构作者兜底后,写进去的具体是什么值?
- 这个决定是否和《07-补遗与衔接.md》第一节最初设想的"authorRaw 临时字段"有出入?如果有出入,请说明当前实际做法和当初文档的差异,不需要现在改文档,但要在报告里点出来

### 2.3 upload_jobs
- 确认 `batchId` 字段已加(可空 uuid),批量提交时正确生成并写入
- 确认状态机字段的当前枚举值,和 04 号文档设计的(`queued/processing/extracted/verified/failed`,或后来简化的 `queued/processing/ready_for_review/failed`)哪个是当前真实版本
- 确认 `resourceStatusEnum`(`resources`表)里**不包含** `uploading/processing`(这两个状态应该只属于 `upload_jobs`,不属于 `resources`)

### 2.4 标签体系(T.1-T.4)
- 确认 `tags` 表的 `facet` 枚举正确(`theme/jurisdiction/asset`)
- 确认种子数据数量:33 个 theme + 16 个 jurisdiction + 15 个 asset,共 64 条,`status` 全部为 `active`
- 确认 `resource_tags` 的 `source` 字段(`auto/manual`)存在且被 `retagResources()` 正确使用(重跑时只覆盖 `auto`,不动 `manual`)

### 2.5 Our Research 鉴权
- 确认 `POST`/`PATCH`/`DELETE /api/our-research` 有 `requireAuth, requireAdmin` 保护(这是很早期就发现的一个安全缺口,请确认已经补上,不要遗漏)

---

## 三、外键与约束审阅

- 列出所有外键关系(哪张表的哪个字段引用哪张表),确认级联规则(`ON DELETE CASCADE` / `SET NULL` / `RESTRICT`)是否符合业务逻辑(比如:删除一个 tag,`resource_tags` 里的关联行该怎么处理?)
- 列出所有 `UNIQUE` 约束和 `NOT NULL` 约束,逐条确认是否符合实际业务规则(比如 `tags.slug` 是否唯一、`resources` 的哪些字段是硬性必填)
- 确认 `resources` 表当前的硬性必填字段(标题 + ≥1 作者 + 年份)在 schema 层面和代码校验层面是否一致(schema 允许为空、但代码强制校验的字段,请单独指出)

---

## 四、状态枚举总览(把散落在各处的状态值汇总成一张表)

请汇总一份"全项目状态枚举总览",格式类似:

| 枚举 | 属于哪张表/字段 | 当前值 | 定义文档来源 |
|---|---|---|---|
| resourceStatusEnum | resources.status | ... | 02号 + 04号 |
| upload_jobs 状态 | upload_jobs.status | ... | 04号(已简化) |
| sourceType | resources.sourceType | ... | 08号 |
| tags.facet | tags.facet | ... | 03号 |
| tags.status | tags.status | ... | 03号 |

目的是让用户和 Chat 能一眼看到"现在到底有哪些状态机在跑,分别管什么",避免以后又出现"文档说的和代码实际不一致"的情况。

---

## 五、前后端字段一致性抽查

不需要全量审阅前端(那是下一步的事),但请做一次快速抽查:

- 前端 `Resource` / `TagSummary` 等 TypeScript 接口的字段定义,和后端实际返回的 JSON 字段是否完全对应(有没有前端还在用旧字段名、或者后端返回了前端没用到的多余字段)
- 特别确认:sourceType 迁移到 slug 之后,前端有没有任何地方还在用旧的英文字符串做判断(比如某处写死了 `if (sourceType === "Report")` 这种)

---

## 输出格式要求

请按上面一到五的顺序,逐节给出结论。**每一条明确写"✅ 符合预期" / "⚠️ 有出入,具体是..." / "❌ 未落地/有问题,具体是..."**,不要用"大致正常"这种模糊表述。如果篇幅较大,可以先给一个"结论摘要"(所有 ⚠️ 和 ❌ 项的汇总列表),再附详细内容。
