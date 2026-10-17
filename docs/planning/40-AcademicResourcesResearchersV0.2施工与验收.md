# Academic Resources + Researchers & Institutions V0.2 施工与验收

初次施工日期：2026-10-16。人工裁决补丁：2026-10-17，14 项冲突已关闭，详见末尾 MANUAL RECONCILIATION PATCH。当前状态：**APPROVED_FOR_MERGE / LOCAL BASELINE**（用户最终验收并授权独立本地提交）。以下初次施工计数和待核验记录保留为历史证据。仅创建本地 Git commit，不 push、不部署 Render。

## 唯一施工源

`Academic_Resources_Researchers_Codex_Ready_Package_V0.2.zip` 为本轮唯一内容施工源。按请求顺序读完 README、status、audit、reconciliation/import specs、QA、directory spec、taxonomy、inclusion policy、filter/empty specs、三个 seed CSV、双语 Content Master 与全部 manifests，再读取 CODEX_HANDOFF。

原样解压：`docs/source-packages/academic_resources_experts_package_v0.2/`。22 个原文件逐项 bytes/SHA-256 与 ZIP entry 一致。ZIP 为 30787 bytes，SHA-256 `05099142f6f1f77d8e1ca20f66fb13c5e5db81830c24ba5d1da3e18eecd0c8c2`。

非阻断 metadata discrepancy：inventory 自身记录 1308 bytes，实际 1598 bytes；仅保留验收记录，未修改原包。`.gitattributes` 增加该原文目录的换行保护与原文空白例外。完整性证据见 QA outputs 的 `package-integrity.json`。

## 第一阶段：只读数据库检查

在任何页面改动或 DB mutation 之前，先读取既有 schema，再以 PostgreSQL READ ONLY 事务执行 COUNT 聚合。没有把旧公开导出 0 当作 DB 空库。未输出 private submission 内容、账户、未公开正文或私密摘要。

| 安全计数 | 施工前 | 施工后 |
| --- | ---: | ---: |
| resources total | 429 | 434 |
| approved / public | 390 | 395 |
| pending / nonpublic working states | 24 | 24 |
| rejected | 12 | 12 |
| withdrawn | 3 | 3 |
| researcher / author total | 1108 | 1109 |
| linked-to-public-resource authors | 842 | 843 |
| 独立已核验公开 researcher profiles | 旧 schema 不支持此状态 | 3 |

原 schema 没有 archived 状态；未把它伪报为 0。旧 `/authors` 使用关联 approved resource 的作者可见性，842 不是“842 位已核验研究者”。本轮新增独立公开核验元数据后，两页使用明确的 verified profile 查询。

施工前额外计数：346 条有 DOI、425 条有 URL、4 条两者皆无；5 组同名作者候选、2 组规范化 DOI 重复、3 条已有 duplicate-candidate 关联。仅报告数量，不列非公开内容。证据为 `db-counts-before.json`、`db-counts-after.json`。

## Non-destructive reconciliation

先 READ ONLY dry-run，再仅应用可安全写入的部分。资源匹配顺序为 DOI → canonical URL → normalized title + year + first author → manual conflict。作者为 ORCID → official profile URL → exact full name + verified institution → verified public publication relationship；没有 fuzzy-name merge。出版页 URL 不作为官方个人身份 URL 使用。

| Seed 类别 | Matched | New | Conflict | Private/nonpublic match |
| --- | ---: | ---: | ---: | ---: |
| Resources（20） | 7 | 5 | 7 | 1 |
| Researchers（10） | 2 | 1 | 7 | 0 |

实际写入：

- 5 条真正缺失的公开资源，`status=approved` 且 `created_by=NULL`，保留原有投稿 moderation workflow。
- 为 7 条匹配公开资源附加目录元数据；连同新记录共 12 条 `public_resource_metadata`。原资源 DOI / URL 没有空缺需要补写，故原 resources 字段 enrichment 实际为 0。
- 2 个已明确匹配作者 + 1 个新作者建立 3 个 `public_researcher_profiles`，新增 2 条 public resource-author relationship。
- 每个新目录 metadata record 使用 `ACADEMIC_RESOURCES_EXPERTS_V0_2_2026_10_16` provenance；不公开展示施工标识。
- 新建三个 additive metadata tables（resource、researcher、institution provenance）；没有删除、破坏性迁移或修改原资源 ownership、editor/user summary、abstract、title、authors、year、moderation state。
- transaction 中重新核对全部原资源 status/title/authors/year；只允许缺失 DOI / URL 白名单补全，其他原字段不进入 UPDATE。

