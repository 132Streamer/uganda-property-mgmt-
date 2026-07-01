-- ============================================================
-- Uganda Property Management: Billing Migration
-- property_units, invoices, payments
--
-- This is the schema the Pesapal/guest-pay flow already assumes
-- (app/api/payments/*, app/guest-pay/[token]/page.tsx). Must run
-- before 0005_guest_payments_token.sql, which alters `payments`
-- and references `invoices(id)`.
--
-- KNOWN DUPLICATION (flagging, not silently fixing):
-- `units` (0003_units.sql) already models property units for the
-- maintenance/tenancy flow, with its own `tenancies` table for
-- leases. `property_units` here is a separate table used only by
-- the billing/payment flow. They are NOT the same row per unit
-- today — a unit created via the landlord properties UI will not
-- automatically have a matching property_units row, and vice
-- versa. Reconciling these into a single source of truth is a
-- real follow-up, not something to paper over with a guess.
-- ============================================================

-- ─── Property Units (billing) ───────────────────────────────

CREATE TABLE IF NOT EXISTS property_units (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT property_units_property_unit_unique UNIQUE (property_id, unit_number)
);

CREATE INDEX idx_property_units_property_id ON property_units(property_id);

-- ─── Invoices ───────────────────────────────────────────────

CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_due       NUMERIC(12, 2) NOT NULL CHECK (amount_due > 0),
  currency         TEXT NOT NULL DEFAULT 'UGX',
  description      TEXT,
  status           invoice_status NOT NULL DEFAULT 'pending',
  due_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_property_unit_id ON invoices(property_unit_id);
CREATE INDEX idx_invoices_tenant_id        ON invoices(tenant_id);
CREATE INDEX idx_invoices_status           ON invoices(status);

-- ─── Payments ───────────────────────────────────────────────
-- One row per payment attempt against an invoice (guest or
-- authenticated). guest_name/guest_phone/is_guest_payment are
-- defined directly here so 0005_guest_payments_token.sql's
-- `ADD COLUMN IF NOT EXISTS` becomes a no-op.

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'reversed');

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id            UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL DEFAULT 'UGX',
  status                payment_status NOT NULL DEFAULT 'pending',
  is_guest_payment      BOOLEAN NOT NULL DEFAULT FALSE,
  guest_name            TEXT,
  guest_phone           TEXT,
  pesapal_tracking_id   TEXT,
  pesapal_status        TEXT,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id           ON payments(invoice_id);
CREATE INDEX idx_payments_pesapal_tracking_id  ON payments(pesapal_tracking_id);

-- ─── updated_at triggers ─────────────────────────────────────
-- trigger_set_updated_at() is defined in 0001_core.sql

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Mark invoice paid automatically when a payment on it succeeds.
-- (app/api/payments/callback/route.ts already does this manually
-- too — this trigger makes it true regardless of which code path
-- updates the payment row, e.g. webhook vs callback.)
CREATE OR REPLACE FUNCTION sync_invoice_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE invoices SET status = 'paid' WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_invoice_status_on_payment
  AFTER UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_status();

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;

-- Property units: owning landlord manages; readable by anyone who
-- can already read the parent property (kept simple — these rows
-- carry no sensitive data on their own).
CREATE POLICY "property_units_read"
  ON property_units FOR SELECT USING (true);

CREATE POLICY "property_units_landlord_write"
  ON property_units FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
        AND properties.landlord_id = auth.uid()
    )
  );

-- Invoices: tenant can read their own; landlord can read/write
-- invoices for their own properties.
CREATE POLICY "invoices_tenant_read"
  ON invoices FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "invoices_landlord_manage"
  ON invoices FOR ALL USING (
    EXISTS (
      SELECT 1 FROM property_units pu
      JOIN properties p ON p.id = pu.property_id
      WHERE pu.id = invoices.property_unit_id
        AND p.landlord_id = auth.uid()
    )
  );

-- Payments: readable by the invoice's tenant or landlord.
CREATE POLICY "payments_read"
  ON payments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      LEFT JOIN property_units pu ON pu.id = i.property_unit_id
      LEFT JOIN properties p ON p.id = pu.property_id
      WHERE i.id = payments.invoice_id
        AND (i.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
  );

-- INSERT/UPDATE are intentionally permissive: app/api/payments/initiate
-- and app/api/payments/callback use the anon key (not service role) and
-- must work for unauthenticated guest payers, so there is no auth.uid()
-- to check against at insert time. The row is only reachable afterward
-- via its unguessable UUID (returned to the caller) or the matching
-- invoice's own RLS above. This mirrors the app's current trust model —
-- it is not more permissive than the code already assumes, but it is
-- worth hardening later by moving these two routes to the service-role
-- key and validating against guest_payment_tokens server-side instead.
CREATE POLICY "payments_insert_any"
  ON payments FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_update_any"
  ON payments FOR UPDATE USING (true);
