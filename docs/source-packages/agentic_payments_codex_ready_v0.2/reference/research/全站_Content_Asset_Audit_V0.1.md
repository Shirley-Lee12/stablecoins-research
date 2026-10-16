# Stablecoin Research Hub｜全站 Content & Asset Audit V0.1

> **审计日期**：2026-10-15  
> **依据**：网站定位与内容原则、41 个公开页面正文快照、数据与维护说明、7 张代表性页面截图，以及已完成的智能体支付研究底稿/网站方案。  
> **性质**：Codex 施工前的全站内容与素材审计，不是最终网页文案，也不是 UI 设计定稿。  
> **状态**：REVIEW  
> **核心目标**：先确定每个页面回答什么问题、保留什么内容、需要什么证据和视觉素材，再进入 Codex 前端施工。

---

# 1. 结论先行

## 1.1 现在不能直接把现有网站材料全部交给 Codex

现有网站已经有较完整的路由和基础页面，但目前存在四类问题：

1. **内容真实性问题**  
   少数页面仍保留未证实或过期陈述，例如量化指标页面中的“实时脱锚概率”“模型校准中”“2024 年第三季度发布”“与国际支付网关合作”等。

2. **研究内容与网页展示没有分层**  
   一些页面像研究报告摘要，一些页面只有短卡片；缺乏统一的“10 秒理解 → 1 分钟理解 → Research Detail”阅读结构。

3. **视觉资产不足**  
   代表性截图显示，现有页面主要依赖文字、表格、浅色卡片和流程块。机制类、区域比较类、研究框架类页面缺少真正承担解释任务的图示。

4. **动态数据页面的“内容缺口”和“运行缺口”混在一起**  
   图表暂时没显示，不等于应该用静态数字或占位图补齐。动态页面必须先定义数据口径、样本、失败状态，再施工。

因此 Codex 前需要一套明确的：

> **Content Package + Asset Package + Data/Chart Spec + Source Manifest**

---

# 2. 第一轮全站优先级

## P0 — 立即处理，不能按旧内容继续施工

1. `/quantitative`
2. `/quantitative/dimension-a`
3. `/quantitative/dimension-b`
4. `/agentic-payments/protocols/a2p2`
5. 所有“实时风险概率 / 模型已校准 / 已合作”等未经证实陈述
6. 所有市场数据页面中的空图、失败状态与“已实现=已稳定可用”的混淆
7. 跨页面不一致的动态数字、牌照状态和产品状态

### 处理原则

- 量化指标尚未形成可公开体系时，不展示虚构结果。
- A2P2 若无足够官方规范证据，不继续作为与 AP2/x402 同等级的协议详情页。
- 不以静态假数据填补运行失败。
- 不把合作、试点、生产验证和全面上线统一写为“已落地”。

---

## P1 — 本轮内容建设核心

1. 智能体支付专题
2. 亚洲稳定币发展
3. 平台首页
4. 我们的研究
5. 监管现状
6. 市场数据总体信息架构

这些页面直接决定网站是否具有“研究 Hub”价值，而不仅仅是已有资料汇总。

---

## P2 — 在 P1 骨架稳定后完善

1. 关于稳定币
2. 发展历程
3. 分类及机制详情
4. 应用场景
5. 监管演进
6. 发行方、储备与赎回
7. Macro / Adoption

---

## P3 — 内容系统与数据库状态稳定后优化

1. 学术资源库
2. 专家与机构

这两个页面更依赖数据库内容和审核体系，不应因当前导出为空而急于填静态假条目。

---

# 3. 代表性截图的视觉审计

7 张现有截图表现出一致的设计语言：左侧导航、窄内容列、浅色背景、细边框卡片、蓝色主色、较大的留白。

## 3.1 可以保留

- 蓝色学术/金融基调；
- 日间/夜间主题思路；
- 左侧全站导航；
- 页面内顶部切换；
- 细线、轻量卡片而非高饱和商业宣传风；
- 文献/来源入口的克制呈现。

## 3.2 当前主要视觉问题

