# Resources / Researchers UI Spec V0.2

## `/academic-resources`

### Desktop
Top:
- H1 + concise scope
- keyword search
- theme chips (scroll/wrap)
- filter row

Results:
- compact vertical resource list, not giant equal-height cards
- title is primary
- metadata line: year · evidence type · venue/institution
- authors
- 2–4 theme tags maximum visible
- access / DOI / official-source actions
- optional one-sentence `Why relevant`

Sidebar-style type-count wall is removed.

### Mobile
- search always visible
- filters open in sheet/drawer
- theme chips horizontally scroll
- resource result remains full-width
- DOI/source actions accessible by tap

Do not hide evidence type or year.

## `/experts`

Public H1:
`Researchers & Institutions`

### Researcher result
Desktop grid/list may show:
- name
- role
- institution
- research focus
- 1–3 representative stablecoin resources
- verified date
- profile/source

No headshot requirement.
Do not scrape or copy profile images unless image rights/use are explicitly approved.

### Institution aggregation
Use compact text cards/list:
- institution
- type/location
- researchers represented
- themes represented

This is a navigation summary, not a logo wall.

Do not scrape logos.

### Mobile
One researcher card per row.
Representative works remain visible as links.

## Counts

If directory query succeeded:
`20 public resources` is allowed only if 20 records truly match approved query.

If database failed:
show unavailable state, no `0`.

## Empty states

Use `EMPTY_STATE_SPEC.json`.

## Source links
Open original publication/profile in new tab.
For DOI records, DOI and publication source may both be available; do not duplicate visually if they resolve to same destination.

## Visual language
Reuse existing academic-blue site system.
Avoid:
- KPI dashboard styling
- trophy/ranking visuals
- gold stars
- citation badges as prestige
- institutional logo wall
