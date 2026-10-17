# Conference Study Risk Framework Routes V0.2 — P0 本地施工与验收

日期：2026-10-17。状态：LOCAL_QA_COMPLETE，待用户检查。未 commit、未 push、未部署 Render。

## 施工源与项目边界

唯一内容施工源为 `Conference_Study_Risk_Framework_Codex_Ready_Package_V0.2.zip`：25397 bytes，SHA-256 `514ed177fd07e4e22350bd8ef3241c6125618ab5075b2b76dba4c7391458ac62`。按用户顺序读取 README、website/thesis boundary、status、QA、component spec、双语 Content Master、study status、四个 mapping/module/roadmap CSV 及所有 manifests，另读 handoff、navigation 和 inventory。

18 个 ZIP entry 原样保存于 `docs/source-packages/conference_risk_framework_routes_v0.2/`，逐项 bytes/hash 与 ZIP entry 一致；inventory 列出 17 个其他文件而不包含自己，已列出的 bytes 全部匹配，无 metadata size discrepancy。未改写源包。新增 `.gitattributes` 原文保护规则。

网站唯一研究成果来源是会议报告 *Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins*，October 2026。作者和机构仅按来源显示 Xueli Li / Zhejiang University，未扩展机构背书。未查找、读取或使用其他项目研究材料；已作废 Quantitative package 未使用。

原三个已挂载路由是量化产品文案与占位页，并未发现已挂载的 TE/Hawkes 实证页面。本轮完全替换旧公开内容；新三页没有引入任何论文实证内容，实际中英文渲染扫描禁用项均为 0。未为缺失资料补造风险、研究阶段、样本日期、数量或模型结果。

## 三路由实现

| 保留路由 | 英文公开 H1 | 中文公开 H1 |
| --- | --- | --- |
| `/quantitative` | Stablecoin Risk Framework | 稳定币风险框架 |
| `/quantitative/dimension-a` | Lifecycle Mapping (T0–T3) | 生命周期映射（T0–T3） |
| `/quantitative/dimension-b` | Amplification & Transmission Mapping (L0–L3) | 放大与传导映射（L0–L3） |

三个路由共用轻量顶部导航 Risk Framework / Lifecycle Mapping / Amplification & Transmission；当前路由有 `aria-current=page`。Sidebar 只有一个 Risk Framework 栏目，未添加 children。全局导航与面包屑标签作必要更名；URL 不变。

原 `QuantDimensionA/B` 的 placeholder exports 移除，App 直接挂载会议研究页面；其余 placeholder exports、About 等路由实现不变。旧主页面的两大虚假产品卡片、占位图和相关 claims 均删除，包含脱锚概率/风险指数、Model under calibration、Q3 2024、Data aggregation in progress、Global Adoption Velocity、payment-gateway cooperation / anonymized velocity metrics。

### 当前研究与未来研究

当前研究只显示风险拆解方法、submitted-framework count 55、T0–T3 及 L0–L3 概念映射。Atomic risk 明确定义为用于 identification and measurement 的 minimum useful risk unit，不代表因果或统计独立；仍可相互作用、放大及传导。

七个模块精确来自 RISK_MODULES.csv；仅作 presentation-level organisation，不定义新的 formal taxonomy。模块页显示 14 个代表性风险条目；合并三个来源映射文件，只有 **19 个不同的已提供代表性风险 ID**，没有自行补齐 55 个风险名单，也没有导入旧 research-risks 列表。

方法流程：Stablecoin System → Risk Modules → Atomic Risk Units → Two-Dimensional Mapping；两维度分别有对应解释与跳转。Current Study / Future Research 使用不同标题及实线/虚线边界，三页均保留，手机不隐藏任何一侧。

全部七个 roadmap 条目仍是 FUTURE_RESEARCH：risk-specific indicators、appropriate composite measures、transmission/amplification quantification、dynamic monitoring/stress detection/tiered early warning、regulatory coverage mapping、blind-spot identification、regulatory optimisation。无 calibration、live/beta/deployed 或完成状态的包装。

### T0–T3

四阶段标签及代表风险严格取自 LIFECYCLE_MAPPING.csv：Foundation, Backing & Issuance；Circulation, Trading & Settlement；Protocol Embedding & Layered Finance；Redemption, Deleveraging & Liquidation。桌面四列横向 band，窄屏纵向，文本可换行，不压缩整图。

显著保留 operational locus；不是 severity ranking、risk score 或 deterministic causal sequence。T1/T2 边界为 protocol embedding，普通 DEX trade 可以仍属 T1；lending、collateral、LP 及其他 layered positions 属 T2。没有把“在链上/在 DeFi”自动归为 T2。

### L0–L3

精确使用 Initial Trigger / Structural Vulnerability / Dynamic Amplification / Cross-System Transmission / Outcomes。L3 保留 other stablecoins、DeFi protocols、broader crypto markets、traditional financial markets 四类向外结果。箭头只表示 conceptual causal-role structure；明确说明结构脆弱性可能先于触发存在，不是经验估计的网络或机械时序。

