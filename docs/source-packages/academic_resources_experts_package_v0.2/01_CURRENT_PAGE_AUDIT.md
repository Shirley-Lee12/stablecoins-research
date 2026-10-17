# Current Page Audit V0.1

## `/academic-resources`

### Existing strengths
- already database-driven;
- language/year/type filtering exists;
- result sorting exists;
- resource-type taxonomy is broad.

### Problems
1. Exported `0` can be misread as “the library contains nothing”.
2. Type counts dominate the page even when all values are zero.
3. Resource type is the main discovery axis, but researchers usually start from a question/topic.
4. `News & commentary` sits beside peer-reviewed research without evidence hierarchy.
5. No visible methodology/access/open-access/DOI/source-status fields.
6. No distinction between:
   - peer-reviewed article;
   - working paper/preprint;
   - central-bank/institutional research;
   - primary law/regulation;
   - dataset/methodology;
   - industry report.
7. An empty DB response and a failed DB request need different public states.

### Decision
Rebuild around:
- keyword search;
- research themes;
- evidence type;
- year;
- language;
- open-access/full-text availability;
- author/institution.

Default result cards expose:
title · authors · year · evidence type · venue/institution · themes · access · source.

## `/experts`

### Existing strengths
- uses DB relationships;
- author count/sort logic already exists.

### Problems
1. Page title `Experts` implies ranking/judgment.
2. Sorting by `article count` can look like an expertise leaderboard.
3. Exported zero may be a DB/export state, not factual absence.
4. No visible inclusion methodology.
5. No distinction between academic, central-bank/institutional and legal/policy researchers.
6. Institution may be stale if derived from publication-time metadata.

### Decision
Public title becomes:
`Researchers & Institutions`

A researcher is included only when:
- at least one directly stablecoin-focused public research output is verified;
- identity is unambiguous;
- current affiliation is verified from an official/current source where possible.

This is a directory of verified relevant research, not a ranking.

Default sort:
`Recently verified` or `Name A–Z`.

Do not default to publication count.
