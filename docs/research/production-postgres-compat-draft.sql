-- MediaClaw production PostgreSQL compatibility draft.
-- Generated for review only on 2026-06-30.
--
-- Purpose:
--   Make the old production PostgreSQL schema additive-compatible with the
--   current mediaclawweb PostgreSQL schema before testing a Hyperdrive-backed
--   production candidate Worker.
--
-- Safety:
--   This draft is intentionally additive: CREATE TABLE IF NOT EXISTS,
--   ALTER TABLE ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, and
--   conservative backfills. It does not drop, rename, or truncate anything.
--
-- IMPORTANT:
--   The final statement is ROLLBACK so accidental execution does not mutate
--   production. After review, change the final ROLLBACK to COMMIT for an
--   approved maintenance-window run.

BEGIN;

SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

-- ---------------------------------------------------------------------------
-- Columns expected by the new code on existing tables
-- ---------------------------------------------------------------------------

ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "partner_id" text,
  ADD COLUMN IF NOT EXISTS "variant_id" text,
  ADD COLUMN IF NOT EXISTS "seat_count" integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "price_rule_snapshot" text;

CREATE INDEX IF NOT EXISTS "idx_order_user_status_payment_type"
  ON "order" ("user_id", "status", "payment_type");
CREATE INDEX IF NOT EXISTS "idx_order_transaction_provider"
  ON "order" ("transaction_id", "payment_provider");
CREATE INDEX IF NOT EXISTS "idx_order_created_at"
  ON "order" ("created_at");

ALTER TABLE "apikey"
  ADD COLUMN IF NOT EXISTS "key_hash" text,
  ADD COLUMN IF NOT EXISTS "key_prefix" text;

-- Old production currently has 0 apikey rows. If that changes before cutover,
-- backfill key_hash from the old plaintext key with application code or
-- pgcrypto digest(), then rotate any persisted plaintext keys.
CREATE INDEX IF NOT EXISTS "idx_apikey_user_status"
  ON "apikey" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_apikey_keyhash_status"
  ON "apikey" ("key_hash", "status");

