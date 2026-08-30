CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text DEFAULT 'resource_update' NOT NULL,
	"title" text NOT NULL,
	"title_zh" text,
	"body" text,
	"body_zh" text,
	"href" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_key" text NOT NULL,
	"target_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_user_id_target_type_target_key_unique" UNIQUE("user_id","target_type","target_key")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "institution" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" text DEFAULT 'zh' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_preference" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "font_scale" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_email" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_digest" text DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;