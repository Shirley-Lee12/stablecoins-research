CREATE TABLE "background_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"total" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "background_tasks" ADD CONSTRAINT "background_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;