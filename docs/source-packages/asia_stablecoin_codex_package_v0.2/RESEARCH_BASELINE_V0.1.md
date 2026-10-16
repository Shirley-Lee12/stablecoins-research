# 亚洲稳定币发展｜Research Baseline V0.1

截止：2026-10-16。生产内容仅采用 Source Manifest 中官方/第一方来源。

## 1. 总体框架
四地不能只按“监管宽松度”排序。网站必须同时比较：监管对象、专门发行制度、牌照、token 是否上线、用户可用性、分发渠道、支付用途和辖区边界。

## 2. 中国内地
2026-02-06 银发〔2026〕42号成为当前基线，并废止 2021 年旧通知。通知明确：虚拟货币不具法偿性；相关业务属非法金融活动；未经同意不得在境外发行挂钩人民币的稳定币；未经同意境内主体及其控制的境外主体不得在境外发行虚拟货币；金融/支付机构不得为相关业务提供账户、资金划转和清算结算；RWA 代币化原则上受限，保留主管部门同意并依托特定金融基础设施的边界。

e-CNY 是中国人民银行发行的 CBDC/法定数字货币，不是 stablecoin。香港跨境 e-CNY 钱包可用香港手机号开立、无需内地银行账户、可经 FPS 增值，当前用于跨境零售支付且不支持香港钱包 P2P。

页面核心：`private stablecoin/virtual currency`、`e-CNY`、`approved tokenised infrastructure` 三条路径必须分开。

## 3. 中国香港
Stablecoins Ordinance 发牌制度自 2025-08-01 实施。HKMA 注册册目前显示：
- Anchorpoint Financial Limited — FRS01 — 2026-04-10
- HSBC — FRS02 — 2026-04-10

HKDAP：
- 1 HKDAP = HKD1
- Beta Access 2026-08-12 开始
- Beta 期间 Ethereum mainnet
- select authorised distributors + institutional/corporate users
- reserve assets 至少覆盖流通面值，并按信托结构为持有人利益持有
- Full Launch 最早目标 2026 年底，当前不应写 retail live
- Standard Chartered 2026-08-24 成为首家银行 authorised distributor

HSBC RedCoin：
- HSBC 2026-09-30 明确尚未发行香港稳定币
- 产品已命名，计划通过 PayMe / HSBC HK App
- 计划 P2P、P2M、tokenised investment
当前状态应写 `LICENSED + FORTHCOMING / NOT ISSUED`。

## 4. 新加坡
MAS 2023-08-15 完成 stablecoin framework 政策设计，覆盖新加坡发行、挂钩 SGD 或 G10 currency 的 SCS，并提出储备、资本、赎回、披露要求。

但 MAS 2026-09-01 又就 Payment Services Act 修法公开咨询，以正式实施 stablecoin framework；咨询截止 2026-10-16。只有未来在该框架下获牌的发行人/token 才可使用 “MAS-regulated stablecoin issuer / MAS-regulated stablecoin” 标签。

与此同时，XSGD/XUSD 已在现有 PSA/DPT/MPI 体系下运行：
- XSGD 1:1 SGD，月度储备鉴证，可 1:1 赎回
- XUSD 1:1 USD，月度储备鉴证
因此不能把“产品已存在”写成“MAS-SCS 专门发牌框架已全面生效”。

Circle Internet Singapore 是 MAS Major Payment Institution，可提供 DPT、国内/跨境转账等服务，但这不等于 USDC 已是 MAS-SCS token。

## 5. 阿联酋
UAE 必须分监管辖区。

### CBUAE
Payment Token Services Regulation C 2/2024 自 2024-08-31 生效，覆盖 issuance / conversion / custody & transfer。Dirham Payment Token 只能以 AED 计价；按面值赎回；不得按持有时间支付利息/奖励；Financial Free Zones 不在该规则 territorial scope。

当前 CBUAE register 包括：
- AED StableCoin LLC — Dirham Payment Token Issuance
- Zand Trust LLC — Dirham Payment Token Issuance
- AEDC Stable Coin LLC — Dirham Payment Token Issuance
- AEDC Network and Distribution — Conversion + Custody/Transfer

AE Coin：
- issuer AED Stablecoin LLC
- 1 AEC = 1 AED
- issuer 第一方披露为 B2B-only，终端 custody/transfer/conversion 由 appointed agents 承担
当前可标 `CBUAE-LICENSED + LIVE PRODUCT + AGENT-DISTRIBUTED`。

Zand AED (AEDZ)：
- 1 AED = 1 AEDZ
- public multi-chain
- 1:1 redemption
- reserve transparency，现金 + UAE Monetary Bills
当前可标 `CBUAE-LICENSED + LIVE PRODUCT + PUBLIC MULTI-CHAIN`。
动态 reserve/circulation 数字必须带 as-of 日期。

AEDC：牌照可核实，但 token 名称、上线时间、用户可用性、chain 当前保留 UNKNOWN。

### VARA
VARA 覆盖 Dubai mainland/free zones，DIFC 除外。AED-referenced FRVA 不由 VARA 批准，归 CBUAE；VARA FRVA 不能作为 UAE 内 goods/services 的支付方式。

### ADGM / FSRA
有独立 FRT regime。Issuing FRT 是 regulated activity；涉及 FRT 的受监管活动只能使用 Accepted FRT。
公开 register：
- Paxos Issuance MENA — USDL only；no retail clients
- Universal Digital INTL — FRT issuance；no retail clients
- Jingdong Coinlink Middle East — FRT issuance effective 2026-01-06
牌照/permission 不自动证明具体 token 已面向市场上线。

### DIFC / DFSA
2026-01-12 更新 Crypto Token framework 生效；由 firms 负责 documented suitability assessment，不再依赖监管机构的 Recognised Crypto Token list。

## 6. 关键 UNKNOWN
- AEDC token exact identity / launch / retail / chain
- JD Coinlink ADGM specific token/product launch
- Universal Digital product details if shown in main comparison
- MAS-SCS final legislative implementation timing
- HSBC RedCoin actual launch date
- HKDAP Full Launch actual timing
