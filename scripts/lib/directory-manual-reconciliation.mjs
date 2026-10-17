import {
  normaliseDoi,
  normaliseText,
  canonicalUrl,
} from "./directory-reconciliation.mjs";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function manualResourceDecision(
  decision,
  rows,
  requireCanonical = false,
) {
  const r = rows.find((r) => r.id === decision.existingId);
  if (!r || r.status !== "approved")
    return { state: "CONFLICT_REVIEW", reason: "approved_target_unavailable" };
  const allowed = [decision.expectedBefore, decision.canonical];
  // Human review authorises only these exact publication variants, never a similar title alone.
  if (
    !allowed.some(
      (a) =>
        normaliseText(a.title) === normaliseText(r.title) &&
        same(a.authors, r.authors) &&
        normaliseDoi(a.doi) === normaliseDoi(r.doi),
    )
  )
    return {
      state: "CONFLICT_REVIEW",
      reason: "incompatible_publication_identity",
    };
  const keys = ["doi", "url"];
  for (const key of keys) {
    const normalise = key === "doi" ? normaliseDoi : canonicalUrl;
    const values = [
      decision.canonical[key],
      ...(key === "doi" ? decision.doiAliases : []),
    ]
      .map(normalise)
      .filter(Boolean);
    const others = rows.filter(
      (x) => x.id !== r.id && values.includes(normalise(x[key])),
    );
    if (others.some((x) => x.status !== "approved"))
      return {
        state: "CONFLICT_REVIEW",
        reason: "nonpublic_identity_collision",
      };
    if (others.length)
      return {
        state: "CONFLICT_REVIEW",
        reason: "duplicate_public_identifier",
      };
  }
  if (
    requireCanonical &&
    !Object.entries(decision.canonical).every(([k, v]) => same(r[k], v))
  )
    return { state: "CONFLICT_REVIEW", reason: "manual_patch_not_applied" };
  return {
    state: "MATCH_EXISTING",
    key: "HUMAN_EDITORIAL_DECISION_V0_1",
    existingId: r.id,
  };
}

export function manualResearcherDecision(
  decision,
  rows,
  links,
  resources,
  requireProfile = false,
) {
  const matches = rows.filter(
    (r) => normaliseText(r.name) === normaliseText(decision.name),
  );
  const r = matches.find((r) => r.id === decision.existingId);
  if (matches.length !== 1 || !r)
    return { state: "CONFLICT_REVIEW", reason: "exact_identity_not_unique" };
  if (
    (r.orcid && r.orcid !== decision.orcid) ||
    (r.isni && r.isni !== decision.isni)
  )
    return { state: "CONFLICT_REVIEW", reason: "hard_identifier_conflict" };
  if (
    r.profile_url &&
    r.verification_type !== "CURRENT_PUBLICATION_AFFILIATION" &&
    canonicalUrl(r.profile_url) !== canonicalUrl(decision.profileUrl)
  )
    return { state: "CONFLICT_REVIEW", reason: "official_profile_conflict" };
  for (const id of decision.representativePublicResourceIds) {
    const publication = resources.find(
      (x) => x.id === id && x.status === "approved",
    );
    if (
      !publication ||
      !publication.authors.some(
        (n) => normaliseText(n) === normaliseText(decision.name),
      ) ||
      !links.some((l) => l.author_id === r.id && l.resource_id === id)
    )
      return {
        state: "CONFLICT_REVIEW",
        reason: "incompatible_publication_identity",
      };
  }
  if (
    requireProfile &&
    (r.profile_seed_id !== decision.seedId ||
      r.role !== decision.role ||
      r.profile_institution !== decision.institution ||
      canonicalUrl(r.profile_url) !== canonicalUrl(decision.profileUrl) ||
      r.verification_type !== decision.verificationType ||
      !r.verified_on)
  )
    return { state: "CONFLICT_REVIEW", reason: "manual_profile_not_applied" };
  return {
    state: "MATCH_EXISTING",
    key: "HUMAN_IDENTITY_DECISION_V0_1",
    existingId: r.id,
  };
}
