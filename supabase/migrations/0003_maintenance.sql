-- Maintenance request status enum
CREATE TYPE maintenance_status AS ENUM (
  'submitted',
  'acknowledged',
  'in_progress',
  'resolved'
);

-- Maintenance requests table
CREATE TABLE maintenance_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  status        maintenance_status NOT NULL DEFAULT 'submitted',
  landlord_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX idx_maintenance_requests_property_id ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_requests_tenant_id   ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_status       ON maintenance_requests(status);

-- RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Tenants: read own requests, insert own requests
CREATE POLICY "tenant_read_own_requests" ON maintenance_requests
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "tenant_insert_own_requests" ON maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Landlords: read + update requests for their properties
CREATE POLICY "landlord_read_property_requests" ON maintenance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = maintenance_requests.property_id
        AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "landlord_update_property_requests" ON maintenance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = maintenance_requests.property_id
        AND properties.landlord_id = auth.uid()
    )
  );
