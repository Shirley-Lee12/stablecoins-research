# About Stablecoins｜VISUAL_QA V0.2

## Frozen assets

READY:
- STB-D01 Stablecoin Lifecycle
- STB-D02 Stablecoin vs Adjacent Digital Money
- STB-D03 Mechanism-first Stablecoin Taxonomy
- STB-D04 Stablecoin Regulatory Evolution
- STB-D05 Fiat-reserve-backed Flow
- STB-D06 Crypto-collateralised Flow
- STB-D07 Synthetic / Hedged Flow
- STB-D08 Algorithmic Reflexive Failure
- STB-D09 Hybrid & Boundary Map

Data-driven:
- STB-T01 History Timeline
- STB-D10 Application ≠ Adoption Matrix

All frozen SVGs use a 1600×900 viewBox and remain editable.

## Research-meaning QA

### STB-D01
- Does not imply every stablecoin uses every lifecycle node.
- Explicitly asks where losses are absorbed under stress.

### STB-D02
- Separates stablecoin, CBDC, tokenised deposit and tokenised fund share.
- Does not rank these instruments.

### STB-D03
- Taxonomy is mechanism-first.
- Teaching groups are not represented as immutable legal categories.
- Footer explicitly prioritises the current mechanism over historical reputation.

### STB-D04
- Explains regulatory evolution, not current country-level permission status.
- Links conceptually to `/regulatory` and `/regional-developments`.

### STB-D05
- Separates eligible direct customers from secondary holders.
- Explicitly states reserve backing does not create identical direct issuer redemption access.

### STB-D06
- Separates solvency/liquidation dynamics from the peg-support role of redemption/arbitrage.
- Highlights oracle, congestion, collateral-liquidity and bad-debt stress points.

### STB-D07
- Backing + hedge + custody/settlement remain separate components.
- Direct counterparty and secondary-holder rights are visually separated.
- Synthetic/hedged is explicitly separated from classic endogenous algorithmic design.

### STB-D08
- Separates intended arbitrage from the reflexive stress loop.
- TerraUSD is presented as a historical failure mechanism, not a universal description of non-fiat stablecoins.

### STB-D09
- Separates mechanism migration from adjacent forms of digital money.
- frxUSD is used only as a current-mechanism example.

## Layout QA
- Long taxonomy and algorithmic labels were re-laid out after first preview.
- No material text overlap remains in the final contact-sheet review.
- No dynamic reserve, market-cap or adoption numbers are embedded in frozen SVGs.
- No product logos, decorative coins, stock photography or fake market charts are used.

## Responsive implementation
Codex may recreate the frozen diagrams as responsive JSX/SVG using semantic theme tokens.
On narrow screens:
- show a readable text explanation;
- allow expanded full diagram;
- do not scale 1600px diagrams into unreadably small text.

## Dark mode
Do not raster-invert.
Map background, text, border and accent colours to site theme tokens without changing meaning.

## Fonts
Only system/web-safe fallbacks. Do not bundle fonts.
