# ABOUT STABLECOINS｜NAVIGATION_SPEC V0.1

## Global sidebar

The global left sidebar must contain only one entry for this section:

- 关于稳定币 / About Stablecoins → `/about-stablecoins`

Do **not** expand any About Stablecoins child routes in the sidebar.

Reason:
About Stablecoins is an introductory/supporting section, not one of the site's primary research pillars. Expanding 9 child pages in the global sidebar creates unnecessary visual weight and competes with Research, Regional Developments, Agentic Payments and Market Data.

## SectionTopNav

Visible at the top of all About Stablecoins pages:

1. 概览 / Overview → `/about-stablecoins`
2. 发展历程 / History → `/about-stablecoins/history`
3. 类别 / Types → `/about-stablecoins/types`
4. 应用 / Applications → `/about-stablecoins/applications`
5. 监管演进 / Regulatory Evolution → `/about-stablecoins/regulatory-evolution`

Do **not** include `/regulatory` in this top navigation.
`/regulatory` remains a separate site-level current-regulation section.

## TypeNav

On `/about-stablecoins/types` and all five type-detail pages, display a lightweight second in-page navigation row beneath SectionTopNav:

1. 法币储备型 / Fiat-reserve-backed → `/about-stablecoins/types/fiat-backed`
2. 加密资产抵押型 / Crypto-collateralised → `/about-stablecoins/types/crypto-backed`
3. 合成型 / Synthetic / hedged → `/about-stablecoins/types/synthetic`
4. 算法型 / Algorithmic → `/about-stablecoins/types/algorithmic`
5. 混合与边界 / Hybrid & boundary cases → `/about-stablecoins/types/other`

This is **in-page navigation**, not global navigation.

## Mobile

Both top navigation rows may horizontally scroll or collapse into an accessible compact selector.
They must not become sidebar children on mobile.
