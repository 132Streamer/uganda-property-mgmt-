-- ============================================================
-- Fix: maintenance_requests is missing landlord_id
-- App code (app/landlord/dashboard, app/api/maintenance/*)
-- queries .eq('landlord_id', user.id) directly against this
-- table, but the original migration never added the column.
-- ============================================================

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Backfill landlord_id from the related property for any existing rows
UPDATE maintenance_requests m
SET landlord_id = p.landlord_id
FROM properties p
WHERE m.property_id = p.id
  AND m.landlord_id IS NULL;

ALTER TABLE maintenance_requests
  ALTER COLUMN landlord_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_landlord_id
  ON maintenance_requests(landlord_id);
