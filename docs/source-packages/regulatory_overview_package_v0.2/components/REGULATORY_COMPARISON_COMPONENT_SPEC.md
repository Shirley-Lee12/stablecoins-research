# Regulatory Comparison Component Spec V0.2

## Desktop structure

The main comparison remains a table.

Sticky first two columns:
1. Jurisdiction
2. Current legal status

Scrollable comparison columns:
3. Primary instrument / stage
4. Issuer / authorisation
5. Reserve / asset protection
6. Redemption
7. Disclosure / AML / supervision
8. Critical boundary

Do not freeze all columns; preserve readable widths.

## Row header

Each row begins with:

`Jurisdiction`
`Status label`
`Current stage / key date`

Example:

United States
Enacted — not yet effective
Expected effective date: 18 Jan 2027 absent earlier final-rule trigger

The legal-stage label must be visible without opening a tooltip.

## Status labels

Public labels:

- In force
- Enacted — not yet effective
- Final rules — future commencement
- Implementation rulemaking
- Consultation
- Restrictive / prohibitive boundary

When two labels apply, use one combined natural-language status rather than two unrelated badges.

Example:
`Enacted · implementation rulemaking · not yet effective`

## Mobile

Do not show an 8-column squeezed table.

Use one expandable jurisdiction card per row:

Header:
- jurisdiction
- status
- key date/stage

Body:
- primary instrument
- issuer / authorisation
- reserves
- redemption
- supervision
- critical boundary
- official source links
- regional-detail deep link where available

All fields remain accessible.

## Filters

V0.2 does not need complex filters.

Optional lightweight filter:
- All
- In force
- Future / implementation
- Consultation
- Restrictive

No `best regulation`, `friendly`, `strict`, `mature` or investment-quality filters.

## Sorting

Default order is editorial, not score-based:
US → EU → UK → Hong Kong → Singapore → Japan → UAE → Mainland China.

Do not sort by colour/status as a ranking.

## Timeline

Use `CURRENT_REGULATORY_TIMELINE.json`.

Desktop:
vertical or compact horizontal timeline.

Mobile:
vertical timeline.

Every item:
date · jurisdiction · event type · what changed · source.

## Asia deep links

Only these rows use regional deep links:
- Hong Kong
- Singapore
- UAE
- Mainland China

Do not duplicate Asia page product detail inside `/regulatory`.

## International baseline

FSB / FATF / CPMI-IOSCO appears below the jurisdiction comparison.
These must be visually separate from country/jurisdiction rows.

Label:
`International standards and monitoring`

Not:
`Global regulator`.
