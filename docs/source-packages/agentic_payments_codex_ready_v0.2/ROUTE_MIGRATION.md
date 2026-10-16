# ROUTE MIGRATION V0.1

## Keep and rewrite
- `/agentic-payments`
- `/agentic-payments/protocols`
- `/agentic-payments/scenarios`
- `/agentic-payments/ecosystem`
- `/agentic-payments/protocols/ap2`
- `/agentic-payments/protocols/acp`
- `/agentic-payments/protocols/amp`
- `/agentic-payments/protocols/x402`
- `/agentic-payments/protocols/apop`
- `/agentic-payments/protocols/ucp`

## Add
- `/agentic-payments/protocols/mpp`
- `/agentic-payments/protocols/act`

## Hold / redirect
### `/agentic-payments/protocols/a2p2`
Reason: current first-party evidence is insufficient to keep it as a peer protocol page.

Recommended behavior:
1. remove it from visible protocol navigation;
2. redirect to `/agentic-payments/protocols` if preserving old links is important;
3. alternatively show a compact verification-state page with no unverified mechanism claims.

## A402
Do not add an independent route in V0.1.
Represent it inside:
- `/agentic-payments/scenarios#api-pay`
- Protocol matrix with artifact type `PAYMENT_METHOD_SPEC`
- Alipay/Agent Pay ecosystem card

Reason:
Official Alipay docs verify a 402-based A2M method called A402, but independent open-standard governance/version/interoperability evidence is not yet established.

## URL stability rule
Do not rename existing stable routes unless necessary. Prefer adding content and redirecting only clearly unsupported legacy protocol pages.
