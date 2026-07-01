-- ============================================================
-- Uganda Property Management: Core Migration
-- profiles, properties, invitations
--
-- This must run BEFORE units.sql, maintenance.sql, leases.sql,
-- and guest-payments-token.sql, since those tables reference
-- properties(id) and profiles(id) via foreign keys.
-- ============================================================

-- ─── Profiles ───────────────────────────────────────────────
-- One row per auth.users row. Created on signup/invite-accept.

CREATE TYPE user_role AS ENUM ('landlord', 'tenant');

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  role        user_role NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- ─── Properties ─────────────────────────────────────────────

CREATE TYPE property_status AS ENUM ('available', 'occupied', 'unavailable');

CREATE TABLE IF NOT EXISTS properties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  address        TEXT NOT NULL,
  district       TEXT NOT NULL,
  city           TEXT NOT NULL,
  monthly_rent   NUMERIC(12, 2) NOT NULL CHECK (monthly_rent > 0),
  bedrooms       INTEGER,
  bathrooms      INTEGER,
  property_type  TEXT,
  photos         TEXT[] NOT NULL DEFAULT '{}',
  status         property_status NOT NULL DEFAULT 'available',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Some payment-flow queries (e.g. app/guest-pay/[token]/page.tsx) select
  -- properties(name) while the property-creation API writes `title`. Rather
  -- than pick a side and break the other, mirror it as a generated column
  -- until the codebase is reconciled to one field name.
  name           TEXT GENERATED ALWAYS AS (title) STORED
);

ALTER TABLE properties
  ADD CONSTRAINT properties_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES profiles(id);

CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_district    ON properties(district);
CREATE INDEX idx_properties_status      ON properties(status);

-- ─── Invitations ────────────────────────────────────────────
-- Landlord invites a tenant to a unit/property by email; tenant
-- accepts and a profile + tenancy row are created (see accept-invite page).

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE IF NOT EXISTS invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES units(id) ON DELETE CASCADE,
  landlord_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_email    TEXT NOT NULL,
  monthly_rent    NUMERIC(12, 2),
  start_date      DATE,
  status          invitation_status NOT NULL DEFAULT 'pending',
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token        ON invitations(token);
CREATE INDEX idx_invitations_tenant_email ON invitations(tenant_email);
CREATE INDEX idx_invitations_property_id  ON invitations(property_id);

-- ─── updated_at triggers ────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Auto-create profile row on signup ──────────────────────
-- Mirrors app/(auth)/signup/page.tsx, which stores `role` in
-- user_metadata at signup. This keeps profiles in sync even if
-- a client-side insert is skipped.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tenant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: a user can read/update their own profile.
-- Landlords can read tenant profiles for their own properties
-- (needed for maintenance/lease views that join profiles).
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_read_related_landlord"
  ON profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenancies t
      JOIN units u ON u.id = t.unit_id
      JOIN properties p ON p.id = u.property_id
      WHERE t.tenant_id = profiles.id
        AND p.landlord_id = auth.uid()
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Properties: public can read available listings (search page);
-- only the owning landlord can write.
CREATE POLICY "properties_read_available"
  ON properties FOR SELECT USING (status = 'available');

CREATE POLICY "properties_read_own"
  ON properties FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "properties_landlord_write"
  ON properties FOR ALL USING (landlord_id = auth.uid());

-- Invitations: landlord manages their own invitations;
-- invited tenant can read by matching email while pending.
CREATE POLICY "invitations_landlord_manage"
  ON invitations FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "invitations_tenant_read_by_email"
  ON invitations FOR SELECT USING (
    tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );
