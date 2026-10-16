# Market Data + Dashboard｜Content Master zh-CN V0.1

> 所有数字必须来自结构化数据对象；正文不硬编码会快速变化的市场数字。

---

# 1. `/dashboard`｜稳定币数据仪表盘

## HERO
**H1** 今天值得看的稳定币信号

**Lead**  
这里不追求“指标越多越好”。只展示定义清楚、来源可核验、时间状态明确的少数市场信号，再把用户引向完整数据页。

## Core signals
最多 6 个：
1. **追踪稳定币流通价值** — DefiLlama 动态数据
2. **Top-2 供应集中度** — 与总量同一快照计算
3. **30 日流通价值净变化** — 同口径历史序列
4. **3 个月美债收益率** — FRED，作为储备收益环境背景，不是发行方实际回报
5. **选定交易场所流动性状态** — 有健康快照才展示，不构造“全市场流动性”
6. **最新采用证据** — 报告快照卡，必须显示研究期间和样本范围

## Data health
每张卡显示：
- observation / report date
- source
- freshness
- methodology tooltip

如果当前抓取失败：
显示 `上次成功快照：YYYY-MM-DD HH:mm`
而不是 `0`。

## Links
市场 / 链上 / 发行方储备 / 宏观 / 采用

**禁止**
- 55 风险、机制数量、辖区数量、资源数量作为 Dashboard KPI
- 实时风险概率
- 实时脱锚概率

---

# 2. `/market-data`｜市场数据概览

## HERO
**H1** 先定义指标，再看图表

**Lead**  
稳定币的“规模、流动性、链上活动、储备、宏观环境和采用”来自不同数据体系。它们不能被压成一个统一的“市场活跃度”。

## Five questions

### 01 市场
**问题：** 市场有多大？供应是否集中？选定交易场所是否流动？价格是否偏离目标？

数据：
- tracked circulating value
- supply concentration
- price deviation / event history
- selected CEX spread / depth / simulated slippage
- selected DEX pool volume / liquidity

### 02 链上
**问题：** 稳定币在哪些链上存在？链上转移活动如何？

数据：
- supply by chain
- raw transfer volume
- adjusted transfer volume
- P2P transfer volume
- active addresses
- selected Ethereum issuance / holder research

### 03 发行方与储备
**问题：** 什么资产支持赎回？披露与核验有多及时？

数据：
- circulation/liabilities covered
- reserve composition
- assurance type
- report period / publication date
- redemption eligibility

### 04 宏观
**问题：** 美元利率、国债收益率、美元强弱与市场压力处于什么环境？

数据：
- SOFR / EFFR
- DGS3MO / DGS2 / DGS10
- broad USD
- RRP
- VIX
- selected Asia FX

### 05 采用
**问题：** 哪些活动可以真正归因到支付、结算或具体使用渠道？

区分：
- attributable payment research
- on-chain activity
- issuer-reported network/distribution metrics

## Methodology warning
不同来源的覆盖、更新频率、样本和许可不同。每个图表独立显示来源与时间，不做“统一实时”假象。

---

# 3. `/market-data/market`｜市场规模、价格与流动性

## HERO
**H1** 供应规模、价格稳定与交易流动性是三件不同的事

## A. Supply
### 追踪稳定币流通价值
使用 DefiLlama stablecoins 数据。

公共标签优先用：
**Tracked circulating value (USD)**

除非字段级验证完成，不把所有数据简单写成“market cap”。

图表：
- aggregate history
- top stablecoins
- 30d net change
- top-2 / top-5 concentration

## B. Price stability
展示：
- current price vs verified target
- deviation in bps
- event history only after methodology QA

**边界**
价格偏离是观测，不是未来脱锚概率。

## C. CEX liquidity — selected venues only
每个交易对展示：
- exchange
- pair
- timestamp
- bid / ask
- spread bps
- bid depth within 2%
- ask depth within 2%
- simulated slippage for explicit order size

不要把一个 Binance pair 称为“全市场流动性”。

## D. DEX liquidity — selected pools only
展示：
- chain / DEX / pool
- pool liquidity USD
- 24h volume
- pool price

**明确：**
DEX pool liquidity ≠ CEX 2% depth ≠ route-level executable slippage.

## E. Failure state
如果 Binance / DEX / CoinGecko 没有有效快照：
显示 unavailable / delayed / last-successful，不显示空白大图，也不显示 0。

---

# 4. `/market-data/on-chain`｜链上活动

## HERO
**H1** 链上转移很多，不等于支付很多

## A. Supply by chain
DefiLlama 自动更新。
需要说明 native / bridged 处理和追踪范围。

## B. Activity hierarchy
依次解释：

### Raw transfer volume
链上代币转移总量，可能包含交易所内部流转、协议交互、机器人、MEV 和重复经济活动。

### Adjusted transfer volume
如果使用 Artemis adjusted metric，必须保留其过滤定义。

