# CODEX HANDOFF｜Regulatory Overview V0.2

STATUS: READY_FOR_CODEX

## Mission

Rebuild `/regulatory` as the current stablecoin regulatory-status comparison page.

This is a targeted factual/status rebuild, not a new global navigation section.

## Read first

1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `01_CURRENT_PAGE_AUDIT.md`
4. `qa/FINAL_COPY_QA.md`
5. `qa/SOURCE_VERIFICATION_LOG.md`
6. `components/REGULATORY_COMPARISON_COMPONENT_SPEC.md`
7. `components/SOURCE_DATE_UI_SPEC.md`
8. `data/REGULATORY_STATUS_TAXONOMY.json`
9. `data/CURRENT_REGULATORY_TIMELINE.json`
10. `matrices/JURISDICTION_MATRIX.csv`
11. `manifests/SOURCE_MANIFEST.csv`
12. bilingual Content Masters
13. `visuals/VISUAL_INTERACTION_PLAN.md`

## Hard content rule

Regulatory status is not binary.

Keep separate:
- enacted law;
- current regulation;
- final rule with future commencement;
- proposed rule / implementation rulemaking;
- consultation;
- guidance;
- register/licence;
- restrictive/prohibitive boundary.

Do not use:
`regulated / approved / licensed / in force`
as interchangeable terms.

## Jurisdiction statuses — frozen

### United States
Public status:
`Enacted — implementation rulemaking — not yet effective`

GENIUS Act:
- enacted 18 Jul 2025;
- expected effective 18 Jan 2027 absent earlier final-rule trigger.

Do not show:
`In force since 2025`.

### European Union
Public status:
`MiCA in force / applicable`

ART/EMT provisions apply.
2026 review does not suspend current MiCA.

### United Kingdom
Public status:
`Final rules published — full commencement 25 October 2027`

FCA final stablecoin rules were published 30 Jun 2026.

Do not retain the old copy:
`final rules pending`.

### Hong Kong
Public status:
`Issuer regime in force — licensed issuers exist`

Current register:
- Anchorpoint Financial Limited — FRS01 — effective 10 Apr 2026
- HSBC — FRS02 — effective 10 Apr 2026

Hard boundary:
issuer licence != token public launch.

Deep link:
`/regional-developments/hong-kong`

### Singapore
Public status:
`Implementation consultation — dedicated MAS-SCS regime not yet in force`

Consultation:
1 Sep 2026 → 16 Oct 2026.

Do not call existing DPT/MPI products:
`MAS-regulated stablecoins`
under the dedicated future framework unless a new official source later proves that status.

Deep link:
`/regional-developments/singapore`

### Japan
Public status:
`Electronic Payment Instrument regime in force`

Use Japanese statutory terminology.
Do not invent a generic single stablecoin licence.

### UAE
Public status:
`CBUAE onshore Payment Token Services Regulation in force`

Hard boundary:
this is the CBUAE onshore perimeter only.

Do not collapse VARA / ADGM / DIFC into this row.

Deep link:
`/regional-developments/uae`

### Mainland China
Public status:
`Restrictive / prohibitive boundary`

Current primary baseline:
银发〔2026〕42号, 6 Feb 2026.

Do not use the superseded 2021 notice as the current controlling baseline.

Deep link:
`/regional-developments/mainland-china`

## Page structure

1. Hero + last-verified date + concise legal-research disclaimer
2. Legal-status legend
3. Eight-jurisdiction comparison
4. Current regulatory changes timeline
5. Convergence vs divergence
6. International standards and monitoring
7. source access

Do not re-add About Stablecoins top navigation here.
`/regulatory` is a standalone site-level route.

## Comparison UI

Desktop:
table.

Mobile:
expandable jurisdiction cards.

Do not use an unreadable horizontally compressed mobile table.

Status is conveyed in text.
Colour is secondary.

No:
- friendliness score
- maturity score
- strictness score
- safety ranking
- country leaderboard.

## Source/date UI

Use existing website source tooltip/mobile popover pattern.

Expose:
- authority;
- document title;
- instrument type;
- publication date;
- effective/commencement date when different;
- last verified;
- official link.

Do not collapse all dates into one generic date.

## Timeline

Render from:
`CURRENT_REGULATORY_TIMELINE.json`

Each item:
date + jurisdiction + event type + what changed + source.

No logo-only timeline.

## International section

Keep FSB, FATF and CPMI-IOSCO outside the jurisdiction matrix.

Label:
`International standards and monitoring`

Do not call them:
`global regulator` or `global law`.

## Reuse / boundaries

The current old page may be used only as layout/reference context.
V0.2 facts/status/copy override old content.

Do not modify:
- `/about-stablecoins/regulatory-evolution`
- regional detail page research conclusions
except for necessary link integration.

## Tests

Add tests for at least:
1. US not labelled in force.
2. UK final rules not labelled pending.
3. UK full commencement = 25 Oct 2027.
4. Singapore not labelled in force.
5. Singapore consultation date remains 16 Oct 2026.
6. Hong Kong licence != product launch wording.
7. Mainland baseline uses 银发〔2026〕42号.
8. UAE row explicitly says CBUAE/onshore.
9. international standards are outside jurisdiction rows.
10. mobile retains all comparison fields.
11. source UI distinguishes publication/effective/licence/consultation dates.
12. existing Homepage/Research, About, Asia, Agentic and Market Data regress cleanly.

## Completion report

Report:
- modified files;
- `/regulatory` implementation;
- desktop/mobile comparison behaviour;
- status labels;
- timeline;
- official source UI;
- tests/regression;
- typecheck;
- build;
- `git diff --check`;
- any current-status issue requiring human judgment.

Do not commit, push or deploy.