-- Old production credential columns were stricter than the current app
-- schema. The app writes null for optional ownership/source/partner fields.
ALTER TABLE "credential"
  ALTER COLUMN "owner_user_id" DROP NOT NULL,
  ALTER COLUMN "source_order_no" DROP NOT NULL,
  ALTER COLUMN "partner_id" DROP NOT NULL,
  ALTER COLUMN "variant_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_credential_owner_status"
  ON "credential" ("owner_user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_credential_source_order"
  ON "credential" ("source_order_no");
CREATE INDEX IF NOT EXISTS "idx_credential_partner"
  ON "credential" ("partner_id", "variant_id");

ALTER TABLE "referral_commission"
  ADD COLUMN IF NOT EXISTS "referrer_user_id" text,
  ADD COLUMN IF NOT EXISTS "invitee_user_id" text,
  ADD COLUMN IF NOT EXISTS "amount" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS "rate" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reason" text;

UPDATE "referral_commission" AS rc
SET
  "referrer_user_id" = COALESCE(rc."referrer_user_id", rc."user_id"),
  "invitee_user_id" = COALESCE(rc."invitee_user_id", rr."referee_id"),
  "amount" = CASE
    WHEN rc."amount" = 0 THEN rc."commission_amount"
    ELSE rc."amount"
  END,
  "currency" = COALESCE(NULLIF(lower(rc."currency"), ''), lower(rc."commission_currency"), 'usd'),
  "rate" = CASE
    WHEN rc."rate" = 0 THEN rc."commission_rate"
    ELSE rc."rate"
  END,
  "reason" = COALESCE(rc."reason", rc."commission_type", rc."cancel_reason")
FROM "referral_relation" AS rr
WHERE rc."relation_id" = rr."id";

CREATE INDEX IF NOT EXISTS "idx_referral_commission_referrer"
  ON "referral_commission" ("referrer_user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_referral_commission_order"
  ON "referral_commission" ("order_no");

ALTER TABLE "referral_withdrawal"
  ADD COLUMN IF NOT EXISTS "account_info" text,
  ADD COLUMN IF NOT EXISTS "reviewer_user_id" text,
  ADD COLUMN IF NOT EXISTS "reason" text;

UPDATE "referral_withdrawal"
SET
  "account_info" = COALESCE("account_info", "contact_snapshot"),
  "reviewer_user_id" = COALESCE("reviewer_user_id", "reviewed_by"),
  "reason" = COALESCE("reason", "review_note");

CREATE INDEX IF NOT EXISTS "idx_referral_withdrawal_user_status"
  ON "referral_withdrawal" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_referral_withdrawal_status"
  ON "referral_withdrawal" ("status");

-- ---------------------------------------------------------------------------
-- New tables expected by the current code
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "referral_account" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE cascade,
  "invite_code" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'active',
  "total_invitees" integer NOT NULL DEFAULT 0,
  "total_commission" integer NOT NULL DEFAULT 0,
  "available_commission" integer NOT NULL DEFAULT 0,
  "pending_commission" integer NOT NULL DEFAULT 0,
  "withdrawn_commission" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'usd',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_referral_account_user"
  ON "referral_account" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_referral_account_code"
  ON "referral_account" ("invite_code");

INSERT INTO "referral_account" (
  "id",
  "user_id",
  "invite_code",
  "status",
  "total_invitees",
  "total_commission",
  "available_commission",
  "pending_commission",
  "withdrawn_commission",
  "currency",
  "created_at",
  "updated_at"
)
SELECT
  'refacct_' || u."id",
  u."id",
  u."referral_code",
  COALESCE(NULLIF(u."referral_status", ''), 'active'),
  COALESCE(rel."total_invitees", 0),
  COALESCE(b."available_amount", 0) + COALESCE(b."pending_amount", 0) + COALESCE(b."withdrawn_amount", 0),
  COALESCE(b."available_amount", 0),
  COALESCE(b."pending_amount", 0) + COALESCE(b."locked_amount", 0),
  COALESCE(b."withdrawn_amount", 0),
  lower(COALESCE(NULLIF(b."currency", ''), 'usd')),
  COALESCE(b."created_at", u."created_at", now()),
  COALESCE(b."updated_at", u."updated_at", now())
FROM "user" AS u
LEFT JOIN "referral_balance" AS b
  ON b."user_id" = u."id"
LEFT JOIN (
  SELECT "referrer_id", count(*)::integer AS "total_invitees"
  FROM "referral_relation"
  GROUP BY "referrer_id"
) AS rel
  ON rel."referrer_id" = u."id"
WHERE u."referral_code" IS NOT NULL
  AND u."referral_code" <> ''
ON CONFLICT ("user_id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "partner" (
  "id" text PRIMARY KEY NOT NULL,
  "partner_code" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "type" text NOT NULL DEFAULT 'supplier',
  "status" text NOT NULL DEFAULT 'active',
  "owner_user_id" text REFERENCES "user"("id") ON DELETE set null,
  "owner_email" text,
  "variant_id" text,
  "contract_status" text NOT NULL DEFAULT 'draft',
  "seat_limit" integer NOT NULL DEFAULT 0,
  "used_seats" integer NOT NULL DEFAULT 0,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_partner_code"
  ON "partner" ("partner_code");
CREATE INDEX IF NOT EXISTS "idx_partner_owner"
  ON "partner" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "idx_partner_status"
  ON "partner" ("status");

CREATE TABLE IF NOT EXISTS "ticket" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "title" text NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ticket_user"
  ON "ticket" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ticket_status"
  ON "ticket" ("status");

CREATE TABLE IF NOT EXISTS "ticket_message" (
  "id" text PRIMARY KEY NOT NULL,
  "ticket_id" text NOT NULL REFERENCES "ticket"("id"),
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "role" text NOT NULL DEFAULT 'user',
  "content" text NOT NULL,
  "attachments" text NOT NULL DEFAULT '[]',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ticket_message_ticket"
  ON "ticket_message" ("ticket_id");

CREATE TABLE IF NOT EXISTS "invite_code" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "max_uses" integer NOT NULL DEFAULT 1,
  "used_count" integer NOT NULL DEFAULT 0,
  "trial_days" integer NOT NULL DEFAULT 15,
  "note" text DEFAULT '',
  "created_by" text REFERENCES "user"("id"),
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_invite_code_code"
  ON "invite_code" ("code");

CREATE TABLE IF NOT EXISTS "user_invite" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "invite_code_id" text NOT NULL REFERENCES "invite_code"("id"),
  "activated_at" timestamp NOT NULL DEFAULT now(),
  "trial_ends_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_invite_user"
  ON "user_invite" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_invite_code"
  ON "user_invite" ("invite_code_id");

-- ---------------------------------------------------------------------------
-- Review queries
-- ---------------------------------------------------------------------------

SELECT 'present_order_compat_columns' AS check_name, count(*) AS count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order'
  AND column_name IN ('partner_id', 'variant_id', 'seat_count', 'price_rule_snapshot');

SELECT 'referral_commission_missing_referrer' AS check_name, count(*) AS count
FROM "referral_commission"
WHERE "referrer_user_id" IS NULL;

SELECT 'referral_account_rows' AS check_name, count(*) AS count
FROM "referral_account";

-- Keep accidental executions non-mutating. Change to COMMIT only after review.
ROLLBACK;
