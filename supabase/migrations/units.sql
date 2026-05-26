-- ============================================================
-- Uganda Property Management: Units & Tenancies Migration
-- ============================================================

-- Unit status enum
CREATE TYPE unit_status AS ENUM ('vacant', 'occupied');

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number   TEXT NOT NULL,
  floor         INTEGER,
  status        unit_status NOT NULL DEFAULT 'vacant',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT units_property_unit_unique UNIQUE (property_id, unit_number)
);

-- Tenancies table
CREATE TABLE IF NOT EXISTS tenancies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id          UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  start_date       DATE NOT NULL,
  end_date         DATE,
  monthly_rent_ugx NUMERIC(12, 2) NOT NULL CHECK (monthly_rent_ugx > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tenancy_dates_valid CHECK (end_date IS NULL OR end_date > start_date)
);

-- Indexes
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status      ON units(status);
CREATE INDEX idx_tenancies_unit_id ON tenancies(unit_id);
CREATE INDEX idx_tenancies_tenant  ON tenancies(tenant_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_tenancies_updated_at
  BEFORE UPDATE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Sync unit status when tenancy is inserted/deleted
CREATE OR REPLACE FUNCTION sync_unit_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE units SET status = 'occupied' WHERE id = NEW.unit_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Mark vacant only if no other active tenancy exists
    IF NOT EXISTS (
      SELECT 1 FROM tenancies
      WHERE unit_id = OLD.unit_id
        AND id <> OLD.id
        AND (end_date IS NULL OR end_date > NOW())
    ) THEN
      UPDATE units SET status = 'vacant' WHERE id = OLD.unit_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_unit_status_on_tenancy
  AFTER INSERT OR DELETE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION sync_unit_status();

-- RLS
ALTER TABLE units     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;

-- Public read access to units
CREATE POLICY "units_read_all"
  ON units FOR SELECT USING (true);

-- Only property owner can insert/update/delete units
CREATE POLICY "units_owner_write"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Tenants can read their own tenancies; owners can read all for their properties
CREATE POLICY "tenancies_read"
  ON tenancies FOR SELECT
  USING (
    tenant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE u.id = tenancies.unit_id
        AND p.owner_id = auth.uid()
    )
  );

-- Only property owner can manage tenancies
CREATE POLICY "tenancies_owner_write"
  ON tenancies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE u.id = tenancies.unit_id
        AND p.owner_id = auth.uid()
    )
  );