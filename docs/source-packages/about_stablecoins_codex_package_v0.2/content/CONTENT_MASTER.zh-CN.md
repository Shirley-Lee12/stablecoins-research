# About Stablecoins｜Content Master zh-CN V0.1

> 定位：轻量、准确的稳定币入门层。  
> 顶部导航遵循 `NAVIGATION_SPEC.md`；侧边栏不展开二级页面。

---

# 1. `/about-stablecoins`｜关于稳定币

## HERO
**H1** 先理解机制，再理解稳定币

**Lead**  
稳定币是一类试图围绕某个参考价值保持相对稳定的可转移数字代币。美元是最常见的参考单位，但“稳定”并不是代币天然拥有的属性，而是由储备、抵押、赎回、清算、对冲或其他稳定机制共同维持。

## 01｜稳定币是什么
不要只看“锚定 1 美元”。

理解一个稳定币，需要看四个问题：

1. **参考价值**：它试图追踪什么？
2. **经济支撑**：什么资产、头寸或机制吸收损失？
3. **发行与退出**：谁能铸造、持有、转移和直接赎回？
4. **偏离后如何恢复**：靠套利、赎回、清算、对冲还是供给调整？

**Visual** `STB-D01-stablecoin-lifecycle.svg`

## 02｜为什么会出现
稳定币最初解决的是加密市场中的“稳定计价与结算”问题，随后逐步进入：
- 跨境资金转移；
- 商户与企业结算；
- DeFi 抵押与流动性；
- tokenised assets 的链上结算；
- 机器/智能体支付等新场景。

但“可以用于某个场景”不等于“已经大规模采用”。

## 03｜稳定币不是这些东西
### CBDC
中央银行发行的数字法定货币。

### Tokenised bank deposit
对商业银行存款负债的数字化表示。

### Tokenised MMF / Treasury fund share
代表基金份额或证券资产的 tokenised claim。

### Stablecoin
通常由私人主体或协议安排发行，目标是维持某个参考价值，并在数字网络中流通。

**Visual** `STB-D02-money-boundaries.svg`

## 04｜从哪里继续
- 看历史 → `/about-stablecoins/history`
- 看类别与机制 → `/about-stablecoins/types`
- 看应用 → `/about-stablecoins/applications`
- 看监管演进 → `/about-stablecoins/regulatory-evolution`
- 看当前各地监管 → `/regulatory`
- 看亚洲真实产品 → `/regional-developments`

---

# 2. `/about-stablecoins/history`｜稳定币发展历程

## HERO
**H1** 稳定币的历史，是稳定机制不断接受压力测试的历史

**Lead**  
从把法币价值搬到链上，到加密抵押、DeFi、算法实验，再到发行人监管和跨境监测，稳定币的发展并不是简单的“规模增长”，而是一次次重新回答：价值支撑在哪里、谁能赎回、压力由谁承担。

## Timeline
### 2014｜法币价值进入区块链
Tether 启动。早期稳定币开始把传统法币计价单位带入区块链交易。

**What changed:** 加密市场获得可链上转移的稳定计价资产。

### 2017｜链上抵押创造稳定币
Maker 推出 Single-Collateral Dai（现称 Sai）。

**What changed:** 稳定币不再只能依赖银行账户中的法币储备，也可以由链上超额抵押与清算机制生成。

### 2018｜储备型稳定币走向更广泛机构化
USDC 于 2018-09-26 上线。

**What changed:** 储备透明度、合规发行和开放区块链流通开始成为重要产品路线。

### 2020–2021｜DeFi 放大稳定币的金融功能
稳定币成为 AMM、借贷、抵押、收益策略和链上结算的重要基础资产。

**What changed:** 稳定币从“交易所现金替代品”进一步变成链上金融基础设施。

### 2022-05｜TerraUSD 崩溃
UST/LUNA 的反身性稳定机制在挤兑中进入死亡螺旋。

**What changed:** 市场重新关注可赎回储备、抵押质量、流动性和信心依赖。

### 2023｜国际监管标准成形
FSB 完成全球稳定币安排的高层建议。

**What changed:** 监管开始围绕治理、风险管理、赎回权、稳定机制和跨境协调形成共同基准。

### 2024｜欧盟 MiCA 的稳定币规则开始适用
ART / EMT 相关条款自 2024-06-30 起适用。

**What changed:** 稳定币进入大型经济体的专门发行与监督框架。

