-- ============================================================
-- Migration 007b: Catch-Up — team_invites + Trigger + Ablaufdatum
-- Führe diese Migration aus wenn 007 teilweise fehlgeschlagen ist
-- und team_invites noch nicht existiert.
-- Idempotent: alle Statements sind sicher mehrfach ausführbar.
-- ============================================================

-- STEP 1: team_invites Tabelle (falls fehlt)
CREATE TABLE IF NOT EXISTS public.team_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token           uuid NOT NULL DEFAULT gen_random_uuid(),
  accepted        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz DEFAULT now() + interval '7 days',
  UNIQUE (organization_id, email)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- STEP 2: Policies (sicher wiederholbar)
DROP POLICY IF EXISTS "invites_select" ON public.team_invites;
CREATE POLICY "invites_select" ON public.team_invites FOR SELECT
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "invites_insert" ON public.team_invites;
CREATE POLICY "invites_insert" ON public.team_invites FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "invites_delete" ON public.team_invites;
CREATE POLICY "invites_delete" ON public.team_invites FOR DELETE
  USING (
    organization_id = public.current_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- STEP 3: Trigger mit Invite-Erkennung + Ablaufdatum-Check (008 + 009 kombiniert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id    uuid;
  org_name  text;
  user_name text;
  invite    RECORD;
BEGIN
  org_name  := COALESCE(NULLIF(new.raw_user_meta_data->>'orgName', ''), 'Meine Organisation');
  user_name := COALESCE(NULLIF(new.raw_user_meta_data->>'name', ''), '');

  -- Pending, nicht abgelaufenen Invite für diese E-Mail prüfen
  SELECT * INTO invite
  FROM public.team_invites
  WHERE email = lower(new.email)
    AND accepted = false
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite.id IS NOT NULL THEN
    -- === INVITE-FLOW: Bestehender Org beitreten ===
    org_id := invite.organization_id;

    INSERT INTO public.profiles (id, name, display_name, organization_id, role)
    VALUES (new.id, user_name, user_name, org_id, invite.role)
    ON CONFLICT (id) DO UPDATE SET
      name            = EXCLUDED.name,
      display_name    = EXCLUDED.display_name,
      organization_id = EXCLUDED.organization_id,
      role            = EXCLUDED.role;

    UPDATE public.team_invites SET accepted = true WHERE id = invite.id;

  ELSE
    -- === NORMAL-FLOW: Neue Org anlegen ===

    -- 1. Profil zuerst (owner_id FK-Constraint)
    INSERT INTO public.profiles (id, name, display_name, role)
    VALUES (new.id, user_name, user_name, 'admin')
    ON CONFLICT (id) DO UPDATE SET
      name         = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      role         = EXCLUDED.role;

    -- 2. Organisation anlegen
    INSERT INTO public.organizations (name, owner_id)
    VALUES (org_name, new.id)
    RETURNING id INTO org_id;

    -- 3. Profil mit Org verknüpfen
    UPDATE public.profiles
    SET organization_id = org_id
    WHERE id = new.id;

  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
