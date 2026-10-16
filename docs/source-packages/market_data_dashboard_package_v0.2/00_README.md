# Market Data + Dashboard｜Codex-ready Data & Content Package V0.2

Project: Stablecoin Research Hub
Date: 2026-10-16
Status: READY_FOR_CODEX
ready_for_codex: true

## Scope

7 routes:
- `/dashboard`
- `/market-data`
- `/market-data/market`
- `/market-data/on-chain`
- `/market-data/issuers-reserves`
- `/market-data/macro`
- `/market-data/adoption`

## Core rule

These pages must be **data-first, not dashboard-looking**.

Every displayed number needs:
- a defined metric;
- a source;
- a unit;
- a timestamp / report period;
- a freshness state;
- an interpretation boundary.

Do not create a chart simply because a page has empty space.

## Critical distinctions

- tracked circulating value / supply ≠ trading volume ≠ transfer volume ≠ payment volume;
- CEX spread ≠ 2% order-book depth ≠ simulated slippage;
- DEX pool liquidity ≠ CEX order-book depth ≠ executable route liquidity;
- raw on-chain transfer volume ≠ adjusted transfer volume ≠ P2P volume ≠ payment volume;
- issuer reserve disclosure ≠ company financial statement;
- attestation ≠ financial-statement audit;
- report-period end ≠ publication date;
- reserve asset yield environment ≠ issuer's realised portfolio return;
- an application/use case ≠ observed adoption.

## Missing-data rule

Never convert unavailable data to `0`.

Allowed public states:
- LIVE / FRESH
- DELAYED
- LAST_SUCCESSFUL_SNAPSHOT
- REPORT_SNAPSHOT
- UNAVAILABLE
- NOT_APPLICABLE
- UNKNOWN / TO VERIFY

A source returning an empty field is not evidence of a zero economic value.

## V0.2 construction status

The seven routes are ready for Codex implementation.

Frozen:
- data metric contract;
- zero/missing/freshness rules;
- source modes;
- Dashboard signal set;
- chart/component semantics;
- responsive chart rules;
- issuer disclosure baseline;
- public depeg-display decision;
- bilingual copy and visual QA.

Important:
No static/fake market charts are included. Dynamic charts must render from real existing data integrations or show a compact unavailable/last-successful state.
