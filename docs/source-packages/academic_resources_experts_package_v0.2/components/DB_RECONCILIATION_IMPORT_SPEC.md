# DB Reconciliation & Seed Import Spec V0.2

## Phase 0 — inspect, do not mutate

Before changing data, report counts only:
- resources total / approved-public / pending-private / archived-rejected where schema supports;
- researchers/authors total / public / linked-to-public-resource;
- duplicate candidates.

Never expose private submission content or account data.

## Phase 1 — schema mapping

Map existing fields to V0.2 concepts:
- publication status / visibility
- title
- authors
- year/date
- type
- language
- DOI
- canonical URL
- venue/institution
- tags/themes
- author relationships
- institution
- moderation state

Prefer adapters over destructive migrations when possible.

## Phase 2 — seed dry-run

For each resource seed:

1. DOI exact-normalised match
2. canonical URL match
3. normalised title + year + first author
4. manual conflict

Output one of:
- MATCH_EXISTING
- NEW_PUBLIC_SEED
- CONFLICT_REVIEW
- PRIVATE_OR_PENDING_MATCH

For each researcher:
1. ORCID if available
2. official profile URL
3. full name + verified institution
4. linked publication identity

Never merge on fuzzy name alone.

## Phase 3 — safe write

Allowed:
- create genuinely new public seed records if existing workflow permits;
- enrich missing non-editorial metadata on matched approved records;
- attach source URL / DOI / themes where absent;
- create public researcher-resource relationships.

Not allowed:
- change moderation state of pending/private records;
- overwrite user/editor summaries;
- delete records;
- merge conflicts automatically;
- publish private submissions;
- change ownership.

## Phase 4 — public queries

Public count = exact same approved/public query as results.

A query failure must not return numeric zero.

## Seed provenance

Every newly created record gets:
`seed_origin = ACADEMIC_RESOURCES_EXPERTS_V0_2_2026_10_16`

This is operational metadata only; do not show it publicly.

## Conflict report

If conflicts exist, write a local reconciliation report with:
- seed ID
- matched existing ID
- conflict field
- no private content beyond safe record identifiers/title

Conflicts are non-destructive and may require user review.
