// ============================================================
// SponsorMatch — Supabase Storage Helper (Events-Bucket)
// ============================================================
import { createClient } from '@/lib/supabase';

const BUCKET = 'events';

function supabase() {
  return createClient();
}

function ext(file: File): string {
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (!allowedExts.includes(extension)) {
    throw new Error('Nicht unterstütztes Dateiformat. Erlaubt: jpg, jpeg, png, webp, gif');
  }
  return extension;
}

export function getPublicUrl(path: string): string {
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadEventBanner(
  userId: string,
  eventId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${eventId}/banner.${ext(file)}`;

  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return getPublicUrl(path);
}

export async function uploadGalleryImage(
  userId: string,
  eventId: string,
  file: File
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext(file)}`;
  const path = `${userId}/${eventId}/gallery/${filename}`;

  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return getPublicUrl(path);
}

export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabase().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function uploadAgreementPdf(
  userId: string,
  eventId: string,
  sponsorId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${eventId}/agreements/${sponsorId}/signed.pdf`;
  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: 'application/pdf' });
  if (error) throw error;
  return getPublicUrl(path);
}

export async function uploadSponsorMaterial(
  userId: string,
  eventId: string,
  sponsorId: string,
  file: File,
  type: 'logo' | 'video' | 'file'
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safeName}`;
  const path = `${userId}/${eventId}/materials/${sponsorId}/${type}/${filename}`;
  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return getPublicUrl(path);
}

export async function uploadAgreementPhoto(
  userId: string,
  eventId: string,
  sponsorId: string,
  file: File
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext(file)}`;
  const path = `${userId}/${eventId}/agreements/${sponsorId}/photos/${filename}`;
  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return getPublicUrl(path);
}
