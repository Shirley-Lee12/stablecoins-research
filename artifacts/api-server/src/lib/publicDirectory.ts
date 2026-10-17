// Deliberate public projection: never select user IDs, moderation notes, abstracts or submission content.
export const PUBLIC_RESOURCES_SQL = `SELECT r.id,r.title,r.authors,r.status,r.source_type AS "sourceType",r.published_date AS "yearLabel",r.url,r.doi,r.keywords,
 m.evidence_type AS "evidenceType",m.venue,m.theme_terms AS "themeTerms",m.method,m.language,m.access,m.relevance_note AS "relevanceNote",m.verified_on::text AS "verifiedOn",
 COALESCE((SELECT array_agg(DISTINCT p.institution) FROM resource_authors ra JOIN public_researcher_profiles p ON p.author_id=ra.author_id WHERE ra.resource_id=r.id),'{}') AS institutions,
 COALESCE((SELECT array_agg(t.name_en) FROM resource_tags rt JOIN tags t ON t.id=rt.tag_id WHERE rt.resource_id=r.id AND t.facet='theme' AND t.status='active'),'{}') AS "recordedThemes"
 FROM resources r LEFT JOIN public_resource_metadata m ON m.resource_id=r.id WHERE r.status='approved' ORDER BY substring(r.published_date from '^[0-9]{4}') DESC NULLS LAST,r.title`;
export const PUBLIC_RESEARCHERS_SQL = `SELECT a.id,a.name,p.researcher_type AS "researcherType",p.role,p.institution,p.institution_type AS "institutionType",p.location,p.focus,p.profile_url AS "profileUrl",p.verification_type AS "verificationType",p.verified_on::text AS "verifiedOn",
 json_agg(DISTINCT jsonb_build_object('id',r.id,'title',r.title,'yearLabel',r.published_date,'url',r.url,'doi',r.doi)) AS works
 FROM public_researcher_profiles p JOIN authors a ON a.id=p.author_id JOIN resource_authors ra ON ra.author_id=a.id JOIN resources r ON r.id=ra.resource_id AND r.status='approved'
 WHERE p.profile_url IS NOT NULL AND p.verified_on IS NOT NULL
 AND p.verification_type IN ('OFFICIAL_PROFILE','OFFICIAL_INSTITUTION_PROFILE','OFFICIAL_AUTHOR_PROFILE','CURRENT_PUBLICATION_AFFILIATION')
 GROUP BY a.id,p.author_id ORDER BY p.verified_on DESC,a.name`;
export async function loadPublicDirectory(
  query: (sql: string) => Promise<{ rows: any[] }>,
  kind: "resources" | "researchers",
) {
  const { rows } = await query(
    kind === "resources" ? PUBLIC_RESOURCES_SQL : PUBLIC_RESEARCHERS_SQL,
  );
  // Defensive check also keeps an accidental future SQL broadening out of public counts.
  const records =
    kind === "resources"
      ? rows.filter((r) => r.status === "approved")
      : rows.filter((r) => r.works?.length && r.profileUrl && r.verifiedOn);
  return { version: "0.2", kind, records, total: records.length };
}
