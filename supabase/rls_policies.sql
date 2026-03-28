-- Row Level Security (RLS) Policies für SponsorMatch
-- Alle Tabellen sind user_id-scoped. Policies prüfen auth.uid() gegen user_id oder über FK-Kette.

-- ============================================================================
-- EVENTS — Direct user_id check
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_select" ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "events_insert" ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update" ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_delete" ON events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CONTACTS — Direct user_id check
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select" ON contacts;
DROP POLICY IF EXISTS "contacts_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_update" ON contacts;
DROP POLICY IF EXISTS "contacts_delete" ON contacts;

CREATE POLICY "contacts_select" ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert" ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EVENT_MEHRWERT — Check via event_id FK
-- ============================================================================

ALTER TABLE event_mehrwert ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_mehrwert_select" ON event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_insert" ON event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_update" ON event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_delete" ON event_mehrwert;

CREATE POLICY "event_mehrwert_select" ON event_mehrwert FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_mehrwert.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_mehrwert_insert" ON event_mehrwert FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_mehrwert.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_mehrwert_update" ON event_mehrwert FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_mehrwert.event_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_mehrwert.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_mehrwert_delete" ON event_mehrwert FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_mehrwert.event_id
    AND events.user_id = auth.uid()
  ));

-- ============================================================================
-- PACKAGES — Check via event_id FK
-- ============================================================================

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages_select" ON packages;
DROP POLICY IF EXISTS "packages_insert" ON packages;
DROP POLICY IF EXISTS "packages_update" ON packages;
DROP POLICY IF EXISTS "packages_delete" ON packages;

CREATE POLICY "packages_select" ON packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = packages.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "packages_insert" ON packages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = packages.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "packages_update" ON packages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = packages.event_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = packages.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "packages_delete" ON packages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = packages.event_id
    AND events.user_id = auth.uid()
  ));

-- ============================================================================
-- PIPELINE — Check via event_id FK
-- ============================================================================

ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_select" ON pipeline;
DROP POLICY IF EXISTS "pipeline_insert" ON pipeline;
DROP POLICY IF EXISTS "pipeline_update" ON pipeline;
DROP POLICY IF EXISTS "pipeline_delete" ON pipeline;

CREATE POLICY "pipeline_select" ON pipeline FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = pipeline.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "pipeline_insert" ON pipeline FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = pipeline.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "pipeline_update" ON pipeline FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = pipeline.event_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = pipeline.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "pipeline_delete" ON pipeline FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = pipeline.event_id
    AND events.user_id = auth.uid()
  ));

-- ============================================================================
-- EVENT_GALLERY — Check via event_id FK
-- ============================================================================

ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_gallery_select" ON event_gallery;
DROP POLICY IF EXISTS "event_gallery_insert" ON event_gallery;
DROP POLICY IF EXISTS "event_gallery_update" ON event_gallery;
DROP POLICY IF EXISTS "event_gallery_delete" ON event_gallery;

CREATE POLICY "event_gallery_select" ON event_gallery FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_gallery.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_gallery_insert" ON event_gallery FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_gallery.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_gallery_update" ON event_gallery FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_gallery.event_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_gallery.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "event_gallery_delete" ON event_gallery FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_gallery.event_id
    AND events.user_id = auth.uid()
  ));

-- ============================================================================
-- CALLS — Check via pipeline_id FK → events.user_id
-- ============================================================================

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calls_select" ON calls;
DROP POLICY IF EXISTS "calls_insert" ON calls;
DROP POLICY IF EXISTS "calls_update" ON calls;
DROP POLICY IF EXISTS "calls_delete" ON calls;

CREATE POLICY "calls_select" ON calls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = calls.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "calls_insert" ON calls FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = calls.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "calls_update" ON calls FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = calls.pipeline_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = calls.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "calls_delete" ON calls FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = calls.pipeline_id
    AND events.user_id = auth.uid()
  ));

-- ============================================================================
-- APPOINTMENTS — Check via pipeline_id FK → events.user_id
-- ============================================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = appointments.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "appointments_insert" ON appointments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = appointments.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "appointments_update" ON appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = appointments.pipeline_id
    AND events.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = appointments.pipeline_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "appointments_delete" ON appointments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pipeline
    JOIN events ON events.id = pipeline.event_id
    WHERE pipeline.id = appointments.pipeline_id
    AND events.user_id = auth.uid()
  ));
