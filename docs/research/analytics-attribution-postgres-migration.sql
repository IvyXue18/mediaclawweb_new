-- MediaClaw analytics attribution migration for PostgreSQL / Neon.
--
-- Safety workflow:
--   1. Review this additive migration.
--   2. Run it as-is to validate the statements; it ends with ROLLBACK.
--   3. Only after review, copy it to a temporary file and replace the final
--      ROLLBACK with COMMIT before applying it to production.

BEGIN;

ALTER TABLE "event_log"
  ADD COLUMN IF NOT EXISTS "utm_content" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "utm_term" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "channel" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "landing_page" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_confidence" text NOT NULL DEFAULT '';

ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "attribution_anonymous_id" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_session_id" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_channel" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_source" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_medium" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_campaign" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_content" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_referrer" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_landing_page" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_confidence" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "attribution_snapshot" text;

-- Deliberately no new indexes here. Orders are low-volume and the analytics
-- endpoint filters them by the existing status/created_at access paths. Avoid
-- paying extra write/storage cost until query metrics justify an index.

ROLLBACK;
