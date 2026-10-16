# CODEX HANDOFF｜Homepage + Research V0.2

STATUS: READY_FOR_CODEX

## Mission
Rebuild:
- `/`
- `/research`

using this package as the single source of truth.

These two pages should organise the wider Stablecoin Research Hub and accurately expose research maturity. They are not a new standalone topic section.

## Read first
1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `FINAL_COPY_QA.md`
4. `content/HOME_CONTENT_MASTER.zh-CN.md`
5. `content/HOME_CONTENT_MASTER.en.md`
6. `content/RESEARCH_CONTENT_MASTER.zh-CN.md`
7. `content/RESEARCH_CONTENT_MASTER.en.md`
8. `data/RESEARCH_STATUS.json`
9. `data/STATUS_LABELS.json`
10. `manifests/PAGE_MANIFEST.csv`
11. `manifests/SOURCE_MANIFEST.csv`
12. `visuals/VISUAL_QA.md`

## Existing website
The screenshot and old copy in `reference/` are context only.
Do not preserve old factual or research-status claims when they conflict with this package.
Do not recreate the existing homepage pixel-for-pixel.

## Identity
Keep:
- `Stablecoin Research Hub`
- `稳定币学术研究平台`

Use exactly:
`Sponsored by the Academy of Internet Finance (AIF), Zhejiang University.`

Do not infer endorsement of all conclusions, data ownership, regulatory approval or commercial authorization.

## Homepage priority
The homepage must lead with user value:
1. mechanisms;
2. regional real-world development;
3. agentic payments;
4. market/on-chain evidence;
5. research.

Do not lead with:
- team bios;
- unfinished research plans;
- resource-count KPIs;
- partner logos.

## Research-state rules
- 55 atomic risks = conceptual taxonomy, not 55 direct model nodes.
- TE/Hawkes = interim empirical results.
- stress/case analysis = research-stage results.
- validation remains in progress.
- monitoring/early warning remains planned.

Never publish:
- real-time depeg probability;
- real-time risk probability;
- a calibrated live risk score;
- a production-grade early-warning system;
- a deployed live TE/Hawkes engine.

## Completed public modules
Treat these as completed evidence modules and link to their existing approved local implementations:
- Agentic Payments V0.2
- Asia Stablecoin Development V0.2

Do not duplicate or rewrite their detailed content on the homepage.

## Frozen visuals
Use:
- `visuals/final/HOME-D01-research-hub-map.svg`
- `visuals/final/HOME-D02-research-maturity.svg`
- `visuals/final/RES-D01-research-pipeline-status.svg`
- `visuals/final/RES-D02-quantitative-research-map.svg`
- `visuals/final/RES-D03-taxonomy-to-measurement.svg`

You may implement responsive SVG/JSX derivatives, but do not change the research meaning.

## Source UI
Public/official claims with external sources should use the site's established source tooltip/popover pattern.
Internal research-status claims should not expose private local paths; they may display status labels without downloadable internal files unless separately approved.

## Language / theme
- preserve Chinese/English support;
- preserve light/dark theme;
- use the site's existing academic blue visual language;
- keep official titles/names intact.

## Completion report
After construction report:
1. files changed;
2. homepage/research modules implemented;
3. status labels preserved;
4. links to Agentic Payments/Asia modules;
5. test/typecheck/build results;
6. any content requiring human confirmation.

Do not commit, push or deploy unless separately instructed.
