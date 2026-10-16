# CODEX HANDOFF｜Market Data + Dashboard V0.2

STATUS: READY_FOR_CODEX

## Mission

Rebuild the seven data routes as a rigorous, source-aware data layer:

- `/dashboard`
- `/market-data`
- `/market-data/market`
- `/market-data/on-chain`
- `/market-data/issuers-reserves`
- `/market-data/macro`
- `/market-data/adoption`

This is a data-governance implementation, not a cosmetic dashboard redesign.

## Read first

1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `02_DATA_GOVERNANCE.md`
4. `qa/FINAL_COPY_QA.md`
5. `qa/DYNAMIC_VISUAL_QA.md`
6. `qa/PUBLIC_DEPEG_DISPLAY_DECISION.md`
7. `qa/ISSUER_DISCLOSURE_FINAL_QA.md`
8. `qa/SOURCE_VERIFICATION_LOG.md`
9. `components/DATA_HEALTH_COMPONENT_SPEC.md`
10. `components/RESPONSIVE_CHART_SPEC.md`
11. `data/PUBLIC_DATA_CONTRACT.json`
12. `data/DATASET_REGISTRY.csv`
13. `data/METRIC_DICTIONARY.csv`
14. `data/SOURCE_MODE_DECISIONS.csv`
15. `visuals/CHART_SPEC.csv`
16. bilingual Content Masters
17. manifests

## Hard data rules

### Missing data
Never convert:
- null;
- missing key;
- failed request;
- rate limit;
- parse failure;
- unavailable credential;
- empty response

into numeric `0`.

A displayed zero must come from a valid source observation that explicitly equals zero.

### Timestamps
Keep separate:
- observation time;
- report-period end;
- publication date;
- collector/fetch time.

Do not display page-load time as if it were the observation time.

### Freshness
Use the frozen states:
- Live / fresh
- Delayed
- Last successful snapshot
- Report snapshot
- Unavailable
- Not applicable
- Unknown / to verify

Every data/chart module exposes:
source + observation/report date + freshness.

## `/dashboard`

At most 4–6 primary signals.

Use the approved signal specification.
Do not restore:
- 55-risk count;
- mechanism count;
- jurisdiction count;
- resource count;
- partner count

as market KPIs.

No depeg-event KPI.
No risk probability.
No depeg probability.

If a source is unavailable, show compact Data Health UI rather than a zero or empty full-height chart.

## `/market-data`

Treat this as the data-method map.

Explain:
- Market
- On-chain
- Issuers & reserves
- Macro
- Adoption

Do not turn it into a duplicate dashboard.

## `/market-data/market`

### Supply
Use:
`Tracked circulating value (USD)`

Do not rename the primary DefiLlama-derived measure to `market cap` unless the existing field semantics are explicitly verified.

### Price
V0.2 may show:
`Observed price deviation`

only when:
- target is verified;
- source is healthy;
- timestamp is valid.

Do not publicly show threshold-derived depeg event history.

### CEX
Selected pair/venue only.

Display:
- exchange
- pair
- timestamp
- spread
- bid depth within 2%
- ask depth within 2%
- simulated slippage
- explicit order side/notional

### DEX
Selected pool only.

Display:
- chain
- DEX
- pool
- pool liquidity
- 24h volume
- price

Never label DEX pool liquidity:
- `2% depth`
- `order-book depth`
- `executable slippage`

unless a separate route-level execution model actually supplies it.

## `/market-data/on-chain`

Keep distinct:
- supply by chain
- raw transfer volume
- adjusted transfer volume
- P2P transfer volume
- attributable payments

Do not stack raw/adjusted/P2P as additive categories.

Use:
`active addresses`
not:
`active users`.

Holder concentration remains hidden/HOLD.

Ethereum issuance is conditional on validated per-contract event semantics.

## `/market-data/issuers-reserves`

Primary visual:
issuer comparison table/cards.

Keep separate:
- report period
- publication date
- reserve composition
- assurance scope/type
- provider
- direct redemption eligibility
- limitations

Hard rule:
`Attestation does not mean financial-statement audit.`

Tether:
- Q2 2026 quarterly reserve attestation;
- 2025 annual KPMG financial-statement audit;
must remain separate rows/labels.

Circle:
dynamic reserve/circulation transparency may be used if the integration is reliable.
Do not hard-code the current 12 Oct 2026 values into page copy.

Paxos:
self-report and attestation remain separate.

FDUSD:
do not hard-code scraped reserve-composition percentages without report-level QA.

Do not create a reserve-quality ranking/score.

## `/market-data/macro`

Use real FRED series only.

Approved chart logic:
- SOFR + DGS3MO
- DGS3MO / DGS2 / DGS10
- broad USD
- VIX
- RRP
- optional normalized Asia FX

RRP stays separate due to different unit.

If Asia FX is normalized for visual comparison:
tooltip must retain the raw local-currency-per-USD value.

Do not write causal stablecoin conclusions from co-movement.

## `/market-data/adoption`

Keep three evidence classes separate:

1. Attributable payment research
2. On-chain activity
3. Issuer-reported activity

Artemis 2025 payment figures must display:
- Study period: Jan 2023–Aug 2025
- sample/coverage note
- Report snapshot badge

Do not call them:
- live 2026 payment volume
- total global stablecoin payment market

Do not add issuer-reported activity to Artemis sampled payments.

## Dynamic-source access rules

Follow `SOURCE_MODE_DECISIONS.csv`.

Do not invent API access or licensing.

If Artemis live API access is not already configured and permitted:
- keep report snapshot content;
- do not create a fake live Artemis chart.

If Etherscan holder PRO access/address labels are not available:
- keep holder concentration hidden.

## UI / responsive

Follow:
- `DATA_HEALTH_COMPONENT_SPEC.md`
- `RESPONSIVE_CHART_SPEC.md`
- `DYNAMIC_VISUAL_QA.md`

No static fake market curves are included in the package.
All time-series charts must use real project data integrations.

## Existing implementation

Reuse existing healthy collectors and data adapters where they satisfy this package.

Do not preserve old behaviour if it:
- maps errors to zero;
- loses timestamps;
- merges incomparable metrics;
- uses stale report data as current;
- hides source/freshness;
- renders large empty charts.

## Source UI

Use the site's established source tooltip/popover behaviour.

For dynamic modules show:
source + observation time + freshness.

For report modules show:
source/report + report period + publication date where relevant.

## Tests required

Add tests for at least:

1. null/missing/fetch error never renders numeric zero;
2. last-successful snapshot keeps its original observation time;
3. report snapshot never receives a live badge;
4. CEX and DEX metric labels remain distinct;
5. raw/adjusted/P2P/payment metrics are not summed;
6. active address is never labelled active user;
7. Tether attestation/audit remain separate;
8. no public depeg probability/event-history module;
9. holder concentration remains hidden;
10. Artemis report shows its dated sample period;
11. mobile retains source/unit/freshness;
12. existing Homepage/Research, Asia, Agentic and About routes regress cleanly.

## Completion report

Report:
- modified files;
- seven route status;
- live/report/conditional source integrations actually used;
- Data Health behaviour;
- missing-data/zero tests;
- issuer disclosure rendering;
- depeg/holder HOLD behaviour;
- responsive/mobile QA;
- all regression counts;
- typecheck;
- build;
- `git diff --check`;
- any access/license/config item requiring human action.

Do not commit, push or deploy unless separately instructed.
