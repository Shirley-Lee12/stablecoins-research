# DYNAMIC CHART RESPONSIVE SPEC V0.2

## Shared rules

### Desktop
Use the full chart only when the time series is valid.
Keep visible:
- title;
- unit;
- selected time window;
- source/freshness;
- concise interpretation boundary.

### Mobile
Do not hide source, unit or freshness.

Allowed transformations:
- full line chart → compact chart + latest-value summary;
- multi-series chart → one selected series with selector;
- wide comparison table → stacked rows/cards;
- depth/liquidity table → pair/pool accordion;
- issuer table → one issuer per expandable row.

Do not:
- remove methodology;
- remove timestamp;
- truncate a risk boundary;
- show only a decorative sparkline.

## Page-specific behaviour

### Dashboard
Mobile:
one column; no more than 6 signal cards.
Adoption evidence card remains visibly `Report snapshot`.

### Market
Supply history:
desktop line chart; mobile compact line chart.

CEX liquidity:
desktop comparison table;
mobile per-pair cards showing spread, bid depth, ask depth, order size and timestamp.

DEX:
desktop comparison table;
mobile per-pool cards.
Never rename pool liquidity as depth.

### On-chain
Chain distribution:
desktop ranked bars / stacked view;
mobile ranked list with values.

Activity hierarchy:
prefer separate rows/series labels for raw / adjusted / P2P.
Do not stack them because adjusted/P2P are subsets/alternative definitions, not additive categories.

### Issuers & reserves
Desktop comparison table.
Mobile issuer-by-issuer disclosure cards.

Keep:
report period and publication date as separate lines.

### Macro
For multi-series rate/curve charts:
mobile defaults to one or two selected series.

RRP must remain separate because its unit differs.

Asia FX:
normalized index for visual comparison;
tooltip shows original local-currency-per-USD value.

### Adoption
Report metrics:
cards + category bars.
Mobile keeps report period/sample note directly beneath the figures.
