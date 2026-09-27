-- ============================================================================
-- Run this AFTER `npx prisma migrate deploy` (or `migrate dev`).
-- Prisma's declarative schema can't express CHECK constraints portably in this
-- version, so the Overnight business rule gets a real DB-level guarantee here
-- in addition to the Zod + service-layer checks. This is defense in depth:
-- even a direct SQL insert or a future bug in the app layer cannot violate it.
-- ============================================================================

-- 1) Overnight business rule (bənd 10), enforced at the database level.
--    A transaction may have a NULL source_organization_id ONLY when its
--    purpose is flagged allows_empty_source = true (i.e. "Overnight sazişi").
--    We enforce this via a trigger because CHECK constraints can't join to
--    another table portably.

CREATE OR REPLACE FUNCTION enforce_overnight_source_rule()
RETURNS TRIGGER AS $$
DECLARE
  purpose_allows_empty BOOLEAN;
BEGIN
  SELECT allows_empty_source INTO purpose_allows_empty
  FROM purposes
  WHERE id = NEW.purpose_id;

  IF NEW.source_organization_id IS NULL AND NOT COALESCE(purpose_allows_empty, FALSE) THEN
    RAISE EXCEPTION
      'Business rule violation: source_organization_id cannot be NULL for this purpose (only Overnight sazişi allows an empty source).';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_overnight_source_rule ON income_transactions;
CREATE TRIGGER trg_enforce_overnight_source_rule
  BEFORE INSERT OR UPDATE ON income_transactions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_overnight_source_rule();

-- 2) Amount must be non-negative (bənd 9: "Məbləğ mənfi ola bilməz").
ALTER TABLE income_transactions
  DROP CONSTRAINT IF EXISTS amount_non_negative;
ALTER TABLE income_transactions
  ADD CONSTRAINT amount_non_negative CHECK (amount >= 0);

-- 3) Fast fuzzy/partial organization search (bənd 7) — trigram index.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm
  ON organizations USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_organizations_short_name_trgm
  ON organizations USING GIN (short_name gin_trgm_ops);

-- searchable_aliases is text[]; unnest + trgm for alias search
CREATE INDEX IF NOT EXISTS idx_organizations_aliases_gin
  ON organizations USING GIN (searchable_aliases);
