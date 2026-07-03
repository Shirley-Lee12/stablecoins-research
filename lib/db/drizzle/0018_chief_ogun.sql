ALTER TABLE "resources" ADD COLUMN "verification_report" jsonb;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "verified_at" timestamp with time zone;