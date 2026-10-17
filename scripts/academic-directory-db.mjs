import "dotenv/config";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  resourceDecision,
  researcherDecision,
  missingPublicMetadata,
} from "./lib/directory-reconciliation.mjs";
import {
  manualResourceDecision,
  manualResearcherDecision,
} from "./lib/directory-manual-reconciliation.mjs";
const root = resolve(import.meta.dirname, "..");
const { Client } = createRequire(resolve(root, "lib/db/package.json"))("pg");
const pack = JSON.parse(
  readFileSync(
    resolve(
      root,
      "artifacts/stablecoin-hub/src/data/academic-directory-v02.generated.json",
    ),
    "utf8",
  ),
);
const manual = process.argv.includes("--manual-decisions")
  ? JSON.parse(
      readFileSync(
        resolve(
          root,
          "scripts/data/academic-directory-manual-decisions-v01.json",
        ),
        "utf8",
      ),
    )
  : null;
const output = resolve(
  root,
  manual
    ? "outputs/academic-directory-manual-patch-2026-10-17"
    : "outputs/academic-directory-v02-qa-2026-10-16",
);
const apply = process.argv.includes("--apply");
if (apply && manual)
  throw new Error(
    "Manual decisions require the bounded manual patch, never a full seed import.",
  );
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
try {
  await c.connect();
  await c.query(
    apply
      ? "BEGIN ISOLATION LEVEL SERIALIZABLE"
      : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
  );
  if (apply) {
    await c.query(
      "SELECT pg_advisory_xact_lock(hashtext('academic-directory-v02'))",
    );
    await c.query(
      "LOCK TABLE resources,authors,resource_authors,institutions IN SHARE ROW EXCLUSIVE MODE",
    );
  }
  const resources = (
    await c.query(
      "SELECT id,title,authors,source_type,published_date,doi,url,status FROM resources",
    )
  ).rows;
  const profilesExist = (
    await c.query(
      "SELECT to_regclass('public.public_researcher_profiles') IS NOT NULL AS present",
    )
  ).rows[0].present;
  const authors = (
    await c.query(
      profilesExist
        ? "SELECT a.id,a.name,i.name AS institution,p.orcid,p.profile_url,p.verification_type,p.seed_id AS profile_seed_id,p.role,p.institution AS profile_institution,p.verified_on FROM authors a LEFT JOIN institutions i ON i.id=a.institution_id LEFT JOIN public_researcher_profiles p ON p.author_id=a.id"
        : "SELECT a.id,a.name,i.name AS institution FROM authors a LEFT JOIN institutions i ON i.id=a.institution_id",
    )
  ).rows;
  const links = (
    await c.query(
      "SELECT ra.author_id,ra.resource_id FROM resource_authors ra JOIN resources r ON r.id=ra.resource_id WHERE r.status='approved'",
    )
  ).rows;
  const resourcePlan = pack.resources.map((s) => ({
    seedId: s.resource_id,
    ...(manual?.resources.find((d) => d.seedId === s.resource_id)
      ? manualResourceDecision(
          manual.resources.find((d) => d.seedId === s.resource_id),
          resources,
          true,
        )
      : resourceDecision(s, resources)),
  }));
  const resolved = new Map(
    resourcePlan
      .filter((p) => p.state === "MATCH_EXISTING")
      .map((p) => [p.seedId, p.existingId]),
  );
  const researcherPlan = pack.researchers.map((s) => ({
    seedId: s.researcher_id,
    ...(manual?.researchers.find((d) => d.seedId === s.researcher_id)
      ? manualResearcherDecision(
          manual.researchers.find((d) => d.seedId === s.researcher_id),
          authors,
          links,
          resources,
          true,
        )
      : researcherDecision(
          s,
          authors,
          links,
          s.representative_resource_ids
            .split(";")
            .map((id) => resolved.get(id))
            .filter(Boolean),
        )),
  }));
  const counts = (plans) =>
    Object.fromEntries(
      [
        "MATCH_EXISTING",
        "NEW_PUBLIC_SEED",
        "CONFLICT_REVIEW",
        "PRIVATE_OR_PENDING_MATCH",
      ].map((k) => [k, plans.filter((p) => p.state === k).length]),
    );
  const safe = {
    mode: apply ? "APPLY" : "READ_ONLY_DRY_RUN",
    resources: counts(resourcePlan),
    researchers: counts(researcherPlan),
    public_resource_decisions: resourcePlan.filter(
      (p) => p.state !== "PRIVATE_OR_PENDING_MATCH",
    ),
    researcher_decisions: researcherPlan,
  };
  if (!apply) {
    await c.query("ROLLBACK");
    writeFileSync(
      resolve(
        output,
        process.argv.includes("--post-check")
          ? "reconciliation-post-dry-run.json"
          : "reconciliation-dry-run.json",
      ),
      JSON.stringify(safe, null, 2) + "\n",
    );
    console.log(JSON.stringify(safe));
  } else {
    // Only additive metadata tables; existing editorial/moderation/ownership fields remain untouched.
    await c.query(
      readFileSync(
        resolve(root, "scripts/sql/academic-directory-v02.sql"),
        "utf8",
      ),
    );
    let created = 0,
      enriched = 0,
      profiles = 0,
      relationships = 0;
    const evidence = {
      "Journal article": "peer_reviewed",
      "Law review article": "law_review",
      "Working paper": "working_paper",
      "Staff report": "institutional_research",
      "Research note": "institutional_research",
      "Institutional research report": "institutional_research",
      "Occasional paper": "institutional_research",
      "Review article": "review_survey",
    };
    const sourceType = {
      "Journal article": "journal_article",
      "Law review article": "journal_article",
      "Working paper": "working_paper",
      "Staff report": "report",
      "Research note": "report",
      "Institutional research report": "report",
      "Occasional paper": "report",
      "Review article": "journal_article",
    };
    for (const p of resourcePlan) {
      if (!["MATCH_EXISTING", "NEW_PUBLIC_SEED"].includes(p.state)) continue;
      const s = pack.resources.find((s) => s.resource_id === p.seedId);
      let id = p.existingId;
      if (!id) {
        id = (
          await c.query(
            "INSERT INTO resources(title,authors,source_type,url,doi,published_date,status,created_by,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,'approved',NULL,now()) RETURNING id",
            [
              s.title,
              s.authors.split(";").map((x) => x.trim()),
              sourceType[s.evidence_type],
              s.canonical_url,
              s.doi || null,
              s.year,
            ],
          )
        ).rows[0].id;
        created++;
      } else {
        const existing = resources.find((r) => r.id === id);
        const patch = missingPublicMetadata(existing, s);
        for (const [key, value] of Object.entries(patch)) {
          await c.query(
            `UPDATE resources SET ${key}=$1 WHERE id=$2 AND status='approved' AND (${key} IS NULL OR ${key}='')`,
            [value, id],
          );
          enriched++;
        }
      }
      resolved.set(p.seedId, id);
      await c.query(
        "INSERT INTO public_resource_metadata(resource_id,seed_id,seed_origin,evidence_type,venue,theme_terms,method,language,access,relevance_note,verified_on) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(resource_id) DO NOTHING",
        [
          id,
          s.resource_id,
          pack.seedOrigin,
          evidence[s.evidence_type],
          s.venue_or_series,
          s.themes.split(";").map((x) => x.trim()),
          s.method_or_evidence,
          s.language,
          s.access,
          s.why_relevant,
          pack.verified,
        ],
      );
    }
    // Recompute identities after resource resolution. No fuzzy names or silent conflicts.
    for (const s of pack.researchers) {
      const ids = s.representative_resource_ids
        .split(";")
        .map((id) => resolved.get(id))
        .filter(Boolean);
      if (!ids.length) continue;
      const d = researcherDecision(s, authors, links, ids);
      if (!["MATCH_EXISTING", "NEW_PUBLIC_SEED"].includes(d.state)) continue;
      let id = d.existingId;
      const institutionSeed = pack.institutions.find(
        (i) => i.institution === s.institution,
      );
      let institution = (
        await c.query("SELECT id FROM institutions WHERE name=$1", [
          s.institution,
        ])
      ).rows[0];
      if (!institution)
        institution = (
          await c.query(
            "INSERT INTO institutions(name,country) VALUES($1,$2) RETURNING id",
            [s.institution, institutionSeed?.location_scope || null],
          )
        ).rows[0];
      if (institutionSeed)
        await c.query(
          "INSERT INTO public_institution_metadata(institution_id,seed_id,seed_origin,institution_type,location) VALUES($1,$2,$3,$4,$5) ON CONFLICT(institution_id) DO NOTHING",
          [
            institution.id,
            institutionSeed.institution_id,
            pack.seedOrigin,
            institutionSeed.institution_type,
            institutionSeed.location_scope,
          ],
        );
      if (!id) {
        id = (
          await c.query(
            "INSERT INTO authors(name,institution_id,research_interests) VALUES($1,$2,$3) RETURNING id",
            [
              s.name,
              institution.id,
              s.stablecoin_research_focus.split(";").map((x) => x.trim()),
            ],
          )
        ).rows[0].id;
        authors.push({ id, name: s.name, institution: s.institution });
      }
      await c.query(
        "INSERT INTO public_researcher_profiles(author_id,seed_id,seed_origin,researcher_type,role,institution,institution_type,location,focus,profile_url,verification_type,verified_on) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(author_id) DO NOTHING",
        [
          id,
          s.researcher_id,
          pack.seedOrigin,
          s.researcher_type,
          s.current_role,
          s.institution,
          institutionSeed?.institution_type || null,
          institutionSeed?.location_scope || null,
          s.stablecoin_research_focus.split(";").map((x) => x.trim()),
          s.profile_or_verification_url,
          s.verification_type,
          pack.verified,
        ],
      );
      profiles++;
      for (const resourceId of ids) {
        const result = await c.query(
          "INSERT INTO resource_authors(resource_id,author_id) SELECT $1,$2 WHERE EXISTS(SELECT 1 FROM resources WHERE id=$1 AND status='approved') ON CONFLICT(resource_id,author_id) DO NOTHING",
          [resourceId, id],
        );
        relationships += result.rowCount;
      }
    }
    const after = (
      await c.query(
        "SELECT (SELECT count(*)::int FROM resources) AS resources_total,(SELECT count(*)::int FROM resources WHERE status='approved') AS resources_public,(SELECT count(*)::int FROM public_researcher_profiles p WHERE EXISTS(SELECT 1 FROM resource_authors ra JOIN resources r ON r.id=ra.resource_id WHERE ra.author_id=p.author_id AND r.status='approved')) AS verified_public_profiles",
      )
    ).rows[0];
    // All pre-existing states and immutable/editorial resource data must still match exactly.
    const unchanged = (
      await c.query(
        "SELECT id,title,authors,published_date,doi,url,status FROM resources WHERE id=ANY($1::int[])",
        [resources.map((r) => r.id)],
      )
    ).rows;
    for (const old of resources) {
      const row = unchanged.find((r) => r.id === old.id);
      for (const k of ["title", "authors", "published_date", "status"])
        if (JSON.stringify(old[k]) !== JSON.stringify(row[k]))
          throw Error("PRESERVATION_CHECK_FAILED");
    }
    await c.query("COMMIT");
    const report = {
      ...safe,
      applied: {
        new_resources: created,
        missing_fields_enriched: enriched,
        verified_profiles: profiles,
        new_public_relationships: relationships,
      },
      after,
      preservation_checks:
        "PASS: existing status/title/authors/year untouched; no summaries/ownership selected for mutation",
    };
    writeFileSync(
      resolve(
        output,
        existsSync(resolve(output, "reconciliation-applied.json"))
          ? "reconciliation-follow-up.json"
          : "reconciliation-applied.json",
      ),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report));
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.log(
    JSON.stringify({
      status: "FAILED",
      error_code: e.code || e.message || "DATABASE_OPERATION_FAILED",
    }),
  );
  process.exitCode = 1;
} finally {
  await c.end().catch(() => {});
}
