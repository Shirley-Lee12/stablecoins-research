# Research Corrections / Additions after V0.3

This file records facts that should override or refine wording in the earlier research draft when Codex uses this package.

## 1. Alipay Machine Pay / A402 — IMPORTANT UPDATE

Earlier research treated Alipay Machine Pay mainly as a product-level machine-payment solution.

Current official Alipay Agent Payment documentation (verified 2026-10-15) now explicitly states:
- Machine Pay is based on HTTP `402 Payment Required`;
- the service can return `Payment-Needed`;
- after payment the agent sends `Payment-Proof`;
- the merchant verifies proof before delivering the resource;
- Alipay's product page calls this 402-based A2M approach **A402**.

Official:
- https://aipay.alipay.com/products/machine-pay
- https://aipay.alipay.com/docs/ai-receive/MACHINE_PAY.html

### Correct classification for the website
- **Machine Pay** = PRODUCT
- **A402** = documented 402-based A2M payment method/specification inside the Alipay Machine Pay ecosystem

### Do NOT yet claim
- A402 has the same open-governance status as x402 or MPP;
- A402 is stablecoin-based;
- A402 is an independent vendor-neutral protocol.

Until first-party evidence of independent governance/version/interoperability is found, use the label:
`PAYMENT_METHOD_SPEC / PRODUCT-EMBEDDED`

---

## 2. JD AI Pay

Official JD Pay sources confirm:
- “京东AI付” is a formal payment/receiving capability for AI scenarios;
- “商户版-AI付” appears in JD Pay's product documentation.

Still unknown:
- independent mandate object;
- KYA;
- preauthorization semantics;
- open protocol;
- stablecoin rail.

Therefore keep as PRODUCT, not PROTOCOL.

---

## 3. Meta Muse

Official Meta source confirms:
- purchase approval before sensitive purchase actions;
- Link checkout;
- one-time-use card;
- Muse has no visibility into payment methods/passwords;
- complete audit trail.

This is a strong real-world example of the scoped/virtual-credential model.

---

## 4. Grok Bot + X Money

xAI changelog verified on 2026-10-15:
- Sep 2026: purchase card with amount and Allow/Deny, Stripe Link payment;
- Oct 11 2026: Bots can pay with X Money or Stripe Link.

X Money legal terms still show a Cross River Bank stored-value structure and conventional bank/card rails.

Do not infer stablecoin/crypto support without future first-party evidence.

---

## 5. A2P2

Do not render as a peer protocol page in the current website package.
Status remains HOLD until sufficient first-party technical evidence is collected.
