ALTER TABLE "connector_sessions" ALTER COLUMN "expires_at" DROP NOT NULL;
UPDATE "connector_sessions" SET "expires_at" = NULL WHERE "revoked_at" IS NULL;