### A. 页面“有结构，但缺视觉解释”

智能体支付、AMP、亚洲比较等页面已经有模块顺序，但主要还是：

> 标题 + 一小段文字 + 卡片 + 表格

用户需要自己在脑中建立机制。

### B. 相同卡片模板重复过多

不同性质的内容——定义、事实、产品、风险、时间线——视觉上差异不够。

结果是：

> 页面看起来整齐，但信息层级不强。

### C. 页面宽度与信息密度不匹配

研究型页面包含复杂比较表、流程、时间线，而当前正文区域偏窄，导致：

- 字号显小；
- 表格压缩；
- 横向比较能力弱；
- 大面积留白与小块文本同时存在。

这不是要求马上重做 UI，但 Codex 施工时必须允许：

- 宽表格；
- 横向流程；
- 全宽图表；
- 必要的 sticky / expandable detail。

### D. 缺少真实世界视觉证据

目前几乎没有：

- 官方产品截图；
- 真实产品界面；
- 机制示意图；
- 区域地图；
- 市场趋势图。

因此页面容易像“文字化知识库”。

---

# 4. 素材分类标准

Codex 前素材统一分为 6 类。

## `DIAGRAM_SVG`

本站自绘解释图。

用途：

- 机制；
- 资金流；
- 生命周期；
- 授权；
- 风险链；
- 分类。

原则：

- SVG 优先；
- 可以响应式；
- 文本可编辑；
- 不依赖截图；
- 统一视觉语言。

---

## `CHART_DYNAMIC`

由网站根据数据动态渲染的图。

用途：

- 市值/供应趋势；
- 价格与脱锚；
- CEX/DEX 流动性；
- mint/burn；
- 储备构成；
- 宏观；
- adoption。

原则：

> 不提前做成 PNG。

Codex 需要的是：

- 字段；
- 数据源；
- 时间区间；
- 口径；
- chart type；
- tooltip；
- missing-data handling。

---

## `SCREENSHOT_OFFICIAL`

官方产品/系统截图。

用途：

- 证明产品真实存在；
- 展示用户真实交互；
- 说明某项产品 capability。

例如：

- ChatGPT Instant Checkout；
- Meta Muse purchase approval；
- Grok Bot Allow / Deny；
- X Money；
- 支付宝 Agent Pay；
- 京东AI购。

原则：

- 只用于事实和产品证据；
- 记录来源 URL、截图日期和用途；
- 不用作装饰背景。

---

## `LOGO_OFFICIAL`

官方品牌/协议标识。

只用于：

- 快速识别；
- 生态关系图；
- 产品/机构表。

不做大面积 Logo wall。

---

## `MAP_SVG`

适合地区与监管边界的地图。

例如：

- 亚洲四地；
- 阿联酋联邦与自由区；
- 主要支付/产品可用地区。

必须有信息目的，不做装饰地图。

---

## `TABLE_UI / DATA_UI`

结构化比较本身就是最佳展示，不需要图片。

适合：

- 协议对比；
- 监管义务；
- 产品状态；
- 发行方事实；
- source matrix。

---

# 5. 41 个页面 Content & Asset Audit

