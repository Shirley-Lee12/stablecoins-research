# Database Reconciliation Protocol V0.1

## Objective

Preserve existing approved/public data while safely reconciling the V0.2 curated seed set.

## Before any import

Codex must inspect the local database/schema and report, without exposing private account/submission content:

### Resources
- total records
- public/approved count
- pending/private count as COUNT ONLY
- archived/rejected count as COUNT ONLY where schema supports it
- records with DOI
- records with canonical URL
- records without both DOI and canonical URL

### Researchers/authors
- total author/profile records
- public profiles
- linked public-resource authors
- duplicate-name candidates

Do not output private submission text, account identifiers or unpublished material.

## Resource deduplication order

1. DOI exact match, normalised lowercase without `https://doi.org/`
2. canonical source URL exact match after safe normalisation
3. title + year + first-author normalised match
4. manual review

Never use title alone to automatically overwrite.

## Researcher identity matching

1. ORCID exact match if present
2. official profile URL
3. full name + current/verified institution
4. publication-author relationship + manual review

Do not merge people on name similarity alone.

## Import mode

Curated seed records are:
`PUBLIC_SEED_CANDIDATE`

They are not automatically authoritative replacements for existing records.

For each seed:
- MATCH_EXISTING → enrich only missing public fields, preserve user/editor fields
- NEW → create as approved public seed only if schema/workflow permits
- CONFLICT → do not overwrite; create reconciliation report
- PRIVATE/PENDING_MATCH → do not expose or overwrite; report count/conflict only

## Existing submissions

Do not:
- delete;
- publish;
- approve;
- reject;
- modify ownership;
- alter moderation state

unless separately instructed.

## Counts

Public result counts must be computed from the same public/approved query used to render results.

Do not display:
- all DB rows as public count;
- pending/private records in public count.

## Export failure vs empty result

### QUERY_SUCCESS + 0 approved matches
Display:
`No approved public records match these filters.`

### QUERY_FAILURE / DB unavailable
Display:
`The public research directory is temporarily unavailable.`

Never display query failure as:
`0 resources`
or
`0 researchers`.
