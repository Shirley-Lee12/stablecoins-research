# 智能体支付专题｜网页内容主稿 zh-CN V0.1

> 用途：可直接提取为网页模块。  
> 不包含建设过程说明。  
> 所有动态事实以 Source Manifest 和 last_verified 为准。

---

# A. `/agentic-payments`｜智能体支付概览

## HERO

**Eyebrow**  
Agentic Payments · 智能体支付

**H1**  
当 AI 可以替你花钱，真正的问题不是“能不能支付”，而是“谁授权、能花多少、钱怎么走”。

**Lead**  
AI 正从“帮你找东西”进入“代表你完成交易”。一个真实的智能体支付流程需要同时解决用户意图、Agent 身份、委托授权、支付凭证、资金轨道、结算和争议处理。稳定币可能成为其中的重要支付轨道，但并不是整个体系。

**Primary CTA**  
看懂支付协议

**Secondary CTA**  
稳定币在这里做什么？

---

## MODULE O1｜从一句话到一笔交易

**Title**  
一句“帮我买”，背后至少有五件事

**Copy**
用户可以只说“500 元以内帮我买一张周五的机票”，但金融系统不能把这句话直接当成无限制扣款指令。系统需要把自然语言转换成可执行条件，识别代表用户行动的 Agent，验证它是否获得授权，选择支付方式，再留下可审计的交易结果。

**Five steps**
1. **Intent** — 用户到底想买什么？
2. **Agent** — 谁在代表用户执行？
3. **Authorization** — Agent 被允许做什么、花多少？
4. **Payment** — 用银行卡、钱包、银行账户还是稳定币？
5. **Evidence** — 出错时，谁能证明发生了什么？

**Visual**  
AGT-D01 Simplified Agentic Payment Stack

---

## MODULE O2｜AI 到底有多大权限？

**Title**  
从“每次问我”到“机器自动付款”

### Human-confirmed
Agent 可以帮你搜索、比较、填表，但最终购买前回到用户确认。  
**例**：ChatGPT Instant Checkout、Meta Muse、Grok Bot 购买流程。

### Pre-authorized
用户事先给出明确边界，例如金额、时间、商户、商品类别和次数，Agent 只在范围内执行。  
**例**：AP2 Mandate、AMP task authorization、APOP structured intent。

### Machine-native
Agent 为 API、数据、算力或其他数字资源按请求自动付款。  
**例**：x402、MPP、支付宝 Machine Pay / A402。

**Key line**  
自动化程度越高，越需要更强的身份、限额、撤销、审计和异常监测。

**Visual**  
AGT-D02 Autonomy Levels

---

## MODULE O3｜AI 有没有“拿到我的银行卡”？

**Title**  
三种资金控制模型

### Mandate
用户签署带约束的任务授权，支付参与者验证 Agent 是否在授权范围内行动。  
**代表**：AP2、APOP，以及 ACT/AMP 的部分设计。

### Scoped credential
支付服务商生成一次性或受限凭证，Agent 可以使用，但不需要看到用户真实支付凭证。  
**代表**：ACP Delegated Payments、Muse + Stripe Link one-time-use card。

### Platform account + approval
Agent 提出购买，用户 Allow / Deny，再由平台金融账户或支付工具完成付款。  
**代表**：Grok Bot + X Money / Stripe Link。

**Visual**  
AGT-D03 Three Fund-Control Models

---

## MODULE O4｜钱最终走哪条路？

**Title**  
智能体支付不等于稳定币支付

### Card / Bank
Visa、Mastercard、UnionPay、ACH、UPI 等。  
优势是商户覆盖、退款和消费者保护成熟。

### Wallet / APM
Alipay、Alipay+、GCash、DANA、TNG eWallet 等。  
适合 mobile-first、二维码和 Super App 生态。

### Stablecoin / Blockchain
适合 24/7、跨境、可编程、高频和极小额机器支付。  
x402 和 MPP 是当前最直接的代表。

**Key line**  
Stablecoin is one payment rail, not the whole agentic-payment stack.

**Visual**  
AGT-D04 Three Payment Rails

---

## MODULE O5｜这些缩写不是同一类东西

**Title**  
Protocol、Product 和 Rail 不要混在一起

**Commerce protocols**
UCP · ACP

**Trust / authorization**
AP2 · ACT · AMP · APOP

**Machine payment**
x402 · MPP · A402（支付宝 Machine Pay 内的 402/A2M 方法）

