CREATE TYPE "public"."edit_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "resource_edit_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"submitted_by" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"proposed_fields" jsonb NOT NULL,
	"previous_fields" jsonb NOT NULL,
	"status" "edit_suggestion_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"review_note" text
);
--> statement-breakpoint
ALTER TABLE "resource_edit_suggestions" ADD CONSTRAINT "resource_edit_suggestions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_edit_suggestions" ADD CONSTRAINT "resource_edit_suggestions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_edit_suggestions" ADD CONSTRAINT "resource_edit_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;