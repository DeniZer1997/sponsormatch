# Supabase Setup — Schritt-für-Schritt

## 1. Supabase-Projekt anlegen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle einen Account (oder logge dich ein)
2. Klicke auf **New Project**
3. Wähle einen Namen (z.B. `sponsormatch`) und ein sicheres Datenbank-Passwort
4. Wähle die Region **eu-central-1 (Frankfurt)** für niedrige Latenz
5. Klicke auf **Create new project** und warte, bis das Projekt bereit ist

## 2. SQL-Migration ausführen

1. Gehe im Supabase Dashboard zu **SQL Editor** (linkes Menü)
2. Klicke auf **New query**
3. Kopiere den gesamten Inhalt von `supabase/migrations/001_initial_schema.sql` und füge ihn ein
4. Klicke auf **Run** — alle Tabellen, Policies und Trigger werden erstellt

### Was die Migration erstellt:
- **profiles** — Benutzerprofil (Name, Akzentfarbe, Logo, Social Links, MwSt-Satz)
- **subscriptions** — Abo-Verwaltung (Tier: free/pro/max, Stripe-Verknüpfung)
- **Trigger** — Automatische Profil- und Subscription-Erstellung bei Registrierung
- **RLS Policies** — Jeder User sieht nur seine eigenen Daten

## 3. Env-Vars finden und eintragen

1. Gehe zu **Settings > API** im Supabase Dashboard
2. Kopiere folgende Werte in deine `.env.local`:

| Variable | Wo zu finden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (z.B. `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys > `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys > `service_role` (geheim halten!) |

## 4. Auth-Settings konfigurieren

1. Gehe zu **Authentication > URL Configuration**
2. Setze **Site URL** auf: `http://localhost:3000` (für Entwicklung)
3. Unter **Redirect URLs** füge hinzu:
   - `http://localhost:3000/**`
   - `https://sponsormatch-iota.vercel.app/**` (für Produktion)

### E-Mail-Templates (optional)

Unter **Authentication > Email Templates** kannst du die E-Mails auf Deutsch anpassen:
- **Confirm signup** — Registrierungsbestätigung
- **Reset password** — Passwort zurücksetzen
- **Magic Link** — Passwortloser Login

## 5. Stripe (später — Phase 3)

Die Stripe-Variablen in `.env.local` werden erst benötigt, wenn du einen Stripe-Account einrichtest.
Die API-Routes (`/api/stripe/*`) geben bis dahin einen 503-Statuscode zurück.
