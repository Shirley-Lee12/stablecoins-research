# Dynamic Visual Design Rules V0.1

## No fake data

Do not draw placeholder trends, illustrative market curves or simulated reserve compositions merely to fill space.

When a dynamic series is unavailable:
- keep the chart area compact;
- show status + last successful observation if one exists;
- provide the source/method note;
- do not show a zero-value line.

## Chart density

The website is a research hub, not a trading terminal.

Prefer:
- 1 principal chart + 1 comparison/table per section;
- short interpretation below the chart;
- details in tooltips or methodology drawer.

Avoid:
- six mini charts in one row;
- gauges/speedometers;
- decorative heatmaps without a research question;
- red/green price-trader aesthetics.

## Tooltip contract

Every dynamic chart tooltip should include:
- date/time;
- value + unit;
- source;
- if adjusted/estimated, the method label.

## Status strip

Each data page should expose a compact source-status strip:
`Source · latest observation · freshness`

Multiple sources may have different timestamps on the same page.

## Mobile

Charts may switch to:
- ranked tables;
- a smaller selected-series view;
- scrollable time-range controls.

Do not remove the unit/method/source merely to fit mobile.

## Colour semantics

Use the existing site semantic/theme colours.
Do not encode “good/bad” unless the underlying metric truly has directional risk meaning.
