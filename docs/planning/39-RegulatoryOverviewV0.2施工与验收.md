# Regulatory Overview V0.2 施工与验收

日期：2026-10-16。状态：`APPROVED_FOR_MERGE`。用户已通过最终内容、监管状态、来源日期与响应式比较验收，并授权独立本地 Git commit；不 push、不部署 Render。

## 唯一施工源与范围

唯一研究源为根目录 `Regulatory_Overview_Codex_Ready_Package_V0.2.zip`；原样解压到 `docs/source-packages/regulatory_overview_package_v0.2/`。

- ZIP：37235 bytes；SHA-256 `c2a0c1971e46a2bc0c7874ff85d4e00151c1a4d85bd2010d76241d2e2fd2da26`。
- 包内 19 个文件与 ZIP entry 逐字节一致，生成数据同时记录全部原文 SHA-256。
- 按用户指定顺序读完 13 组文件，包括中英文 Content Master；随后读取 CODEX_HANDOFF、page/asset manifests。
- 原包 metadata discrepancy：`PACKAGE_INVENTORY.json` 对自身记录 1005 bytes，实际 1368 bytes；其余条目大小一致。只记录差异，未修改原包。
- 本轮仅改变 `/regulatory` 的公开页面实现。未修改 About Regulatory Evolution 或 Asia 地区页面的研究结论；未修改 App 路由、站点导航或监管后端数据。
- 当前页面不再从旧监管条目 API 混入独立维护的状态；公开事实、状态和时间线使用冻结 V0.2 数据。既有后端接口保留。
- `.gitattributes` 只为本包增加原始换行保护及原文空白例外，未改原文来通过检查。

## 页面与文件

公开页面按以下顺序呈现：Hero → 2026-10-16 最后核验 → 简短研究/法律声明 → 状态图例 → 八法域比较 → 当前监管变化时间线 → 收敛/差异 → International standards and monitoring → 官方来源入口。

实现文件：

- `artifacts/stablecoin-hub/src/pages/regulatory.tsx`：定向替换旧公开页面；一个站点级路由，不加入 About 顶部导航。
- `artifacts/stablecoin-hub/src/components/regulatory-ui.tsx`：比较卡片、桌面 source tooltip、手机 source popover、日期字段、香港牌照记录、地区链接。
- `artifacts/stablecoin-hub/src/data/regulatory.ts`：冻结 public labels、双语展示适配、独立日期语义及字段翻译。
- `artifacts/stablecoin-hub/src/data/regulatory-v02.generated.json`：8 法域、28 官方来源、11 时间线项及 19 原文 hash；从包机械生成。
- `scripts/prepare-regulatory-package.mjs`：本地可重复生成脚本，不联网、不引入其他研究源。
- `scripts/tests/regulatory-overview.test.ts`：17 项包完整性、渲染、状态及日期边界测试。
- 本文档、原始 ZIP/解压副本、`.gitattributes`、本专题 outputs 下的 QA 截图、日志、完整性及逐文件记录。

逐文件列表：`outputs/regulatory-v02-qa-2026-10-16/changed-files.json`。

## 八法域冻结状态

| 法域 | 英文公开状态 | 关键日期与边界 |
| --- | --- | --- |
| United States | Enacted — implementation rulemaking — not yet effective | 2025-07-18 成法；预计 2027-01-18 生效，除非最终实施规则触发更早生效。成法后 18 个月与最终实施规则后 120 天两者较早者。 |
| European Union | MiCA in force / applicable | ART/EMT 条款自 2024-06-30 适用；2026 review 不暂停现行制度。 |
| United Kingdom | Final rules published — full commencement 25 October 2027 | 2026-02-04 制定法规；2026-06-30 FCA 最终规则；2027-10-25 完整制度全面生效。BoE 系统性层单独区分。 |
| Hong Kong | Issuer regime in force — licensed issuers exist | 制度 2025-08-01 生效；Anchorpoint Financial Limited / FRS01 与 HSBC / FRS02 均自 2026-04-10 持牌。issuer licence ≠ token public launch。 |
| Singapore | Implementation consultation — dedicated MAS-SCS regime not yet in force | 咨询 2026-09-01 至 2026-10-16，新加坡时间 23:59 截止。现有 DPT/MPI 或 XSGD/XUSD 不自动成为未来专门制度下 MAS-regulated stablecoin。 |
| Japan | Electronic Payment Instrument regime in force | 2023-06-01 原制度；2026-06-01 新中介制度；保留法定类别与登记，不创造统一稳定币牌照。 |
| UAE | CBUAE onshore Payment Token Services Regulation in force | 2024-08-31 生效；只代表 CBUAE 在岸范围；VARA、ADGM、DIFC 不合并。 |
| Mainland China | Restrictive / prohibitive boundary | 当前主基线银发〔2026〕42号，2026-02-06；2021 通知仅作为被取代的旧文件提及。 |

