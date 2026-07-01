CREATE TYPE "public"."upload_job_status" AS ENUM('queued', 'processing', 'ready_for_review', 'failed');--> statement-breakpoint
CREATE TYPE "public"."upload_job_type" AS ENUM('pdf', 'url');--> statement-breakpoint
ALTER TYPE "public"."resource_status" ADD VALUE 'needs_review';--> statement-breakpoint
ALTER TYPE "public"."resource_status" ADD VALUE 'failed';--> statement-breakpoint
CREATE TABLE "upload_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "upload_job_type" NOT NULL,
	"status" "upload_job_status" DEFAULT 'queued' NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_jobs" ADD CONSTRAINT "upload_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;