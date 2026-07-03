ALTER TABLE "resources" ADD COLUMN "keywords" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "keywords_source" text;