# PACKAGE_STATUS V0.2

status: READY_FOR_CODEX
ready_for_codex: true
baseline_date: 2026-10-16

## Scope
- `/dashboard`
- `/market-data`
- `/market-data/market`
- `/market-data/on-chain`
- `/market-data/issuers-reserves`
- `/market-data/macro`
- `/market-data/adoption`

## Frozen data-governance rules
- unavailable/missing/failed data never becomes numeric zero;
- observation/report time remains distinct from page-load/fetch time;
- each module shows source, time and freshness;
- supply, trading volume, transfer volume and payment volume remain distinct;
- CEX order-book liquidity and DEX pool liquidity remain distinct;
- report snapshots are visually distinct from dynamic API data;
- attestation/examination and financial-statement audit remain distinct;
- issuer company financial results are separate from stablecoin reserve backing;
- active addresses are not labelled users;
- holder concentration remains non-public in V0.2;
- no cross-evidence summation on Adoption.

## Public depeg decision
Allowed:
- current observed price deviation, when target/source/timestamp are valid.

Not public:
- threshold-derived depeg event history;
- depeg event counts/rankings;
- risk/depeg probability;
- dashboard depeg KPI.

## Dynamic/source decisions
Ready:
- DefiLlama supply/chain data;
- FRED macro series;
- existing healthy Binance/DEX collectors;
- issuer report snapshots;
- Artemis 2025 payments report as dated research evidence.

Conditional:
- CoinGecko current deviation only after source/target health checks;
- Ethereum issuance only after contract/event semantic QA.

Hold:
- public holder concentration;
- Artemis live API modules unless key/licensing/redistribution are confirmed.

## QA completed
- issuer disclosure final QA;
- source verification log;
- Data Health component spec;
- responsive chart spec;
- dynamic visual QA;
- final bilingual copy QA.

## Handoff
Send only the V0.2 ZIP to Codex.
Do not separately send V0.1 or duplicate CSV/spec files.
