-- =============================================================================
-- apply_v2.db.sql
-- N_COLE Interpress — Incremental migration (v2)
-- Apply ONLY on databases that already have apply.db.sql applied.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE guards.
--
-- What this file adds:
--   1. Missing indexes on activity_logs (should already exist via Prisma push,
--      included here as a safety net for manual Supabase setups)
--   2. set_updated_at trigger on otp_codes (otp_codes has no updatedAt column
--      so this block is intentionally omitted — confirmed correct)
--   3. Composite index on activity_logs(entity, entityId) missing from v1
--   4. No new tables — all models already exist after apply.db.sql
-- =============================================================================

-- ─── 1. Ensure activity_logs table exists (Prisma push target) ───────────────
-- This table is managed by Prisma directly. Included here only as a fallback
-- for Supabase projects where `prisma db push` has NOT been run.

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        REFERENCES "users"("id") ON DELETE SET NULL,
  "action"    "AuditAction" NOT NULL,
  "entity"    TEXT,
  "entityId"  TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- ─── 2. Indexes on activity_logs ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx"
  ON "activity_logs"("userId");

CREATE INDEX IF NOT EXISTS "activity_logs_action_idx"
  ON "activity_logs"("action");

CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx"
  ON "activity_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "activity_logs_entity_entityId_idx"
  ON "activity_logs"("entity", "entityId");

-- ─── 3. Verify applications indexes (idempotent — already in v1) ─────────────
CREATE INDEX IF NOT EXISTS "applications_email_idx"  ON "applications"("email");
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "applications_role_idx"   ON "applications"("role");

-- ─── 4. Verify otp_codes index (idempotent — already in v1) ─────────────────
CREATE INDEX IF NOT EXISTS "otp_codes_userId_idx" ON "otp_codes"("userId");

-- ─── 5. Grant usage (Supabase service role already has these; safe to skip) ──
-- No explicit GRANT statements needed — Supabase handles role permissions.

-- Done ✓
-- No new tables created.
-- activity_logs table and all indexes ensured.
-- Safe to re-run on any database state.
