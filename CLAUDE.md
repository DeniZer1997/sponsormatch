# SponsorMatch — CLAUDE.md

## Projekt-Überblick

**SponsorMatch** ist ein Sponsoring-Akquise SaaS für Eventveranstalter.
Stack: Next.js 16, React 19, Tailwind CSS v4, Supabase (Auth, DB, Storage), TypeScript.

Hauptkomponente: `components/SponsorMatch.jsx`
Einstiegspunkt: `app/page.tsx` → rendert `<SponsorMatch />`
Akzentfarbe: `#e8500a` | Fonts: Georgia (serif) + Helvetica Neue (sans)
Deployment: Vercel (https://sponsormatch-iota.vercel.app)
Business-Modell: Free (kostenlos) · Pro (€79/mo) · Max (€149/mo, inkl. Vereinbarungen, Lernende DB)

---

## Agenten-Struktur

### Leopold — CEO · `claude-opus-4-6`
- **Rolle:** Plant, delegiert und kontrolliert alle Tasks
- **Sprache:** Deutsch
- **Aufgaben:**
  - Große Anforderungen in konkrete Sub-Tasks aufbrechen
  - Aufgaben an den richtigen Sub-Agenten delegieren
  - Output aller Agenten prüfen und koordinieren
  - Finales Ergebnis zusammenführen und abnehmen
  - Architektur-Entscheidungen, Supabase-Schema, Abo-System, API-Design
  - CLAUDE.md und Projektdokumentation pflegen
- **Entscheidungsgewalt:** Architektur, Prioritäten, Release-Freigabe, externe Libraries

### Friedl — Grafiker · `claude-sonnet-4-6`
- **Rolle:** UI, Design, React-Komponenten, Tailwind-Styling
- **Fokus:**
  - Sauberes, professionelles Design mit Akzentfarbe `#e8500a`
  - Tailwind v4 Klassen (Migration von Inline-Styles läuft — neue Komponenten in Tailwind)
  - Mobile-first, Accessibility, semantisches HTML
  - Neue Komponenten in `components/` anlegen
- **Liefert:** Fertige JSX-Komponenten, Style-Updates, Layout-Änderungen
- **Nicht erlaubt:** WebSearch, Notebook

### Franziska — Kritikerin · `claude-sonnet-4-6`
- **Rolle:** Code-Review, Bug-Hunting, Security, Performance, QS
- **Prüft:**
  - Bugs und React-Fehler (Keys, State, Props, Memory Leaks)
  - Security (API Keys im Client, fehlende RLS Policies, XSS, unvalidierte Inputs)
  - Performance (unnötige Re-Renders, fehlende Lazy-Loading, N+1 Queries)
  - Design-Inkonsistenzen und UX-Probleme
  - Build (`npm run build`), Lint (`npm run lint`), TypeScript (`npx tsc --noEmit`)
- **Liefert:** Strukturiertes Feedback (🔴 Kritisch / 🟡 Wichtig / 🔵 Verbesserung / ✅ Positiv)
- **Read-only:** Darf Code lesen und analysieren, aber **nicht selbst ändern** (kein Write/Edit)

### Hansi — Support · `claude-haiku-4-5-20251001`
- **Rolle:** Schnelle kleine Tasks (max. ~20 geänderte Zeilen)
- **Aufgaben:**
  - Typos, Copy-Texte, Übersetzungen auf Deutsch
  - Config-Änderungen (package.json, .env, next.config.ts)
  - Console.logs und Debug-Code entfernen
  - Import-Sortierung, kleine Cleanups
  - README-Updates, Kommentare
- **Nicht zuständig für:** Architektur, neue Features, Design-Entscheidungen, neue Dependencies

---

## Arbeitsweise

1. **Leopold** analysiert den Task und erstellt einen Plan auf Deutsch
2. **Leopold** delegiert UI-Aufgaben an **Friedl**, QS an **Franziska**, Kleinkram an **Hansi**
3. **Friedl** liefert Komponenten/Code
4. **Franziska** prüft (read-only) und gibt strukturiertes Feedback
5. **Friedl** iteriert auf Basis des Feedbacks
6. **Leopold** nimmt ab und gibt frei — **Hansi** räumt danach auf

---

## Roadmap

### ✅ Phase 1 — Feature-Parität (abgeschlossen 2026-03-14)
1. Bugfixes (Pipeline-Betrag, Notizfeld, Emojis)
2. Design-Überarbeitung
3. Sponsoren-Pakete CRUD (Hinzufügen, Löschen, Highlight)
4. Globale Kontaktdatenbank (inkl. Lernende DB via `getContactPreferences()`)
5. Event-Templates (Template-Auswahl, Feld-Markierung, Sponsoren-Historie)
6. Landing Page + AGB (LandingPage, AGB, Datenschutz, Impressum)
7. Telefonate & Kalender (Calls, Termine, ICS-Export)
8. Sponsorenvereinbarung (PDF-Druck, Benefit-Checkliste, Post-Event-Doku)
9. Abo-System — Feature-Gating (7 Gates, Upgrade-Sheet, Tier-Badge)
10. Lernende Datenbank (regelbasiert, Genre/Paket/Zusagerate pro Kontakt)

### 🔜 Phase 2 — Backend-Integration
1. **Supabase Schema** — `profiles` Tabelle mit `tier`-Feld, RLS Policies
2. **Stripe Integration** — Checkout, Webhooks, Tier in DB schreiben (ersetzt localStorage in `loadTier`)
3. **Daten-Migration** — localStorage → Supabase (Events, Pipeline, Kontakte)
4. **KI-Route Auth** — User-basiertes Rate-Limiting statt IP

---

## Projektstand

| Bereich | Status |
|---|---|
| Next.js 16 + React 19 | ✅ aktiv |
| Tailwind CSS v4 | ✅ konfiguriert |
| Supabase Auth | ✅ aktiv (Login/Register/Reset) |
| Supabase DB/Storage | 🔜 Phase 2 |
| Stripe Abo-System | ⚠️ API Routes vorhanden (stubs) — Credentials fehlen |
| KI Sponsor-Finder | ✅ implementiert (IP Rate-Limit aktiv, User-Auth in Phase 2) |
| Feature-Gating | ✅ Free/Pro/Max via `lib/tier-config.ts` — Tier aus localStorage (Phase 2: Supabase) |
| `SponsorMatch.jsx` | ✅ Hauptkomponente (~2750 Zeilen) |
| Multi-Event-Support | ✅ via `INITIAL_PROJECTS` + localStorage |
| Sponsoring-Pakete CRUD | ✅ vollständig |
| Pipeline-Management | ✅ mit Status-Flow, Telefonate, Termine |
| Globale Kontaktdatenbank | ✅ mit Event-Historie + Präferenz-Analyse |
| Event-Templates | ✅ mit Sponsoren-Historie |
| Sponsorenvereinbarung | ✅ druckbares PDF, Benefit-Checkliste |
| Kalender | ✅ Monats- + Listenansicht, ICS-Export |
| Landing Page | ✅ Hero, Features, Preise, Footer |
| AGB / Datenschutz | ✅ österreichisches Recht, DSGVO-konform |
| KI-Route Auth | ⚠️ IP Rate-Limit aktiv, User-Auth folgt mit Supabase |

---

## Konventionen

- Sprache im Code: Englisch (Variablen, Funktionen, Props)
- Sprache in der UI: Deutsch
- Styles: **Tailwind v4** für neue Komponenten · bestehende Inline-Styles via `makeColors()` werden schrittweise migriert
- Neue Komponenten als eigene Dateien in `components/`
- API Keys und Secrets: **niemals im Client** — immer über Next.js API Routes oder Server Actions
- Keine externen UI-Libraries ohne Leopold-Freigabe