四个关键区分均完整显示：L0 ≠ L1（trigger / susceptibility）；L1 ≠ L2（structural condition / activated process）；T0 ≠ L1（operational location / causal role）；T3 ≠ L3（exit stage / cross-system propagation）。无数值边权、概率、系数、风险仪表、预测或压力曲线。

## Desktop / mobile / bilingual / theme QA

实际浏览器运行本机 Vite 5184；不部署、不新增 API、不访问或写入数据库。

- 3 routes × 4 widths（320×740、390×844、768×1024、1440×1000）× 2 languages × 2 themes，共 **48 个实际渲染组合**。
- 从实际 DOM 记录 innerWidth、scrollWidth、标题、stage positions、grid columns、Current/Future 容器高度及 Future item 数量；48/48 均无整页横向 overflow，两个研究状态均存在，七项 Future 均保留。
- T/L 两个 band 在 <1024px 单列纵向，桌面四列横向；记录实际 stage x/y 验证。另检查桌面完整 band、手机 T1/T2 与 L2/L3 关系、代表性风险换行、Current/Future 实际可读性。
- 48 张原始 viewport 截图与 4 张 contact sheets；单独保存关系/状态截图。没有为适配删除关键关系，没有压缩图片代替文本。
- 会议来源折叠可展开，显示报告完整题名、日期、作者及机构；未提供或伪造原始研究文件下载链接。
- 页面所有展示文案通过 `t(en, zh)`，代表风险中文仅为所给英文名的翻译，原英文标签保留于适配数据；class-based dark theme、academic blue、空白及分隔线与既有网站一致。
- 两个检查标签页 browser console errors 均为 0。临时 viewport 已 reset，原有目录预览已恢复，保留本轮框架预览。

## 跨页面只读审计 — 需另轮纠正

**CROSS_PAGE_RESEARCH_BOUNDARY_CORRECTION_REQUIRED = YES**

| Route | Website component / file | Problematic wording category |
| --- | --- | --- |
| `/research` | `pages/research.tsx`；`data/home-research.ts`；`data/home-research-english-copy.ts`；`components/home-research-ui.tsx`；`data/home-research-v02.generated.json` | 将 TE/Hawkes 中期实证、stress-scenario/historical-case 结果、measurement design / audited data pipeline / validation 状态作为网站当前研究成果。 |
| `/` | `pages/home-overview.tsx`；`data/home-research.ts`；`components/home-research-ui.tsx` | current research / maturity 文案称 TE/Hawkes 已有 interim results，并列示压力情景、历史事件实证及相应验证进度。 |

所有路径均相对于网站 `artifacts/stablecoin-hub/src/`。没有披露任何私人论文文件路径。

已在两页实际渲染中确认，例如 `/research` 正文称这些方法 “have produced interim empirical results”，首页状态称 “TE/Hawkes have interim results”。按本轮最高级范围要求，仅报告，**未修改两页或其共享研究数据/组件**。六个相关文件施工前后的 SHA-256 完全一致，见 read-only-page-fingerprints.json 与 cross-page-boundary-report.json。全局 sidebar 的必要栏目标签更新不改变两页研究结论。

此项需要后续单独的跨页边界纠正；不能因本轮三个路由 QA 通过而将整个网站研究边界视为已修复。

## 测试与完整回归

新增 **27/27** 测试：原始 18 文件完整性；三 URL；中英文实际 SSR 无 TE/Hawkes、论文 nodes/benchmarks、论文 stress/case empirical claims、旧脱锚概率、模型校准/Q3 2024、支付网关 claims；三 H1；55 submitted-framework count；atomic 最小有用单元与交互；T/L 精确标签与 representatives；T1/T2；四个不等式；Future-only 状态；只用 19 个已给代表 ID；手机保留两状态与纵向 band；七模块组织边界；概念图无假量化；单 sidebar parent / internal nav。

全专题 **136/136 passed**，0 failed/skipped：既有 Homepage/Research、About、Asia、Agentic、Market Data、Regulatory、Academic Resources/Researchers 共 **109/109**，本轮 27。既有专题回归通过表示兼容性通过；首页/Research 研究边界问题仍如上单独列为 YES。

- `pnpm run typecheck`：PASS。
- `pnpm run build`：PASS；既有非阻断 sourcemap / chunk-size 警告仍在。
- `git diff --check`：PASS；新增实现/文档另做空白检查，源包原文不格式化。
- ZIP / 18 原文逐项 hash/bytes：PASS。
- 全公开中英文禁用项扫描：0 occurrence。

验证证据：`outputs/conference-risk-framework-v02-qa-2026-10-17/`。主要日志为 framework-tests.log、regression.log、typecheck.log、build.log；视觉与扫描为 responsive-matrix.json、rendered-public-content.json、contact sheets 与截图；跨页为 cross-page-boundary-report.json / cross-page-rendered-audit.json。

逐文件记录与排除项见 changed-files.json / scope-check.json；保留其他未提交工作区改动，包括 layout 的原有 activeAliases 两行、connector ZIP、import audit、既有规划/内容交接文件与旧本地快照。没有改动其他已批准专题的研究结论。

三页没有未决的框架内容裁决。仍需用户另行处理的内容事项是上述 Homepage/Research 跨项目边界纠正。本轮停止等待检查，不 commit、不 push、不部署 Render。