事务使用 serializable isolation、advisory lock 与相关表锁防止并发重复写入；任何检查失败均 rollback。未执行全库 drizzle push。

写入后的只读重复 dry-run：资源 12 matched / 0 new / 7 conflict / 1 private-match；研究者 3 matched / 0 new / 7 conflict。证明已导入项不再判为新记录。非公开状态数量保持 24 / 12 / 3。

报告：`reconciliation-dry-run.json`、`reconciliation-applied.json`、`reconciliation-post-dry-run.json`、`reconciliation-follow-up.json`。机构 provenance 补齐复用幂等流程，未新增资源或关联（new resources=0、new relationships=0）；首次导入报告保留。原 dry-run 与 post-check 分开保存。脚本默认只读；只有显式 `--apply` 才进入安全写入。

## 需要人工决定的冲突

资源：RES-001、RES-003、RES-005、RES-007、RES-009、RES-012、RES-020。包括标题/版本身份、DOI 不一致、DOI 对应作者不一致；没有借 seed 覆盖已审核数据。

研究者：RSC-001、RSC-002、RSC-003、RSC-004、RSC-005、RSC-006、RSC-009。已存在同名作者，但当前可用 institution / resolved public publication relationship 不足以无歧义确认；没有自动创建重复 profile 或合并身份。

另有 1 项资源匹配非公开记录，完全跳过；报告不列该记录 ID、标题、内容或具体私密状态。

特别保留包内 RES-003 / RES-007 修正后的作者与 DOI 原文，但现有已审核记录发生冲突时不自动覆盖。因此这些既有公开条目仍有人工 metadata review 待办。本轮完成的是安全 reconciliation，不声称已解决全部 bibliographic conflict。

安全人工清单：`outputs/academic-directory-v02-qa-2026-10-16/manual-conflicts.md`。

## 公开查询与两页实现

新增只读、固定 approved scope 的 `/api/public-directory/resources` 与 `/api/public-directory/researchers`；不因调用者登录/admin 身份扩大公开结果。SQL 使用字段 allowlist，不返回账户、ownership、审核批注、摘要或未公开投稿。资源 count 与 records 使用同一 approved query；研究者须有核验类型、官方/出版来源、核验日期及 approved public works。

`/academic-resources` H1 改为 Stablecoin Research Library / 稳定币研究资源库。主题浏览先于证据类型；支持 keyword、theme、evidence、year、language、access、author、institution/venue。默认 newest publication year first，保留修订标签原记录，不用录入时间替代出版年。20 条分页，不制作类型 KPI 墙。

395 条 approved public records 可查询；默认排除 17 条 news/commentary，因此无筛选默认结果为 **378**，这是同一公开结果的过滤数，不是 DB 全量。其他证据类分别显示；既有 journal_article 若没有明确评审 metadata，显示“期刊论文 · 未记录评审状态”，不自动称 peer-reviewed。缺失 venue/language/access/evidence metadata 显示未记录；不从旧正文或包外资料猜填。语言/获取方式也可筛选未记录状态。

主题索引使用已有公开 tags/keywords 及已核验 seed theme terms，不覆盖原 tagging。卡片最多显示四个主题，保留 title/authors/year/evidence/venue/access/DOI/source，relevance note 使用包内单句，不复制长摘要。

`/experts` 路由保持；H1 改为 Researchers & Institutions / 研究者与机构。当前显示 **3 个**已核验档案：Carlo Altavilla、Iñaki Aldasoro、Lance Ang。默认 recently verified，同日按姓名；辅助 Name A–Z。每卡显示角色、机构、研究方向、1–3 项代表研究、核验日及官方/出版链接；计数仅称 Resources in this library。

Lance Ang 的角色及机构明确为 publication-time record / affiliation，不能视作 current affiliation。Marco Gross 因身份冲突未新增 profile，未把其出版时 affiliation 推断成当前身份。

机构区目前为 **3 个**实际公开档案所代表机构的聚合；发表时机构另行标记，不把十个 institution seed 直接铺成榜单。无人物图片、机构 logo、排名、citation/expert/authority score 或合作标签。

