import "dotenv/config";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  manualResourceDecision,
  manualResearcherDecision,
} from "./lib/directory-manual-reconciliation.mjs";
import { canonicalUrl, normaliseDoi } from "./lib/directory-reconciliation.mjs";
const root = resolve(import.meta.dirname, "..");
const { Client } = createRequire(resolve(root, "lib/db/package.json"))("pg");
const ledger = JSON.parse(
  readFileSync(
    resolve(root, "scripts/data/academic-directory-manual-decisions-v01.json"),
    "utf8",
  ),
);
const pack = JSON.parse(
  readFileSync(
    resolve(
      root,
      "artifacts/stablecoin-hub/src/data/academic-directory-v02.generated.json",
    ),
    "utf8",
  ),
);
const out = resolve(root, "outputs/academic-directory-manual-patch-2026-10-17");
const apply = process.argv.includes("--apply");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
const ids = ledger.resources.map((x) => x.existingId);
async function protection() {
  return (
    await c.query(
      `SELECT
   (SELECT md5(string_agg(to_jsonb(r)::text,'|' ORDER BY r.id)) FROM resources r WHERE status<>'approved') AS nonpublic,
   (SELECT md5(string_agg((to_jsonb(r)-ARRAY['title','authors','source_type','published_date','doi','url'])::text,'|' ORDER BY r.id)) FROM resources r) AS protected_resource_fields,
   (SELECT md5(string_agg(to_jsonb(r)::text,'|' ORDER BY r.id)) FROM resources r WHERE id<>ALL($1::int[])) AS untargeted_resources,
   (SELECT md5(string_agg(to_jsonb(a)::text,'|' ORDER BY a.id)) FROM authors a) AS authors,
   (SELECT md5(string_agg(to_jsonb(ra)::text,'|' ORDER BY ra.id)) FROM resource_authors ra) AS relationships,
   (SELECT md5(string_agg(to_jsonb(d)::text,'|' ORDER BY d.id)) FROM duplicate_candidates d) AS duplicate_candidates`,
      [ids],
    )
  ).rows[0];
}
const duplicates = (rows) => {
  const count = (normalise) => {
    const groups = new Map();
    for (const r of rows) {
      const k = normalise(r);
      if (k) groups.set(k, (groups.get(k) || 0) + 1);
    }
    return [...groups.values()].filter((n) => n > 1).length;
  };
  return {
    doi_groups: count((r) => normaliseDoi(r.doi)),
    canonical_url_groups: count((r) => canonicalUrl(r.url)),
  };
};
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
      "LOCK TABLE resources,authors,resource_authors,public_resource_metadata,public_researcher_profiles IN SHARE ROW EXCLUSIVE MODE",
    );
  }
  const before = await protection();
  const resources = (
    await c.query(
      "SELECT id,title,authors,source_type,published_date,doi,url,status FROM resources",
    )
  ).rows;
  const authors = (
    await c.query(
      "SELECT a.id,a.name,p.orcid,p.profile_url,p.verification_type,p.seed_id AS profile_seed_id,p.role,p.institution AS profile_institution,p.verified_on FROM authors a LEFT JOIN public_researcher_profiles p ON p.author_id=a.id",
    )
  ).rows;
  const links = (
    await c.query(
      "SELECT ra.author_id,ra.resource_id FROM resource_authors ra JOIN resources r ON r.id=ra.resource_id WHERE r.status='approved'",
    )
  ).rows;
  const resourcePlan = ledger.resources.map((d) => ({
    seedId: d.seedId,
    ...manualResourceDecision(d, resources),
  }));
  const researcherPlan = ledger.researchers.map((d) => ({
    seedId: d.seedId,
    ...(d.representativePublicResourceIds.some((id) => {
      const dependency = ledger.resources.find((r) => r.existingId === id);
      return (
        dependency &&
        resourcePlan.find((p) => p.seedId === dependency.seedId)?.state !==
          "MATCH_EXISTING"
      );
    })
      ? {
          state: "CONFLICT_REVIEW",
          reason: "representative_publication_conflict",
        }
      : manualResearcherDecision(d, authors, links, resources)),
  }));
  let resourceUpdates = 0,
    metadataInserted = 0,
    profilesInserted = 0;
  const evidence = {
    "Journal article": "peer_reviewed",
    "Working paper": "working_paper",
  };
  if (apply) {
    for (const plan of resourcePlan) {
      if (plan.state !== "MATCH_EXISTING") continue;
      const d = ledger.resources.find((d) => d.seedId === plan.seedId),
        s = pack.resources.find((s) => s.resource_id === plan.seedId);
      const a = d.canonical;
      const result = await c.query(
        "UPDATE resources SET title=$1,authors=$2,source_type=$3,published_date=$4,doi=$5,url=$6 WHERE id=$7 AND status='approved' AND (title,authors,source_type,published_date,doi,url) IS DISTINCT FROM ($1,$2,$3::source_type,$4,$5,$6)",
        [
          a.title,
          a.authors,
          a.source_type,
          a.published_date,
          a.doi,
          a.url,
          d.existingId,
        ],
      );
      resourceUpdates += result.rowCount;
      metadataInserted += (
        await c.query(
          "INSERT INTO public_resource_metadata(resource_id,seed_id,seed_origin,evidence_type,venue,theme_terms,method,language,access,relevance_note,verified_on) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(resource_id) DO NOTHING",
          [
            d.existingId,
            d.seedId,
            pack.seedOrigin,
            evidence[s.evidence_type],
            s.venue_or_series,
            s.themes.split(";").map((x) => x.trim()),
            s.method_or_evidence,
            s.language,
            s.access,
            s.why_relevant,
            ledger.decisionDate,
          ],
        )
      ).rowCount;
    }
    for (const plan of researcherPlan) {
      if (plan.state !== "MATCH_EXISTING") continue;
      const d = ledger.researchers.find((d) => d.seedId === plan.seedId),
        s = pack.researchers.find((s) => s.researcher_id === plan.seedId);
      const institution = pack.institutions.find(
        (i) => i.institution === d.institution,
      );
      const existing = authors.find((a) => a.id === d.existingId);
      if (existing.profile_seed_id) {
        assert.equal(
          existing.profile_seed_id,
          d.seedId,
          "Existing profile provenance mismatch",
        );
        assert.equal(
          manualResearcherDecision(d, authors, links, resources, true).state,
          "MATCH_EXISTING",
          "Existing profile requires separate review",
        );
        continue;
      }
      profilesInserted += (
        await c.query(
          "INSERT INTO public_researcher_profiles(author_id,seed_id,seed_origin,researcher_type,role,institution,institution_type,location,focus,profile_url,verification_type,verified_on,orcid) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL)",
          [
            d.existingId,
            d.seedId,
            pack.seedOrigin,
            s.researcher_type,
            d.role,
            d.institution,
            institution?.institution_type,
            institution?.location_scope,
            s.stablecoin_research_focus.split(";").map((x) => x.trim()),
            d.profileUrl,
            d.verificationType,
            ledger.decisionDate,
          ],
        )
      ).rowCount;
    }
  }
  const after = await protection();
  assert.deepEqual(
    after,
    before,
    "Protected fields changed: transaction must roll back",
  );
  const afterRows = (await c.query("SELECT id,doi,url FROM resources")).rows;
  const report = {
    mode: apply ? "APPLY_BOUNDED_MANUAL_PATCH" : "READ_ONLY_MANUAL_PREFLIGHT",
    authority: ledger.authority,
    resource_decisions: resourcePlan,
    researcher_decisions: researcherPlan,
    writes: {
      resource_updates: resourceUpdates,
      new_resources: 0,
      new_authors: 0,
      metadata_inserted: metadataInserted,
      profiles_inserted: profilesInserted,
      relationship_changes: 0,
    },
    protected_state_unchanged: true,
    nonpublic_unchanged: true,
    duplicates_before: duplicates(resources),
    duplicates_after: duplicates(afterRows),
    new_hard_conflicts: [...resourcePlan, ...researcherPlan].filter(
      (p) => p.state === "CONFLICT_REVIEW",
    ),
  };
  await c.query(apply ? "COMMIT" : "ROLLBACK");
  const filename = apply
    ? "manual-patch-applied.json"
    : "manual-patch-preflight.json";
  writeFileSync(resolve(out, filename), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error(
    "Manual patch stopped; transaction rolled back.",
    e.code || e.name,
  );
  process.exitCode = 1;
} finally {
  await c.end();
}
