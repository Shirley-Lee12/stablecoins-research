# FINAL COPY QA｜Market Data + Dashboard V0.2

Date: 2026-10-16.

## Public terminology

Use:
- `Tracked circulating value (USD)` for the primary DefiLlama-derived size measure unless field-level implementation supports a more specific term.
- `Observed price deviation` for current price-vs-target difference.
- `Selected CEX liquidity` and `Selected DEX pools`.
- `Report snapshot` for dated report evidence.
- `Last successful snapshot` for failed-current-fetch fallback.

Avoid:
- `real-time market cap` when the field is not proven to be market cap;
- `global liquidity` from one exchange/pool;
- `payment volume` for generic on-chain transfers;
- `users` for blockchain addresses;
- `audit` for attestation/examination;
- `live adoption` for a dated research sample.

## British English

General site copy:
- `annualised`
- `normalised`
- `authorised` where used
- `organisation` in prose where appropriate

Official provider/document titles remain unchanged.

## Dashboard language

Preferred H1:
`Stablecoin signals worth checking today`

The page must remain modest about freshness:
different cards can have different observation times.

Do not write:
`Real-time overview of the stablecoin market`
unless every relevant source actually satisfies a defined real-time contract.

## Market page

Key sentence:
`Supply size, price stability and trading liquidity are different concepts.`

CEX label:
`Selected CEX pairs`

DEX label:
`Selected DEX pools`

Observed deviation:
not `depeg risk`.

## On-chain page

Key sentence:
`High on-chain transfer activity does not automatically imply high payment adoption.`

Always use:
`active addresses`
not:
`active users`.

## Issuers & reserves

Preferred H1:
`Compare disclosure scopes before comparing reserve numbers`

Required:
`Attestation does not mean financial-statement audit.`

Company financial results use:
`Company-level financial result`
and never:
`stablecoin profit`.

## Macro

Preferred H1:
`Macro data describe the environment; they do not establish stablecoin causality.`

Do not write causal copy from visual co-movement.

## Adoption

Preferred H1:
`Adoption evidence must identify who is using stablecoins, for what, and in what sample.`

Artemis report figures are always accompanied by:
- `Study period: Jan 2023–Aug 2025`
- report/sample scope.

Do not use `current stablecoin payments market` for those figures.

## No internal-working-language leakage

Public pages must not show:
- collector QA
- source registry
- READY_IF_COLLECTOR
- LICENSE_REQUIRED
- METHOD UNDER VALIDATION as an internal status code
- package / baseline / manifest terminology.

If a public method is unavailable, use natural-language UI such as:
`Historical depeg-event analysis is not currently published.`

Prefer omission over a large “coming soon” card.
