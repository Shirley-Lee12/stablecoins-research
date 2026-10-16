# Agentic Payments｜Core Visual Scripts V0.1

> These are information-design scripts, not final artwork.  
> Final assets should preferably be SVG and remain editable.

---

# AGT-D01｜Agentic Payment Stack

## Purpose
让普通用户先理解：Agentic Payment 不是一个协议或一种钱，而是一条多层交易链。

## Desktop
横向或纵向 5 层简版，点击“展开研究视图”后显示 9 层。

### Simplified
1. **You / User Intent**
2. **AI Agent**
3. **Trust & Authorization**
4. **Payment**
5. **Settlement & Evidence**

### Expanded 9-layer
1. User / Enterprise Intent
2. Product Surface / Agent
3. Service & Commerce Interaction
4. Agent Identity & Trust
5. Delegated Authorization
6. Payment Execution / Machine Payment
7. Payment Rail
8. Settlement
9. Receipt / Audit / Dispute

## Protocol placement
- Commerce: UCP, ACP, ACT/AVOP
- Identity/Trust: KYA, APOP identity
- Authorization: AP2, ACT, AMP, APOP
- Machine Payment: x402, MPP, A402
- Rails: Card, Bank, Wallet, Stablecoin

## Visual rules
- Protocol = solid outline rectangle
- Product = rounded rectangle
- Rail = thick horizontal band
- Unknown / not verified = dashed outline
- Stablecoin rail uses same hierarchy as card/wallet; do not visually imply it owns the whole stack.

## Mobile
Vertical stack; protocol chips collapse under each layer.

---

# AGT-D02｜Autonomy Levels

## Purpose
回答“AI 到底能花多少钱、要不要每次问我”。

## Three columns
### Level 1 — Human-confirmed
Find → show final amount → user confirms → pay  
Examples: ChatGPT Instant Checkout; Muse; Grok Bot.

### Level 2 — Pre-authorized
User sets:
- amount cap
- merchant/category
- time
- frequency
- confirmation rule

Then Agent executes only if constraints pass.

### Level 3 — Machine-native
Request resource → payment request → automatic/authorized payment → resource.

## Risk strip
随着 autonomy ↑：
- convenience ↑
- need for identity / limits / monitoring / audit ↑

Do not use “fully autonomous” as a celebratory label.

---

# AGT-D03｜Three Fund-Control Models

## A. Mandate
User → structured mandate → Agent → verifier → payment

Callout:
“Task authority, not full account control.”

Examples:
AP2 / APOP / parts of ACT & AMP.

## B. Scoped Credential
User approval → PSP/wallet → one-time/scoped token → Agent → merchant

Examples:
ACP Delegated Payment; Muse + Link.

Callout:
“Agent can use a credential without seeing the underlying card.”

## C. Platform Account + Approval
Platform balance/account → Agent proposes purchase → Allow/Deny → platform payment → merchant

Example:
Grok Bot + X Money / Link.

## Visual
三列等宽；底部比较：
- raw credential exposure
- user confirmation
- pre-authorization
- revocation
- best-fit scenario

---

# AGT-D04｜Three Payment Rails

## Columns
### Card / Bank
Visa · Mastercard · UnionPay · ACH · UPI

### Wallet / APM
Alipay · Alipay+ · GCash · DANA · TNG eWallet

### Stablecoin / Blockchain
x402 stablecoin flows · MPP stablecoin path · future A2A

## Comparison rows
- merchant acceptance
- refund/dispute
- micropayments
- 24/7
- programmability
- cross-border
- reversibility
- regulatory maturity

## Key statement
“Stablecoin is one rail, not the whole stack.”

Do not depict cards as obsolete or stablecoins as inevitable replacement.

---

# AGT-D05｜Protocol vs Product vs Infrastructure

## Three vertical zones

### Protocol / Standard
UCP · ACP · AP2 · ACT · AMP · APOP · x402 · MPP

