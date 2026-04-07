-- Migration 011: Fehlende Spalten in calls-Tabelle
ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS done boolean DEFAULT false;
