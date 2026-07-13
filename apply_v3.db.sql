-- =============================================================================
-- apply_v3.db.sql
-- N_COLE Interpress — Incremental migration (v3)
-- Adds: wishlists, wishlist_items, reviews tables
-- Safe to re-run: all statements use IF NOT EXISTS guards.
-- Run in Supabase: Dashboard → SQL Editor → New Query → paste → Run
-- =============================================================================

-- ─── 1. wishlists ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wishlists" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- ─── 2. wishlist_items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "wishlistId" TEXT        NOT NULL REFERENCES "wishlists"("id") ON DELETE CASCADE,
  "productId"  TEXT        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wishlist_items_wishlistId_productId_key" UNIQUE ("wishlistId", "productId")
);

CREATE INDEX IF NOT EXISTS "wishlist_items_wishlistId_idx" ON "wishlist_items"("wishlistId");

-- ─── 3. reviews ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "productId" TEXT        NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "userId"    TEXT        NOT NULL REFERENCES "users"("id")    ON DELETE CASCADE,
  "rating"    INTEGER     NOT NULL,
  "title"     TEXT,
  "body"      TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_productId_userId_key" UNIQUE ("productId", "userId")
);

CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews"("productId");

-- ─── 4. updatedAt triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "wishlists_updated_at" ON "wishlists";
CREATE TRIGGER "wishlists_updated_at"
  BEFORE UPDATE ON "wishlists"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "reviews_updated_at" ON "reviews";
CREATE TRIGGER "reviews_updated_at"
  BEFORE UPDATE ON "reviews"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Done ✓
-- Tables created: wishlists, wishlist_items, reviews
