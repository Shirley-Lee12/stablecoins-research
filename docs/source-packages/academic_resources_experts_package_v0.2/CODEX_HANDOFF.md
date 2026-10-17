# CODEX HANDOFF｜Academic Resources + Researchers & Institutions V0.2

STATUS: READY_FOR_CODEX

## Mission

Rebuild:
- `/academic-resources`
- `/experts`

as a database-backed research library and verified researcher/institution directory.

## Read first
1. `00_README.md`
2. `PACKAGE_STATUS.md`
3. `01_CURRENT_PAGE_AUDIT.md`
4. `data/DB_RECONCILIATION_PROTOCOL.md`
5. `components/DB_RECONCILIATION_IMPORT_SPEC.md`
6. `qa/FINAL_CONTENT_DATA_QA.md`
7. `components/DIRECTORY_UI_SPEC.md`
8. `data/RESOURCE_TAXONOMY.json`
9. `data/RESEARCHER_INCLUSION_POLICY.md`
10. `data/SEARCH_FILTER_SPEC.json`
11. `data/EMPTY_STATE_SPEC.json`
12. seed candidate CSVs
13. bilingual Content Masters
14. manifests

## First action: inspect existing database

Before data mutation, report counts only:
- resource total / public-approved / pending-private / archived-rejected if schema supports;
- researcher/author total / public / linked to public resources;
- duplicate candidates.

Do not expose private submission/account content.

The old public export showed zero. Do NOT infer database emptiness from it.

## Reconciliation

Resources:
1. DOI
2. canonical URL
3. title + year + first author
4. manual conflict

Researchers:
1. ORCID
2. official profile
3. full name + verified institution
4. public publication relationship

No fuzzy-name automatic merge.

Seed candidates are additive/reconciliation inputs, not replacements.

Do not:
- delete existing records;
- change pending/private moderation status;
- publish private submissions;
- overwrite editor/user summaries;
- alter ownership.

If a conflict cannot be safely reconciled, preserve both states and report it.

## `/academic-resources`

Public title:
`Stablecoin Research Library`
`稳定币研究资源库`

Primary discovery:
research question/theme, then evidence type.

Search:
title / author / venue or institution / theme / keyword.

Filters:
theme / evidence type / year / language / access / author / institution.

Default sort:
newest year first.

Do not restore a wall of zero type-count cards.

Evidence classes remain explicit.
News/commentary may exist but is not a default academic-evidence class.

Resource cards:
title / authors / year / evidence type / venue / themes / access / DOI or official source / concise relevance note.

Do not copy long abstracts.

## `/experts`

Route remains `/experts`.

Public title changes to:
`Researchers & Institutions`
`研究者与机构`

This is not an expert ranking.

Profile requires verified directly stablecoin-focused work represented in the public library.

Show:
name / role / institution / research focus / representative stablecoin resources / verification date / official profile-source.

If only publication-time affiliation is verified, label it.

Default sort:
recently verified.

Secondary:
name A-Z.

Do not default to article count.
If count is shown, label:
`Resources in this library`
not total publications.

## Institutions

Aggregate only from verified public researcher/resource records.

Do not call institutions:
top / leading / partner / strategic partner
without separate evidence.

Do not scrape logos/headshots.

## Empty/error state

Successful query + no matches:
show a zero-match message.

DB/query failure:
show temporarily unavailable.

Never render DB failure as:
`0 resources`
or
`0 experts`.

## Tests

At minimum:
1. failed DB query does not show factual zero;
2. public counts exclude pending/private;
3. seed DOI match does not duplicate;
4. URL match does not duplicate;
5. fuzzy researcher name does not auto-merge;
6. private/pending records are not published;
7. default expert sort is not article count;
8. public page contains no ranking language;
9. publication-time affiliation is not labelled current;
10. mobile filters/results retain evidence type/source;
11. existing six local baselines regress cleanly.

## Completion report
- existing DB counts (safe counts only);
- reconciliation summary: matched/new/conflict/private-match;
- modified files;
- two-route implementation;
- actual public record counts after reconciliation;
- responsive QA;
- tests/full regression;
- typecheck/build/git diff --check;
- any conflict requiring user decision.

Do not commit, push or deploy.
