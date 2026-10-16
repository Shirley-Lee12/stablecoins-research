# Current Market Data / Dashboard Audit V0.1

Reference date: 2026-10-16.
Source: 2026-10-15 website handoff export and screenshot.
The current page text is treated as implementation evidence, not factual authority.

## `/dashboard`

### Current problem
The page mixes research coverage counts with market observation:
- 55 atomic risks
- 4 core mechanisms
- 7 jurisdictions
- latest resources

These are not the highest-value “current market signals”.

### Decision
Rebuild `/dashboard` as a compact current-state entry page with at most 4–6 high-value signals that have reliable source/freshness semantics.

Do not use:
- research-count KPIs;
- resource-count KPIs;
- partner counts;
- jurisdiction counts;
- unvalidated risk probabilities.

## `/market-data`

### Current problem
The information architecture is broadly correct, but the first chart can fail and leave a large empty block.
The page lists sources before defining exact metric semantics.

### Decision
Make this page the **data map / methodology entry**, not another dashboard.
Each section answers one question:
- Market: size, concentration, price stability, selected venue liquidity
- On-chain: where supply/activity occurs
- Issuers: what supports redemption and how disclosures differ
- Macro: external rate/dollar/funding/stress environment
- Adoption: which activity can actually be attributed to use/payment

## `/market-data/market`

### Current problem
“Market cap”, circulating amount and supply are not consistently distinguished.
Liquidity/depeg sections have no successful stored snapshot.

### Decision
Use “tracked circulating value (USD)” for the main DefiLlama-derived stablecoin size measure unless implementation can prove another definition.
Never merge CEX and DEX liquidity into one number.

## `/market-data/on-chain`

### Current problem
A dated Artemis snapshot is displayed beside automatically updated supply data.
The page can visually imply identical freshness.
Ethereum issuance/holder data are incomplete.

### Decision
Separate:
- automated supply-by-chain;
- dated Artemis activity snapshot/API;
- Ethereum-specific issuance/holder modules.
Each panel gets its own timestamp and source status.

## `/market-data/issuers-reserves`

### Current problem
Issuer company profitability, reserve values and assurance status are mixed.
The Tether snapshot is outdated relative to the latest verified Q2 2026 attestation.
The old table can imply that issuer profits are product-level stablecoin economics.

### Decision
Core comparison fields:
- token / issuer
- report period
- publication date
- circulation / liabilities covered
- reserve composition
- assurance type
- assurance provider
- disclosure frequency
- direct redemption eligibility
- material disclosure limitations

Company net income/profit is optional contextual information and must be separately labelled `company-level`, never `stablecoin product profit`.

## `/market-data/macro`

### Current problem
The page has a good conceptual scope but almost no visible analysis in the export.

### Decision
Use a small number of interpretable charts:
- short USD rates / reserve-income environment;
- Treasury curve;
- broad dollar;
- market stress;
- optional Asia FX panel with explicit quote direction.

Do not claim these variables “cause” stablecoin demand or risk from simple co-movement.

## `/market-data/adoption`

### Current problem
The Artemis payment report is a dated sample, but presentation can look like a live total market estimate.
A failed dynamic supply calculation was rendered as `$0`.
Issuer-reported wallet/on-chain/CPN statistics are mixed with attributable payment evidence.

### Decision
Split three evidence classes:
1. attributable payment research samples;
2. on-chain activity / transfer metrics;
3. issuer-reported distribution or network metrics.

Never add them together.

`$0` must never be used as a missing-data fallback.
