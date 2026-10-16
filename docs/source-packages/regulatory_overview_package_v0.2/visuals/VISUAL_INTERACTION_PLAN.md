# Regulatory Overview｜Visual & Interaction Plan V0.1

## Principle

The page should help users compare **legal status and regulatory substance**.

Do not use a coloured world map as the primary visual.
A map compresses complex legal stages into a misleading colour.

Primary visual order:
1. status legend;
2. jurisdiction comparison table;
3. dated current-change timeline;
4. convergence/divergence summary.

## REG-T01｜Status legend

Compact horizontal legend.

Public labels:
- In force
- Enacted — not yet effective
- Final rules — future commencement
- Implementation rulemaking
- Consultation
- Restrictive / prohibitive boundary

Do not create a single green/yellow/red maturity score.

Each status opens a short definition on hover/focus/tap.

## REG-T02｜Jurisdiction matrix

Desktop columns:
- Jurisdiction
- Current legal status
- Primary instrument
- Issuer / authorisation
- Reserves / asset protection
- Redemption
- Disclosure / AML / ongoing supervision
- Critical boundary

First visible line in each row:
`Status · as-of date`

Asian rows may include a small deep-link:
`Regional detail →`

Do not duplicate the full Asia product/regulatory pages.

### Mobile

Do not horizontally compress eight regulatory columns into unreadable text.

Use jurisdiction accordion/cards:
- jurisdiction + status
- current stage/date
- issuer
- reserves
- redemption
- supervision
- critical boundary
- official sources
- regional detail link when applicable

All fields remain available.

## REG-T03｜Current-change timeline

Data source:
`data/CURRENT_REGULATORY_TIMELINE.json`

Use event-type labels:
- Law enacted
- In force
- Final rule
- Proposed rule
- Consultation
- Register/licence
- Restrictive boundary
- International monitoring

Every item displays:
- exact date;
- jurisdiction;
- what changed;
- source.

Do not use logos as the timeline content.

## Source UI

Important status/date claims use existing source tooltip / mobile popover.

For jurisdiction rows:
prefer one small superscript/source control at the relevant statement rather than a bibliography wall.

The source detail should show:
- regulator / authority;
- document;
- date;
- instrument type;
- last verified;
- external link.

## Status colour

Colour is secondary.
Text label is mandatory.

Do not imply:
- `consultation = bad`;
- `in force = safe`;
- `restrictive = high risk`.

Status describes legal implementation stage, not investment quality.

## Current-date banner

Top of comparison:
`Regulatory status last verified: 16 October 2026`

This is a research verification date, not a guarantee that no regulator changed a rule later that day.

## No regulatory scoring

V0.1/V0.2 must not produce:
- regulatory friendliness score;
- regulatory quality ranking;
- stablecoin safety score;
- country leaderboard.