导航/面包屑仅作相应名称更正；既有两行 activeAliases 工作区修改保留，不属于本专题。`preexisting-layout.patch` 仅为本地未提交快照；正式提交范围与排除路径记录于提交前 `scope-audit.json`。

## 失败与零匹配

Loading、query success、zero match、directory unavailable 是独立状态。HTTP/DB failure、parse error、格式错误或超时均不返回成功的空数组，不回退到 seed，也不显示 0 resources / 0 experts。只有查询成功后才显示匹配数量。

真实故障演练通过本机 QA API `/__qa/fail` 令生产 public projection 失败，再在浏览器重新读取两页：两页均显示“暂时无法读取”，没有数量/列表，未把失败显示成 0。随后恢复查询，真实结果恢复为 395 public / 3 verified profiles；默认新闻过滤后 378。正常搜索无匹配显示普通 zero-match message，与失败区分。

QA API 加载实际生产查询函数，每次 DB 操作包在 READ ONLY 事务中，仅绑定 127.0.0.1:3001，无后台任务、无 DB 写入。Vite 5183 用临时环境参数指向该 API，未修改 .env；原站点服务未部署。

## Desktop / mobile QA

- 桌面 1440×1000、手机 390×844：两页英文/中文、light/dark 实际渲染检查；另测 320px 两页和 768px 筛选抽屉，无整页横向溢出。
- Library 桌面紧凑纵向资源列表，主题 wrap；手机主题横向滚动，搜索保持可见，七个筛选/排序控件放在 sheet。
- 实测 keyword + evidence + year + language + access + author + institution 联合筛选，得到对应真实 public resource；手机仍能读 evidence/year，并 tap DOI / source。
- Researchers 手机每行一张卡，代表研究链接和发表时机构可见；桌面两列，未使用头像或机构 logo。
- 搜索 zero-match、两页 query-failure、恢复查询、source link href、新旧 metadata 显示均检查。
- 浏览器最终 console error 0，见 `browser-errors.json`；截图及公开内容记录在同目录。

## 修改文件与兼容性

主要文件：

- 两页入口及新增 `pages/academic-directory-v02.tsx`、`components/directory-ui.tsx`、`data/academic-directory.ts`、生成 JSON、`hooks/use-public-directory.ts`。
- `academic-resources.tsx` 仅替换旧公开默认页面，保留原有 admin / contributions / author 页所用类型与 helper exports；相关授权编辑、审核和上传接口未更改。
- API public projection / router 及 routes/index 集成；OpenAPI 两个新 GET endpoint 与 codegen 输出。
- additive DB schema `publicDirectory.ts` 与 schema/index；SQL migration 与显式 apply reconciliation 脚本、纯匹配模块、生成脚本、只读 QA runtime。
- 22 个原包文件、原 ZIP、21 项新增测试、本验收文档和 outputs 证据。

逐文件记录：`outputs/academic-directory-v02-qa-2026-10-16/changed-files.json`。既有 import audit、.gitkeep 删除、connector ZIP、规划32/33、内容交接包及 layout activeAliases 不纳入专题实现。

## 最终验证

- 全专题 **99/99 passed**，0 failed/skipped：既有六个已批准专题 Homepage/Research、About、Asia、Agentic、Market Data、Regulatory 共 **78/78**，本轮新增 **21/21**。
- 覆盖：DB failure ≠ factual zero、approved-only count、DOI / canonical URL dedup、title/year/first-author、private/pending 不发布、无 fuzzy identity merge、共享出版页 URL 不作为个人身份、强 ORCID/profile 标识冲突不能被姓名覆盖、缺失 metadata 白名单、verified-date 排序、publication-time affiliation、机构聚合、手机 evidence/source、真实 reconciliation preservation 及重复 dry-run。
- 测试命令：在 `scripts/` 使用 Node 24 执行 `node --import tsx --test tests/*.test.ts`；日志 `regression-final.log`。
- `pnpm run typecheck`：通过，日志 `typecheck-final.log`。
- OpenAPI codegen：通过，日志 `codegen.log`。
- `pnpm run build`：通过，日志 `build.log`；保留既有 sourcemap / chunk-size 非阻断警告。
- `git diff --check`：通过；新增实现文本另查尾随空白，源包不格式化。
- ZIP 22/22 bytes/hash：通过；inventory discrepancy 原样记录。

