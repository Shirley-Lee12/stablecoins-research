# Visual QA V0.2

## READY assets
- REG-M01 Asia Stablecoin Development
- REG-D01 Mainland Digital-Money Boundary
- REG-D02 Hong Kong Licence ≠ Availability
- REG-D03 Singapore Framework vs Live Market
- REG-M02 UAE Regulatory Perimeters

All five are editable SVG with a 1600×900 viewBox.

## QA decisions
- No openness/friendliness ranking.
- No red/green moral ranking across jurisdictions.
- Hong Kong visually separates licence, token launch, distribution and retail access.
- Singapore visually separates future MAS-SCS implementation from the existing PSA/DPT market.
- Mainland China separates private stablecoins, e-CNY and approval-bound tokenised activity.
- UAE separates CBUAE, VARA, ADGM and DIFC.
- Dynamic reserve/circulation numbers are excluded from the frozen SVGs.
- No unverified product logos/screenshots are embedded.

## Responsive implementation
Production preference:
- rebuild SVG structure as responsive SVG/JSX components using site semantic tokens; or
- use the frozen SVG directly and provide a mobile text fallback / expandable full view.

Do not shrink a 1600px diagram into unreadable mobile text.

## Dark mode
The files are light-mode reference assets. If converted to components, map fills/strokes to theme tokens without changing the research meaning.

## Font
SVGs use system/web-safe fallbacks only. Do not bundle font files.
