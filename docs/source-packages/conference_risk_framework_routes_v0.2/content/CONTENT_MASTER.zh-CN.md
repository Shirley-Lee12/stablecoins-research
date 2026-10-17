# Stablecoin Risk Framework｜Content Master zh-CN V0.2

---

# `/quantitative`｜稳定币风险框架

## HERO

**H1** 从复杂稳定币系统中拆解可识别、可定位的风险单元

**Lead**  
本研究提出一个面向稳定币全生命周期的多维风险框架。研究首先把广泛、混合的风险概念拆解为 **55 个 atomic risks**，再从两个互补维度进行映射：风险主要出现在哪个生命周期位置，以及它在“触发—脆弱性—放大—跨系统传导”链条中扮演什么角色。

**Research status**  
当前成果是**概念风险框架与二维映射**。量化指标、动态监测、early warning 和监管覆盖评估属于后续研究方向，并非当前网站已经完成或上线的研究产品。

---

## 01｜为什么要拆解稳定币风险？

稳定币连接：
- 发行人
- 储备资产
- 托管机构
- 区块链基础设施
- 二级市场
- DeFi 协议
- 用户与赎回机制

这些风险同时具有：
- 金融与机构属性；
- crypto-native 技术与协议属性。

如果只使用一个总风险分数，会掩盖：
- 风险源在哪里；
- 风险何时变得相关；
- 风险是触发因素、结构脆弱性，还是动态放大机制；
- 风险何时已经跨越单一稳定币边界。

因此，本研究先做**风险分解与定位**，再为未来量化建立结构基础。

---

## 02｜什么是 Atomic Risk？

Atomic risk 是本框架中用于识别和测量的**最小有用风险单元**。

“Atomic”并不表示：
- 无法继续细分；
- 与其他风险统计独立；
- 与其他风险因果独立。

Atomic risk 仍然可以：
- 相互作用；
- 放大其他风险；
- 向其他系统传导。

核心要求：
1. 是一个明确的风险对象；
2. 与其他风险尽量保持概念边界；
3. 有主要运行位置；
4. 可以连接到后续指标设计；
5. 允许与其他 atomic risks 发生相互作用。

当前提交的框架包含：
**55 atomic risks**。

---

## 03｜从系统到 Atomic Risks

研究方法分三步：

### Step 1 · Understand the stablecoin system
识别：
- 稳定币类型与架构；
- 关键主体；
- 运行关系；
- 发行、流通、协议使用与赎回过程。

### Step 2 · Organise risk modules
按照经济、机构和技术功能组织较高层风险模块。

### Step 3 · Define atomic risk units
在模块内部进一步识别：
- 明确风险对象；
- 概念边界；
- 主要运行位置；
- 后续测量逻辑。

证据基础贯穿三个步骤：
- 学术研究；
- 监管与行业报告；
- 发行方 / 协议文档；
- 真实失效与压力案例。

**量化与监测发生在风险分解和映射之后，不是本阶段的分解步骤。**

---

## 04｜七个展示层风险模块

### M1 — Backing Assets & Balance Sheet
例如：
- C5 Asset-Liability Maturity Mismatch
- C10 Insufficient Reserve Market Capacity

### M2 — Issuer Transparency, Legal Structure & Custody
例如：
- C11 Balance Sheet Transparency Time-Lag
- C16 Custodian Credit Default

### M3 — Fiat Settlement, Regulation & Redemption
例如：
- C17 Fiat Clearing Temporal Mismatch
- C26 Asymmetric Redemption Channels

### M4 — Secondary Markets, Token Holders & Confidence
例如：
- C22 Deficient Secondary Market Order Book Depth
- C25 Erosion of the Credit Foundation

### M5 — Technical Infrastructure, Code, Cryptography & Information
例如：
- U1 Underlying Public Blockchain Network Congestion
- U8 Smart Contract Vulnerabilities

### M6 — Governance & Privileged Control
例如：
- C13 Highly Centralized Governance Permissions
- U15 DAO Governance Proposal Manipulation

### M7 — DeFi Integration, On-Chain Markets & Endogenous Mechanisms
例如：
- U18 DeFi Nested Collateralization Risks
- U25 Unbuffered Cascading Liquidations

**说明：**
这是会议研究的 presentation-level organization，用于解释提交框架，不应在网站上包装成新的独立 taxonomy。

---

## 05｜为什么需要两个维度？

生命周期位置和风险的因果角色是两种不同属性。

### Lifecycle Dimension — T
回答：
> 风险主要位于稳定币运行生命周期的哪里？

### Amplification & Transmission Dimension — L
回答：
> 风险在从初始冲击到跨系统传导的链条中扮演什么角色？

只看 T：
能够定位风险，但不足以解释风险怎样放大。

只看 L：
能够描述因果角色，但不足以说明风险主要在哪个运行阶段形成或激活。

因此两个维度互补，而不是互相替代。

---

## 06｜两个维度的边界

### T0 ≠ L1
T0 是生命周期位置；
L1 是结构脆弱性的因果角色。

### T3 ≠ L3
T3 是赎回、去杠杆、清算和退出阶段；
L3 从影响跨越 focal stablecoin 的系统边界开始。

### T1 ≠ T2
关键边界不是“是否上链”或“是否在 DeFi”。

- 普通 DEX 交易仍可能属于 T1；
- lending、collateral、LP 或其他 layered positions 属于 T2。

如果一个风险在不同生命周期阶段承担不同风险角色，应考虑拆分风险，而不是强行合并。

---

## 07｜当前成果与未来研究

### Current study
- 55 atomic risks
- T0–T3 lifecycle mapping
- L0–L3 amplification & transmission mapping
- risk decomposition methodology

