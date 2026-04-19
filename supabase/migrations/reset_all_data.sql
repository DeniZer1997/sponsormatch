-- ============================================================
-- RESET: Alle Daten und User löschen — sauberer Neustart
-- ============================================================
-- ACHTUNG: Nur einmalig ausführen! Löscht ALLES unwiderruflich.
-- ============================================================

-- Reihenfolge wichtig wegen FK-Constraints

-- 1. Invite-Daten
TRUNCATE public.team_invites CASCADE;

-- 2. Event-Daten (cascade löscht pipeline, packages, mehrwert, gallery, calls, appointments)
TRUNCATE public.calls CASCADE;
TRUNCATE public.appointments CASCADE;
TRUNCATE public.pipeline CASCADE;
TRUNCATE public.event_gallery CASCADE;
TRUNCATE public.packages CASCADE;
TRUNCATE public.event_mehrwert CASCADE;
TRUNCATE public.events CASCADE;

-- 3. Kontakte
TRUNCATE public.contacts CASCADE;

-- 4. Subscriptions
TRUNCATE public.subscriptions CASCADE;

-- 5. Profiles (cascade von auth.users)
TRUNCATE public.profiles CASCADE;

-- 6. Organisationen
TRUNCATE public.organizations CASCADE;

-- 7. Auth-User löschen (löscht auch profiles via CASCADE)
DELETE FROM auth.users;