### 2025｜美国与香港进入专门制度阶段
美国 GENIUS Act 于 2025-07-18 签署成法；香港稳定币发行人制度于 2025-08-01 生效。

**What changed:** “是否监管”逐渐转向“谁能发行、储备是什么、如何赎回、如何监督”。

### 2026｜从发牌走向系统性与跨境监测
英国推进 FCA/BoE 稳定币规则；FSB 继续研究全球稳定币的跨境脆弱性与数据监测。

**What changed:** 监管问题从单一发行人进一步扩展到支付系统、跨境传导和金融稳定。

**Visual** `STB-T01-history-timeline`（结构化时间线，不做静态大图）

---

# 3. `/about-stablecoins/types`｜稳定币类别

## HERO
**H1** 与其记住标签，不如先看稳定机制

**Lead**  
“法币储备型”“加密抵押型”“合成型”“算法型”是理解机制的入口，不是永远互斥的法律分类。项目会升级、改变抵押和赎回结构，甚至彻底迁移稳定机制。

## 01｜三轴分类法
### 价值支撑
- 现金 / 短期国债 / 其他储备资产
- 加密资产抵押
- 对冲后的加密资产头寸
- 内生 token / 算法激励
- 混合结构

### 退出与赎回
- issuer 直接 1:1 赎回
- 链上用抵押品赎回
- 仅符合资格的 direct minter/redeemer
- 主要依靠二级市场退出
- 多路径 / 受容量限制

### 稳定机制
- primary-market arbitrage
- overcollateralisation + liquidation
- redemption
- delta hedge
- supply adjustment / endogenous arbitrage
- multiple mechanisms combined

**Visual** `STB-D03-taxonomy-matrix.svg`

## 02｜五类页面
### 法币储备型
核心是 issuer + reserve + redemption。

### 加密资产抵押型
核心是 collateral + overcollateralisation + liquidation/redemption。

### 合成型
核心是 backing + hedge + derivatives/custody infrastructure。

### 算法型
核心是 supply/incentive/arbitrage feedback；历史上最典型的失败案例是 UST。

### 混合与边界
用于机制迁移、复合结构，以及与 CBDC / tokenised deposit / tokenised fund 的边界说明。

## 03｜不要这样分类
- 不因为“去中心化”就自动归为算法型；
- 不因为 token 叫“USD”就认为是 1:1 法币储备；
- 不因为项目过去使用某种机制，就永久沿用旧标签；
- 不把收益型 wrapper 与基础 stablecoin 本体混为一谈。

---

# 4. `/about-stablecoins/applications`｜稳定币应用

## HERO
**H1** 应用回答“能解决什么任务”，采用回答“实际用了多少”

**Lead**  
这一页讲稳定币可以承担哪些金融与支付任务；真实交易量、用户规模、地区分布和渠道采用，应到 Adoption 数据页查看。

## Application matrix

### 1. 加密交易与结算
**Task:** 在高波动资产之间提供稳定计价、交易和结算资产。  
**Why stablecoin:** 链上/交易平台间移动方便，减少频繁回到银行体系。  
**Constraint:** 交易量不等于真实商品支付采用。

### 2. DeFi 抵押、借贷与流动性
**Task:** 作为借贷资产、AMM 配对资产、保证金和抵押物。  
**Why:** 可组合、可编程、24/7。  
**Constraint:** 智能合约、预言机、清算和流动性风险。

### 3. 跨境转移与汇款
**Task:** 跨境发送稳定价值。  
**Why:** 公共链可减少部分跨境中间环节。  
**Constraint:** on/off-ramp、合规、汇兑、本地法币结算仍决定实际体验。

### 4. 企业资金与 B2B 结算
**Task:** 跨时区结算、供应商付款、内部资金调拨。  
**Why:** 可在银行营业时间之外转移。  
**Constraint:** 对手方接受度、会计税务、银行出入金和法域规则。

### 5. 商户 / P2P 支付
**Task:** 商品服务支付或个人间转账。  
**Why:** 可编程、数字原生。  
**Constraint:** 商户接受、费用、用户保护、退款/争议机制和监管要求。

### 6. Tokenised asset settlement
**Task:** 为 tokenised securities / funds / real-world assets 提供链上现金腿。  
**Why:** 资产与结算可以在相近数字基础设施中协调。  
**Constraint:** delivery-versus-payment、资产法律权利、合格投资者和互操作性。

