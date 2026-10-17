export const normaliseDoi = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();
export const normaliseText = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
export function canonicalUrl(value) {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol)) return "";
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    for (const k of [...u.searchParams.keys()])
      if (/^(utm_|fbclid|gclid)/i.test(k)) u.searchParams.delete(k);
    u.searchParams.sort();
    return u.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
export const publicationYear = (value) =>
  String(value || "").match(/\b(19|20)\d{2}\b/)?.[0] || "";
export function resourceDecision(seed, rows) {
  const doi = normaliseDoi(seed.doi),
    url = canonicalUrl(seed.canonical_url),
    title = normaliseText(seed.title),
    year = publicationYear(seed.year),
    first = normaliseText(seed.authors.split(";")[0]);
  const tests = [
    ["DOI", (r) => doi && normaliseDoi(r.doi) === doi],
    ["URL", (r) => url && canonicalUrl(r.url) === url],
    [
      "TITLE_YEAR_AUTHOR",
      (r) =>
        normaliseText(r.title) === title &&
        publicationYear(r.published_date) === year &&
        normaliseText(r.authors?.[0]) === first,
    ],
  ];
  for (const [key, test] of tests) {
    const matched = rows.filter(test);
    if (!matched.length) continue;
    if (matched.some((r) => r.status !== "approved"))
      return { state: "PRIVATE_OR_PENDING_MATCH", key };
    if (matched.length !== 1)
      return {
        state: "CONFLICT_REVIEW",
        key,
        reason: "multiple_public_matches",
        existingIds: matched.map((r) => r.id),
      };
    const r = matched[0];
    if (key !== "DOI" && doi && r.doi && normaliseDoi(r.doi) !== doi)
      return {
        state: "CONFLICT_REVIEW",
        key,
        reason: "different_doi",
        existingIds: [r.id],
      };
    // Contradictory verified author identity is never repaired by replacing an existing author list.
    if (
      key === "DOI" &&
      r.authors?.length &&
      !r.authors.some((n) => normaliseText(n) === first)
    )
      return {
        state: "CONFLICT_REVIEW",
        key,
        reason: "author_metadata_conflict",
        existingIds: [r.id],
      };
    return { state: "MATCH_EXISTING", key, existingId: r.id };
  }
  const ambiguous = rows.filter((r) => normaliseText(r.title) === title);
  if (ambiguous.length)
    return ambiguous.some((r) => r.status !== "approved")
      ? { state: "PRIVATE_OR_PENDING_MATCH", key: "TITLE_CONFLICT" }
      : {
          state: "CONFLICT_REVIEW",
          key: "TITLE_CONFLICT",
          reason: "title_requires_review",
          existingIds: ambiguous.map((r) => r.id),
        };
  return { state: "NEW_PUBLIC_SEED" };
}
export function researcherDecision(seed, rows, relationships, resourceIds) {
  const sameName = rows.filter(
    (r) => normaliseText(r.name) === normaliseText(seed.name),
  );
  const stages = [
    ["ORCID", (r) => seed.orcid && r.orcid && seed.orcid === r.orcid],
    [
      "PROFILE",
      (r) =>
        r.profile_url &&
        seed.verification_type !== "CURRENT_PUBLICATION_AFFILIATION" &&
        r.verification_type !== "CURRENT_PUBLICATION_AFFILIATION" &&
        canonicalUrl(r.profile_url) ===
          canonicalUrl(seed.profile_or_verification_url),
    ],
    [
      "NAME_INSTITUTION",
      (r) =>
        normaliseText(r.name) === normaliseText(seed.name) &&
        normaliseText(r.institution) === normaliseText(seed.institution),
    ],
    [
      "PUBLICATION_RELATIONSHIP",
      (r) =>
        normaliseText(r.name) === normaliseText(seed.name) &&
        relationships.some(
          (x) => x.author_id === r.id && resourceIds.includes(x.resource_id),
        ),
    ],
  ];
  for (const [key, test] of stages) {
    const m = rows.filter(test);
    if (m.length > 1)
      return {
        state: "CONFLICT_REVIEW",
        key,
        reason: "ambiguous_identity",
        existingIds: m.map((r) => r.id),
      };
    if (m.length === 1) {
      const r = m[0];
      if (
        (seed.orcid && r.orcid && seed.orcid !== r.orcid) ||
        (seed.verification_type !== "CURRENT_PUBLICATION_AFFILIATION" &&
          r.verification_type !== "CURRENT_PUBLICATION_AFFILIATION" &&
          r.profile_url &&
          seed.profile_or_verification_url &&
          canonicalUrl(r.profile_url) !==
            canonicalUrl(seed.profile_or_verification_url))
      )
        return {
          state: "CONFLICT_REVIEW",
          key,
          reason: "identifier_conflict",
          existingIds: [r.id],
        };
      if (
        r.institution &&
        normaliseText(r.institution) !== normaliseText(seed.institution)
      )
        return {
          state: "CONFLICT_REVIEW",
          key,
          reason: "affiliation_conflict",
          existingIds: [r.id],
        };
      return { state: "MATCH_EXISTING", key, existingId: r.id };
    }
  }
  if (sameName.length)
    return {
      state: "CONFLICT_REVIEW",
      reason: "name_without_verified_identity",
      existingIds: sameName.map((r) => r.id),
    };
  return { state: "NEW_PUBLIC_SEED" };
}
export function missingPublicMetadata(existing, seed) {
  const update = {};
  for (const key of ["doi", "url"]) {
    const candidate = key === "url" ? seed.canonical_url : seed.doi;
    if (!existing[key] && candidate) update[key] = candidate;
  }
  return update;
}
