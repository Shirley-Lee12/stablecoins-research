ALTER TYPE "public"."upload_job_type" ADD VALUE 'title';--> statement-breakpoint
ALTER TABLE "upload_jobs" ADD COLUMN "folder_import_id" uuid;