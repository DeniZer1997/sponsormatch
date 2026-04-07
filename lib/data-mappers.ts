// ============================================================
// SponsorMatch — Data Mappers
// Übersetzt zwischen dem localStorage-Format (SponsorMatch.jsx)
// und dem normalisierten Supabase-Schema.
// ============================================================
import type { UserData } from '@/lib/db';
import type {
  EventInsert,
  EventMehrwertInsert,
  PackageInsert,
  PipelineInsert,
  CallInsert,
  AppointmentInsert,
  ContactInsert,
} from '@/lib/types';

// UUID-Pattern zur Erkennung bereits migrierter IDs
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ============================================================
// Supabase → lokales Format (für initUserData)
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assembleProjects(data: UserData): any[] {
  return data.events.map((event) => {
    const mehrwert = data.mehrwert
      .filter((m) => m.event_id === event.id)
      .map((m) => ({ id: m.id, icon: m.icon, title: m.title, text: m.text }));

    const packages = data.packages
      .filter((p) => p.event_id === event.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        color: p.color,
        slots: p.slots,
        taken: p.taken,
        benefits: p.benefits,
        highlight: p.highlight,
      }));

    const pipeline = data.pipeline
      .filter((p) => p.event_id === event.id)
      .map((entry) => ({
        id: entry.id,
        company: entry.company,
        contact: entry.contact ?? '',
        email: entry.email ?? '',
        phone: entry.phone ?? '',
        package: entry.package ?? '',
        status: entry.status,
        value: entry.value,
        notes: entry.notes ?? '',
        pitchSent: entry.pitch_sent,
        opened: entry.opened ?? '—',
        contactId: entry.contact_id ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agreement: (entry as any).agreement ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        postEventDoc: (entry as any).post_event_doc ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sponsorMaterials: (entry as any).sponsor_materials ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        packageExtras: (entry as any).package_extras ?? undefined,
        calls: data.calls
          .filter((c) => c.pipeline_id === entry.id)
          .map((c) => ({
            id: c.id,
            date: c.date,
            time: c.time ?? '',
            result: c.result ?? '',
            notes: c.notes ?? '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            duration: (c as any).duration ?? null,
          })),
        appointments: data.appointments
          .filter((a) => a.pipeline_id === entry.id)
          .map((a) => ({
            id: a.id,
            date: a.date,
            time: a.time ?? '',
            title: a.title ?? '',
            location: a.location ?? '',
            notes: a.notes ?? '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            done: (a as any).done ?? false,
          })),
      }));

    const gallery = data.gallery
      .filter((g) => g.event_id === event.id)
      .map((g) => ({ id: g.id, url: g.image_url }));

    return {
      id: event.id,
      uid: event.user_id,
      name: event.name,
      date: event.date ?? '',
      location: event.location ?? '',
      audience: event.audience ?? '',
      reach: event.reach ?? '',
      email: event.email ?? '',
      description: event.description ?? '',
      category: event.category ?? '',
      banner: event.banner_url ?? null,
      gallery,
      mehrwert,
      packages,
      pipeline,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assembleContacts(data: UserData): any[] {
  return data.contacts.map((c) => ({
    id: c.id,
    company: c.company,
    contactName: c.contact ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    notes: c.notes ?? '',
    tags: c.tags,
    eventHistory: c.event_history,
  }));
}

// ============================================================
// Lokales Format → Supabase (für saveProjects / saveContacts)
// ============================================================

export function mapProjectToEventInsert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proj: any,
  userId: string,
  sortOrder = 0,
  orgId?: string | null
): EventInsert {
  return {
    ...(isUuid(proj.id) ? { id: proj.id } : {}),
    user_id: userId,
    ...(orgId ? { organization_id: orgId } : {}),
    name: proj.name ?? '',
    date: proj.date || null,
    location: proj.location || null,
    audience: proj.audience ? parseInt(String(proj.audience), 10) : null,
    reach: proj.reach || null,
    email: proj.email || null,
    description: proj.description || null,
    category: proj.category || null,
    banner_url: proj.banner || null,
    sort_order: sortOrder,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPackageToInsert(pkg: any, eventId: string, index: number = 0): PackageInsert {
  return {
    ...(isUuid(pkg.id) ? { id: pkg.id } : {}),
    event_id: eventId,
    name: pkg.name ?? '',
    price: parseFloat(pkg.price) || 0,
    color: pkg.color || '#e8500a',
    slots: parseInt(String(pkg.slots), 10) || 1,
    taken: parseInt(String(pkg.taken), 10) || 0,
    benefits: Array.isArray(pkg.benefits) ? pkg.benefits : [],
    highlight: pkg.highlight ?? false,
    sort_order: index,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMehrwertToInsert(m: any, eventId: string, index: number = 0): EventMehrwertInsert {
  return {
    ...(isUuid(m.id) ? { id: m.id } : {}),
    event_id: eventId,
    icon: m.icon || 'Ziel',
    title: m.title || '',
    text: m.text || '',
    sort_order: index,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPipelineToInsert(entry: any, eventId: string): PipelineInsert {
  const validStatuses = ['draft', 'sent', 'negotiating', 'confirmed', 'rejected'];
  return {
    ...(isUuid(entry.id) ? { id: entry.id } : {}),
    event_id: eventId,
    contact_id: isUuid(entry.contactId) ? entry.contactId : null,
    company: entry.company || '',
    contact: entry.contact || null,
    email: entry.email || null,
    phone: entry.phone || null,
    package: entry.package || null,
    status: validStatuses.includes(entry.status) ? entry.status : 'draft',
    value: parseFloat(entry.value) || 0,
    notes: entry.notes || null,
    pitch_sent: entry.pitchSent ?? false,
    opened: entry.opened && entry.opened !== '—' ? entry.opened : null,
    agreement: entry.agreement ?? null,
    post_event_doc: entry.postEventDoc ?? null,
    sponsor_materials: entry.sponsorMaterials ?? null,
    package_extras: entry.packageExtras ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapContactToInsert(contact: any, userId: string, orgId?: string | null): ContactInsert {
  return {
    ...(isUuid(contact.id) ? { id: contact.id } : {}),
    user_id: userId,
    ...(orgId ? { organization_id: orgId } : {}),
    company: contact.company || '',
    contact: contact.contactName || contact.contact || null,
    email: contact.email || null,
    phone: contact.phone || null,
    notes: contact.notes || null,
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    event_history: Array.isArray(contact.eventHistory) ? contact.eventHistory : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCallToInsert(call: any, pipelineId: string): CallInsert {
  return {
    ...(isUuid(call.id) ? { id: call.id } : {}),
    pipeline_id: pipelineId,
    date: call.date ?? new Date().toISOString().slice(0, 10),
    time: call.time ?? null,
    duration: call.duration ?? null,
    result: call.result ?? null,
    notes: call.notes ?? null,
    done: call.done ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAppointmentToInsert(apt: any, pipelineId: string): AppointmentInsert {
  return {
    ...(isUuid(apt.id) ? { id: apt.id } : {}),
    pipeline_id: pipelineId,
    date: apt.date ?? new Date().toISOString().slice(0, 10),
    time: apt.time ?? null,
    title: apt.title ?? null,
    location: apt.location ?? null,
    notes: apt.notes ?? null,
    done: apt.done ?? false,
  };
}