## A. 平台与基础理解

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 1 | `/` 平台首页 | **保留路由，深度重写** | 这个 Hub 研究什么？我能在这里找到什么？为什么可信？ | 从“机构介绍优先”改为“用户价值优先”；成果与研究计划分开；保留 AIF 支持关系但不做宣传主体 | `DIAGRAM_SVG` 全站研究地图；少量真实动态指标；栏目入口 | 轻度 | P1 |
| 2 | `/about-stablecoins` 了解稳定币 | **保留，重写** | 稳定币是什么？为什么能接近 1 美元？谁承诺赎回？ | 从定义进入“发行—流通—赎回—套利”；普通用户术语解释 | `DIAGRAM_SVG` 稳定币基本机制；不需要产品截图 | 无 | P2 |
| 3 | `/about-stablecoins/history` 发展历程 | **保留，重构** | 为什么稳定币从加密交易工具变成支付/金融议题？ | 时间线不能只堆事件；分阶段解释规模、危机、监管、机构采用 | `TIMELINE_UI` + `CHART_DYNAMIC` 市场规模趋势 | 有 | P2 |
| 4 | `/about-stablecoins/types` 稳定币类别 | **保留，重构 taxonomy** | 不同稳定机制真正差在哪里？ | 用支撑资产、赎回权、价格稳定机制、清算机制分类；允许混合机制 | `DIAGRAM_SVG` taxonomy + `TABLE_UI` | 无 | P2 |
| 5 | `/about-stablecoins/applications` 稳定币应用 | **保留，明确与 Adoption 分工** | 具体能用来做什么？资金如何走？ | 按用户任务：交易、跨境、支付、企业资金、DeFi；不堆采用数字 | `DIAGRAM_SVG` 场景资金流 3–4 张；官方案例截图可选 | 轻度 | P2 |
| 6 | `/about-stablecoins/regulatory-evolution` 监管演进 | **保留，压缩** | 监管为什么从“观察风险”走向发行/储备/赎回制度？ | 做制度演化，不重复各地现行规则 | `TIMELINE_UI` | 无 | P2 |

---

## B. 稳定币机制详情

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 7 | `/types/fiat-backed` 法币储备型 | **保留，深化** | 储备型稳定币如何发行、赎回和维持价格？ | 解释 issuer / reserve / bank / custodian / primary vs secondary market | `DIAGRAM_SVG` mint–reserve–redeem；储备结构动态/报告图 | 中 | P2 |
| 8 | `/types/crypto-backed` 加密抵押型 | **保留，深化** | 超额抵押、预言机、清算如何维持稳定？ | 区分 DAI/LUSD 等机制；解释清算与坏账 | `DIAGRAM_SVG` collateral–oracle–liquidation | 轻度 | P2 |
| 9 | `/types/synthetic` 合成型 | **保留但重新定义边界** | 对冲型/合成美元靠什么支撑？ | 避免把所有非传统稳定币放进一个桶；重点解释对冲、资金费率、托管和交易对手 | `DIAGRAM_SVG` hedge/balance-sheet flow | 轻度 | P2 |
| 10 | `/types/algorithmic` 算法型 | **保留，历史与机制导向** | 无充分外部资产支撑时如何稳定？为什么容易失败？ | UST 等作为机制与失败案例，不把历史失败机制与当前主流等量齐观 | `DIAGRAM_SVG` reflexive loop + `TIMELINE_UI` crisis case | 可选 | P2 |
| 11 | `/types/other` 其他分类 | **建议合并/改名** | 混合机制、商品支持、数据源分类差异怎么处理？ | 不保留“其他=一种机制”的误导；可改为“混合与边界案例”或并入 Types | `TABLE_UI`，通常不需要图片 | 无 | P2 |

---

## C. 监管与亚洲发展

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 12 | `/regulatory` 监管现状 | **保留，深度重写** | 谁受监管？什么规则已生效？发行、储备、赎回分别要求什么？ | 法案/规则/指引/牌照/咨询稿分开；截至日统一 | `TABLE_UI` jurisdiction matrix；`TIMELINE_UI` | 无 | P1 |
| 13 | `/regional-developments` 亚洲比较总览 | **保留，重点重做** | 中国内地、香港、新加坡、阿联酋的发展模式本质区别是什么？ | 从政策摘要变为“产品—渠道—用户—制度—真实采用”比较 | `MAP_SVG` + 四地比较矩阵 + 具名产品卡 | 中 | P1 |
| 14 | `/mainland-china` 中国内地 | **保留，深度重写** | 境内私人稳定币边界是什么？与 e-CNY、代币化存款、境外业务如何区分？ | 清楚区分 private stablecoin / CBDC / tokenised deposit / offshore linkage | `DIAGRAM_SVG` 边界图；必要时官方基础设施图 | 轻度 | P1 |
| 15 | `/hong-kong` 中国香港 | **保留，深度核验** | 哪些牌照/产品/渠道真正可用？谁能用？ | license ≠ product launch；逐产品列发行、托管、用户限制、渠道 | `TIMELINE_UI` + `TABLE_UI` product/channel matrix；官方产品素材可选 | 中 | P1 |
| 16 | `/singapore` 新加坡 | **保留，深度核验** | MAS 框架与实际稳定币产品如何对应？ | 不用 DPT 机构数量替代稳定币采用；逐项核实 XSGD/USDC/USDP 等 | `DIAGRAM_SVG` framework-to-product map；产品/渠道表 | 中 | P1 |
| 17 | `/uae` 阿联酋 | **保留，深度核验** | 联邦、迪拜、ADGM 等规则与产品分别适用于哪里？ | 不能把 UAE=Dubai；逐辖区、币种和产品对应 | `MAP_SVG` jurisdiction map + `TABLE_UI` product/regulator matrix | 中 | P1 |