### 7. Machine / agentic payments
**Task:** API、agent、机器之间的小额或条件式支付。  
**Why:** stablecoin 可以成为某些 24/7 programmable rails。  
**Constraint:** stablecoin 不是 Agentic Payments 的必要条件；授权与责任更关键。

→ `/agentic-payments`

## Boundary
**当前 IMF 研究仍指出，加密交易是稳定币的主要用途；跨境支付正在增长。**
因此页面不使用“已经广泛取代银行卡/银行转账”之类表述。

→ 实际采用数据：`/market-data/adoption`

---

# 5. `/about-stablecoins/regulatory-evolution`｜监管演进

## HERO
**H1** 稳定币监管正在从“风险提示”转向“发行、赎回与系统性监督”

**Lead**  
这一页解释监管逻辑怎样变化，不承担“今天哪个国家允许什么”的实时比较任务。当前制度状态请进入独立监管栏目。

## Five stages

### Stage 1｜识别风险与监管边界
早期问题主要是：
稳定币究竟是 crypto asset、e-money、payment instrument、security，还是其他金融工具？

### Stage 2｜把稳定性拆成可监管义务
监管重点逐渐收敛到：
- reserve quality and custody
- redemption rights
- governance
- operational resilience
- AML/CFT
- disclosure
- recovery / wind-down

### Stage 3｜国际共同基准
2023 FSB 建议强调治理、全面风险管理、跨境协调、及时赎回和有效稳定机制。

### Stage 4｜专门发行人制度
- EU MiCA：ART/EMT 规则自 2024-06-30 起适用；
- US GENIUS Act：2025-07-18 成法；
- Hong Kong：issuer licensing 2025-08-01 生效；
- UK：2026 推进 qualifying/systemic stablecoin 规则。

### Stage 5｜跨境与系统性监测
FSB 2025 review 指出各地实施仍不一致；2026 工作进一步关注全球稳定币跨境脆弱性和金融稳定监测数据。

**Visual** `STB-D04-regulatory-evolution.svg`

## Links
当前监管比较 → `/regulatory`  
亚洲制度与真实产品 → `/regional-developments`

---

# 6. `/about-stablecoins/types/fiat-backed`｜法币储备型

## HERO
**H1** 法币储备型：稳定来自“可兑现的储备 + 赎回机制”

## Mechanism
Fiat / reserve assets  
→ authorised issuer receives funds/assets  
→ mint stablecoin  
→ token circulates in secondary market  
→ eligible customer redeems  
→ token burned + reserve paid out

**Visual** `STB-D05-fiat-backed-flow.svg`

## Why the peg can hold
如果一级市场参与者可以接近面值铸造/赎回，二级市场偏离就会产生套利动机。

## What to inspect
1. reserve composition
2. reserve liquidity
3. custodian / bank structure
4. holder legal claim
5. direct redemption eligibility
6. redemption timing / fees / minimums
7. disclosure / assurance
8. secondary-market liquidity

## Current examples
### USDC
Circle 表示 USDC 由高流动性的现金与现金等价资产支持并可按 1:1 赎回。Circle Mint 的直接 mint/redeem 面向机构，不面向个人和小企业；普通用户通常通过交易所、钱包等渠道获得。

### USDT
Tether 表示 Tether tokens 与对应法币 1:1 挂钩并由储备支持。

### PYUSD
PayPal USD 由 Paxos 发行，PayPal 表示其储备包括美元存款、短期美国国债及类似现金等价物，并可 1:1 买卖。

## Critical distinction
**Reserve backing ≠ every holder has the same direct redemption right.**

## Risks
reserve / bank / custody / issuer / legal / compliance / redemption / operational / market-liquidity risk.

---

# 7. `/about-stablecoins/types/crypto-backed`｜加密资产抵押型

## HERO
**H1** 加密抵押型：用超额抵押与清算抵御高波动资产风险

## Mechanism
crypto collateral  
→ open borrowing position  
→ mint stablecoin debt  
→ collateral ratio changes  
→ liquidation if unsafe  
→ redemption / market arbitrage supports peg

**Visual** `STB-D06-crypto-collateral-flow.svg`

## Current clean example: BOLD
Liquity V2 将 BOLD 描述为美元锚定、超额抵押，并由 WETH、wstETH、rETH 支持；BOLD 可以按面值逻辑兑换协议抵押品，抵押不足的仓位进入清算机制。