### Future research
- 为 atomic risks 建立 risk-specific indicator sets；
- 在适用时构建 composite measures；
- 量化 risk transmission 与 amplification；
- 动态 monitoring；
- stress detection；
- tiered early warning；
- regulatory coverage mapping；
- blind-spot identification；
- regulatory framework optimisation recommendations。

**这些未来方向目前不能显示为已完成、under calibration、live beta 或已上线功能。**

---

# `/quantitative/dimension-a`｜生命周期映射（T0–T3）

## HERO

**H1** 风险主要在哪里进入、形成或变得相关？

**Lead**  
Lifecycle Dimension 用 T0–T3 标记 atomic risk 在稳定币运行体系中的主要位置。它描述的是**operational locus**，不是风险严重程度，也不是因果链中的“第几步”。

---

## T0 — Foundation, Backing & Issuance

覆盖：
- foundation
- backing
- issuance

它关注稳定币的基础支撑、发行结构和进入流通前的关键风险条件。

会议研究中的代表性风险：
- C5 — Asset-Liability Maturity Mismatch
- C14 — Lack of Bankruptcy Remoteness for Reserves

---

## T1 — Circulation, Trading & Settlement

覆盖：
- circulation
- trading
- settlement

它关注稳定币已经进入市场流通之后的交易、结算与基础市场活动。

代表性风险：
- C22 — Deficient Secondary Market Order Book Depth
- U1 — Underlying Public Blockchain Network Congestion

### T1 / T2 边界
DEX trade 本身不必然属于 T2。

如果稳定币只是在市场中进行交换、转账与结算，仍可能属于 T1。

---

## T2 — Protocol Embedding & Layered Finance

覆盖：
- lending
- collateral
- liquidity provision
- layered financial positions
- endogenous protocol mechanisms

代表性风险：
- U18 — DeFi Nested Collateralization Risks
- U24 — Excessive Credit Expansion via AMO Algorithms

T2 的关键不是“使用 DeFi”，而是稳定币是否已经**嵌入更深层的金融头寸和协议结构**。

---

## T3 — Redemption, Deleveraging & Liquidation

覆盖：
- redemption
- deleveraging
- liquidation
- exit / unwind

代表性风险：
- C26 — Asymmetric Redemption Channels
- U25 — Unbuffered Cascading Liquidations

T3 关注的是稳定币或相关金融头寸如何退出、赎回、去杠杆或被强制清算。

---

## 如何使用 T 维度？

T 维度适合回答：

- 风险主要在哪个运行阶段形成？
- 哪些风险在发行前就已经嵌入？
- 哪些风险只在市场流通后才出现？
- 哪些风险依赖协议嵌入？
- 哪些风险主要出现在退出、赎回或清算阶段？

T 维度**不回答**：
- 哪个风险更严重；
- 哪个风险一定先发生；
- 哪个风险必然导致另一个风险。

---

# `/quantitative/dimension-b`｜放大与传导映射（L0–L3）

## HERO

**H1** 一个风险在“冲击—脆弱性—放大—外溢”链条中扮演什么角色？

**Lead**  
Amplification & Transmission Dimension 用 L0–L3 区分风险的因果角色。它不是时间顺序的机械标签，而是用于区分：什么触发冲击、什么是预先存在的脆弱性、什么在压力下放大冲击，以及什么时候影响已经跨越 focal stablecoin 的边界。

---

## L0 — Initial Trigger

定义：
**直接启动风险 episode 的冲击。**

代表性风险：
- C1 — Macro Interest Rate Shocks
- U2 — Layer 2 Sequencer Downtime

L0 强调的是 trigger event / initiating shock。

它与 L1 的区别：
- L0 = shock
- L1 = pre-existing susceptibility

---

## L1 — Structural Vulnerability

定义：
**在冲击发生前已经存在，并决定系统脆弱程度的结构性弱点。**

代表性风险：
- C5 — Asset-Liability Maturity Mismatch
- C22 — Deficient Secondary Market Order Book Depth

L1 不是“已经发生的放大过程”。

它描述的是：
> 为什么同样的冲击，在某种结构下会造成更大的问题？

---

## L2 — Dynamic Amplification

定义：
**被激活的反应或反馈循环，使初始冲击进一步放大。**

代表性风险：
- U21 — High Friction Inducing Arbitrage Failure
- U25 — Unbuffered Cascading Liquidations

L1 与 L2 的区别：

- L1 = structural condition
- L2 = activated amplification process

---

## L3 — Cross-System Transmission / Outcomes

定义：
**影响已经越过 focal stablecoin 本身的系统边界。**

可能传导至：
- other stablecoins
- DeFi protocols
- broader crypto markets
- traditional financial markets

L3 与 T3 完全不同：

- T3 = redemption / deleveraging / liquidation / exit stage
- L3 = cross-system propagation / outcome

---

## 为什么 L0–L3 有用？

它可以帮助研究者区分：

### Trigger
什么直接启动风险？

### Susceptibility
什么结构使系统更容易受到冲击？

### Amplification
什么反馈机制使问题进一步恶化？

### Transmission
什么时候风险已经不再局限于单一稳定币？

这为以后：
- transmission measurement
- dynamic monitoring
- stress detection
- early-warning design

建立概念结构，但**本会议研究尚未完成这些后续量化工作**。

---

## 当前研究边界

当前网站可以展示：
- L0–L3 的概念定义；
- atomic risks 的代表性映射；
- T 与 L 两个维度为什么互补；
- 风险分解与映射方法。

当前网站不能把本研究写成：
- 已估计 causal network；
- 已计算 transmission coefficients；
- 已运行 Hawkes / TE；
- 已建立实时预警；
- 已生成稳定币 risk probability；
- 已完成 regulatory coverage score。
