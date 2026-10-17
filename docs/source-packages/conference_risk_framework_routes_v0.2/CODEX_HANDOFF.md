# CODEX HANDOFF｜Conference Study Risk Framework Routes V0.2

STATUS: READY_FOR_CODEX

## STOP / INVALIDATION NOTICE

Do NOT use:
`Quantitative_Research_Codex_Ready_Package_V0.2.zip`

That package is invalid because it incorrectly imported the user's master's-thesis research into the separate Stablecoin Research Hub website project.

This package supersedes it.

## Mission

Rebuild the existing routes:

- `/quantitative`
- `/quantitative/dimension-a`
- `/quantitative/dimension-b`

using ONLY the website conference study:

`Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins`

The URLs remain for compatibility, but the public content is no longer a quantitative-risk-product section.

## Read first

1. `00_README.md`
2. `01_WEBSITE_THESIS_BOUNDARY.md`
3. `PACKAGE_STATUS.md`
4. `qa/FINAL_BOUNDARY_QA.md`
5. `components/RISK_FRAMEWORK_COMPONENT_SPEC.md`
6. `content/CONTENT_MASTER.zh-CN.md`
7. `content/CONTENT_MASTER.en.md`
8. `data/CONFERENCE_STUDY_STATUS.json`
9. `data/LIFECYCLE_MAPPING.csv`
10. `data/AMPLIFICATION_MAPPING.csv`
11. `data/RISK_MODULES.csv`
12. `data/FUTURE_RESEARCH_ROADMAP.csv`
13. manifests

## Project boundary — absolute

Stablecoin Research Hub != master's thesis.

Website research result:
the conference study only.

Do NOT import or preserve on these routes:
- Transfer Entropy results
- conditional TE
- Hawkes results
- TE–Hawkes matched comparison
- thesis risk nodes N01–N13 / E1 / E2
- thesis stress-test results
- thesis historical case analysis
- thesis systemic-network proxy
- thesis empirical sample dates/counts
- thesis predictive-validation statistics

If any of these currently appear because the invalid package was partially applied, remove them.

## Public titles

`/quantitative`

Stablecoin Risk Framework
稳定币风险框架

`/quantitative/dimension-a`

Lifecycle Mapping (T0–T3)
生命周期映射（T0–T3）

`/quantitative/dimension-b`

Amplification & Transmission Mapping (L0–L3)
放大与传导映射（L0–L3）

Do not use:
Quantitative Indicators / 量化指标
Dimension A
Dimension B
as primary public headings.

## `/quantitative`

Current study must show:

- 55 atomic risks in the submitted framework
- risk decomposition methodology
- seven presentation-level risk modules
- T0–T3 lifecycle dimension
- L0–L3 amplification & transmission dimension

Atomic-risk wording:

`Atomic risk = the minimum useful risk unit for identification and measurement in this framework.`

Also state:

`Atomic does not mean causally or statistically independent.`

## Seven modules

Use only the package data.

They are:
- M1 Backing Assets & Balance Sheet
- M2 Issuer Transparency, Legal Structure & Custody
- M3 Fiat Settlement, Regulation & Redemption
- M4 Secondary Markets, Token Holders & Confidence
- M5 Technical Infrastructure, Code, Cryptography & Information
- M6 Governance & Privileged Control
- M7 DeFi Integration, On-Chain Markets & Endogenous Mechanisms

Hard wording:
`Presentation-level organisation of the submitted framework — not a new formal taxonomy.`

## Do NOT invent the complete 55-risk list

The conference material confirms 55 atomic risks, but this package only carries representative risks that are explicitly shown in the conference presentation.

Do not fabricate the remaining names.
Do not backfill them from the master's thesis.
Do not infer them from old drafts unless separately authorised.

## `/quantitative/dimension-a`

Public content:
Lifecycle Mapping (T0–T3)

T0:
Foundation, Backing & Issuance

T1:
Circulation, Trading & Settlement

T2:
Protocol Embedding & Layered Finance

T3:
Redemption, Deleveraging & Liquidation

Use representative risks only from:
`data/LIFECYCLE_MAPPING.csv`.

Critical T1/T2 boundary:

`Protocol embedding — not simply being on-chain or being in DeFi — is the boundary.`

