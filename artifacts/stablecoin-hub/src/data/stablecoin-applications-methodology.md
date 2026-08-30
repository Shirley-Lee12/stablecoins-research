# Stablecoin Application Data Methodology

This dataset keeps several different quantitative questions separate:

1. **Current market stock:** month-end market capitalisation through 29 May 2026 from BIS Annual Economic Report 2026, Chapter III, Graph 2.
2. **Historical cross-border series:** quarterly estimated USDC and USDT cross-border flows through 2024 Q2 from BIS Annual Economic Report 2025, Graph 2.
3. **Latest cross-border benchmark:** the IMF's separately published estimate of USD 316 billion in gross USDC and USDT cross-border flows in 2025 Q1.
4. **Fiat-to-stablecoin flows:** monthly cumulative net inflows from USD, EUR and other fiat currencies into four major USD-pegged stablecoins through December 2025. This is an FX-interface measure, not a complete cross-border series.
5. **Application allocation:** the Federal Reserve Bank of Kansas City's November 2025 estimate of how the stablecoin market-cap stock was distributed across uses.
6. **Transaction-value allocation:** the BIS's 2026 publication of estimated 2024 transaction-value shares by use.

## Comparability rules

- Never compare a market-cap stock directly with a quarterly or monthly transaction flow.
- Application shares are comparable only when the reference date, denominator, coin and chain scope, and category rules are identical.
- Preserve source rounding. The Kansas City Fed categories total 99.9%, so the pipeline records a 0.1 percentage-point rounding residual instead of silently scaling the figures to 100%.
- Label published observations and model estimates separately. A figure published by an official institution is not necessarily a direct observation.
- Do not append the IMF 2025 Q1 cross-border benchmark to the older BIS series as though they were one continuous data vintage.
- Do not label fiat-to-stablecoin exchange flows as wallet-to-wallet cross-border payments.
- Treat transfer-event counts cautiously. Smart-contract transactions may generate multiple embedded transfer events and are not equivalent to user payments.

## Quality classes

- `published_observation`: a published numerical series requiring only mechanical time aggregation.
- `published_model_estimate`: a published result that depends on attribution, classification, velocity, geolocation, or other modeling assumptions.

Confidence can differ within one dataset. In the application allocation benchmark, protocol and exchange balances are more directly observable than the payment and transfer categories.

## Rebuild

From the repository root:

```bash
pnpm --filter @workspace/scripts process-stablecoin-applications \
  --bis-2025-workbook /path/to/ar2025e3_stats.xlsx \
  --bis-2026-workbook /path/to/ar2026e3_stats.xlsx
```

When either workbook argument is omitted, the script downloads that official BIS workbook. The normalized output is written to `artifacts/stablecoin-hub/src/data/stablecoin-applications.json`.

## Sources

- [BIS Annual Economic Report 2025 underlying data](https://www.bis.org/statistics/ar2025stats.htm)
- [BIS Annual Economic Report 2026 underlying data](https://www.bis.org/statistics/ar2026stats.htm)
- [IMF Global Financial Stability Report, April 2026, Chapter 2](https://www.elibrary.imf.org/abstract/book/9798229035910/CH002.xml)
- [Federal Reserve Bank of Kansas City application-allocation estimate](https://www.kansascityfed.org/research/payments-system-research-briefings/what-are-stablecoins-used-for-today-estimating-the-distribution-of-stablecoins/)
- [BIS: Anatomy of stablecoin transactions](https://www.bis.org/publ/work1359.htm)
