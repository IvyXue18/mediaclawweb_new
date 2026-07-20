-- MediaClaw starter-card deduction reservation migration for PostgreSQL.
--
-- Review workflow:
--   1. Run this file as-is. The final ROLLBACK validates it without persisting.
--   2. Confirm the duplicate guard does not raise an exception.
--   3. In an approved maintenance window, change only the final ROLLBACK to
--      COMMIT and run the reviewed copy against production.

BEGIN;

SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS "account_style_profile" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "platform" text NOT NULL,
  "platform_blogger_id" text NOT NULL,
  "blogger_name" text,
  "blogger_url" text,
  "source_type" text DEFAULT 'standard' NOT NULL,
  "sample_count" integer DEFAULT 0 NOT NULL,
  "detail_sample_count" integer DEFAULT 0 NOT NULL,
  "comment_sample_count" integer DEFAULT 0 NOT NULL,
  "confidence_level" text DEFAULT 'medium' NOT NULL,
  "profile_json" text DEFAULT '{}' NOT NULL,
  "editable_json" text DEFAULT '{}' NOT NULL,
  "sample_summary_json" text DEFAULT '{}' NOT NULL,
  "last_analyzed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS
  "account_style_profile_user_platform_blogger_unique"
  ON "account_style_profile" (
    "user_id",
    "platform",
    "platform_blogger_id"
  );

CREATE INDEX IF NOT EXISTS "idx_account_style_profile_user_updated"
  ON "account_style_profile" ("user_id", "updated_at");

ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "starter_browser_install_hash" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "deduction_reservation_key" text;

CREATE INDEX IF NOT EXISTS "idx_order_starter_browser"
  ON "order" ("starter_browser_install_hash", "product_id", "status");

-- Existing active/paid deduction orders must be unique per user before the
-- reservation key is backfilled. Abort instead of silently choosing one if
-- production already contains a double deduction that needs manual review.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "order"
    WHERE "discount_code" = 'trial_deduction'
      AND COALESCE("discount_amount", 0) > 0
      AND "status" IN ('created', 'pending', 'paid')
      AND "deleted_at" IS NULL
    GROUP BY "user_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'duplicate active trial_deduction orders exist; review them before migration';
  END IF;
END
$$;

UPDATE "order"
SET "deduction_reservation_key" = "user_id" || ':trial_deduction'
WHERE "discount_code" = 'trial_deduction'
  AND COALESCE("discount_amount", 0) > 0
  AND "status" IN ('created', 'pending', 'paid')
  AND "deleted_at" IS NULL
  AND "deduction_reservation_key" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_deduction_reservation"
  ON "order" ("deduction_reservation_key");

ROLLBACK;
