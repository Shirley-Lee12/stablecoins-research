import "dotenv/config";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const { Client } = createRequire(resolve(root, "lib/db/package.json"))("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
const out = resolve(root, "outputs/academic-directory-manual-patch-2026-10-17");
mkdirSync(out, { recursive: true });
try {
  await c.connect();
  await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const resources = (
    await c.query(
      "SELECT id,title,authors,source_type,published_date,doi,url FROM resources WHERE status='approved' AND id=ANY($1::int[]) ORDER BY id",
      [[83, 70, 114, 445, 67, 68, 57]],
    )
  ).rows;
  const authors = (
    await c.query(
      "SELECT a.id,a.name,i.name AS institution,p.orcid,p.profile_url,p.verification_type FROM authors a LEFT JOIN institutions i ON i.id=a.institution_id LEFT JOIN public_researcher_profiles p ON p.author_id=a.id WHERE a.id=ANY($1::int[]) ORDER BY a.id",
      [[100, 200, 201, 202, 35, 213, 97]],
    )
  ).rows;
  const publicRelationships = (
    await c.query(
      "SELECT a.id AS author_id,a.name,r.id AS resource_id,r.title,r.authors,r.doi FROM resource_authors ra JOIN authors a ON a.id=ra.author_id JOIN resources r ON r.id=ra.resource_id AND r.status='approved' WHERE a.id=ANY($1::int[]) ORDER BY a.id,r.id",
      [[100, 200, 201, 202, 35, 213, 97]],
    )
  ).rows;
  const publicRepresentative = (
    await c.query(
      "SELECT id,title,authors,doi,url FROM resources WHERE status='approved' AND lower(title) LIKE '%taming wildcat stablecoins%' ORDER BY id",
    )
  ).rows;
  const targetLinks = (
    await c.query(
      "SELECT ra.resource_id,a.id AS author_id,a.name FROM resource_authors ra JOIN authors a ON a.id=ra.author_id JOIN resources r ON r.id=ra.resource_id AND r.status='approved' WHERE r.id=ANY($1::int[]) ORDER BY r.id,a.id",
      [[83, 70, 114, 445, 67, 68, 57]],
    )
  ).rows;
  const optionalSchema = (
    await c.query(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND (column_name ~* '(orcid|isni|alias|alternate|revision|version|profile)' OR table_name ~* '(alias|alternate|revision|version)') ORDER BY table_name,column_name",
    )
  ).rows;
  const counts = (
    await c.query(
      "SELECT (SELECT count(*)::int FROM resources) AS resources_total,(SELECT count(*)::int FROM resources WHERE status='approved') AS approved_public,(SELECT count(*)::int FROM authors) AS authors_total,(SELECT count(*)::int FROM public_researcher_profiles) AS verified_profiles,(SELECT count(*)::int FROM duplicate_candidates) AS duplicate_candidates",
    )
  ).rows[0];
  const protectedState = (
    await c.query(
      "SELECT (SELECT md5(string_agg(to_jsonb(r)::text,'|' ORDER BY r.id)) FROM resources r WHERE status<>'approved') AS nonpublic_fingerprint,(SELECT md5(string_agg((to_jsonb(r)-ARRAY['title','authors','source_type','published_date','doi','url'])::text,'|' ORDER BY r.id)) FROM resources r) AS protected_resource_fields_fingerprint,(SELECT md5(string_agg(to_jsonb(r)::text,'|' ORDER BY r.id)) FROM resources r WHERE id<>ALL($1::int[])) AS untargeted_resources_fingerprint,(SELECT md5(string_agg(to_jsonb(a)::text,'|' ORDER BY a.id)) FROM authors a) AS authors_fingerprint",
      [[83, 70, 114, 445, 67, 68, 57]],
    )
  ).rows[0];
  const report = {
    mode: "READ_ONLY",
    resources,
    authors,
    publicRelationships,
    publicRepresentative,
    targetLinks,
    optionalSchema,
    counts,
    protectedState,
  };
  await c.query("ROLLBACK");
  writeFileSync(
    resolve(
      out,
      process.argv.includes("--after")
        ? "preflight-after.json"
        : "preflight-before.json",
    ),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await c.end();
}
