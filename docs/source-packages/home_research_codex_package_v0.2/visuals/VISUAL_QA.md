# Visual QA V0.2

## Frozen assets
- HOME-D01 Research Hub Map
- HOME-D02 Research Maturity
- RES-D01 Research Pipeline & Status
- RES-D02 Quantitative Risk-Transmission Research
- RES-D03 From Taxonomy to Measurement

All five are editable SVGs with a 1600×900 viewBox.

## QA conclusions

### HOME-D01
- Starts from user questions, not institutional biography.
- Gives equal visual weight to mechanisms, regional evidence, agentic payments, market data and research.
- Does not imply Market Data or Research are already live monitoring systems.

### HOME-D02
- Separates completed/public work, interim empirical results, validation and planned infrastructure.
- Explicitly states that no live depeg probability or production-grade early-warning score exists.
- Does not use progress percentages.

### RES-D01
- Shows research dependency from conceptual framework to future monitoring.
- Every stage has a visible status.
- The arrows do not imply completion.

### RES-D02
- Separates continuous-risk analysis (Transfer Entropy) from event dynamics (multivariate Hawkes).
- Historical cases, stress scenarios, robustness, out-of-sample evaluation and reproducibility remain a validation layer.
- Monitoring/warning is connected through a dashed future path.

### RES-D03
- Explicitly states `55 ≠ 55 direct model nodes`.
- Does not publish a fixed empirical node count that has not been frozen for public release.

## Design constraints
- no decorative robot/coin imagery;
- no stock photography;
- no team-photo wall;
- no fake monitoring charts;
- no numerical progress bars;
- no dynamic unpublished model results in frozen SVGs.

## Responsive implementation
Codex may rebuild these as responsive JSX/SVG components using the site's semantic theme tokens, but research meaning and status labels must remain unchanged.

## Dark mode
Do not raster-invert the light reference SVGs. Map background, line and text colours to theme tokens.

## Fonts
Only system/web-safe fallbacks are referenced. Do not bundle font files.