**Products**
ChatGPT Instant Checkout · 支付宝 Agent Pay · 京东AI付 · Muse · X Money

**Rails**
Card · Bank · Wallet · Stablecoin

**Visual**  
AGT-D05 Protocol vs Product vs Infrastructure

---

## MODULE O6｜为什么稳定币仍值得关注？

**Title**  
稳定币的优势不在“AI 才能付款”，而在机器支付的经济性

**Four reasons**
- **Micropayments**：极小金额按调用付费；
- **Machine-to-machine**：软件主体之间直接交换价值；
- **24/7**：跨时区持续结算；
- **Programmability**：授权、条件和结算可以程序化组合。

**Caveat**
普通消费者购物中，银行卡和钱包仍具有成熟的商户接受度、争议处理和消费者保护。稳定币的比较优势最明显地出现在 API、数据、算力、Agent-to-Agent 与跨境机器结算。

---

## MODULE O7｜风险

**Title**  
更多自主权，也意味着更多新的失误方式

- 用户意图被错误解释；
- Prompt injection 操纵 Agent；
- 授权范围过宽；
- 支付凭证或钱包密钥泄露；
- 恶意商户/API 收钱不履约；
- 重复请求导致重复扣款；
- 稳定币脱锚、链上不可逆和合规风险；
- 最终责任无法清楚归属。

**CTA**  
查看应用与风险

**Visual**  
AGT-D06 Agentic Payment Risk Chain

---

# B. `/agentic-payments/protocols`｜协议与机制

## HERO

**H1**  
不是“八个协议做同一件事”，而是不同层共同组成交易栈

**Lead**
UCP、ACP 主要解决 Agent 与商户怎样交换商品、购物车和订单；AP2、ACT、AMP、APOP 处理身份、授权和可信执行；x402、MPP 与 A402 更接近机器如何按请求付款。把它们放在同一平面排名，会掩盖真正的差异。

---

## MODULE P1｜Layer Map

### Commerce
- UCP
- ACP

### Commerce trust / authorization
- AP2
- ACT
- AMP
- APOP

### Machine-native payment
- x402
- MPP
- A402 / Alipay Machine Pay

**Note**
同一笔交易可以同时使用多个层。例如 UCP 负责 checkout，AP2 提供委托授权，下层支付可以使用银行卡或稳定币。

---

## MODULE P2｜Protocol Matrix

表格字段：
- Protocol
- Organization
- Main layer
- User-confirmed purchase
- Delegated purchase
- Machine payment
- Agent identity
- Payment rails
- Stablecoin relationship
- Maturity

数据直接读取 `PROTOCOL_CARDS.json`。

---

## MODULE P3｜How to read the labels

**PROTOCOL** 公开技术规范或框架  
**PRODUCT** 实际用户/商户产品  
**PRODUCTION VALIDATION** 真实生产系统验证，不等于全面开放  
**PILOT / ROLLOUT** 部分机构或白名单阶段  
**PARTNERSHIP** 合作公告，不等于已完成互操作  
**UNKNOWN** 官方证据不足

---

# C. `/agentic-payments/scenarios`｜应用与风险

## HERO

**H1**  
同样叫“AI 支付”，消费者购物、API 付费和 Agent-to-Agent 的金融问题完全不同

---

## SCENARIO S1｜AI 替人购物

**Example**
“帮我找一双 100 美元以下的跑鞋，最终付款前让我确认。”

**Flow**
Find → compare → checkout → user confirmation → payment → fulfillment

**Best-fit mechanisms**
UCP / ACP + user confirmation + card/wallet rails

**Main risks**
错误商品、错误价格、隐藏费用、凭证暴露、商户履约。

**Real examples**
ChatGPT Instant Checkout；Meta Muse + Link；Grok Bot purchase approval。

---

## SCENARIO S2｜满足条件自动购买

**Example**
“周五前，如果机票总价低于 800 元，自动买一张。”

**Flow**
User constraints → mandate/task authorization → Agent finds trade → verify constraints → payment → receipt

**Best-fit mechanisms**
AP2 / AMP / APOP / Antom conditional purchase

**Main risks**
授权范围过宽、重复执行、价格条件解释错误、撤销不及时。

---

## SCENARIO S3｜AI 调 API 按次付款

**Example**
研究 Agent 需要一次实时数据，价格 ¥0.01 / $0.01。