---

## D. 我们的研究与量化

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 18 | `/research` 我们的研究 | **保留，重点重写** | 我们已经完成什么？原创问题是什么？下一步研究什么？ | 明确“理论框架 / 已完成研究 / 正在构建的测量 / 计划”；避免把研究计划写成生产系统 | `DIAGRAM_SVG` 生命周期×风险层级框架；方法路线图 | 后续 | P1 |
| 19 | `/quantitative` 量化指标 | **暂缓公开或改成方法状态页** | 目前到底有什么可公开量化结果？ | 删除实时风险概率、过期发布日期、未证实合作；没有冻结方法/数据前不展示指数 | 暂不做视觉资产 | 高 | **P0** |
| 20 | `/quantitative/dimension-a` 维度 A | **建议隐藏/合并** | 无成熟内容时不应单独占路由 | 等量化框架正式建立后再拆 | 无 | 高 | **P0** |
| 21 | `/quantitative/dimension-b` 维度 B | **建议隐藏/合并** | 同上 | 同上 | 无 | 高 | **P0** |

---

## E. 智能体支付专题

> 本栏目已有独立研究底稿 V0.3 与网站展示方案 V0.1。以下审计以新研究为准，不沿用旧页面深度。

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 22 | `/agentic-payments` 概览 | **整页重构** | AI 能替我付款了吗？谁授权？稳定币在哪一层？ | 采用“User→Agent→Authorization→Payment→Settlement”主线；控制等级、资金模型、rails | 7 张核心自绘图中的 4–5 张 | 无 | **P1** |
| 23 | `/agentic-payments/protocols` | **整页重构** | 各协议究竟处于哪一层，是否竞争？ | 协议矩阵；Protocol ≠ Product；更新协议集合 | `TABLE_UI` + `DIAGRAM_SVG` protocol stack | 无 | **P1** |
| 24 | `/agentic-payments/scenarios` | **整页重构** | 消费购物、API、企业采购、A2A 的流程和风险有何不同？ | 按“任务”而不是公司写；真实案例 vs 研究示意分开 | 4 个场景流程图；风险 callout | 无 | P1 |
| 25 | `/agentic-payments/ecosystem` | **整页重构** | Google、OpenAI、蚂蚁、银联、Meta、X、京东分别在哪层？ | 机构关系按层分类；合作/协议/产品/试点分开 | `DIAGRAM_SVG` ecosystem map；`LOGO_OFFICIAL`；少量 `SCREENSHOT_OFFICIAL` | 无 | P1 |
| 26 | `/protocols/ap2` | **保留，扩写** | Agent 如何证明被用户授权？ | Mandate / receipt；Human Present vs Autonomous；Trusted Surface | `DIAGRAM_SVG` AP2 mandate flow | 无 | P1 |
| 27 | `/protocols/acp` | **保留，扩写** | Agent 如何和商户 checkout，并安全传递支付权限？ | Commerce + Delegate Payment；Merchant of Record | `DIAGRAM_SVG` + `SCREENSHOT_OFFICIAL` Instant Checkout 可选 | 无 | P1 |
| 28 | `/protocols/amp` | **保留，扩写** | Wallet-first Agent payment 有什么不同？ | task not account、KYA、nano-payment、Phase I rollout | `DIAGRAM_SVG` AMP + wallet network；`LOGO_OFFICIAL` partners | 无 | P1 |
| 29 | `/protocols/x402` | **保留，扩写** | HTTP 402 如何变成机器付款？稳定币为什么适合？ | 从 USDC-native origin 到 multi-asset；Discovery/Batch Settlement | `DIAGRAM_SVG` HTTP 402 flow；演变时间线 | 无 | P1 |
| 30 | `/protocols/apop` | **保留，扩写** | 银联如何解决 Agent 身份、意图、过程信任？ | 四大能力 + 5 笔生产系统验证；白名单/试点状态 | `DIAGRAM_SVG` identity-intent-process triangle；case timeline | 无 | P1 |
| 31 | `/protocols/a2p2` | **暂停/删除，先核验** | 是否真有足够官方规范证据支持独立页面？ | 当前新研究底稿未将其列入核心协议；无权威证据前不与其他协议等量展示 | 无 | 无 | **P0** |
| 32 | `/protocols/ucp` | **保留，扩写** | Agent 与商户如何共享商品、购物车、checkout？ | Commerce layer；与 AP2 的组合关系 | `DIAGRAM_SVG` UCP commerce flow | 无 | P1 |

