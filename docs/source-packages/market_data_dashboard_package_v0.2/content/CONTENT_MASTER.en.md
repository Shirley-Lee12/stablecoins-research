# Market Data + Dashboard｜Content Master en V0.1

## `/dashboard`
### Stablecoin signals worth checking today
Show no more than 4–6 well-defined signals:
- tracked stablecoin circulating value;
- top-two supply concentration;
- 30-day net supply change;
- 3-month Treasury yield as macro context;
- selected-market liquidity health, only when the collector is healthy;
- the latest dated adoption-evidence card.

Never turn missing data into zero.
Do not use research counts or resource counts as market KPIs.

## `/market-data`
### Define the metric before showing the chart
Organise the section around five questions:
Market / On-chain / Issuers & reserves / Macro / Adoption.

Each panel has its own source, timestamp, coverage and freshness state.
Do not create a false impression that all sources update in real time.

## `/market-data/market`
### Supply, price stability and trading liquidity are different concepts

Use `Tracked circulating value (USD)` for the main DefiLlama-derived size measure unless field-level implementation proves a different definition.

CEX:
selected venue/pair only; show pair, timestamp, spread, separate bid/ask 2% depth, and simulated slippage for an explicit order size.

DEX:
selected pool liquidity and volume only.

`DEX pool liquidity ≠ CEX order-book depth ≠ route-level executable slippage.`

Observed price deviation is not a depeg probability.

## `/market-data/on-chain`
### High transfer activity does not automatically mean high payment adoption

Separate:
- supply by chain;
- raw transfer volume;
- adjusted transfer volume;
- P2P transfer volume;
- active addresses;
- selected Ethereum issuance research.

Address ≠ user.

Public holder-concentration metrics remain on hold until address classification and exclusion rules are validated.

## `/market-data/issuers-reserves`
### Compare disclosure scopes before comparing reserve numbers

Core fields:
report period / publication date / circulation or liabilities covered / reserve composition / assurance type / assurance provider / direct redemption eligibility / limitations.

`Attestation ≠ financial-statement audit.`

Tether:
latest verified reserve attestation at this baseline is Q2 2026 (period end 30 June 2026, published 31 July 2026). Tether separately announced an unqualified KPMG audit opinion on its 2025 financial statements on 13 August 2026.

Circle:
continuous transparency/reserve page plus monthly reserve attestations; company financial reporting is a separate disclosure layer.

Paxos PYUSD:
monthly reserve reports/attestations; KPMG listed from February 2025 onward.

FDUSD:
monthly reserve disclosure/attestation; direct issuer purchase/redemption eligibility differs from secondary-market access.

Company profit may be shown only as a separately labelled company-level metric.

## `/market-data/macro`
### Macro data describe the environment; they do not establish stablecoin causality

Charts:
1. SOFR + DGS3MO (optionally EFFR)
2. DGS3MO / DGS2 / DGS10 Treasury curve
3. DTWEXBGS broad dollar
4. VIXCLS market-stress context
5. RRPONTSYD money-market liquidity
6. optional normalized Asia FX panel using DEXCHUS / DEXHKUS / DEXSIUS

Always preserve units and quote direction.

## `/market-data/adoption`
### Adoption evidence must identify who is using stablecoins, for what, and in what sample

Artemis 2025 report is a dated sample:
- 22 surveyed firms + 11 estimated firms;
- Jan 2023–Aug 2025;
- $136B attributable payments in the study period;
- $122B annualised run rate as of Aug 2025.

These are not a live 2026 total-market measure.

Keep separate:
- attributable payment research;
- on-chain activity;
- issuer-reported network/distribution metrics.

Do not add these evidence classes together.
