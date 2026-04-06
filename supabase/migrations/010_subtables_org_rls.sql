-- Migration 010: Sub-Tabellen RLS auf organization_id-basierte Isolation umstellen
-- Betrifft: event_mehrwert, packages, pipeline, event_gallery, calls, appointments
-- Diese Tabellen haben keine eigene organization_id Spalte.
-- Isolation erfolgt ueber FK-Kette: sub_table -> events.organization_id = current_org_id()
-- Bei calls/appointments: sub_table -> pipeline -> events.organization_id = current_org_id()

-- ============================================================================
-- EVENT_MEHRWERT — 1 Stufe: event_mehrwert.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "event_mehrwert_select" ON public.event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_insert" ON public.event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_update" ON public.event_mehrwert;
DROP POLICY IF EXISTS "event_mehrwert_delete" ON public.event_mehrwert;

CREATE POLICY "event_mehrwert_select" ON public.event_mehrwert FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_mehrwert.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_mehrwert_insert" ON public.event_mehrwert FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_mehrwert.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_mehrwert_update" ON public.event_mehrwert FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_mehrwert.event_id
    AND events.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_mehrwert.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_mehrwert_delete" ON public.event_mehrwert FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_mehrwert.event_id
    AND events.organization_id = public.current_org_id()
  ));

-- ============================================================================
-- PACKAGES — 1 Stufe: packages.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "packages_select" ON public.packages;
DROP POLICY IF EXISTS "packages_insert" ON public.packages;
DROP POLICY IF EXISTS "packages_update" ON public.packages;
DROP POLICY IF EXISTS "packages_delete" ON public.packages;

CREATE POLICY "packages_select" ON public.packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = packages.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "packages_insert" ON public.packages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = packages.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "packages_update" ON public.packages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = packages.event_id
    AND events.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = packages.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "packages_delete" ON public.packages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = packages.event_id
    AND events.organization_id = public.current_org_id()
  ));

-- ============================================================================
-- PIPELINE — 1 Stufe: pipeline.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "pipeline_select" ON public.pipeline;
DROP POLICY IF EXISTS "pipeline_insert" ON public.pipeline;
DROP POLICY IF EXISTS "pipeline_update" ON public.pipeline;
DROP POLICY IF EXISTS "pipeline_delete" ON public.pipeline;

CREATE POLICY "pipeline_select" ON public.pipeline FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = pipeline.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "pipeline_insert" ON public.pipeline FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = pipeline.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "pipeline_update" ON public.pipeline FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = pipeline.event_id
    AND events.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = pipeline.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "pipeline_delete" ON public.pipeline FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = pipeline.event_id
    AND events.organization_id = public.current_org_id()
  ));

-- ============================================================================
-- EVENT_GALLERY — 1 Stufe: event_gallery.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "event_gallery_select" ON public.event_gallery;
DROP POLICY IF EXISTS "event_gallery_insert" ON public.event_gallery;
DROP POLICY IF EXISTS "event_gallery_update" ON public.event_gallery;
DROP POLICY IF EXISTS "event_gallery_delete" ON public.event_gallery;

CREATE POLICY "event_gallery_select" ON public.event_gallery FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_gallery.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_gallery_insert" ON public.event_gallery FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_gallery.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_gallery_update" ON public.event_gallery FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_gallery.event_id
    AND events.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_gallery.event_id
    AND events.organization_id = public.current_org_id()
  ));

CREATE POLICY "event_gallery_delete" ON public.event_gallery FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_gallery.event_id
    AND events.organization_id = public.current_org_id()
  ));

-- ============================================================================
-- CALLS — 2 Stufen: calls.pipeline_id -> pipeline.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "calls_select" ON public.calls;
DROP POLICY IF EXISTS "calls_insert" ON public.calls;
DROP POLICY IF EXISTS "calls_update" ON public.calls;
DROP POLICY IF EXISTS "calls_delete" ON public.calls;

CREATE POLICY "calls_select" ON public.calls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = calls.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "calls_insert" ON public.calls FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = calls.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "calls_update" ON public.calls FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = calls.pipeline_id
    AND e.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = calls.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "calls_delete" ON public.calls FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = calls.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

-- ============================================================================
-- APPOINTMENTS — 2 Stufen: appointments.pipeline_id -> pipeline.event_id -> events
-- ============================================================================

DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = appointments.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = appointments.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = appointments.pipeline_id
    AND e.organization_id = public.current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = appointments.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));

CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pipeline p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = appointments.pipeline_id
    AND e.organization_id = public.current_org_id()
  ));
