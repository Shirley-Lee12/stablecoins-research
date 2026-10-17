# Risk Framework Route Component Spec V0.2

## Shared internal navigation

All three routes use:
- Risk Framework
- Lifecycle Mapping
- Amplification & Transmission

Do not show:
- Quantitative Indicators
- Dimension A
- Dimension B

as the primary public labels.

## `/quantitative`

### RF-D01 — Decomposition flow

Use a conceptual flow:

Stablecoin System
→ Risk Modules
→ Atomic Risk Units
→ Two-Dimensional Mapping

Then branch:
- Lifecycle Dimension (T0–T3)
- Amplification & Transmission Dimension (L0–L3)

Future research sits after the mapping layer:
- quantification
- dynamic monitoring
- regulatory coverage evaluation

Do NOT place future research in the same visual state as completed study outputs.

### Atomic-risk callout

Prominent:
`55 atomic risks in the submitted framework`

Directly below:
`Atomicity means the minimum useful unit for identification and measurement — not causal or statistical independence.`

### Risk modules

Show the seven presentation-level modules as a structured list/grid.

Do not call them a newly revised taxonomy.
Use:
`Presentation-level organisation of the submitted framework.`

### Current vs future

Use a clear two-column or two-stage component.

Current study:
- 55 atomic risks
- T0–T3
- L0–L3
- risk decomposition methodology

Future research:
- quantification
- monitoring
- early warning
- regulatory coverage evaluation

Future items must be visually labelled FUTURE RESEARCH.

## `/quantitative/dimension-a`

### T0–T3

Prefer a left-to-right lifecycle band on desktop:
T0 → T1 → T2 → T3

Mobile:
vertical sequence.

Each stage shows:
- stage name
- concise operational meaning
- representative risks

Do not imply chronological certainty or severity ranking.

### T1/T2 boundary

This distinction must be visible:
`Protocol embedding — not merely being on-chain or in DeFi — is the boundary.`

A DEX trade can remain T1.
Lending/collateral/LP/layered positions belong to T2.

## `/quantitative/dimension-b`

### L0–L3

Use:
L0 Initial Trigger
→ L1 Structural Vulnerability
→ L2 Dynamic Amplification
→ L3 Cross-System Transmission / Outcomes

This is a conceptual causal-role chain, not an empirically estimated causal network.

### L3

Render the outward outcomes as:
- other stablecoins
- DeFi protocols
- broader crypto markets
- traditional financial markets

Do not draw measured weights, probabilities or transmission coefficients.

## No fake quantitative visualisation

Forbidden:
- numeric risk scores
- probability gauges
- transmission coefficients
- TE/Hawkes networks
- stress curves
- model accuracy
- live refresh indicators

because none are outputs of the current website conference study.

## Mobile / dark

Use existing site academic visual language.
No horizontal overflow at 320px.
All representative-risk text remains readable.
