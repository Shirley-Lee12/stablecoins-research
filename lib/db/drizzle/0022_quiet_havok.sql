CREATE TYPE "public"."duplicate_match_type" AS ENUM('exact_doi', 'exact_url', 'fuzzy_title');--> statement-breakpoint
ALTER TYPE "public"."resource_status" ADD VALUE 'withdrawn';--> statement-breakpoint
CREATE TABLE "duplicate_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"candidate_resource_id" integer NOT NULL,
	"match_type" "duplicate_match_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "duplicate_note" text;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_candidate_resource_id_resources_id_fk" FOREIGN KEY ("candidate_resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;