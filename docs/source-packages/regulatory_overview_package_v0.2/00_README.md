# Regulatory Overview｜Codex-ready Content & Evidence Package V0.2

Project: Stablecoin Research Hub
Baseline date: 2026-10-16
Status: READY_FOR_CODEX
ready_for_codex: true

## Scope

One route:
- `/regulatory`

## Page role

`/regulatory` answers:

> What is the current regulatory status of stablecoins in major jurisdictions, and what kind of legal instrument currently controls issuance, reserves, redemption and distribution?

It is **not**:
- the historical evolution page (`/about-stablecoins/regulatory-evolution`);
- a duplicate of Asia country pages (`/regional-developments/*`);
- a product/licence directory;
- legal advice.

## Core design rule

Regulatory status is not one binary field.

The page must distinguish:
- enacted law;
- regulation in force;
- final rule published but not yet effective;
- proposed rule;
- consultation;
- supervisory guidance;
- licence/register entry;
- restrictive/prohibitive boundary.

Never use `regulated`, `approved`, `in force`, or `licensed` interchangeably.

## Current comparison set

1. United States
2. European Union
3. United Kingdom
4. Hong Kong
5. Singapore
6. Japan
7. UAE — CBUAE onshore payment-token perimeter
8. Mainland China

The UAE row is deliberately scoped to the CBUAE onshore payment-token regime.
VARA / ADGM / DIFC detail remains in `/regional-developments/uae`.

## V0.2 construction status

The `/regulatory` route is ready for Codex implementation.

Frozen:
- eight-jurisdiction current-status matrix;
- legal-stage taxonomy;
- bilingual public copy;
- current regulatory timeline;
- authoritative source manifest;
- responsive table/card behaviour;
- source/date popover fields;
- final copy QA;
- same-day source verification.

No map-based regulatory score or country ranking is included.