### Product / Solution
Instant Checkout · Agent Pay · Machine Pay · Muse · X Money · JD AI Pay · Antom

### Infrastructure / Rail
Stripe · Visa · Mastercard · UnionPay · bank accounts · wallets · stablecoins · tokenised deposits

## Special callout
A402:
“402-based A2M method/spec within Alipay Machine Pay — do not yet present as a fully independent open standard.”

## Visual relationship
Use arrows showing:
Protocol → enables Product
Product → calls Rail
But avoid suggesting a single protocol maps one-to-one to a single product.

---

# AGT-D06｜Agentic Payment Risk Chain

## Flow
User Intent
→ Agent
→ Authorization
→ Credential
→ Merchant/Service
→ Payment
→ Settlement
→ Dispute

## Risk at each node
Intent: ambiguity / hidden constraints  
Agent: hallucination / prompt injection / spoofing  
Authorization: over-delegation / replay / stale consent  
Credential: card/token/key theft  
Merchant: fraud / non-delivery / fake API  
Payment: duplicate charge / wrong amount  
Stablecoin/settlement: depeg / smart-contract / irreversibility  
Dispute: unclear evidence / liability

## Mitigation chips
structured intent · KYA · mandate · scoped token · idempotency · receipt · refund · monitoring

## Design
Risk is not a red wall. Use restrained small warning markers and one highlighted path.

---

# AGT-T01｜2025–2026 Timeline

## Track colors by event type
- Protocol release
- Product launch
- Production validation
- Rollout
- Partnership
- Governance
- Regulation / industry rule

## Required nodes
2025-05-06 x402 launch  
2025-09-04 Antom Agentic Payment Solution  
2025-09-16 AP2  
2025-09-29 ACP + Instant Checkout  
2025-11-28 JD AI Shopping user agreement  
2025-12-11 x402 V2  
2026-01-11 UCP  
2026-01-16 ACT  
2026-03-18 MPP  
2026-04-02 APOP + 5 production-system validation trades  
2026-04-28 AMP  
2026-05 Alipay AI Wallet / AI Pay scale disclosure  
2026-05-08 China CAC agent guidance  
2026-07 x402 Foundation operational / UnionPay AVOP & products  
2026-08-24 China agentic-payment self-regulatory convention  
2026-09-01 Grok Bot purchase approval via Link  
2026-09-08 Muse  
2026-09-11 AMP Phase I rollout / KYA collaboration  
2026-10-11 Grok Bot payments with X Money or Stripe Link

## Mobile
Vertical timeline; event-type icon and short label; details expand on tap.

---

# Protocol detail mini-diagrams

## AGT-P01 AP2
User → Trusted Surface → Open/Closed Mandate → Shopping Agent → Merchant / Credential Provider → Payment Processor → Receipt

## AGT-P02 UCP
Consumer Surface → UCP profile / product/cart/checkout → Business (MoR) → payment handler → trusted UI / AP2 extension

## AGT-P03 ACP
ChatGPT → product feed → checkout session ↔ Merchant → delegated payment token → merchant PSP → order event → ChatGPT

## AGT-P04 x402
Agent GET resource → 402 + payment requirements → sign/pay → retry with proof → verify/settle → resource

## AGT-P05 MPP
Agent → resource request → service payment request → selected payment method → authorization → delivery

## AGT-P06 ACT
User intent → delegated trust boundary → Agent/platform interaction → payment product → order/payment evidence
Mark exact field-level objects as “not publicly verified” rather than inventing them.

## AGT-P07 AMP
User → task authorization → Agent → KYA / trust rating → wallet / APM → merchant/acquirer → settlement
Optional A2A branch: Agent → nano-payment → Agent/service; settlement asset = UNKNOWN.

## AGT-P08 APOP
Agent identity + structured intent + user identity → payment authorization → UnionPay/bank rail → receipt / validation
Use “5 production-system validation trades” as evidence badge, not as mass-adoption badge.
