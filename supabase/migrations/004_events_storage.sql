-- ============================================================
-- Migration 004: Storage Policies für Events-Bucket
-- ============================================================
-- Bucket "events" muss manuell im Supabase Dashboard als PUBLIC Bucket erstellt werden.
-- Ordnerstruktur: {user_id}/{event_id}/banner.{ext}
--                 {user_id}/{event_id}/gallery/{filename}.{ext}

create policy "Users can upload to own events folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'events'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own event files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'events'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can read event files"
  on storage.objects for select
  to public
  using (bucket_id = 'events');

create policy "Users can delete own event files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'events'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
