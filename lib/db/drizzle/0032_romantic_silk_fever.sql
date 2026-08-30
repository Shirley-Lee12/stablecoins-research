CREATE TABLE "pending_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"verification_code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
INSERT INTO "pending_registrations" ("email", "name", "password_hash", "verification_code", "expires_at", "created_at", "updated_at")
SELECT DISTINCT ON (u."email")
	u."email", u."name", u."password_hash", c."code", c."expires_at", u."created_at", now()
FROM "users" u
INNER JOIN "email_verification_codes" c ON c."user_id" = u."id"
WHERE u."email_verified" = false AND c."used" = false AND c."expires_at" > now()
ORDER BY u."email", c."created_at" DESC
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
DELETE FROM "users" WHERE "email_verified" = false;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "notification_email" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "notification_digest" SET DEFAULT 'off';--> statement-breakpoint
UPDATE "users" SET "notification_email" = false, "notification_digest" = 'off';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_reason" text;