### 建议新增协议详情（替代/补充旧集合）

- `/protocols/mpp` — Machine Payments Protocol
- `/protocols/act` — Alipay ACT
- 可将 AVOP 放入 APOP/银联生态二级内容，不必一开始独立占主导航。

---

## F. 数据仪表盘与市场数据

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 33 | `/dashboard` 数据仪表盘 | **保留路由，数据优先重构** | 今天/本周稳定币市场有什么值得注意？ | 只放 4–6 个高价值信号；不要显示资源条目数当核心 KPI；明确数据状态 | 全部 `CHART_DYNAMIC` / KPI；禁止静态假图 | **高** | P1 |
| 34 | `/market-data` 市场概览 | **保留，做数据导航页** | 市场、链上、发行方、宏观、采用分别回答什么？ | 少量 summary + 分区入口；不重复子页所有图 | 4–5 个小趋势图或 sparklines，动态 | 高 | P1 |
| 35 | `/market-data/market` 市场规模与价格稳定性 | **保留，重做数据 spec** | 规模、集中度、价格稳定性、流动性和脱锚如何变化？ | 区分 CEX / DEX；定义 2% depth、spread、slippage、depeg event | `CHART_DYNAMIC` 多图；事件表 | **高** | P1 |
| 36 | `/market-data/on-chain` 链上活动 | **保留，重做数据 spec** | 哪些链上发行/赎回/流量变化值得关注？ | 存量与流量分开；mint/burn ≠ circulation；地址分类透明 | `CHART_DYNAMIC` supply by chain, mint/burn, treasury, holders | **高** | P1 |
| 37 | `/market-data/issuers-reserves` 发行方与储备 | **保留，重点深化** | 发行人怎么赚钱？储备是什么？怎么赎回？披露多久一次？ | 每个 issuer 做可比 profile；鉴证 ≠ 审计 | `CHART_DYNAMIC`/report-derived reserve composition；`TABLE_UI` | 中高 | P1/P2 |
| 38 | `/market-data/macro` Macro | **保留，数据+解释重构** | 利率、美元、资金环境怎么影响稳定币？ | FRED 不只列代码；每张图配传导解释；补 HK/UAE 相关指标再扩 | `CHART_DYNAMIC` + `DIAGRAM_SVG` transmission | 高 | P2 |
| 39 | `/market-data/adoption` 支付与实际使用 | **保留，严格证据化** | 真实支付/商户/机构使用到什么程度？ | 不把转账额、钱包地址、覆盖人数相加；报告样本/期间清晰 | `CHART_DYNAMIC` 或 report snapshot；地区/渠道结构图 | 中高 | P2 |

---

## G. 资源与专家