**Flow**
Request → HTTP 402/payment request → payment proof → verification → resource

**Best-fit mechanisms**
x402 / MPP / Alipay Machine Pay (A402)

**Main risks**
微额资金持续流失、恶意 API、重复请求、不可逆支付、服务未交付。

---

## SCENARIO S4｜Agent-to-Agent

**Example**
主 Agent 为完成任务，向其他 Agent 购买翻译、搜索、推理或数据。

**Flow**
Discover service → evaluate price → authorize budget → machine payment → deliver result

**Evidence boundary**
AMP 已公开 nano-grade A2A settlement；x402/MPP 适合机器支付。具体结算资产和完全自主程度必须按实现核实。

---

## RISK SECTION

采用 AGT-D06 风险链；每个风险点击后展开：
- what can go wrong
- current mitigation
- residual risk
- example protocol/product

---

# D. `/agentic-payments/ecosystem`｜生态与进展

## HERO

**H1**
谁在做协议，谁在做 Agent，谁真正掌握支付账户？

**Lead**
同一家公司可能同时扮演 AI 入口、协议制定者、支付服务商或结算基础设施角色。本站按角色而不是按品牌热度组织生态。

---

## ORGANIZATION GROUPS

### Standards / protocols
Google · OpenAI/Stripe · x402 Foundation · Ant International · Alipay · China UnionPay

### AI / commerce surfaces
ChatGPT · Gemini · Muse · Grok Bot · 京东AI购 · 支付宝/千问生态

### Payment infrastructure
Stripe · Visa · Mastercard · UnionPay · Alipay/Alipay+ · X Money · banks · stablecoin rails

---

## COMPANY CARDS

内容从 `ECOSYSTEM_CARDS.json` 读取。

每张卡只显示：
- Role
- Protocols
- Products
- Payment rail
- Stablecoin status
- Evidence status
- Last verified

不要把 logo 当作主要内容。

---

## TIMELINE

使用 AGT-T01。颜色区分：
- protocol release
- product launch
- production validation
- rollout
- partnership
- governance
- regulatory/industry rule

---

# E. Protocol detail pages

所有详情页使用同一结构：

1. What it is
2. Problem solved
3. Typical scenario
4. How it works
5. Actors
6. Authorization and fund control
7. Payment rail
8. Stablecoin relationship
9. Real-world evidence / maturity
10. Risks and unknowns
11. Official sources

---

# E1. `/agentic-payments/protocols/ap2`

**H1**  
AP2：证明 AI 真的有权替你花这笔钱

**One-line**
AP2 不是新的银行卡或稳定币网络，而是一个 payment-agnostic 授权与信任协议。

**Problem**
传统支付默认“点击 Pay 的人就是用户”。Agent 代付时，商户和支付机构必须证明用户到底授权了什么。

**Core mechanism**
Mandate + verifiable evidence + receipt。

**Human Present**
最终具体交易由用户通过可信、确定性的界面确认。

**Human Not Present**
用户预先授权金额、时间、商品/服务等约束；Agent 只能在条件内完成具体交易。

**Important control**
Trusted Surface 应是 non-agentic / deterministic；不能让 LLM 自己声称“用户已经同意”。

**Stablecoin**
Compatible, not native。Google 明确把 AP2 设计成 payment-agnostic，可与 card、bank transfer、stablecoin 等下层方式组合。

**Maturity**
Open protocol / evolving ecosystem。

---

# E2. `/agentic-payments/protocols/ucp`

**H1**  
UCP：让 Agent 和商户使用同一种商业语言

**One-line**
UCP 解决商品、购物车、checkout、payment handler 与订单状态如何在 Agent surface 和商户之间标准化交换。

**Problem**
每个商户都有不同 API 和 checkout；如果每个平台逐一适配，集成成本呈 N×M 增长。

**Key rule**
没有 AP2 Mandates 扩展时，checkout 默认需要 trusted deterministic UI 由用户最终完成。

**Merchant role**
Business remains Merchant of Record。

**Stablecoin**
Indirect / payment-neutral。

---

# E3. `/agentic-payments/protocols/acp`

**H1**
ACP：让 ChatGPT 等 Agent 连接商户的商品、checkout 和订单系统

**One-line**
ACP 是 OpenAI 与 Stripe 等共同构建的开放 commerce standard；Instant Checkout 是产品，不是协议本身。

