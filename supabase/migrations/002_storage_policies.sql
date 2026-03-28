-- Storage Bucket: avatars (muss manuell im Dashboard erstellt werden als PUBLIC Bucket)
-- Diese Policies erlauben authentifizierten Usern, in ihren eigenen Ordner (user_id/) hochzuladen und zu lesen.

-- Policy: Authentifizierte User dürfen Dateien in ihrem eigenen Ordner hochladen
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authentifizierte User dürfen ihre eigenen Dateien aktualisieren (upsert)
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Jeder darf Avatare lesen (Public Bucket)
create policy "Anyone can read avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Policy: User dürfen ihre eigenen Avatare löschen
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
