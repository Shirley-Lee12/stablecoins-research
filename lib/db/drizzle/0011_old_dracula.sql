CREATE TABLE "rejection_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_zh" text NOT NULL,
	"name_en" text NOT NULL,
	CONSTRAINT "rejection_reasons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "rejection_reason_id" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "rejection_note" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_rejection_reason_id_rejection_reasons_id_fk" FOREIGN KEY ("rejection_reason_id") REFERENCES "public"."rejection_reasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;