## Historical milestone: Dai / Sai
Maker 于 2017 年推出 Single-Collateral Dai，允许用户抵押 ETH 生成 Dai，后来扩展到多抵押品体系。

## Stability is not free
超额抵押的代价是资本效率较低；极端下跌时系统依赖：
- oracle
- liquidators
- stability pools / auctions
- blockchain capacity
- collateral liquidity

## Risks
collateral crash / oracle / liquidation / bad debt / smart-contract / liquidity / governance or parameter risk.

---

# 8. `/about-stablecoins/types/synthetic`｜合成型

## HERO
**H1** 合成型：稳定不仅看“持有什么”，还要看“如何对冲”

## Mechanism
backing assets  
+ offsetting derivatives / hedge  
→ mint synthetic dollar  
→ hedge maintains approximate USD exposure  
→ funding / basis / PnL / custody continuously managed  
→ eligible counterparties redeem

**Visual** `STB-D07-synthetic-flow.svg`

## Example: USDe
Ethena 表示 USDe 的稳定性由协议持有资产与 delta-hedging derivatives positions 支持。直接 mint/redeem 需要 KYC/KYB 并进入白名单；普通 holding user 与 direct mint user 的权利不同。

## Why this is different
合成型并不是简单“没有资产支撑”。
它的关键是：
- backing asset value
- hedge effectiveness
- derivative liquidity
- funding/basis
- exchange settlement
- custody architecture

## Risks
basis/funding risk / derivative counterparty / exchange failure / custody / hedge execution / liquidity / redemption access.

## Boundary
**Synthetic/hedged ≠ classic endogenous algorithmic stablecoin.**

---

# 9. `/about-stablecoins/types/algorithmic`｜算法型

## HERO
**H1** 算法型：当稳定依赖信心和内生套利，压力可能自我强化

## Classic mechanism
stablecoin < target  
→ buy stablecoin  
→ convert/burn against endogenous token  
→ endogenous token supply expands  
→ intended arbitrage restores peg

If confidence falls:
stablecoin sell-off  
→ endogenous token issuance  
→ token price falls  
→ backing/arbitrage capacity weakens  
→ more redemptions  
→ death spiral

**Visual** `STB-D08-algorithmic-death-spiral.svg`

## Case: TerraUSD
BIS 记录显示，UST 依赖与 LUNA 之间的 1 美元价值兑换与套利。2022 年 5 月信心崩溃后，大量 UST 换成新铸 LUNA，LUNA 价格进一步下跌，机制进入死亡螺旋。

## What the case teaches
稳定机制如果依赖一个与系统信心高度共振的内生资产，就可能在压力下出现反身性。

## Important boundary
- UST 是经典失败案例，不代表所有非储备型 stablecoin；
- algorithmic ≠ decentralised；
- crypto-collateralised stablecoin 有真实超额抵押与清算机制，不能与 UST 模式混为一谈。

---

# 10. `/about-stablecoins/types/other`｜混合与边界案例

## HERO
**H1** 混合与边界：产品名称不重要，今天的经济机制才重要

## 01｜为什么需要这一页
真实项目会：
- 更换储备资产；
- 从算法机制转向资产储备；
- 引入 RWA / tokenised Treasuries；
- 增加 PSM / redemption modules；
- 改变 governance 与发行主体。

所以分类必须随机制变化。

## 02｜Current frxUSD
Frax 当前将 frxUSD 描述为可法币赎回、fully collateralised，并由 permitted cash-equivalent reserves / tokenised Treasury funds 支持。

这说明：
**不能因为一个品牌历史上采用过另一种稳定机制，就用旧标签描述当前 token。**

## 03｜边界资产
### CBDC
央行负债。

### Tokenised deposit
商业银行存款负债的 tokenised representation。

### Tokenised MMF / Treasury fund
基金/证券份额，不是稳定币本体。

### Yield-bearing wrapper
例如某些 stablecoin 的质押/收益凭证，经济权利可能与基础 stablecoin 不同。

**Visual** `STB-D09-boundary-map.svg`

## 04｜最终判断清单
看到一个新 token 时，不先问“它属于哪一类”，而先问：
- redeemable against what?
- by whom?
- on what terms?
- what absorbs losses?
- what restores the peg?
- what happens under stress?