本轮未 commit、未 push、未部署 Render。需要用户下一步人工裁决的是上述 7 项资源 metadata/版本冲突与 7 项研究者身份；不存在为了补足 seed 数量而自动公开投稿、覆盖编辑结论或合并身份的操作。

## MANUAL RECONCILIATION PATCH — 2026-10-17

本轮仅处理人工裁决指定的 7 项 public resource conflicts 和 7 项 researcher identity conflicts。未重做两页、未重新导入全部 seed、未新建数据库结构。唯一人工编辑依据为 `Academic_Directory_Manual_Reconciliation_Decisions_V0.1.md`，原文件 SHA-256：`3edc55d56dad54d56180217617e2671a226a86181bdbf7dfd8e1107318572cb3`。执行请求来自本轮用户粘贴文件；裁决内容通过该明确请求授权执行。

### 逐项最终 disposition

| 项目 | 既有公开 ID | 最终处理 |
| --- | ---: | --- |
| RES-001 | 83 | MERGE_EXISTING / USE_EXISTING_CANONICAL；final Journal of International Money and Finance 131 (2023), 102777；DOI `10.1016/j.jimonfin.2022.102777`；作者 Richard K. Lyons / Ganesh Viswanath-Natraj。 |
| RES-003 | 70 | MERGE_EXISTING / CORRECT_CANONICAL_DOI；同一标题及 Kanis Saengchote / Krislert Samphantharak 作者身份相符；Finance Research Letters 64 (2024), 105435；DOI `10.1016/j.frl.2024.105435`。 |
| RES-005 | 114 | MERGE_EXISTING / PROMOTE_FINAL_JOURNAL_VERSION；RFS final，2026-09-03；DOI `10.1093/rfs/hhag072`；不新增 working-paper 重复记录。 |
| RES-007 | 445 | MERGE_EXISTING / CORRECT_AUTHOR_METADATA / PROMOTE_FINAL_JOURNAL_VERSION；作者精确为 Olli Castrén / Riccardo Russo；Economics Letters 258 (2026), 112720；DOI `10.1016/j.econlet.2025.112720`。原批准 author array 已含重音正确姓名，本次确认并保留，未制造无意义姓名改写。 |
| RES-009 | 67 | MERGE_EXISTING / STANDARDISE_OFFICIAL_TITLE；`Stablecoins and safe asset prices`；作者 Rashad Ahmed / Iñaki Aldasoro；BIS WP1270，publication year 保持 2025，原始发表日 2025-05-28；官方 BIS URL 为 source。 |
| RES-012 | 68 | MERGE_EXISTING / NORMALISE_IMF_DOI_ALIAS；IMF WP2026/005，2026-01-16；base DOI `10.5089/9798229036795.001` 为 canonical；`.A001` 为同一出版物 alias，无新增资源。 |
| RES-020 | 57 | MERGE_EXISTING / STANDARDISE_OFFICIAL_TITLE；`Stablecoins: risks, potential and regulation`；Douglas Arner / Raphael Auer / Jon Frost；BIS WP905，publication year 2020、原始发表日 2020-11-24；官方 BIS URL 为 source。 |
| RSC-001 | author 100 | MERGE_RESEARCHER_IDENTITY；Ganesh Viswanath-Natraj，Warwick Business School，**Associate Professor**；公开资源 83。未保留 seed 中已过时的 Assistant Professor。 |
| RSC-002 | author 200 | MERGE_RESEARCHER_IDENTITY；Yiming Ma，Columbia Business School，Regina Pitaro Associate Professor of Business, Finance Division；公开资源 114。 |
| RSC-003 | author 201 | MERGE_RESEARCHER_IDENTITY；Yao Zeng，The Wharton School, University of Pennsylvania，Assistant Professor of Finance；公开资源 114。 |
| RSC-004 | author 202 | MERGE_RESEARCHER_IDENTITY；Anthony Lee Zhang，Chicago Booth School of Business，Associate Professor of Finance；公开资源 114；未堆叠 honorary titles。 |
| RSC-005 | author 35 | MERGE_RESEARCHER_IDENTITY；Gary B. Gorton，Yale School of Management，Frederick Frank Class of 1954 Professor Emeritus of Management & Finance；关联原本已批准公开的 `Taming Wildcat Stablecoins`。 |
| RSC-006 | author 213 | MERGE_RESEARCHER_IDENTITY；Jeffery Y. Zhang，University of Michigan Law School，Assistant Professor of Law；关联原本已批准公开的 `Taming Wildcat Stablecoins`。 |
| RSC-009 | author 97 | MERGE_RESEARCHER_IDENTITY；Marco Gross，International Monetary Fund；安全角色 **Institutional researcher**；保留 **Publication-time affiliation**，来源为 IMF publication，未编造精确 job title；公开资源 68。 |

