# Regulatory Source & Date UI Spec V0.2

## Principle

Regulatory claims are date-sensitive.
Every row must make clear:
- what changed;
- when;
- what type of instrument it is;
- whether it is currently binding.

## Source popover fields

Desktop hover/focus and mobile tap:

- Authority
- Document title
- Instrument type
- Publication / effective date
- Last verified
- Open official source

## Instrument labels

Use these public labels:

LAW
REGULATION
FINAL RULE
PROPOSED RULE
CONSULTATION
GUIDANCE
REGISTER
POLICY FRAMEWORK
NOTICE
INTERNATIONAL STANDARD
MONITORING REPORT

Do not label:
- consultation as regulation;
- policy framework as law;
- register entry as regulatory approval of every product;
- guidance as statute.

## Date semantics

Keep distinct:

### Enactment / publication date
When a law/rule/document was made or published.

### Effective / commencement date
When binding obligations apply.

### Licence effective date
When a named licence becomes effective.

### Consultation closing date
Deadline for comments, not an effective date.

### Last verified
When this website last re-checked the status.

Never collapse these into one generic `Date`.

## Singapore edge case

As of the V0.2 baseline:
consultation closes 16 Oct 2026 at 11.59 PM Singapore time.

The page should display:
`Implementation consultation`
not:
`Regime effective`.

## US edge case

GENIUS Act enactment date:
18 Jul 2025.

Expected effective date:
18 Jan 2027 absent earlier final-rule trigger.

The page must not show:
`Effective 2025`.

## UK edge case

FCA final rule publication:
30 Jun 2026.

Full commencement:
25 Oct 2027.

The page must not show:
`UK regime in force 2026`.

## Hong Kong edge case

Issuer regime effective:
1 Aug 2025.

Named issuer licences effective:
10 Apr 2026.

Do not infer token public launch from the register.

## Current verification banner

At top of page:
`Regulatory status last verified: 16 October 2026`

Chinese:
`监管状态最后核验：2026年10月16日`

This is a research verification date, not a legal guarantee.
