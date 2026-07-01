# 项目规划文档索引

> 本目录是 Claude Chat(设计/规划)与 Claude Code(执行)之间的衔接文档。
> Code 在动手前应**先通读 01-08**,理解整体设计与几处修正关系;遇到文档间冲突,以编号更大/日期更新的为准,不确定先问用户。

## 一、阅读顺序与各文件作用

| # | 文件 | 作用 |
|---|---|---|
| 01 | 重构施工清单 | 五大模块(Dashboard / Resources / Authors / Regulatory / Our Research)整体施工顺序,最早的主线规划 |
| 02 | 实现说明_修订版 | 配置(.env + 只读状态面板)/ 认证邮件 / 标签 T.1–T.5 / 上传管线 U.1–U.6 框架,**项目主干** |
| 03 | 标签种子与重构 | 33 主题 + 16 辖区 + 15 币种种子数据;U.3 打标须可对全库重跑;后续的标签重构辅助面板 |
| 04 | 落库策略修正 | **修正 02 中 U.5 的状态机**——uploading/processing 实际属于新增的 upload_jobs 表,不属于 resources;两表两状态、三入口分流(手填/单条走纯内存,批量/PDF 走 upload_jobs) |
| 05 | 上传管线 U1-U6 | 学者 API 五个工具函数(Crossref/OpenAlex/Semantic Scholar/DOI/Unpaywall)、反查链接 agent、核对 agent 的具体实现;PDF 抽取"先文字后 OCR"分层 |
| 06 | 题录导入第四入口 | 知网 RefWorks/EndNote/NoteExpress/知网研学 题录批量导入;**其中 sourceType 部分已被 08 取代** |
| 07 | 补遗与衔接 | authorRaw 临时字段(机构作者兜底)、Authors 模块预定决策(`type: person|organization`,排在上传管线之后做)、三批测试夹具总览 |
| 08 | sourceType 最终枚举 | **最终定案,覆盖 06 中的早期版本**:7 个 slug(journal_article/working_paper/conference_paper/thesis/report/gov_document/news),语言无关,前端按当前语言显示 nameZh/nameEn;原"智库报告"已并入"报告" |

## 二、已知的覆盖关系(避免冲突执行)

- **08 覆盖 06**:sourceType 一律按 08 的 7 个 slug 执行,06 里出现的旧枚举值作废
- **04 覆盖 02 的 U.5 部分**:resourceStatusEnum 不含 uploading/processing,这两个状态属于 upload_jobs.status
- **fixtures/batch2 已是 v3 终版**(早期 v1/v2 已废弃删除),sourceType 用 08 的 slug

## 三、测试夹具(`fixtures/`)

| 文件 | 条数 | 路径 | 用途 |
|---|---|---|---|
| batch1-10papers.json + batch1-说明.md | 10 | DOI 解析 + 标题反查(U.2) | 英文文献,含无DOI反查、非稳定币不强塞标签、标题污染清洗 |
| batch2-urldoi-v3.json | 12 | URL/DOI 导入 | 政府文件机构作者、直链PDF识别、可疑来源标记、跨文件年份冲突 |
| batch3-cnki.json | 9 | 题录导入(第四入口) | 四格式解析、中文打标、多作者/机构作者拆分、CNKI DOI不反查、缺摘要补全 |

## 四、当前项目进度(供 Code 核对,以实际仓库 git log 为准)

- ✅ 配置(.env + 只读状态面板)
- ✅ 认证邮件(注册验证码 + 忘记密码重置)
- ✅ 标签数据层 T.1–T.4(tags 表 + 64 条种子)
- ✅ U.1–U.5(学者工具函数 / 反查 agent / 打标 / 核对 agent / 状态机 + upload_jobs)
- ✅ U.6 后端(routes/upload.ts,手填+单条同步路径,批量/PDF走job)
- ⬜ U.6 前端(academic-resources.tsx 四个 tab:手填/DOI·URL/PDF/题录导入)
- ⬜ 题录导入(06 文档对应的实现)
- ⬜ T.5(前端按 facet 渲染标签 + 点击聚合)
- ⬜ authorRaw 字段(07 文档第一节,应尽快补——四个入口都依赖)
- ⬜ Authors / Dashboard / Regulatory / Our Research 模块(01 文档,排在上传管线之后)

## 五、给 Code 的建议指令

> 请通读本目录 01–08(注意二、覆盖关系),对照"四、当前进度"和你在仓库里看到的实际状态确认是否一致,如有出入告诉我。确认后我们继续做 U.6 前端 / authorRaw 字段。过程中用 fixtures/ 下的夹具做回归验证。