**Core**
Product feed → Checkout session → Merchant authoritative cart → Delegated Payment → Merchant processes payment and fulfillment。

**Payment control**
一次性 delegated payment request 设定最大金额和 expiry；PSP 返回支付 token。

**Merchant of Record**
仍是商户，不是 OpenAI。

**Stablecoin**
No native dependency；底层 PSP/rail 可扩展，但不能据此把 ACP 称为稳定币协议。

---

# E4. `/agentic-payments/protocols/x402`

**H1**
x402：让机器像请求网页一样请求并支付资源

**One-line**
服务器用 HTTP 402 返回付款要求，Agent 付款并带证明再次请求，服务验证后交付资源。

**Best use**
API、数据、推理、算力、数字内容、Agent-to-Agent。

**Evolution**
起源于稳定币原生链上支付；V2 已扩展多资产、多网络，并向更广支付类型发展。

**Stablecoin**
Direct / strong historical fit，但当前 scope 不应简化为“USDC-only”。

**Governance**
2026 进入 Linux Foundation 下的 x402 Foundation 中立治理。

---

# E5. `/agentic-payments/protocols/mpp`

**H1**
MPP：让 Agent 用稳定币或传统支付方式按请求付款

**One-line**
Stripe 与 Tempo 共创的开放 machine payment standard，覆盖 microtransactions、recurring payments 和 pay-per-use。

**Flow**
Agent requests resource → service returns payment request → Agent authorizes → resource delivered。

**Rails**
Stablecoin + cards + BNPL via Shared Payment Tokens / Stripe infrastructure。

**Real use**
Browserbase、PostalForm、Prospect Butcher Co.、Stripe Climate 等官方案例。

---

# E6. `/agentic-payments/protocols/act`

**H1**
ACT：把用户意图、委托授权和商业执行连接成可信链

**One-line**
支付宝生态的 Agentic Commerce Trust Protocol，公开定位比单一支付授权更宽，覆盖用户意图、跨 Agent/平台商业交互和可追溯执行。

**Evidence boundary**
完整字段级公开 specification 当前仍不足；不得自行把 ACT 字段与 AP2 一一对应。

**Stablecoin**
No verified direct link。

**Related products**
Agent Pay、Machine Pay、AI Wallet 等属于产品层。

---

# E7. `/agentic-payments/protocols/amp`

**H1**
AMP：面向钱包、Super App 和移动终端的 Agent 支付协议

**One-line**
Ant International 的 mobile-first / wallet-first agentic payment protocol。

**Core principle**
Authorise the task, not hand over the account。

**Trust**
KYA + Agent Trust Rating。

**Use**
Digital wallets、smartphone、wearables、in-car；支持公开披露的 A2A nano-payment。

**Stablecoin**
A2A nano-payment 已验证；具体 settlement asset 未公开确认，标 UNKNOWN。

---

# E8. `/agentic-payments/protocols/apop`

**H1**
APOP：把 Agent 身份、用户意图和支付授权放进同一信任框架

**Three trust questions**
身份信任 · 意图信任 · 过程信任

**Four capabilities**
智能体身份管理 · 意图管理 · 用户身份管理 · 支付授权管理

**Evidence**
2026-04 发布时完成 5 笔生产系统验证交易；部分功能为白名单/验证阶段。

**Stablecoin**
No verified direct link；当前公开实例主要依托银联卡、银行账户和现有支付网络。

---

# F. A402 / Alipay Machine Pay（暂不设一级详情页）

**Classification**
Machine Pay = PRODUCT  
A402 = 402-based A2M payment method/specification within the product ecosystem

**Official verified flow**
1. Agent 请求付费资源；
2. 服务端返回 HTTP 402 + `Payment-Needed`；
3. 用户授权/确认后由支付宝支付；
4. Agent 获得支付凭证；
5. 再次请求并携带 `Payment-Proof`；
6. 商户验证；
7. 返回资源并发送履约回执。

**Editorial rule**
在找到独立公开治理、版本化标准或跨实现规范证据前，不与 x402/MPP 完全等同为独立开放标准。

---

# G. `/agentic-payments/protocols/a2p2`

**Status**
HOLD / remove from protocol matrix。

**Web behavior**
若旧路由已上线：
- 暂时隐藏导航入口；
- 保留 302/内部 redirect 到 `/agentic-payments/protocols` 或显示“内容正在重新核验”；
- 不展示未经充分证实的规范内容。
