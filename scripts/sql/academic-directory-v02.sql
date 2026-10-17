-- Additive directory metadata only. No existing moderation, ownership, abstracts or summaries are altered.
CREATE TABLE IF NOT EXISTS public_resource_metadata (
 resource_id integer PRIMARY KEY REFERENCES resources(id),
 seed_id text UNIQUE NOT NULL,
 seed_origin text NOT NULL,
 evidence_type text,
 venue text,
 theme_terms text[] NOT NULL DEFAULT '{}',
 method text,
 language text,
 access text,
 relevance_note text,
 verified_on date
);
CREATE TABLE IF NOT EXISTS public_researcher_profiles (
 author_id integer PRIMARY KEY REFERENCES authors(id),
 seed_id text UNIQUE NOT NULL,
 seed_origin text NOT NULL,
 researcher_type text,
 role text,
 institution text,
 institution_type text,
 location text,
 focus text[] NOT NULL DEFAULT '{}',
 profile_url text,
 verification_type text,
 verified_on date,
 orcid text UNIQUE
);
CREATE TABLE IF NOT EXISTS public_institution_metadata (
 institution_id integer PRIMARY KEY REFERENCES institutions(id),
 seed_id text UNIQUE NOT NULL,
 seed_origin text NOT NULL,
 institution_type text,
 location text
);