## 比较与来源 UI

桌面为主比较表，2248px 最小表宽，在页面内容区域内部横向滚动。仅法域 168px 与当前状态/阶段 280px 两列固定，其余六列滚动；未固定整张表。键盘 ArrowRight 实测 scrollLeft=120 后两固定列仍位于容器左缘 0 / 168px。正文保持可读宽度，不把所有字段压成窄列。

1024px 以下改为八张原生可展开 jurisdiction cards，状态和阶段日期在折叠态可见。展开后保留主要文件、发行准入、储备、赎回、监督、关键边界、官方来源及适用地区链接；每张卡共十个字段。

香港、新加坡、UAE、中国内地链接使用请求指定的 `/regional-developments/*` 地址。实测均打开正确地区页面，既有 App 将其规范化到 `/hong-kong`、`/singapore`、`/uae`、`/mainland-china`；本轮未修改该既有重定向。

来源沿用全站 Radix tooltip / popover 交互模式：桌面 hover/focus，卡片断点内 tap。每个 source body 明确：

- Authority / document / instrument type；类型区分 law、regulation、final rule、proposed rule、consultation、guidance、policy、notice、register。
- Publication date 与 enactment / making date 独立。
- Effective / commencement date 独立；不把 document publication 当制度生效。
- Register 另列 licence effective date；咨询另列 consultation closing date。
- Last verified 与 official source link。

包内未提供明确日期时显示“引用记录未注明”，不编造日期、不使用 page-load/fetch time。香港制度生效与牌照生效分属不同来源；新加坡咨询截止不当成制度生效。

视觉修正：本组件的 desktop tooltip 采用主题 popover 颜色，避免原蓝底上普通正文颜色的低对比；长来源面板限制为 `min(75vh, Radix available height)`，设置碰撞边距及内部滚动。320px 下实测顶部 16px，内部 End 可滚至核验日和官方链接，不裁掉字段。不修改全站共享 tooltip/popover 样式。

## 时间线、国际区与文案边界

时间线使用 `CURRENT_REGULATORY_TIMELINE.json` 的全部 11 项，保留原日期、顺序、法域、event type、变化内容及 source IDs。日期范围为 2024-06-30 至 2026-10-12。新加坡开启咨询项附独立截止日；不增加包外事件或新结论。

FSB、FATF、CPMI-IOSCO 位于单独的 International standards and monitoring 区。FSB 2023 建议及 2026-10-12 监测、FATF 2026 报告、CPMI-IOSCO PFMI 范围按包呈现，不进入八法域行，不称全球监管机构或全球法律。

法律通过、当前适用、未来最终规则、实施规则制定、咨询、指引、牌照/登记与限制性边界保留区别。未加入评分、排名、监管友好度、成熟度、安全分数、leaderboard 或主地图。删除旧页面的“英国最终规则待发布”等已过时状态；不显示美国联邦制度已生效，不把新加坡 2023 政策定稿等同专门制度生效。

英文使用 authorisation、finalised、licence 等 British English；官方文件名与机构名保留原拼写。中文将 relative “今天截止”转换成包内固定绝对日期，未更改研究结论。

## 实际浏览器验收

浏览器打开真实本地 `/regulatory`，非仅检查 source package 或 SSR。