| # | 页面 | 决策 | 页面要回答的问题 | 主要内容动作 | 核心视觉/素材 | 数据依赖 | 优先级 |
|---|---|---|---|---|---|---|---|
| 40 | `/academic-resources` 学术资源库 | **保留，等数据库状态稳定后优化** | 我想研究某个问题，应该从哪些高质量资料开始？ | 从“资源数量”转为策展：主题、方法、数据、监管、行业报告 | 不需要图片；`TABLE_UI` / resource cards | 高 | P3 |
| 41 | `/experts` 专家与机构 | **保留，但重定义目的** | 谁研究什么？基于哪些可核查成果？ | 不做权威排名；作者/机构关系必须有出处；不要自动抓作者当推荐专家 | 通常不需要人物照片；机构 Logo 可选 | 高 | P3 |

---

# 6. 全站“必须制作”的第一批自绘视觉资产

下面这些素材具备跨页面复用价值，应优先制作。

## GLOBAL

### `GLB-D01` Stablecoin Basic Mechanism
用途：
- About
- Fiat-backed
- Applications

内容：
```text
User / Market
↕
Issuer
↕
Reserve / Custodian
+
Secondary Market / Arbitrage
```

---

### `GLB-D02` Stablecoin Taxonomy
用途：
- Types
- 类型详情入口

维度：
- backing
- redemption
- stabilization
- liquidation / hedge
- issuer / protocol structure

---

### `GLB-T01` Stablecoin Evolution Timeline
用途：
- History
- 首页二级入口

---

## REGIONAL

### `REG-M01` Asia Stablecoin Development Map
覆盖：
- Mainland China
- Hong Kong
- Singapore
- UAE

每地不是只放监管颜色，而显示：
- regulatory model
- named products
- user/channel availability
- real-use evidence

---

### `REG-D01` Mainland Boundary Diagram
必须清楚区分：
- private stablecoin
- e-CNY
- tokenised deposits
- offshore stablecoin activity

---

### `REG-M02` UAE Regulatory Jurisdiction Map
区分：
- federal
- Dubai / VARA
- ADGM
- 其他相关监管边界

---

## RESEARCH

### `RES-D01` Stablecoin Risk Research Framework
内容：
- lifecycle
- risk nodes
- amplification layers
- contagion / transmission

只展示已确认理论/研究框架，不画成“实时预警已上线”。

---

## AGENTIC PAYMENTS

### `AGT-D01` Agentic Payment Stack
User Intent → Agent → Commerce → Identity → Authorization → Payment → Rail → Settlement → Audit

### `AGT-D02` Autonomy Levels
Human-confirmed / Pre-authorized / Autonomous

### `AGT-D03` Three Fund-Control Models
Mandate / Scoped Credential / Platform Account

### `AGT-D04` Three Payment Rails
Card/Bank / Wallet/APM / Stablecoin/Blockchain

### `AGT-D05` Protocol vs Product vs Infrastructure

### `AGT-T01` 2025–2026 Agentic Payment Timeline

### `AGT-D06` Agentic Payment Risk Chain

---

## MARKET / DATA

数据页面优先动态渲染，不制作静态数据图片。

唯一建议先自绘：

### `MKT-D01` Macro-to-Stablecoin Transmission
示意：
```text
Rates / USD / Funding / FX
→ reserve income / demand / liquidity / arbitrage
→ stablecoin market variables
```

---

# 7. 第一批需要收集的官方截图

官方截图的原则是“证明真实产品交互”，不是给页面加装饰。

## Agentic Payments — 必须优先

| Asset ID | 对象 | 目的 | 优先级 |
|---|---|---|---|
| `AGT-S01` | ChatGPT Instant Checkout | 展示 AI 内完成真实 checkout | 必须 |
| `AGT-S02` | Meta Muse purchase approval | 展示 human approval + agent purchase | 必须 |
| `AGT-S03` | Grok Bot Allow / Deny purchase | 展示明确金额审批 | 必须 |
| `AGT-S04` | X Money | 展示 Agent 可调用的平台金融产品 | 最好有 |
| `AGT-S05` | 支付宝 Agent Pay / Machine Pay | 展示国内 AI 支付产品实际入口 | 必须 |
| `AGT-S06` | 京东AI购 | 展示 AI shopping product | 最好有 |
| `AGT-S07` | 银联 APOP 真实案例材料 | 证明 production-system validation 场景 | 最好有 |

