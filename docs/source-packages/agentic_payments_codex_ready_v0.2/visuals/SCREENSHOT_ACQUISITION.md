# Official Screenshot Acquisition List V0.1

> 这些截图用于事实证据，不用于首页装饰。  
> 网站公开使用前仍需检查各来源的转载/商标/媒体使用条件。

## AGT-S01｜ChatGPT Instant Checkout
- Source: https://openai.com/index/buy-it-in-chatgpt/
- What to capture: 产品推荐 → Buy → shipping/payment confirmation / checkout UI
- What it proves: Agentic Commerce 产品已真实进入 ChatGPT；用户显式确认；商户处理订单/支付
- Status: SOURCE_FOUND / CAPTURE_REQUIRED
- Crop: 保留 ChatGPT 上下文 + checkout 卡，不只截“Buy”按钮
- Alt: “ChatGPT Instant Checkout showing product purchase and checkout confirmation”
- Publish note: prefer official OpenAI media asset if available; otherwise cite source adjacent to screenshot

## AGT-S02｜Meta Muse purchase
- Source: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
- Official page includes Muse shopping video
- What to capture: purchase approval or Muse shopping sequence
- What it proves: Muse asks approval before purchase; Link is used for checkout
- Status: SOURCE_FOUND / VIDEO_STILL_CAPTURE_REQUIRED
- Alt: “Meta Muse requesting approval before completing a purchase”

## AGT-S03｜Grok Bot Allow / Deny payment
- Source: https://x.ai/changelog/bot
- What to capture: amount card + Allow/Deny if official changelog/media exposes it
- What it proves: human-in-the-loop purchase approval; later support for X Money / Stripe Link
- Status: SOURCE_FOUND / CAPTURE_REQUIRED
- Note: if no official image is available, do NOT use a third-party reconstruction; use a self-drawn UI-neutral schematic with official source citation.

## AGT-S04｜X Money
- Source: https://money.x.com/en
- What to capture: official X Money product/account/card screen
- What it proves: X Money is a real financial product, not a stablecoin wallet
- Status: SOURCE_FOUND / CAPTURE_REQUIRED
- Alt: “X Money product interface and X Card information”

## AGT-S05｜Alipay Agent Pay / Machine Pay
- Sources:
  - https://aipay.alipay.com/products/agent-pay
  - https://aipay.alipay.com/products/machine-pay
- What to capture:
  1. Agent Pay user-confirmation purchase flow
  2. Machine Pay demo showing 402 / Payment-Needed / payment / result
- What it proves: current production-facing Alipay AI payment product taxonomy; A402 flow
- Status: SOURCE_FOUND / CAPTURE_REQUIRED
- Alt: “Alipay Agent Payment flow with user authorization” / “Alipay Machine Pay HTTP 402 pay-per-use flow”

## AGT-S06｜JD AI Shopping
- Sources:
  - https://joyai-user-protocol-pro.pf.jd.com/
  - JD AI Shopping official app/product entry when accessible
- What to capture: official JD AI Shopping conversation / AI shopping interface
- What it proves: AI shopping is a product; not evidence of an open payment protocol
- Status: SOURCE_PARTIAL / OFFICIAL_UI_CAPTURE_REQUIRED
- Rule: do not use third-party screenshots as primary evidence if official app screenshot can be obtained.

## AGT-S07｜UnionPay APOP case
- Source: https://www.unionpay.com/upowhtml/cn/templates/newInfo-nosub/7885004da382485e8bde5a0ba000fdd3/20260403105759.html
- What to capture: official production-system validation scenario image (flight / hotel / in-car / utility)
- What it proves: APOP had five production-system validation transactions at launch
- Status: SOURCE_FOUND / CAPTURE_REQUIRED
- Wording rule: “production-system validation”, not “mass rollout”.

## Acquisition rule
Every final screenshot file must be registered in ASSET_MANIFEST with:
source_url, source_org, source_date, capture_date, crop note, alt text, rights note, and status.
