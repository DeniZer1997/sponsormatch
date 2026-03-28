-- ============================================================
-- Migration 008: Trigger erkennt pending Invite bei Registrierung
-- Wenn jemand über einen Invite-Link registriert, tritt er der
-- bestehenden Org bei statt eine neue zu erstellen.
-- ============================================================

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

  -- Pending Invite für diese E-Mail prüfen
  SELECT * INTO invite
  FROM public.team_invites
  WHERE email = lower(new.email) AND accepted = false
  LIMIT 1;

  IF invite.id IS NOT NULL THEN
    -- === INVITE-FLOW: Bestehender Org beitreten ===
    org_id := invite.organization_id;

    -- Profil anlegen mit Org + Rolle aus Einladung
    INSERT INTO public.profiles (id, name, display_name, organization_id, role)
    VALUES (new.id, user_name, user_name, org_id, invite.role)
    ON CONFLICT (id) DO UPDATE SET
      name            = EXCLUDED.name,
      display_name    = EXCLUDED.display_name,
      organization_id = EXCLUDED.organization_id,
      role            = EXCLUDED.role;

    -- Invite als angenommen markieren
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

    -- 2. Organisation anlegen (owner_id jetzt gültig)
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