### 每张截图必须同时记录

- source_url
- organization
- capture_date
- what_it_proves
- crop_instruction
- alt_text
- copyright/use note
- status

---

# 8. 哪些页面“不需要图片”

以下页面不要为了“更丰富”硬塞图片：

- 监管现状：比较表、时间线通常更有效；
- 资源库：筛选、策展、元数据优先；
- 专家与机构：没有明确授权和价值时不要批量使用人物头像；
- 市场数据：动态 chart 优先；
- 发行方 facts：数据表和储备图优先；
- Protocol matrix：表格/结构图优先。

---

# 9. 动态图表素材需求

## 9.1 Dashboard

建议只保留：

1. Total stablecoin supply
2. Top-asset share / concentration
3. Recent depeg signal
4. CEX liquidity snapshot
5. On-chain issuance/redeem flow
6. One adoption/usage snapshot（若有合格来源）

必须允许：

- unavailable
- delayed
- partial coverage

而不是空大卡片。

---

## 9.2 Market

需要定义：

- venue sample
- pair sample
- quoted currency
- depth side
- timestamp
- order size
- depeg threshold
- recovery threshold

---

## 9.3 On-chain

必须区分：

- supply stock
- mint flow
- burn flow
- treasury transfer
- external transfer
- address concentration

不能把“链分布供应量”标成“交易额”。

---

## 9.4 Issuer / Reserves

图表要同时显示：

- report period
- publication date
- attestation/audit status
- reserve categories
- duration if available
- redemption terms

---

## 9.5 Macro

现有 FRED：
- EFFR
- SOFR
- DGS3MO
- DGS2
- DGS10
- DTWEXBGS
- RRPONTSYD
- VIXCLS
- DEXCHUS
- DEXHKUS
- DEXSIUS

仍需研究：
- Hong Kong money-market conditions
- UAE money-market conditions
- Singapore policy framework 不能硬塞成单一“政策利率”对比

---

## 9.6 Adoption

每个数字必须附：

```text
Metric
Definition
Sample
Period
Source
Adjustment
Coverage limitation
```

例如：

> “$X stablecoin payments”

不能脱离报告样本直接标成“全市场支付总额”。

---

# 10. 全站素材目录建议

交给 Codex 前最终整理成：

```text
content/
  home/
  basics/
  regional/
  regulation/
  research/
  agentic-payments/
  market-data/
  resources/

assets/
  diagrams/
    global/
    regional/
    research/
    agentic/
  screenshots/
    agentic/
    products/
  logos/
    issuers/
    protocols/
    companies/
  maps/

data-specs/
  dashboard.md
  market.md
  on-chain.md
  issuers-reserves.md
  macro.md
  adoption.md

manifests/
  asset_manifest.csv
  source_manifest.csv
  page_manifest.csv
```

---

# 11. Asset Manifest 建议字段

```text
asset_id
section
page_route
module_id
asset_type
filename
title
purpose
source_url
source_org
source_date
capture_date
alt_text
crop_or_render_instruction
rights_note
language
status
```

`status` 使用：

- PLANNED
- SOURCE_FOUND
- CREATED
- REVIEW
- READY
- REJECTED

---

# 12. Page Manifest 建议字段

每页交给 Codex 前必须有：

```text
page_route
page_title
primary_audience
user_questions
module_order
web_copy_status
source_status
visual_asset_ids
dynamic_chart_ids
interaction_notes
empty_state
mobile_notes
last_verified
approval_status
```

---

# 13. Codex Ready Gate

一个页面只有满足以下条件才标 `READY_FOR_CODEX`：

## 内容

