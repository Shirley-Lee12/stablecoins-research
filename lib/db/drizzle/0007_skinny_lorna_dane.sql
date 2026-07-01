CREATE TYPE "public"."resource_tag_source" AS ENUM('auto', 'manual');--> statement-breakpoint
ALTER TABLE "resource_tags" ADD COLUMN "source" "resource_tag_source" DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "region" text;