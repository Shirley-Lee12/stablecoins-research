ALTER TABLE "resources" ADD COLUMN "ai_review_status" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "ai_review_summary" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "ai_review_details" jsonb;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "ai_reviewed_at" timestamp with time zone;