- [ ] 页面回答的问题已经确定
- [ ] 模块顺序已经确定
- [ ] 网页短文案已审阅
- [ ] Protocol / Product / Pilot / Partnership 状态已区分
- [ ] 动态事实写有截至日期

## 来源

- [ ] 重要事实有原始来源
- [ ] 链接已核查
- [ ] 数字/版本/时间与来源相邻
- [ ] 未知项明确标注

## 视觉

- [ ] 每个视觉都有 asset_id
- [ ] 自绘图内容脚本已冻结
- [ ] 官方截图已确定来源和用途
- [ ] 不需要图片的模块明确标记
- [ ] Logo 已确认官方来源

## 数据

- [ ] chart fields 已定义
- [ ] source / coverage 已定义
- [ ] unit / frequency 已定义
- [ ] empty / delayed / partial state 已定义
- [ ] 不使用伪造 placeholder data

## 施工

- [ ] desktop / mobile 信息优先级明确
- [ ] 交互说明明确
- [ ] 中英文处理规则明确
- [ ] 不含研究过程说明或内部 TODO 文案

---

# 14. 推荐的实际整理顺序

## Stage 1 — 先完成智能体支付的 Codex-ready 内容包

原因：

- 已有最完整研究底稿；
- 已有网站展示方案；
- 最容易形成“以后其他栏目照着做”的标准样板。

需要完成：

1. 7 张核心图脚本冻结；
2. 5–7 张官方截图；
3. protocol cards；
4. ecosystem cards；
5. timeline；
6. source manifest；
7. 页面文案。

---

## Stage 2 — 亚洲稳定币发展

完成：

- 四地总览；
- 四个地区详情；
- 亚洲地图；
- product/channel matrix；
- regulatory boundary；
- named products；
- source manifest。

---

## Stage 3 — 首页 + Research

首页在两个强专题形成后再重写，避免首页继续只是“网站有什么栏目”。

Research 页面同步修正：

> 已完成研究 ≠ 正在研究 ≠ 计划构建的平台能力。

---

## Stage 4 — Market Data

先完成 data spec 和数据 QA，再让 Codex建图。

不能反过来：

> 先画 20 个空图框，再找数据填。

---

## Stage 5 — Basics / Regulation / Resources

最后统一基础页、监管页、资源页，确保术语、日期和引用风格与前面一致。

---

# 15. 第一轮审计后的最终判断

## 可以直接保留的不是“现有页面内容”，而是：

- 大部分路由逻辑；
- 全站蓝色视觉基调；
- 稳定币作为中心主线；
- About / Regional / Research / Market / Agentic 等栏目边界的基本方向；
- AIF 支持单位表述；
- 中英双语和深浅主题需求。

## 不能直接继承的是：

- 旧量化指标陈述；
- A2P2 等未经充分证实的协议层级；
- 把所有页面都做成小卡片+短段落的展示方式；
- 将“产品/牌照/试点/合作”统一称为已落地；
- 空数据图表；
- 过度依赖机构介绍而非用户问题的首页；
- 缺乏真实机制图和实际产品证据的专题页。

## Codex 前最关键的素材工作

不是“收集很多图片”，而是：

> **为每个模块确定最合适的证据载体。**

优先级：

1. 自绘机制 SVG
2. 动态数据图表 specification
3. 有事实价值的官方产品截图
4. 地图/时间线
5. Logo
6. 最后才考虑装饰性视觉

Stablecoin Research Hub 不需要大量 stock photo。

它需要的是：

> **能解释机制、证明事实、展示真实数据的视觉素材。**

---

# 16. 下一步

当前最合理的下一项任务：

> **把“智能体支付”做成全站第一个 Codex-ready Content & Asset Package。**

具体交付应包括：

1. 页面级 final outline
2. 模块级网页文案
3. 7 张核心自绘图的精确画面脚本
4. 官方截图 acquisition list
5. Protocol / Company card data
6. Source manifest
7. Asset manifest
8. Codex handoff instructions

智能体支付完成后，亚洲发展栏目直接复用同一套交付标准。
