// ============================================================
// SponsorMatch — Datenbank-Helper (Supabase CRUD)
// ============================================================
import { createClient } from '@/lib/supabase';
import type {
  Event, EventInsert,
  EventMehrwert, EventMehrwertInsert,
  Package, PackageInsert,
  PipelineEntry, PipelineInsert,
  Call, CallInsert,
  Appointment, AppointmentInsert,
  Contact, ContactInsert,
  GalleryImage, GalleryImageInsert,
  FullEvent,
} from '@/lib/types';

// ---- UserData (aggregiert, für initUserData) ----------------
export interface UserData {
  events: Event[];
  mehrwert: EventMehrwert[];
  packages: Package[];
  pipeline: PipelineEntry[];
  calls: Call[];
  appointments: Appointment[];
  gallery: GalleryImage[];
  contacts: Contact[];
}

function supabase() {
  return createClient();
}

// ============================================================
// EVENTS
// ============================================================

export async function getEvents(userId: string): Promise<Event[]> {
  const { data, error } = await supabase()
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFullEvent(eventId: string): Promise<FullEvent | null> {
  const sb = supabase();

  const [eventRes, mehrwertRes, packagesRes, pipelineRes, galleryRes] = await Promise.all([
    sb.from('events').select('*').eq('id', eventId).single(),
    sb.from('event_mehrwert').select('*').eq('event_id', eventId).order('sort_order'),
    sb.from('packages').select('*').eq('event_id', eventId).order('sort_order'),
    sb.from('pipeline').select('*').eq('event_id', eventId).order('created_at'),
    sb.from('event_gallery').select('*').eq('event_id', eventId).order('sort_order'),
  ]);

  if (eventRes.error || !eventRes.data) return null;

  if (mehrwertRes.error) console.warn('getFullEvent: mehrwert query error', mehrwertRes.error);
  if (packagesRes.error) console.warn('getFullEvent: packages query error', packagesRes.error);
  if (pipelineRes.error) console.warn('getFullEvent: pipeline query error', pipelineRes.error);
  if (galleryRes.error) console.warn('getFullEvent: gallery query error', galleryRes.error);

  return {
    ...eventRes.data,
    mehrwert: mehrwertRes.data ?? [],
    packages: packagesRes.data ?? [],
    pipeline: pipelineRes.data ?? [],
    gallery: galleryRes.data ?? [],
  };
}

export async function upsertEvent(event: EventInsert): Promise<Event> {
  const { data, error } = await supabase()
    .from('events')
    .upsert(event, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase()
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

// ============================================================
// EVENT MEHRWERT
// ============================================================

export async function getMehrwert(eventId: string): Promise<EventMehrwert[]> {
  const { data, error } = await supabase()
    .from('event_mehrwert')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (error) throw error;
  return data ?? [];
}

export async function upsertMehrwert(item: EventMehrwertInsert): Promise<EventMehrwert> {
  const { data, error } = await supabase()
    .from('event_mehrwert')
    .upsert(item, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function replaceMehrwert(eventId: string, items: EventMehrwertInsert[]): Promise<void> {
  const sb = supabase();
  await sb.from('event_mehrwert').delete().eq('event_id', eventId);
  if (items.length > 0) {
    const { error } = await sb.from('event_mehrwert').insert(items);
    if (error) throw error;
  }
}

// ============================================================
// PACKAGES
// ============================================================

export async function getPackages(eventId: string): Promise<Package[]> {
  const { data, error } = await supabase()
    .from('packages')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (error) throw error;
  return data ?? [];
}

export async function upsertPackage(pkg: PackageInsert): Promise<Package> {
  const { data, error } = await supabase()
    .from('packages')
    .upsert(pkg, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePackage(packageId: string): Promise<void> {
  const { error } = await supabase()
    .from('packages')
    .delete()
    .eq('id', packageId);

  if (error) throw error;
}

export async function replacePackages(eventId: string, packages: PackageInsert[]): Promise<void> {
  const sb = supabase();
  await sb.from('packages').delete().eq('event_id', eventId);
  if (packages.length > 0) {
    const { error } = await sb.from('packages').insert(packages);
    if (error) throw error;
  }
}

// ============================================================
// PIPELINE
// ============================================================

export async function getPipeline(eventId: string): Promise<PipelineEntry[]> {
  const { data, error } = await supabase()
    .from('pipeline')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at');

  if (error) throw error;
  return data ?? [];
}

export async function upsertPipelineEntry(entry: PipelineInsert): Promise<PipelineEntry> {
  const { data, error } = await supabase()
    .from('pipeline')
    .upsert(entry, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPipelineEntry(entryId: string): Promise<PipelineEntry | null> {
  const { data } = await supabase()
    .from('pipeline')
    .select('*')
    .eq('id', entryId)
    .single();
  return data ?? null;
}

export async function deletePipelineEntry(entryId: string): Promise<void> {
  const { error } = await supabase()
    .from('pipeline')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

// ============================================================
// CALLS
// ============================================================

export async function getCalls(pipelineId: string): Promise<Call[]> {
  const { data, error } = await supabase()
    .from('calls')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('created_at');

  if (error) throw error;
  return data ?? [];
}

export async function upsertCall(call: CallInsert): Promise<Call> {
  const { data, error } = await supabase()
    .from('calls')
    .upsert(call, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCall(callId: string): Promise<void> {
  const { error } = await supabase()
    .from('calls')
    .delete()
    .eq('id', callId);

  if (error) throw error;
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function getAppointments(pipelineId: string): Promise<Appointment[]> {
  const { data, error } = await supabase()
    .from('appointments')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('date');

  if (error) throw error;
  return data ?? [];
}

export async function upsertAppointment(appointment: AppointmentInsert): Promise<Appointment> {
  const { data, error } = await supabase()
    .from('appointments')
    .upsert(appointment, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase()
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
}

// ============================================================
// CONTACTS
// ============================================================

export async function getContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase()
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('company');

  if (error) throw error;
  return data ?? [];
}

export async function upsertContact(contact: ContactInsert): Promise<Contact> {
  const { data, error } = await supabase()
    .from('contacts')
    .upsert(contact, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContact(contactId: string): Promise<void> {
  const { error } = await supabase()
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
}

// ============================================================
// EVENT GALLERY
// ============================================================

export async function getGallery(eventId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabase()
    .from('event_gallery')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (error) throw error;
  return data ?? [];
}

export async function addGalleryImage(image: GalleryImageInsert): Promise<GalleryImage> {
  const { data, error } = await supabase()
    .from('event_gallery')
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGalleryImage(imageId: string): Promise<void> {
  const { error } = await supabase()
    .from('event_gallery')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

// ============================================================
// LOAD ALL USER DATA (für initUserData in SponsorMatch.jsx)
// Max 3 Request-Runden, alles parallel innerhalb jeder Runde.
// ============================================================

export interface UserProfile {
  organization_id: string | null;
  role: string;
  display_name: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data } = await supabase()
    .from('profiles')
    .select('organization_id, role, display_name')
    .eq('id', userId)
    .single();
  return {
    organization_id: data?.organization_id ?? null,
    role: data?.role ?? 'admin',
    display_name: data?.display_name ?? null,
  };
}

export async function getUserOrgId(userId: string): Promise<string | null> {
  const { data } = await supabase()
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();
  return data?.organization_id ?? null;
}

export async function loadAllUserData(userId: string): Promise<UserData> {
  const sb = supabase();

  // Org-ID laden — neue Events werden org-scoped abgefragt
  const orgId = await getUserOrgId(userId);

  const eventsQuery = sb.from('events').select('*').order('sort_order', { ascending: true });
  const { data: events, error: eventsError } = orgId
    ? await eventsQuery.eq('organization_id', orgId)
    : await eventsQuery.eq('user_id', userId);

  if (eventsError) throw eventsError;

  const eventIds = (events ?? []).map((e) => e.id);

  if (eventIds.length === 0) {
    const contactsQuery = sb.from('contacts').select('*').order('company');
    const { data: contacts } = orgId
      ? await contactsQuery.eq('organization_id', orgId)
      : await contactsQuery.eq('user_id', userId);
    return {
      events: [],
      mehrwert: [],
      packages: [],
      pipeline: [],
      calls: [],
      appointments: [],
      gallery: [],
      contacts: contacts ?? [],
    };
  }

  const contactsQuery = sb.from('contacts').select('*').order('company');
  const [mehrwertRes, packagesRes, pipelineRes, galleryRes, contactsRes] =
    await Promise.all([
      sb.from('event_mehrwert').select('*').in('event_id', eventIds).order('sort_order'),
      sb.from('packages').select('*').in('event_id', eventIds).order('sort_order'),
      sb.from('pipeline').select('*').in('event_id', eventIds).order('created_at'),
      sb.from('event_gallery').select('*').in('event_id', eventIds).order('sort_order'),
      orgId
        ? contactsQuery.eq('organization_id', orgId)
        : contactsQuery.eq('user_id', userId),
    ]);

  const pipelineEntries = pipelineRes.data ?? [];
  const pipelineIds = pipelineEntries.map((p) => p.id);

  let calls: Call[] = [];
  let appointments: Appointment[] = [];

  if (pipelineIds.length > 0) {
    const [callsRes, aptsRes] = await Promise.all([
      sb.from('calls').select('*').in('pipeline_id', pipelineIds).order('created_at'),
      sb.from('appointments').select('*').in('pipeline_id', pipelineIds).order('date'),
    ]);
    calls = callsRes.data ?? [];
    appointments = aptsRes.data ?? [];
  }

  return {
    events: events ?? [],
    mehrwert: mehrwertRes.data ?? [],
    packages: packagesRes.data ?? [],
    pipeline: pipelineEntries,
    calls,
    appointments,
    gallery: galleryRes.data ?? [],
    contacts: contactsRes.data ?? [],
  };
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase()
    .from('notifications')
    .update({ read: true })
    .in('id', ids);
}