### P2P transfer volume
wallet-to-wallet 活动，比 raw transfer 更接近个人间转移，但仍不等于商户支付。

### Attributable payments
需要付款方/收款方/商户/发票/支付服务商等额外证据，放在 Adoption 页面。

## C. Active addresses
地址 ≠ 用户。
一个用户可控制多个地址；托管地址可代表多个用户。

## D. Ethereum issuance
仅对经过验证的 USDT/USDC 等合约展示。
Mint/burn 事件含义、Treasury 转移与流通发行必须逐币验证。

## E. Holder concentration
默认 HOLD。
只有完成 exchange/bridge/treasury 地址分类和排除规则后，才公开集中度指标。

---

# 5. `/market-data/issuers-reserves`｜发行方、储备与赎回

## HERO
**H1** 比较储备之前，先比较披露口径

**Lead**
“100% backed”不是一个足够完整的横向比较。还要看资产构成、期限、托管、核验类型、报告时滞和谁能直接赎回。

## Comparison table
主列：
- Token / issuer
- Report period
- Publication date
- Circulation / liabilities covered
- Reserve composition
- Assurance type
- Assurance provider
- Disclosure frequency
- Direct redemption eligibility
- Notes / limitations

## Assurance ladder
### Issuer self-report
发行方自己的数字。

### Attestation / examination
独立会计机构针对特定声明和时点执行鉴证程序。

### Financial-statement audit
对公司完整财务报表执行审计。

**Attestation ≠ financial-statement audit.**

## Current baseline examples
### Tether / USDT
截至本基线，最新核验的储备鉴证为 Q2 2026、报告期末 2026-06-30、2026-07-31 发布。Tether 另于 2026-08-13 宣布 KPMG 对 2025 全年财务报表出具无保留审计意见。

不要把年度公司审计与季度储备鉴证混成一个字段。

### Circle / USDC
Circle transparency 页面持续披露 circulation、reserve composition 与 issuance/redemption，并发布月度储备鉴证。公司季度财报是另一层披露。

### Paxos / PYUSD
保留每月 reserve reports / attestations；2025-02 起页面列示 KPMG。

### FDUSD
使用月度储备披露与鉴证；直接 purchase/redeem 面向符合资格的发行方客户，普通二级市场持有人关系不同。

## Issuer economics
公司级收入/利润可以作为背景，但必须单列：
`Company-level financial result`
不得标成某稳定币“产品利润”。

---

# 6. `/market-data/macro`｜宏观环境

## HERO
**H1** 宏观数据提供环境，不提供稳定币因果结论

## Chart 1｜美元短端利率环境
SOFR、DGS3MO；必要时 EFFR。
同为百分比，但含义不同。

解释：
短端利率与短期储备资产的潜在收益环境相关；不是发行方实际投资组合回报。

## Chart 2｜Treasury curve
DGS3MO / DGS2 / DGS10。

解释：
观察期限结构与利率风险环境；不暗示发行方实际持有对应期限。

## Chart 3｜Broad USD
DTWEXBGS。

解释：
美元外部价值背景。不要由同步变化直接推出 stablecoin demand 因果关系。

## Chart 4｜Market stress
VIXCLS。

解释：
跨市场风险情绪背景，不是“稳定币风险指数”。

## Chart 5｜Money-market liquidity
RRPONTSYD。
单位 USD bn，必须单独纵轴。

## Optional｜Asia FX
DEXCHUS / DEXHKUS / DEXSIUS。
若同图比较，建议转换为各自基期=100 的归一化指数；tooltip 仍显示原始“本币/1美元”报价。

香港本地利率、阿联酋货币市场指标仍属于后续扩展，不为了对称性硬填。

---

# 7. `/market-data/adoption`｜支付与实际使用

## HERO
**H1** 采用证据必须回答“谁在用、用于什么、样本有多大”

## Evidence class A｜Attributable payment research
Artemis 2025 report：
- 22 家受访公司 + 11 家补充估算
- 研究期：2023-01 至 2025-08
- 可归因稳定币支付累计：$136B
- 2025-08 年化运行规模：$122B

这些数字是**报告样本**，不是 2026 年实时全市场总额。

按报告分类展示：
B2B / P2P / Card / B2C / Prefunding。

## Evidence class B｜On-chain activity
transfer volume / transactions / active addresses。

这些衡量网络活动，不能自动转成支付采用。

## Evidence class C｜Issuer-reported activity
例如发行方报告的：
- wallets
- on-chain volume
- network participants
- payment-network activity

必须保留发行方自己的指标定义和报告日期。
不得与 Artemis sampled payments 相加。

## Cross-link
“稳定币能做什么” → `/about-stablecoins/applications`
“实际用了多少” → 本页

## Explicit warning
不要用：
- 链上 transfer volume
- 钱包数量
- partner/member count
- token circulation

单独证明“merchant adoption”或“大规模支付采用”。
