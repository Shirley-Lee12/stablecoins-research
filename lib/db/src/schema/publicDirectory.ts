import { pgTable, integer, text, date } from "drizzle-orm/pg-core";
import { resourcesTable } from "./resources";
import { authorsTable, institutionsTable } from "./authors";
export const publicResourceMetadataTable = pgTable("public_resource_metadata", {
  resourceId: integer("resource_id")
    .primaryKey()
    .references(() => resourcesTable.id),
  seedId: text("seed_id").notNull().unique(),
  seedOrigin: text("seed_origin").notNull(),
  evidenceType: text("evidence_type"),
  venue: text("venue"),
  themeTerms: text("theme_terms").array().notNull().default([]),
  method: text("method"),
  language: text("language"),
  access: text("access"),
  relevanceNote: text("relevance_note"),
  verifiedOn: date("verified_on"),
});
export const publicResearcherProfilesTable = pgTable(
  "public_researcher_profiles",
  {
    authorId: integer("author_id")
      .primaryKey()
      .references(() => authorsTable.id),
    seedId: text("seed_id").notNull().unique(),
    seedOrigin: text("seed_origin").notNull(),
    researcherType: text("researcher_type"),
    role: text("role"),
    institution: text("institution"),
    institutionType: text("institution_type"),
    location: text("location"),
    focus: text("focus").array().notNull().default([]),
    profileUrl: text("profile_url"),
    verificationType: text("verification_type"),
    verifiedOn: date("verified_on"),
    orcid: text("orcid").unique(),
  },
);

export const publicInstitutionMetadataTable = pgTable(
  "public_institution_metadata",
  {
    institutionId: integer("institution_id")
      .primaryKey()
      .references(() => institutionsTable.id),
    seedId: text("seed_id").notNull().unique(),
    seedOrigin: text("seed_origin").notNull(),
    institutionType: text("institution_type"),
    location: text("location"),
  },
);
