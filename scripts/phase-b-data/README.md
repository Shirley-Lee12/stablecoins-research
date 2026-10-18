# Phase B targeted academic patch — REVIEW, NOT APPLIED

The public library reads `resources` and `public_resource_metadata` through the API. The generated academic package supplies taxonomy and provenance, not a replacement copy of these live records. There is no frontend URL override.

`ACADEMIC_DATA_PATCH_PLAN.json` is the exact before-image and field allowlist for resource IDs 107, 127, 159, 162, 180, 284 and 429. It contains 14 bibliographic field changes, two new metadata rows, and the evidence for each. The invalid DOI `10.29094/1164` remains in the before-image. The required `seed_id`/`seed_origin` on new metadata rows identify this patch; other missing fields stay null/default, including `verified_on`. Neither `status` nor moderation columns are patched.

## Dry-run

First capture the public database projection in a `BEGIN READ ONLY` transaction. Local evidence belongs under `outputs/phase-b-corrections-2026-10-18/evidence/`. Then run:

```sh
node scripts/phase-b-data/dry-run.mjs
```

This script is offline and cannot connect to a database. It validates exact before-images and column allowlists, simulates the changes against all 395 public records, and writes field-level before/after and count checks. It is not a production transaction rehearsal and does not prove production data was corrected.

## Prepared transaction — requires separate owner authorization

`prepared-transaction.ts` exports `applyReviewedPhaseB` and `rollbackReviewedPhaseB`. There is deliberately no CLI or automatic call. Do not invoke either function under the current instruction, which prohibits production writes. The explicit authorization string in the function is an execution safeguard, not evidence of human approval.

A later authorized operator must re-read the live rows, compare this exact plan, and obtain explicit owner authorization before calling the prepared transaction. It uses serializable isolation, an advisory lock, row locks and full selected before-image checks. Any drift or ambiguous exact author name aborts the transaction. No fuzzy matching occurs.

For resource 429 only, the existing `syncResourceAuthors` helper runs inside the same transaction. Existing author links must exactly equal [1054, 1055, 1056] before applying. The old malformed author entity is not renamed or merged. A new bibliographic author entity may be created for the exact corrected string `Ambi Ambituuni` if none exists; this asserts no ORCID, verified identity, position or affiliation. The other two links retain their existing exact-name entities. The resource remains `approved`; **Unpublished** is its publication status, explicitly retained in method/evidence, not a moderation state. `conference_contribution` uses the existing free-text evidence field; the resource source-type enum is unchanged.

Resource 284 becomes the 2023 `book_chapter`, which naturally sorts ahead of the 2021 preprint. IDs 284 and 285 remain. The duplicate-candidate table is not a version-family model: `VERSION_RELATION_PENDING`.

## Rollback

1. Keep this plan and its before-images unchanged; retain a pre-apply transaction audit and the actual created author ID if any.
2. In a separately authorized serializable transaction, verify the exact current after-values for every patched field. Stop on drift.
3. Restore only resource fields included in the patch; call `syncResourceAuthors` for resource 429 with its original author strings.
4. Restore previously existing metadata fields, or remove a new metadata row only if its patch-owned seed and the complete row still match. Stop if later enrichment exists.
5. Never delete or rename author entities globally. Any newly created, now-unlinked bibliographic entity is retained; it has no public approved-resource projection. This avoids deleting identity data added later.
6. Re-run public directory count, status, protected-ID, DOI/URL and author-link QA. Expected counts remain 395 approved / 378 non-news. Preserve both version IDs and all eight relevance cases.

The prepared code is typechecked separately and tested with an in-memory transaction harness for authorization rejection, before-image drift, apply/rollback round-trip and later-enrichment protection. No DML was executed on a real database.
