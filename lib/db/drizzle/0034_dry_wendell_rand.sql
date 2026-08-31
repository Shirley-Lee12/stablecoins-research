ALTER TYPE "public"."upload_job_type" ADD VALUE 'browser_capture';--> statement-breakpoint
CREATE TABLE "connector_pairings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"poll_secret_hash" text NOT NULL,
	"client_id" text NOT NULL,
	"client_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"authorized_by" integer,
	"session_id" integer,
	"encrypted_token" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connector_pairings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "connector_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"client_id" text NOT NULL,
	"client_name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"scope" text DEFAULT 'resource:capture' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connector_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "connector_pairings" ADD CONSTRAINT "connector_pairings_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_pairings" ADD CONSTRAINT "connector_pairings_session_id_connector_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."connector_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_sessions" ADD CONSTRAINT "connector_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connector_pairings_expiry_idx" ON "connector_pairings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "connector_sessions_user_idx" ON "connector_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connector_sessions_client_idx" ON "connector_sessions" USING btree ("client_id");