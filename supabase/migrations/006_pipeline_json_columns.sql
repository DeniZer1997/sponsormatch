-- Migration 006: Fehlende JSONB-Spalten in pipeline-Tabelle
-- Wird benötigt für: Sponsorenvereinbarung, Post-Event-Dokumentation,
-- Sponsoren-Materialien und Paket-Extras (Persistenz über Supabase)

ALTER TABLE pipeline
  ADD COLUMN IF NOT EXISTS agreement jsonb,
  ADD COLUMN IF NOT EXISTS post_event_doc jsonb,
  ADD COLUMN IF NOT EXISTS sponsor_materials jsonb,
  ADD COLUMN IF NOT EXISTS package_extras jsonb;

-- done-Feld für appointments (markiert erledigte Termine)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS done boolean DEFAULT false;
