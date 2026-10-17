# FINAL CONTENT / DATA QA V0.2

## Database boundary
- public-export zero is not treated as database emptiness;
- private/pending data is never exposed or auto-published;
- seed imports are non-destructive;
- DOI/URL identity precedes title matching.

## Resource metadata
20 seed candidates have:
- stable ID
- title
- authors
- year
- evidence type
- venue/series
- research themes
- method/evidence descriptor
- language
- access label
- canonical source
- relevance note

Corrections frozen:
- RES-003 authors: Kanis Saengchote; Krislert Samphantharak.
- RES-007 authors: Olli Castren; Riccardo Russo.
- RES-007 DOI: 10.1016/j.econlet.2025.112720.

## Researcher metadata
10 seed candidates are directory candidates, not ranked experts.

Current affiliation verification strength remains visible internally:
- official institutional profile;
- official author profile;
- current publication affiliation.

Do not publicly call publication-time affiliation “current” unless separately verified.

## Public naming
`/academic-resources`:
Stablecoin Research Library / 稳定币研究资源库

`/experts`:
Researchers & Institutions / 研究者与机构

Route remains unchanged.

## Evidence hierarchy
Peer-reviewed article / law scholarship / working paper / institutional research / primary regulation / dataset-method / industry research remain separate.

News/commentary may be stored but is not a default-highlighted evidence class.

## Sorting
Resources default: newest year.
Researchers default: recently verified.
No default publication-count sorting.

## No ranking
Forbidden:
- top expert
- leading institution
- authority score
- citation score
- expert rank
- best paper

## Empty/error states
Query success with no match != directory failure.
Failure never becomes factual zero.

## Affiliation / institution
Institution aggregation means representation in this public directory only.
It does not imply partnership, endorsement or sponsorship.
