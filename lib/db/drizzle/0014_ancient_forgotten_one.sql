ALTER TABLE "resources" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."resource_status";--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('incomplete', 'disputed', 'off_topic', 'duplicate', 'pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."resource_status";--> statement-breakpoint
-- 'needs_review'/'failed' no longer exist in the new enum — remap any existing rows to 'disputed'
-- as a safe temporary placeholder (closest old meaning: "verification flagged something"). A
-- follow-up one-off script re-classifies these into the correct one of
-- incomplete/disputed/off_topic/duplicate by re-running the new detection logic against their
-- actual data, since a blind mapping can't know which of the four actually applies.
ALTER TABLE "resources" ALTER COLUMN "status" SET DATA TYPE "public"."resource_status" USING (
  CASE "status"
    WHEN 'needs_review' THEN 'disputed'
    WHEN 'failed' THEN 'disputed'
    ELSE "status"
  END
)::"public"."resource_status";