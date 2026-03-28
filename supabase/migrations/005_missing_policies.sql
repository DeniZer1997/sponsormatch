-- ============================================================
-- Migration 005: Fehlende RLS-Policies + DB-Indizes
-- ============================================================

-- profiles: insert-Policy (für den Fall dass Trigger fehlschlägt)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- subscriptions: update-Policy (für zukünftige Client-seitige Updates)
create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- ============================================================
-- DB-Indizes auf FK-Spalten (werden nicht automatisch erstellt)
-- ============================================================
create index idx_events_user_id on public.events(user_id);
create index idx_event_mehrwert_event_id on public.event_mehrwert(event_id);
create index idx_packages_event_id on public.packages(event_id);
create index idx_pipeline_event_id on public.pipeline(event_id);
create index idx_pipeline_contact_id on public.pipeline(contact_id);
create index idx_calls_pipeline_id on public.calls(pipeline_id);
create index idx_appointments_pipeline_id on public.appointments(pipeline_id);
create index idx_event_gallery_event_id on public.event_gallery(event_id);
create index idx_contacts_user_id on public.contacts(user_id);

-- ============================================================
-- Storage Bucket "events" via SQL erstellen
-- (alternativ zum manuellen Erstellen im Dashboard)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;
