# CODEX HANDOFF｜About Stablecoins V0.2

STATUS: READY_FOR_CODEX

## Mission

Rebuild the 10-route About Stablecoins section as a concise, rigorous introductory layer.

Routes:
- `/about-stablecoins`
- `/about-stablecoins/history`
- `/about-stablecoins/types`
- `/about-stablecoins/applications`
- `/about-stablecoins/regulatory-evolution`
- `/about-stablecoins/types/fiat-backed`
- `/about-stablecoins/types/crypto-backed`
- `/about-stablecoins/types/synthetic`
- `/about-stablecoins/types/algorithmic`
- `/about-stablecoins/types/other`

## Read first
1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `NAVIGATION_SPEC.md`
4. `FINAL_COPY_QA.md`
5. `RESEARCH_BASELINE_V0.1.md`
6. `content/CONTENT_MASTER.zh-CN.md`
7. `content/CONTENT_MASTER.en.md`
8. `data/ABOUT_NAV.json`
9. `data/TYPE_MECHANISM_MATRIX.csv`
10. `data/APPLICATION_MATRIX.csv`
11. `data/HISTORY_TIMELINE.json`
12. `data/REGULATORY_EVOLUTION.json`
13. manifests
14. `visuals/VISUAL_QA.md`

## Navigation — hard requirement

### Global sidebar
One entry only:
`About Stablecoins` → `/about-stablecoins`

Do not add History / Types / Applications / Regulatory Evolution or type pages as sidebar children.

### Top page navigation
Use SectionTopNav:
Overview / History / Types / Applications / Regulatory Evolution.

### Type navigation
On Types + type-detail pages, add a lightweight in-page TypeNav:
Fiat-reserve-backed / Crypto-collateralised / Synthetic-hedged / Algorithmic / Hybrid & boundary.

`/regulatory` is not an About child.

## Information architecture
This section is deliberately lower-weight than Research, Regional Developments, Agentic Payments and Market Data.
Do not create a large sidebar hierarchy or a dense research-dashboard aesthetic.

## Core content rules
- mechanism before label;
- current mechanism before historical reputation;
- application != adoption;
- attestation != audit;
- reserve backing != identical direct redemption access;
- stablecoin != CBDC/tokenised deposit/tokenised fund;
- synthetic/hedged != algorithmic;
- algorithmic != decentralised.

## Frozen visuals
Use:
- `visuals/final/STB-D01-stablecoin-lifecycle.svg`
- `visuals/final/STB-D02-money-boundaries.svg`
- `visuals/final/STB-D03-taxonomy-matrix.svg`
- `visuals/final/STB-D04-regulatory-evolution.svg`
- `visuals/final/STB-D05-fiat-backed-flow.svg`
- `visuals/final/STB-D06-crypto-collateral-flow.svg`
- `visuals/final/STB-D07-synthetic-flow.svg`
- `visuals/final/STB-D08-algorithmic-death-spiral.svg`
- `visuals/final/STB-D09-boundary-map.svg`

Data-driven:
- History from `HISTORY_TIMELINE.json`
- Applications from `APPLICATION_MATRIX.csv`

Responsive JSX/SVG derivatives are allowed if research meaning remains unchanged.

## Source pattern
Use the existing source tooltip/popover pattern for important mechanism/product/date claims.
Do not create large bibliography blocks in the middle of introductory pages.

## Cross-links
- actual adoption → `/market-data/adoption`
- current regulation → `/regulatory`
- regional product/regulatory evidence → `/regional-developments`
- agentic-payment detail → `/agentic-payments`

## Existing pages
Old About pages are reference only.
Do not preserve old text if it conflicts with this package.

## Implementation report
After local construction report:
1. modified files;
2. all 10 routes;
3. sidebar and top-nav behaviour;
4. data-driven timeline/application implementation;
5. frozen visual use;
6. source handling;
7. tests/typecheck/build;
8. any content issue requiring user confirmation.

Do not commit, push or deploy unless separately instructed.
