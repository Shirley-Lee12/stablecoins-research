# PACKAGE_STATUS V0.2

status: READY_FOR_CODEX
ready_for_codex: true
baseline_date: 2026-10-16

## Scope
One route:
- `/regulatory`

## Page role
Current legal-status comparison across major jurisdictions.

Not:
- regulatory-history page;
- legal advice;
- Asia product-detail duplicate;
- country ranking.

## Frozen jurisdiction set
- United States
- European Union
- United Kingdom
- Hong Kong
- Singapore
- Japan
- UAE — CBUAE onshore payment-token perimeter
- Mainland China

## Frozen P0 status corrections
- US: enacted + implementation rulemaking; not yet effective.
- EU: MiCA in force/applicable.
- UK: FCA final rules published; full commencement 25 Oct 2027.
- Hong Kong: issuer regime in force; current register has two licensees effective 10 Apr 2026.
- Singapore: implementation consultation; dedicated MAS-SCS regime not yet in force.
- Japan: Electronic Payment Instrument regime in force.
- UAE CBUAE: Payment Token Services Regulation in force.
- Mainland China: current restrictive/prohibitive baseline is 银发〔2026〕42号.

## International baseline
- FSB 2023 recommendations
- FSB 12 Oct 2026 monitoring note
- FATF Mar 2026 targeted stablecoin/P2P report
- CPMI-IOSCO 2022 PFMI guidance

## UI frozen
- primary desktop visual = comparison table
- mobile = expandable jurisdiction cards
- status text mandatory; colour secondary
- current timeline data-driven
- source/date popovers use exact instrument type and dates
- no regulatory-friendliness or safety ranking
- no primary world map

## Handoff
Send only the V0.2 ZIP to Codex.
Do not separately send V0.1.
