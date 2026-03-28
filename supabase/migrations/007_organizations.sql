-- ============================================================
-- Migration 007: Multi-Tenant Organizations (v2 — fixed order)
-- ============================================================

-- ============================================================
-- STEP 1: ORGANIZATIONS Tabelle (noch ohne Policies)
-- ============================================================

CREATE TABLE public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT '',
  owner_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: PROFILES erweitern (organization_id muss VOR den Policies existieren)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  ADD COLUMN IF NOT EXISTS display_name text;

-- ============================================================
-- STEP 3: ORGANIZATIONS Policies (jetzt existiert profiles.organization_id)
-- ============================================================

CREATE POLICY "org_select" ON public.organizations FOR SELECT
  USING (id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org_update" ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- STEP 4: PROFILES Policies updaten
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 5: Hilfsfunktion current_org_id()
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 6: EVENTS organization_id + aktualisierte Policies
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;

CREATE POLICY "events_select" ON public.events FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "events_insert" ON public.events FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "events_update" ON public.events FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "events_delete" ON public.events FOR DELETE
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

-- ============================================================
-- STEP 7: CONTACTS organization_id + aktualisierte Policies
-- ============================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;

CREATE POLICY "contacts_select" ON public.contacts FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE
  USING (
    organization_id = public.current_org_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

-- ============================================================
-- STEP 8: TEAM INVITES
-- ============================================================

CREATE TABLE public.team_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token           uuid NOT NULL DEFAULT gen_random_uuid(),
  accepted        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON public.team_invites FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "invites_insert" ON public.team_invites FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "invites_delete" ON public.team_invites FOR DELETE
  USING (
    organization_id = public.current_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- STEP 9: TRIGGER — Reihenfolge: Profil zuerst, dann Org, dann Update
-- (Löst circular FK: organizations.owner_id → profiles.id)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id    uuid;
  org_name  text;
  user_name text;
BEGIN
  org_name  := COALESCE(NULLIF(new.raw_user_meta_data->>'orgName', ''), 'Meine Organisation');
  user_name := COALESCE(NULLIF(new.raw_user_meta_data->>'name', ''), '');

  -- 1. Profil ohne org_id anlegen (FK-Constraint: Profil muss vor Org existieren)
  INSERT INTO public.profiles (id, name, display_name, role)
  VALUES (new.id, user_name, user_name, 'admin')
  ON CONFLICT (id) DO UPDATE SET
    name         = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    role         = EXCLUDED.role;

  -- 2. Organisation anlegen (owner_id ist jetzt gültig)
  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, new.id)
  RETURNING id INTO org_id;

  -- 3. Profil mit org_id verknüpfen
  UPDATE public.profiles
  SET organization_id = org_id
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 10: DATENMIGRATION — Bestehende User → eigene Org
-- ============================================================

DO $$
DECLARE
  r      RECORD;
  org_id uuid;
BEGIN
  FOR r IN
    SELECT p.id, p.name
    FROM public.profiles p
    WHERE p.organization_id IS NULL
  LOOP
    -- Org anlegen (owner_id ist gültig da Profil existiert)
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NULLIF(r.name, ''), 'Organisation'), r.id)
    RETURNING id INTO org_id;

    -- Profil updaten
    UPDATE public.profiles
    SET organization_id = org_id,
        role            = 'admin',
        display_name    = COALESCE(NULLIF(r.name, ''), name)
    WHERE id = r.id;

    -- Events migrieren
    UPDATE public.events
    SET organization_id = org_id
    WHERE user_id = r.id AND organization_id IS NULL;

    -- Contacts migrieren
    UPDATE public.contacts
    SET organization_id = org_id
    WHERE user_id = r.id AND organization_id IS NULL;
  END LOOP;
END;
$$;