7 位研究者均使用既有精确姓名 author ID；全部已存在正确的 approved-public publication relationship，不需要新增或删除关系。两位 *Taming Wildcat Stablecoins* 作者复用原本已公开版本，完全未变更那一条 nonpublic match 的内容或可见性。

没有发现新的 hard identifier / publication contradiction。当前 author/profile schema 无 ISNI 字段、这七位没有已登记 ORCID 或不同 official profile；缺失值没有被伪造为身份核验证据。补丁 guard 对后续出现的 ORCID/ISNI、不同官方 profile、重复精确姓名、错误出版关系及标识冲突 fail closed；不使用 fuzzy-name 自动合并。

### 窄范围事务与保护证明

独立 ledger：`scripts/data/academic-directory-manual-decisions-v01.json`。保留人工文件 hash、7 个公开目标的预期既有作品元数据、canonical fields、7 个精确作者 ID、角色与官方/出版核验来源。V0.2 生成 seed JSON 与原始 22 个文件均未改写，人工角色/版本修正不回写原包。

只读 preflight 后，`scripts/academic-directory-manual-patch.mjs --apply` 使用 serializable transaction、相同 advisory lock 和限定表锁。仅允许已 approved 的 7 个精确 resource ID 更新 title/authors/source_type/published_date/doi/url；新增 7 条目录资源 metadata 和 7 条附着于既有 authors 的 public profile metadata。实际 resources INSERT=0、authors INSERT=0、relationship changes=0；未更改 institutions 或原 author bio/identity fields。

所有非公开 resources 全行、所有 resources 的其余字段（含 moderation/ownership/摘要）、7 项以外的所有 resources、所有 authors 全行、所有 resource_authors、duplicate_candidates 的事务前后匿名摘要均一致。任何保护断言失败会 rollback。没有输出非公开匹配 ID、账户或投稿内容。

数据库没有 alternate-version / DOI-alias / revision 专用字段。依裁决的“如 schema 支持”条件，未添加新表或借用摘要/审核 JSON。NBER WP27136、NBER WP33882、EBA Staff Paper18 早期版本及 IMF `.A001` alias 保存在独立 editorial ledger；不声称这些版本已存进 DB 独立字段。BIS 两篇原有 SSRN DOI 保留，official source URL 改为冻结包中 BIS 来源，不编造 BIS DOI。

### 安全计数与最终 dry-run

| 指标 | 补丁前 | 补丁后 |
| --- | ---: | ---: |
| resources total | 434 | 434 |
| approved / public | 395 | 395 |
| authors total | 1109 | 1109 |
| verified public researcher profiles | 3 | 10 |
| 既有 duplicate_candidates 关系数 | 3 | 3 |

非公开记录及状态全行指纹一致，故原 24 / 12 / 3 moderation 数量也保持不变；不披露该 1 个 seed nonpublic match 的 ID 或内容。

累计施工口径：资源 **14 matched + 5 上轮新增 + 0 conflict + 1 private-match**；研究者 **9 matched + 1 上轮新增 + 0 conflict**。本次新增 resources/authors 均为 0。

补丁后实际命令：`node scripts/academic-directory-db.mjs --manual-decisions --post-check`。该模式严格只读，并要求人工裁决的 canonical/profile metadata 已实际存在，不能只因“已获授权”就判为完成。输出为资源 **19 MATCH_EXISTING / 0 NEW / 0 CONFLICT / 1 PRIVATE_OR_PENDING_MATCH**，研究者 **10 MATCH_EXISTING / 0 NEW / 0 CONFLICT**。前轮已新增记录现已存在，因而在重复 dry-run 归入 matched。`--manual-decisions` 与完整导入 `--apply` 互斥，人工补丁不会触发重新导入。

DOI / canonical URL / identity 检查：本轮七目标无其他记录占用 canonical DOI/URL；IMF base + `.A001` 无第二资源；10 个公开 researcher ID/name 唯一；无新增 duplicate import candidate。全库原有 **2 组 DOI 重复、3 组规范 URL 重复**仍存在且数量不变，属于既有数据，不扩大本轮范围清理或宣称全库已零重复。

### 页面与测试验收

两页继续使用真实生产 public projection，经回环地址只读 QA API 读取 DB：资源 API 395 approved-only、研究者 API 10 verified profiles。未重构页面、接口或数据库。

- 逐个搜索七篇公开资源，均仅返回一条；核对 title/authors/year/evidence/venue、DOI 和 official source；RFS final 和 IMF base DOI 正确显示。
- `/experts` 默认 Recently verified；7 个新核验档案日期为 2026-10-17，原三档案保留 2026-10-16。
- Ganesh 为 Associate Professor；Marco 为 Institutional researcher，角色和机构均保留 publication-time qualifier；无 fabricated job title。
- 桌面 1440×1000 light/dark；手机 390×844 light/dark；中文页面及 320px 窄屏核验通过。长英文题名、机构、代表论文可换行；资源 evidence/source、研究者核验日期/官方来源在手机保留，无整页水平溢出。
- 新增 10 项补丁测试，包含 14 项真实公开 API / DB audit 验证、强标识与 publication guard、幂等 canonical、private target 不公开、IMF alias collision、精确身份、角色及禁止资源/作者新增或保护字段修改。
- 全专题 **109/109**（前轮 99 + 本次 10），0 fail/skipped；包含原六个已批准专题 **78/78**。
- `pnpm run typecheck`：通过。
- `pnpm run build`：通过；既有非阻断 sourcemap/chunk-size 警告保持。
- `git diff --check`：通过；新增文本另做空白检查。
- 原 ZIP 及 22 个原包文件 hash/bytes 完整性测试继续通过；inventory size discrepancy 仅保留上述验收记录。

本次逐文件与证据目录：`outputs/academic-directory-manual-patch-2026-10-17/`。其中 `preflight-before/after.json`、`manual-patch-preflight/applied.json`、`reconciliation-post-dry-run.json`、`acceptance.json`、公开 API 投影、浏览器内容/截图及验证日志构成验收证据。初次施工 `2026-10-16` 目录中的 3-profile / 7+7-conflict 记录未覆写。

本轮 14 项均已关闭，没有新增需要人工裁决的本轮身份/作品冲突。工作区其他专题原有改动保留；没有暂存或提交，没有 push，没有部署 Render。

## APPROVED_FOR_MERGE / LOCAL BASELINE — 提交前复核

2026-10-17，用户确认本专题最终内容、数据库 reconciliation、14 项人工裁决及全量 QA 通过，并明确授权一次独立本地 Git commit：`feat: rebuild academic resources and researcher directory v0.2`。原资源/作者导入阶段与本次人工补丁的历史计数均保留，不将本次 resources=0 / authors=0 误写成初次施工从未新增记录。

提交前重新执行：109/109 全专题回归、`pnpm run typecheck`、`pnpm run build`、`git diff --check`、只读 reconciliation idempotency 和实际 production public projection / visibility 检查。结果全部通过，证据保存在 `outputs/academic-directory-precommit-2026-10-17/`。

只读复核再次确认 resources 434 / approved-public 395、authors 1109、verified public profiles 10；资源 dry-run 为 19 matched / 0 new / 0 conflict / 1 nonpublic skip，研究者为 10 matched / 0 new / 0 conflict。14 项 canonical / identity / role 与裁决完全一致，IMF alias 仍仅在独立 ledger 中；所有非公开记录、ownership、摘要及既有 author 全行保护指纹与补丁后基线一致。公开 count 直接等于 approved public query records 数，DB/query failure 继续抛出失败而非 factual zero。全库原有 DOI 2 组、URL 3 组重复保持不变，未扩大清理范围。

原 ZIP 和 22 个 source package 原文件逐项 bytes/hash 与原验收值及 ZIP entry 相同，metadata discrepancy 继续原样记录。只暂存本专题实现、生成 API 契约、测试、源包、ledger 与验收证据；layout 仅纳入两页公开导航/面包屑名称，原 activeAliases 两行改动不进入提交。其他既有 workspace changes 不暂存，完整路径核对见 `scope-audit.json`。

本地提交不会 push，不部署 Render；数据库复核全程 READ ONLY，不再次 apply/import seed。