- 1440×1000 桌面：英文/中文、light/dark 均检查比较表、状态、日期及文本对比度；整页 scrollWidth=1440，表格内容在局部 2248px 容器滚动。
- 390×844 手机：英文/中文、light/dark 均检查卡片与文本；八张卡均实际展开核对，中文/英文完整展开内容记录在 `browser-content-qa.json`，每张保留十个字段。
- 320×800：整页 scrollWidth=320，source popover 可内部滚至底部链接。
- 768×1024：使用卡片与 tap source UI，桌面表隐藏；整页 scrollWidth=768。
- 英国桌面来源实测公布 2026-06-30 / 全面生效 2027-10-25；新加坡手机来源实测公布 / 咨询截止；香港手机来源实测牌照生效 / 最后核验。
- 时间线、收敛/差异、国际区和官方来源入口截图已保存；四个地区 deep-link 实际点击通过。
- 浏览器 console error：0。

证据位置：`outputs/regulatory-v02-qa-2026-10-16/`。本轮启动仅绑定本机的 Vite 5183 预览，未启动 API、未写数据库、未部署。

## 测试与最终检查

- 全专题回归 **78/78 passed**，0 failed / skipped：既有 Homepage/Research + About + Asia + Agentic + Market Data **61/61**，新增 Regulatory **17/17**。
- 测试采用真实 React SSR + 包解析适配，核对八个 public labels、US 生效机制、UK 最终规则及未来日期、SG 实施咨询、HK 牌照/上线语义、日本类别、UAE scope、内地主基线、国际区隔离、手机字段、desktop 固定列、source 日期分类与 11 项时间线；并核对 19 个 source 文件与 ZIP bytes/hash。
- 命令：在 `scripts/` 使用 Node 24 执行 `node --import tsx --test tests/*.test.ts`。日志 `regression.log`。
- `pnpm run typecheck`：通过，日志 `typecheck-final.log`。
- `pnpm run build`：通过（包含全工作区 typecheck），日志 `build.log`。既有 UI sourcemap / 大 chunk 警告仍存在，不阻断 build。
- `git diff --check`：通过；新增实现文本另查尾随空白，原包不作格式化。
- 包完整性：19/19 通过，见 `package-integrity.json`；inventory 自身大小 discrepancy 非阻断，未修改原包。
- 未改 About Regulatory Evolution、Asia 页面研究源或其他已提交专题；现存 layout、导入脚本、connector ZIP、.gitkeep 删除及内容交接包等无关工作区改动保留原样，不纳入本专题。

## 人工裁决与冻结日期

按照本轮唯一施工包的 2026-10-16 冻结版本，未发现阻断施工、需要人工裁决的当前监管状态问题。来源核验日期及其结论引用包内记录；本轮不进行包外法律研究，也不自动推进未来生效或咨询状态。若后续官方事实变化，应以新施工源重新审核，不能仅根据日历或现有产品/牌照推断制度已生效。

## APPROVED_FOR_MERGE / 本地提交前复核

2026-10-16 用户确认最终内容、监管状态、来源日期与响应式比较验收通过，状态设为 `APPROVED_FOR_MERGE`，授权独立本地提交。提交信息：`feat: rebuild regulatory overview v0.2`。不 push、不部署 Render。

提交前重新执行：全专题 **78/78 passed**、`pnpm run typecheck` 通过、`pnpm run build` 通过、`git diff --check` 通过。日志位于 QA outputs 的 `precommit-regression.log`、`precommit-typecheck.log`、`precommit-build.log`、`precommit-diff-check.log`。

原 ZIP SHA-256 及其 19 个文件逐字节完整性再次通过，见 `precommit-integrity.json`。原 inventory 的 1005 / 1368 bytes 自身大小差异继续只记录，不修改源包。八个冻结 public labels 及法律/制度、政策/约束、牌照/上线、咨询/最终规则、国际标准/国内法边界全部保持。

来源 UI 的 publication、enactment / making、effective / commencement、licence effective、consultation closing、last verified 仍为独立字段，已通过组件渲染测试及源码核对。未改 About Regulatory Evolution 或 Asia 研究结论。

提交按 `changed-files.json` 精确范围核对，共 69 个文件；逐项验证暂存集合与清单一致、index blob 与工作区相同、原包 19 个 index blob 与 ZIP entry 相同。范围记录见 `precommit-scope.json`。既有 layout、导入脚本、connector ZIP、.gitkeep 删除及其他规划/交接文件保持未暂存。
