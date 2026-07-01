ALTER TABLE "resources" ALTER COLUMN "source_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "source_type" SET DEFAULT 'journal_article'::text;--> statement-breakpoint
DROP TYPE "public"."source_type";--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('journal_article', 'working_paper', 'conference_paper', 'thesis', 'report', 'gov_document', 'news');--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "source_type" SET DEFAULT 'journal_article'::"public"."source_type";--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "source_type" SET DATA TYPE "public"."source_type" USING "source_type"::"public"."source_type";