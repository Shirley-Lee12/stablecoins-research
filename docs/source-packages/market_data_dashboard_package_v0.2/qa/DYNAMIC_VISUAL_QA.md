# DYNAMIC VISUAL / DATA UI QA V0.2

## Principle

Market Data pages should look data-rich only when valid data exists.
A chart container is not evidence.

## Dashboard

Approved:
- no more than six signals;
- cards use current value only when source state permits;
- each card carries source/time/freshness;
- report evidence is visually marked as a report snapshot.

Rejected:
- research-count KPIs;
- jurisdiction/resource counts;
- fake sparklines;
- depeg/risk probability cards.

## Market

### Supply
One principal historical chart + ranked current snapshot.

Use:
`Tracked circulating value (USD)`

Do not automatically relabel it `market cap`.

### CEX
Use a structured comparison table/cards.
Display:
exchange · pair · observation time · spread · bid depth · ask depth · simulated slippage · explicit order size.

### DEX
Use pool rows/cards.
Display:
chain · DEX · pool · pool liquidity · 24h volume · price.

Never align a DEX pool-liquidity number directly under a CEX `2% depth` heading.

### Price deviation
Small table/card, not risk gauge.
No green/red “safe/danger” score in V0.2.

## On-chain

### Supply by chain
Ranked bars/list.

### Activity hierarchy
Raw / adjusted / P2P are alternative scopes, not additive stacks.

### Holder concentration
No public chart in V0.2.

## Issuers & reserves

Primary visual = comparison table/cards.
Do not use pie charts to imply directly comparable reserve categories across issuers unless the reporting scopes have been harmonised.

The explanatory assurance component should show:
Issuer self-report → attestation/examination → financial-statement audit

This is a scope distinction, not a linear “quality score”.

## Macro

Use separate charts where units differ.

Permitted combinations:
- SOFR + DGS3MO on percent axis;
- DGS3MO / DGS2 / DGS10 on percent axis.

Separate:
- RRP (USD bn);
- VIX (index);
- broad USD index.

Asia FX:
normalise only for visual comparison; raw quote remains available in tooltip.

## Adoption

The Artemis report panel must visibly show:
`Study period: Jan 2023–Aug 2025`
and sample/coverage note.

Do not place its $122B annualised run rate beside a live supply KPI without a `Report snapshot` badge.

## Empty-state height

When no valid data exists:
- use a compact panel;
- do not preserve a 400–600px blank chart area.

## Dark mode

Charts use semantic theme variables.
Do not invert screenshots or SVG bitmaps.
Maintain gridline/text contrast.

## Mobile

See `components/RESPONSIVE_CHART_SPEC.md`.
No critical method, unit, date, source or freshness field may disappear.
