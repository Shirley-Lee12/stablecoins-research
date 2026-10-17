# Academic Resources + Researchers & Institutions｜Codex-ready Content/Data Package V0.2

Project: Stablecoin Research Hub
Baseline date: 2026-10-16
Status: READY_FOR_CODEX
ready_for_codex: true

## Scope

- `/academic-resources`
- `/experts`

## Public display names

`/academic-resources`
- 中文：稳定币研究资源库
- English: Stablecoin Research Library

`/experts`
- 中文：研究者与机构
- English: Researchers & Institutions

The route remains `/experts`; the public title is intentionally less ranking-oriented.

## Critical database boundary

The 2026-10-15 public export displayed `0` resources and `0` experts.

This MUST NOT be treated as proof that the database is empty.

The handoff states:
- the directory depends on database returns;
- only approved/public records should be exposed;
- private submissions/account data were not exported;
- zero in the export does not establish the actual database total.

V0.1 therefore provides:
1. a database reconciliation protocol;
2. a curated public seed candidate set;
3. non-destructive deduplication keys;
4. public empty/unavailable states.

Codex must not delete or overwrite existing records merely because this package includes seed candidates.

## Page philosophy

Academic Resources:
`Find the evidence behind stablecoin research questions.`

Researchers & Institutions:
`Trace stablecoin research through verified publications and current affiliations.`

No rankings.
No citation-count leaderboard.
No institutional prestige score.
No automatically inferred “expert” status.

## V0.2 construction status

Ready for Codex.

Frozen:
- non-destructive database reconciliation;
- curated public seed candidates;
- resource/researcher identity matching;
- search/filter behaviour;
- public count semantics;
- empty vs unavailable states;
- responsive directory UI;
- no-ranking researcher/institution policy;
- final content/data QA.

Codex must inspect the existing database first and reconcile before importing any seed record.