A DEX trade can remain T1.
Lending/collateral/LP/other layered positions belong to T2.

Do not imply:
- T0→T3 is a deterministic causal sequence
- higher T = higher risk
- T is a severity score

## `/quantitative/dimension-b`

Public content:
Amplification & Transmission Mapping (L0–L3)

L0:
Initial Trigger

L1:
Structural Vulnerability

L2:
Dynamic Amplification

L3:
Cross-System Transmission / Outcomes

Use representative risks/outcomes only from:
`data/AMPLIFICATION_MAPPING.csv`.

Critical distinctions:

L0 != L1
trigger vs pre-existing susceptibility

L1 != L2
structural condition vs activated amplification process

T0 != L1
lifecycle location vs causal role

T3 != L3
exit/unwind stage vs cross-system propagation

L3 outcomes:
- other stablecoins
- DeFi protocols
- broader crypto markets
- traditional financial markets

Do not draw measured transmission weights.

## Current study vs future research

This separation must be prominent.

CURRENT STUDY:
- 55 atomic risks
- T0–T3 lifecycle mapping
- L0–L3 amplification/transmission mapping
- decomposition methodology

FUTURE RESEARCH:
- risk-specific indicator sets
- composite measures where appropriate
- quantify transmission and amplification
- dynamic monitoring
- stress detection
- early warning
- regulatory coverage mapping
- blind-spot identification
- regulatory optimisation recommendations

All future items must visibly say:
`Future research`

Do not say:
- model calibrating
- coming Q3
- live beta
- current monitoring
- current early warning
- current quantified transmission

## Remove unsupported old product claims

Ensure zero public occurrences of:

- real-time depeg probability
- stablecoin depeg risk index
- model calibration in progress
- 2024 Q3 release
- international payment gateway cooperation
- anonymous flow-rate metrics
- live risk score

## Visual implementation

Allowed:
- system → modules → atomic risks → two-dimensional mapping diagram
- T0–T3 lifecycle band
- L0–L3 causal-role chain
- Current Study vs Future Research table
- representative-risk lists

Forbidden:
- TE/Hawkes graph
- probability gauge
- risk score
- transmission coefficient
- model performance chart
- stress-test time series
- fake quantitative chart
- live refresh indicator

## Navigation

Use lightweight internal nav:

Risk Framework
Lifecycle Mapping
Amplification & Transmission

Keep route URLs unchanged unless separately instructed.

## Regression boundary

Do not modify research conclusions on:
- `/research`
- About
- Asia
- Agentic
- Market Data
- Regulatory
- Academic Resources / Researchers

except for necessary link/nav integration.

If `/research` currently contains master's-thesis TE/Hawkes/stress/case claims from an earlier incorrect rebuild, DO NOT silently fix them in this task. Report them explicitly as a cross-page research-boundary issue requiring a separate correction.

This is important:
the user has clarified that the website's own research output is only the conference study.

## Tests

Add at minimum:

1. no TE content on the three routes
2. no Hawkes content
3. no thesis N-node labels
4. no thesis stress/case results
5. no real-time depeg probability
6. no model-calibration / Q3 2024 copy
7. no payment-gateway cooperation claim
8. public title = Stablecoin Risk Framework
9. dimension-a title = Lifecycle Mapping
10. dimension-b title = Amplification & Transmission Mapping
11. 55 atomic risks shown as submitted framework
12. atomic != causal/statistical independence
13. T0–T3 labels exact
14. T1/T2 boundary exact
15. L0–L3 labels exact
16. T0 != L1 and T3 != L3 distinction present
17. quantification/monitoring/early warning are labelled Future Research
18. no fabricated full 55-risk list
19. mobile retains current-vs-future distinction
20. previous approved local baselines regress cleanly

## Completion report

Report:
- modified files
- three-route implementation
- any master's-thesis content removed from these routes
- current-study vs future-research presentation
- T0–T3 rendering
- L0–L3 rendering
- whether `/research` or other already-approved pages currently contain thesis-derived website claims that conflict with the user's clarified boundary
- tests/full regression
- typecheck
- build
- `git diff --check`
- scientific/content issues requiring user decision

Do not commit.
Do not push.
Do not deploy Render.
