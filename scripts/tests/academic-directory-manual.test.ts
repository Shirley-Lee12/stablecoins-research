import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  manualResourceDecision,
  manualResearcherDecision,
} from "../lib/directory-manual-reconciliation.mjs";
const root = resolve(import.meta.dirname, "../..");
const ledger = JSON.parse(
  readFileSync(
    resolve(root, "scripts/data/academic-directory-manual-decisions-v01.json"),
    "utf8",
  ),
);
const resourceRows = ledger.resources.map((d: any) => ({
  ...d.expectedBefore,
  status: "approved",
}));
const researcher = ledger.researchers[0];
const authors = [{ id: researcher.existingId, name: researcher.name }];
const links = [{ author_id: researcher.existingId, resource_id: 83 }];

test("manual resource decisions accept only the seven reviewed publication identities", () => {
  for (const d of ledger.resources)
    assert.equal(
      manualResourceDecision(d, resourceRows).state,
      "MATCH_EXISTING",
    );
  assert.equal(
    manualResourceDecision(
      ledger.resources[1],
      resourceRows.map((r: any) =>
        r.id === 70 ? { ...r, authors: ["Different Author"] } : r,
      ),
    ).reason,
    "incompatible_publication_identity",
  );
});
test("manual final dry-run requires canonical metadata already applied, then is idempotent", () => {
  for (const d of ledger.resources) {
    assert.equal(
      manualResourceDecision(d, resourceRows, true).state,
      "CONFLICT_REVIEW",
    );
    const rows = resourceRows.map((r: any) =>
      r.id === d.existingId ? { ...r, ...d.canonical } : r,
    );
    assert.equal(manualResourceDecision(d, rows, true).state, "MATCH_EXISTING");
    assert.deepEqual(
      manualResourceDecision(d, rows, true),
      manualResourceDecision(d, rows, true),
    );
  }
});
test("manual decisions fail closed on a nonpublic target without exposing its ID", () => {
  const d = ledger.resources[0];
  const result = manualResourceDecision(
    d,
    resourceRows.map((r: any) =>
      r.id === d.existingId ? { ...r, status: "pending" } : r,
    ),
  );
  assert.equal(result.state, "CONFLICT_REVIEW");
  assert.equal("existingId" in result, false);
});
test("canonical DOI, URL and IMF article-view aliases cannot collide with another resource", () => {
  const d = ledger.resources.find((d: any) => d.seedId === "RES-012");
  for (const collision of [
    { doi: d.canonical.doi },
    { doi: d.doiAliases[0].toLowerCase() },
    { url: d.canonical.url + "?utm_source=test" },
  ]) {
    assert.equal(
      manualResourceDecision(d, [
        ...resourceRows,
        { id: 9999, status: "approved", ...collision },
      ]).reason,
      "duplicate_public_identifier",
    );
    const result = manualResourceDecision(d, [
      ...resourceRows,
      { id: 9999, status: "pending", ...collision },
    ]);
    assert.equal(result.reason, "nonpublic_identity_collision");
    assert.equal(JSON.stringify(result).includes("9999"), false);
  }
});
test("manual researcher requires unique exact identity and verified public publication relationship", () => {
  assert.equal(
    manualResearcherDecision(researcher, authors, links, resourceRows).state,
    "MATCH_EXISTING",
  );
  assert.equal(
    manualResearcherDecision(
      researcher,
      [{ ...authors[0], name: "Ganesh Viswanath Natraj Jr" }],
      links,
      resourceRows,
    ).state,
    "CONFLICT_REVIEW",
  );
  assert.equal(
    manualResearcherDecision(
      researcher,
      [...authors, { ...authors[0], id: 9999 }],
      links,
      resourceRows,
    ).reason,
    "exact_identity_not_unique",
  );
  assert.equal(
    manualResearcherDecision(researcher, authors, [], resourceRows).reason,
    "incompatible_publication_identity",
  );
  assert.equal(
    manualResearcherDecision(
      researcher,
      authors,
      links,
      resourceRows.map((r: any) => ({ ...r, status: "pending" })),
    ).reason,
    "incompatible_publication_identity",
  );
});
test("human merge never overrides contradictory ORCID, ISNI or official profile", () => {
  for (const extra of [
    { orcid: "0000-0000-0000-0001" },
    { isni: "0000000123456789" },
    {
      profile_url: "https://different.example/person",
      verification_type: "OFFICIAL_PROFILE",
    },
  ])
    assert.equal(
      manualResearcherDecision(
        researcher,
        [{ ...authors[0], ...extra }],
        links,
        resourceRows,
      ).state,
      "CONFLICT_REVIEW",
    );
});
test("human role corrections are separate from frozen seed and require applied profiles", () => {
  assert.equal(researcher.role, "Associate Professor");
  const marco = ledger.researchers.find((r: any) => r.seedId === "RSC-009");
  assert.equal(marco.role, "Institutional researcher");
  assert.equal(marco.verificationType, "CURRENT_PUBLICATION_AFFILIATION");
  assert.equal(
    manualResearcherDecision(researcher, authors, links, resourceRows, true)
      .reason,
    "manual_profile_not_applied",
  );
  const row = {
    ...authors[0],
    profile_seed_id: researcher.seedId,
    role: researcher.role,
    profile_institution: researcher.institution,
    profile_url: researcher.profileUrl,
    verification_type: researcher.verificationType,
    verified_on: ledger.decisionDate,
  };
  assert.equal(
    manualResearcherDecision(researcher, [row], links, resourceRows, true)
      .state,
    "MATCH_EXISTING",
  );
});
test("canonical editorial decisions preserve final editions, publication year and aliases", () => {
  const resource = (id: string) =>
    ledger.resources.find((d: any) => d.seedId === id);
  assert.equal(resource("RES-003").canonical.doi, "10.1016/j.frl.2024.105435");
  assert.equal(resource("RES-005").canonical.doi, "10.1093/rfs/hhag072");
  assert.deepEqual(resource("RES-007").canonical.authors, [
    "Olli Castrén",
    "Riccardo Russo",
  ]);
  assert.equal(
    resource("RES-007").canonical.doi,
    "10.1016/j.econlet.2025.112720",
  );
  assert.equal(resource("RES-009").canonical.published_date, "2025");
  assert.equal(resource("RES-012").canonical.doi, "10.5089/9798229036795.001");
  assert.deepEqual(resource("RES-012").doiAliases, [
    "10.5089/9798229036795.001.A001",
  ]);
  assert.equal(resource("RES-001").earlierVersions[0].doi, "10.3386/w27136");
});
test("bounded patch cannot insert resources or authors, delete rows or change protected columns", () => {
  const script = readFileSync(
    resolve(root, "scripts/academic-directory-manual-patch.mjs"),
    "utf8",
  );
  assert.doesNotMatch(script, /INSERT INTO (resources|authors)\s*\(/i);
  assert.doesNotMatch(script, /DELETE FROM/i);
  assert.doesNotMatch(script, /UPDATE (authors|resource_authors)/i);
  const update = script.match(/UPDATE resources SET ([^"\n]+)/)?.[1] || "";
  assert.match(update, /WHERE id=\$7 AND status='approved'/);
  assert.doesNotMatch(
    update,
    /abstract|summary|created_by|reviewed_by|SET status/i,
  );
  assert.match(script, /assert\.deepEqual\(\s*after,\s*before/);
  assert.match(script, /ROLLBACK/);
});
test("actual manual patch audit proves 14 dispositions, unchanged protected state and zero new duplicates", () => {
  const read = (file: string) =>
    JSON.parse(
      readFileSync(
        resolve(
          root,
          "outputs/academic-directory-manual-patch-2026-10-17",
          file,
        ),
        "utf8",
      ),
    );
  const before = read("preflight-before.json"),
    after = read("preflight-after.json"),
    applied = read("manual-patch-applied.json"),
    dry = read("reconciliation-post-dry-run.json");
  assert.deepEqual(before.protectedState, after.protectedState);
  assert.deepEqual(after.counts, {
    resources_total: 434,
    approved_public: 395,
    authors_total: 1109,
    verified_profiles: 10,
    duplicate_candidates: 3,
  });
  assert.deepEqual(applied.writes, {
    resource_updates: 7,
    new_resources: 0,
    new_authors: 0,
    metadata_inserted: 7,
    profiles_inserted: 7,
    relationship_changes: 0,
  });
  assert.equal(applied.new_hard_conflicts.length, 0);
  assert.deepEqual(applied.duplicates_before, applied.duplicates_after);
  assert.deepEqual(dry.resources, {
    MATCH_EXISTING: 19,
    NEW_PUBLIC_SEED: 0,
    CONFLICT_REVIEW: 0,
    PRIVATE_OR_PENDING_MATCH: 1,
  });
  assert.deepEqual(dry.researchers, {
    MATCH_EXISTING: 10,
    NEW_PUBLIC_SEED: 0,
    CONFLICT_REVIEW: 0,
    PRIVATE_OR_PENDING_MATCH: 0,
  });
  const publicResources = read("public-resources.json"),
    publicResearchers = read("public-researchers.json");
  assert.equal(publicResources.total, 395);
  assert.equal(publicResearchers.total, 10);
  assert.equal(
    new Set(publicResearchers.records.map((r: any) => r.id)).size,
    10,
  );
  for (const d of ledger.resources) {
    const r = publicResources.records.find((r: any) => r.id === d.existingId);
    assert.equal(r.status, "approved");
    assert.equal(r.title, d.canonical.title);
    assert.deepEqual(r.authors, d.canonical.authors);
    assert.equal(r.doi, d.canonical.doi);
    assert.equal(r.url, d.canonical.url);
    assert.equal(r.yearLabel, d.canonical.published_date);
  }
  for (const d of ledger.researchers) {
    const r = publicResearchers.records.find((r: any) => r.id === d.existingId);
    assert.equal(r.name, d.name);
    assert.equal(r.role, d.role);
    assert.equal(r.institution, d.institution);
    assert.equal(r.verificationType, d.verificationType);
    for (const id of d.representativePublicResourceIds)
      assert.ok(r.works.some((w: any) => w.id === id));
  }
});
