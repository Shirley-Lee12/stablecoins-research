# Agentic Payments｜Web Copy Master en V0.1

> This file mirrors the approved Chinese information architecture.  
> Keep claims tied to the Source Manifest and `last_verified`.

---

# A. `/agentic-payments`｜Overview

## HERO
**H1**  
When AI can spend on your behalf, the key question is not whether it can pay, but who authorized it, how much it can spend, and which rail moves the money.

**Lead**  
AI is moving from product discovery to transaction execution. A real agentic-payment stack must handle user intent, agent identity, delegated authority, payment credentials, payment rails, settlement, and dispute evidence. Stablecoins can be an important rail, but they are not the entire stack.

---

## O1｜From a sentence to a transaction
A user can say, “Buy me a Friday flight under ¥500,” but a payment system cannot treat that sentence as unlimited debit authority. The request must be converted into constraints, tied to an agent identity, verified against authorization, routed to a payment method, and recorded for audit.

Intent → Agent → Authorization → Payment → Evidence

---

## O2｜How much autonomy does the agent have?

**Human-confirmed**  
The agent researches and prepares the transaction; the user confirms before purchase.

**Pre-authorized**  
The user sets limits such as amount, merchant, time, category, and frequency.

**Machine-native**  
The agent pays automatically for APIs, data, compute, or other digital resources.

More autonomy requires stronger identity, spending limits, revocation, auditability, and anomaly monitoring.

---

## O3｜Does the agent get my card?

**Mandate model**  
The agent gets task-specific authority with verifiable constraints.

**Scoped credential model**  
A PSP issues a one-time or restricted payment credential without exposing the underlying card.

**Platform account + approval model**  
The agent proposes a purchase; the user approves it; a platform financial account executes the payment.

---

## O4｜Which rail moves the money?

**Card / Bank**  
Broad merchant acceptance and mature refunds and consumer protections.

**Wallet / APM**  
Mobile-first rails such as Alipay+, GCash, DANA, and other regional wallets.

**Stablecoin / Blockchain**  
Strong fit for 24/7, cross-border, programmable, high-frequency and low-value machine payments.

**Key line**  
Stablecoin is one payment rail, not the whole agentic-payment stack.

---

## O5｜Protocol is not product

Commerce: UCP · ACP  
Trust / authorization: AP2 · ACT · AMP · APOP  
Machine payment: x402 · MPP · A402 / Alipay Machine Pay  
Products: Instant Checkout · Agent Pay · JD AI Pay · Muse · X Money  
Rails: Card · Bank · Wallet · Stablecoin

---

## O6｜Why stablecoins still matter
Stablecoins are not required for AI shopping. Their strongest structural case appears in machine-to-machine payments, micropayments, 24/7 settlement, cross-border transfers, and programmable API-native transactions.

---

## O7｜Risks
Intent errors · prompt injection · over-delegation · credential/key compromise · malicious merchants/APIs · duplicate payments · stablecoin and chain risk · unclear liability.

---

# B. `/agentic-payments/protocols`

**H1**  
These protocols do not all compete at the same layer.

**Lead**  
UCP and ACP mainly standardize commerce interactions. AP2, ACT, AMP and APOP focus on trust, identity or delegated authority. x402, MPP and A402 are closer to machine-native payment execution.

Render the protocol matrix from `PROTOCOL_CARDS.json`.

---

# C. `/agentic-payments/scenarios`

## AI shopping
Research → checkout → user confirmation → payment → fulfillment.  
Examples: ChatGPT Instant Checkout, Muse + Link, Grok Bot purchase approval.

## Conditional purchase
User constraints → delegated authority → agent finds qualifying transaction → verify → pay → receipt.

## Pay-per-call API
Request → HTTP 402/payment request → payment proof → verification → resource.  
Examples: x402, MPP, Alipay Machine Pay/A402.

## Agent-to-Agent
Service discovery → price → budget authorization → machine payment → result delivery.

---

# D. `/agentic-payments/ecosystem`

**H1**  
Who defines the protocol, who owns the agent, and who actually holds the payment account?

Group organizations by role rather than brand popularity:
- Standards / protocols
- AI and commerce surfaces
- Payment infrastructure
- Settlement rails

Render cards from `ECOSYSTEM_CARDS.json`.

---

# E. Protocol detail pages

Use one shared page template:
What it is → Problem solved → Scenario → How it works → Actors → Authorization → Payment rail → Stablecoin relation → Evidence/maturity → Risks/unknowns → Official sources.

## AP2
An authorization and trust protocol, not a new payment rail. Mandates provide verifiable evidence that an agent was allowed to transact. Human-present and delegated/human-not-present patterns are both supported. Stablecoin-compatible, not stablecoin-native.

## UCP
A common commerce language for consumer surfaces, businesses and payment providers. Without AP2 mandates, checkout is finalized through a trusted deterministic UI. The business remains Merchant of Record.

## ACP
An open commerce standard connecting ChatGPT with merchant catalogs, checkout and order systems. Delegated Payments can issue restricted payment tokens; the merchant remains Merchant of Record.

## x402
An HTTP-native payment protocol. A service returns payment requirements, an agent pays, and the service verifies proof before delivering the resource. Stablecoin-native origins; now broader in asset and payment scope.

## MPP
An open machine-payment standard by Stripe and Tempo. Agents can pay for resources programmatically using stablecoins or conventional payment methods supported by the implementation.

## ACT
Alipay ecosystem commerce-trust protocol. Public descriptions cover user intent, delegation, cross-platform commerce and traceability. Field-level mapping to AP2 remains unverified.

## AMP
Ant International's mobile- and wallet-first agentic-payment protocol. Core idea: authorize the task, not the account. Includes KYA and agent trust concepts. The settlement asset for nano-payments is not publicly verified as a stablecoin.

## APOP
China UnionPay's open framework for agentic payments, built around agent identity, structured intent, user identity and payment authorization. Five production-system validation transactions were reported at launch.

---

# F. A402 / Alipay Machine Pay
Machine Pay is the product; A402 is the documented HTTP-402-based A2M payment method/specification used in that ecosystem.

Verified pattern:
request → `402 Payment Required` + `Payment-Needed` → user authorization/payment → `Payment-Proof` → verification → resource delivery.

Do not label A402 as a fully independent open standard until governance/version/interoperability evidence is verified.

---

# G. A2P2 route
Status: HOLD. Remove from the main protocol matrix and navigation until first-party specification evidence is sufficient.
