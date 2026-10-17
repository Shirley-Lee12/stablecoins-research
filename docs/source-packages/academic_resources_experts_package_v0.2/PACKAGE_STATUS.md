# PACKAGE_STATUS V0.2

status: READY_FOR_CODEX
ready_for_codex: true
baseline_date: 2026-10-16

## Scope
- `/academic-resources`
- `/experts`

## Critical rule
The old public export's `0 resources / 0 experts` is not evidence that the underlying database is empty.

## Public titles
- Stablecoin Research Library / 稳定币研究资源库
- Researchers & Institutions / 研究者与机构

## Seed candidates
- 20 public resource candidates
- 10 researcher candidates
- 10 institution aggregation candidates

These must be reconciled non-destructively with existing local records.

## Frozen behaviour
- inspect DB before mutation
- public counts use approved/public query only
- pending/private content remains private
- DOI > canonical URL > title/year/author for dedup
- researcher identity uses ORCID/profile/institution/publication links; no fuzzy-name auto merge
- failed DB query != factual zero
- news/commentary not default-highlighted
- no expert/institution ranking
- no default article-count sorting
- institution representation != partnership/endorsement

## Handoff
Use only the V0.2 ZIP.
Do not separately import V0.1.
