# CODEX HANDOFF｜Asia Stablecoin Development V0.2

STATUS: READY_FOR_CODEX

## Mission
Rebuild the Stablecoin Research Hub Asia regional section using this package as the single source of truth.

Pages:
- `/regional-developments`
- `/mainland-china`
- `/hong-kong`
- `/singapore`
- `/uae`

## Read first
1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `RESEARCH_BASELINE_V0.1.md`
4. `content/CONTENT_MASTER.zh-CN.md`
5. `manifests/PAGE_MANIFEST.csv`
6. `manifests/SOURCE_MANIFEST.csv`
7. `matrices/REGULATORY_MATRIX.csv`
8. `matrices/PRODUCT_AVAILABILITY.csv`
9. `visuals/VISUAL_QA.md`

## Single-source rules
Do not use old website copy as a factual source when it conflicts with this package.
Do not add external facts unless explicitly requested.
Do not infer missing product states.

## Critical content boundaries
- `licence != token launch != retail availability != mass adoption`
- e-CNY is CBDC, not a stablecoin.
- Mainland China does not have a private stablecoin issuer-licensing route.
- Hong Kong: HKDAP is Beta Access, not retail Full Launch.
- Hong Kong: HSBC RedCoin is licensed/named but not yet issued at the 2026-10-16 baseline.
- Singapore: MPI/DPT status is not the future MAS-SCS issuer licence.
- Singapore: existing XSGD/XUSD activity and future MAS-SCS implementation must remain separate.
- UAE must preserve CBUAE / VARA / ADGM / DIFC as distinct regulatory perimeters.
- ADGM issuer permission alone does not prove a specific token has launched.
- Dynamic reserve/circulation figures require an as-of date.
- UNKNOWN stays UNKNOWN.

## Visual assets
READY:
- `visuals/final/REG-M01-asia-development-map.svg`
- `visuals/final/REG-D01-mainland-digital-money-boundary.svg`
- `visuals/final/REG-D02-hk-licence-availability.svg`
- `visuals/final/REG-D03-singapore-framework-vs-market.svg`
- `visuals/final/REG-M02-uae-regulatory-perimeters.svg`

Data-driven:
- `matrices/PRODUCT_AVAILABILITY.csv`
- `matrices/REGULATORY_MATRIX.csv`
- `visuals/TIMELINE_DATA.json`

Official product imagery is non-blocking; see `visuals/OFFICIAL_VISUAL_STATUS.md`.

## UI guidance
Keep the existing Research Hub blue academic visual language and navigation continuity, but do not copy the old regional pages pixel-for-pixel.

Prefer:
- broad comparison tables;
- timeline filters;
- jurisdiction/status chips;
- source tooltips near important claims;
- responsive full-width diagrams.

Avoid:
- subjective openness rankings;
- decorative city skylines / flags as primary content;
- logo walls;
- large empty chart placeholders;
- turning every paragraph into an equal card.

## Source UI
Important status/date claims should expose the official source:
- desktop: hover/focus tooltip with organisation/title/date;
- mobile: tap opens source popover;
- clicking opens official source.

## Implementation completion report
After construction, report:
1. modified files;
2. pages/routes implemented;
3. source/UNKNOWN items preserved;
4. visual assets used;
5. test/typecheck/build results;
6. any content question requiring human confirmation.

Do not push Git or deploy unless separately instructed.
