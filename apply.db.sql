-- =============================================================================
-- apply.db.sql
-- N_COLE Interpress — Vendor & Rider Application System + OTP Login
-- Run this file once in the Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS and DO $$ blocks for enums
-- =============================================================================

-- ─── 1. New enum values on AuditAction ───────────────────────────────────────
-- Prisma enums map to Postgres enums. We add new values safely.

DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPLICATION_SUBMITTED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPLICATION_APPROVED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPLICATION_REJECTED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'OTP_SENT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'OTP_VERIFIED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. New enum: ApplicationStatus ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. New enum: ApplicationRole ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ApplicationRole" AS ENUM ('VENDOR', 'RIDER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 4. applications table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "applications" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "role"            "ApplicationRole"    NOT NULL,
  "status"          "ApplicationStatus" NOT NULL DEFAULT 'PENDING',

  -- Personal info
  "fullName"        TEXT        NOT NULL,
  "email"           TEXT        NOT NULL,
  "phone"           TEXT        NOT NULL,
  "nationalId"      TEXT        NOT NULL,
  "dateOfBirth"     DATE        NOT NULL,
  "address"         TEXT        NOT NULL,
  "district"        TEXT        NOT NULL,
  "province"        TEXT        NOT NULL,
  "photoUrl"        TEXT,

  -- Vendor-specific (required when role = VENDOR)
  "businessName"    TEXT,
  "businessType"    TEXT,
  "businessAddress" TEXT,
  "momoNumber"      TEXT,
  "yearsInBusiness" INTEGER,
  "description"     TEXT,

  -- Rider-specific (required when role = RIDER)
  "vehicleType"     TEXT,
  "plateNumber"     TEXT,
  "licenseNumber"   TEXT,
  "deliveryZone"    TEXT,
  "experience"      TEXT,

  -- Emergency contact (both roles)
  "emergencyName"   TEXT        NOT NULL,
  "emergencyPhone"  TEXT        NOT NULL,

  -- Admin fields
  "reviewedBy"      TEXT,        -- userId of admin who acted
  "reviewNote"      TEXT,
  "reviewedAt"      TIMESTAMP WITH TIME ZONE,

  -- Linked user (set after approval)
  "userId"          TEXT        REFERENCES "users"("id") ON DELETE SET NULL,

  "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "applications_email_idx"  ON "applications"("email");
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "applications_role_idx"   ON "applications"("role");

-- ─── 5. otp_codes table ──────────────────────────────────────────────────────
-- Stores short-lived 6-digit OTP codes for post-login verification.
CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code"      TEXT        NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "usedAt"    TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "otp_codes_userId_idx" ON "otp_codes"("userId");

-- ─── 6. Auto-update updatedAt on applications ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "applications_updated_at" ON "applications";
CREATE TRIGGER "applications_updated_at"
  BEFORE UPDATE ON "applications"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Done ✓
-- Tables created: applications, otp_codes
-- Enum values added: APPLICATION_SUBMITTED, APPLICATION_APPROVED, APPLICATION_REJECTED, OTP_SENT, OTP_VERIFIED
-- Enums created: ApplicationStatus, ApplicationRole
