CREATE TABLE "resource_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"sources" text[] DEFAULT '{"crossref"}' NOT NULL,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"external_key" text NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"authors" text[] DEFAULT '{}' NOT NULL,
	"year" integer,
	"abstract" text,
	"doi" text,
	"url" text,
	"raw_metadata" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"upload_job_id" integer,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_jobs" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_jobs" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "upload_jobs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resource_subscriptions" ADD CONSTRAINT "resource_subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_candidates" ADD CONSTRAINT "subscription_candidates_subscription_id_resource_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."resource_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_candidates" ADD CONSTRAINT "subscription_candidates_upload_job_id_upload_jobs_id_fk" FOREIGN KEY ("upload_job_id") REFERENCES "public"."upload_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_candidates_subscription_external_unique" ON "subscription_candidates" USING btree ("subscription_id","external_key");