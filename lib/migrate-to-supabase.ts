// ============================================================
// SponsorMatch — Migration: localStorage → Supabase
// ============================================================
// Läuft einmalig beim ersten Login eines Users.
// Ist nicht-destruktiv: localStorage wird NICHT gelöscht,
// sondern mit dem Suffix "_migrated" markiert.
// ============================================================

import { upsertEvent, replaceMehrwert, replacePackages, upsertPipelineEntry, upsertCall, upsertAppointment, upsertContact } from '@/lib/db';
import type {
  EventInsert,
  EventMehrwertInsert,
  PackageInsert,
  PipelineInsert,
  CallInsert,
  AppointmentInsert,
  ContactInsert,
} from '@/lib/types';

export interface MigrationResult {
  migrated: boolean;
  eventsCount: number;
  contactsCount: number;
  errors: string[];
}

// ---- localStorage-Schlüssel (aus SponsorMatch.jsx) ----------
function projectsKey(uid: string) { return `sm_projects_${uid}`; }
function contactsKey(uid: string) { return `contacts_v1_${uid}`; }
function migratedFlag(uid: string) { return `sm_migrated_${uid}`; }

// ---- Hauptfunktion ------------------------------------------
export async function migrateLocalStorageToSupabase(
  userId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    migrated: false,
    eventsCount: 0,
    contactsCount: 0,
    errors: [],
  };

  if (typeof window === 'undefined') {
    return { migrated: false, eventsCount: 0, contactsCount: 0, errors: ['Server-Kontext: Migration nur im Browser möglich'] };
  }

  // Bereits migriert?
  if (localStorage.getItem(migratedFlag(userId)) === 'true') {
    result.migrated = true;
    return result;
  }

  const projectsRaw = localStorage.getItem(projectsKey(userId));
  const contactsRaw = localStorage.getItem(contactsKey(userId));

  const hasLocalData = projectsRaw || contactsRaw;
  if (!hasLocalData) {
    // Kein localStorage-Daten → nichts zu migrieren, Flag setzen
    localStorage.setItem(migratedFlag(userId), 'true');
    result.migrated = true;
    return result;
  }

  // ---- Events migrieren -------------------------------------
  if (projectsRaw) {
    try {
      const projects = JSON.parse(projectsRaw);
      if (Array.isArray(projects)) {
        const projectResults = await Promise.allSettled(
          projects.map((project, i) => migrateProject(userId, project, result, i))
        );
        projectResults.forEach(r => {
          if (r.status === 'rejected') result.errors.push(String(r.reason));
        });
      }
    } catch (e) {
      result.errors.push(`Projects-Parse-Fehler: ${e}`);
    }
  }

  // ---- Kontakte migrieren -----------------------------------
  if (contactsRaw) {
    try {
      const contacts = JSON.parse(contactsRaw);
      if (Array.isArray(contacts)) {
        const contactResults = await Promise.allSettled(
          contacts.map((contact) => migrateContact(userId, contact, result))
        );
        contactResults.forEach(r => {
          if (r.status === 'rejected') result.errors.push(String(r.reason));
        });
      }
    } catch (e) {
      result.errors.push(`Contacts-Parse-Fehler: ${e}`);
    }
  }

  // ---- Abschluss --------------------------------------------
  if (result.errors.length === 0) {
    localStorage.setItem(migratedFlag(userId), 'true');
    result.migrated = true;
  }

  return result;
}

// ---- Einzelnes Projekt migrieren ----------------------------
async function migrateProject(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any,
  result: MigrationResult,
  sortOrder: number = 0
): Promise<void> {
  try {
    const eventInsert: EventInsert = {
      user_id: userId,
      name: project.name ?? 'Event',
      date: project.date ?? null,
      location: project.location ?? null,
      audience: project.audience ? parseInt(project.audience, 10) : null,
      reach: project.reach ?? null,
      email: project.email ?? null,
      description: project.description ?? null,
      category: project.category ?? null,
      banner_url: project.banner ?? null,
      sort_order: sortOrder,
    };

    const event = await upsertEvent(eventInsert);
    const eventId = event.id;
    result.eventsCount++;

    // Mehrwert
    if (Array.isArray(project.mehrwert) && project.mehrwert.length > 0) {
      const mehrwertItems: EventMehrwertInsert[] = project.mehrwert.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any, i: number) => ({
          event_id: eventId,
          icon: m.icon ?? 'Ziel',
          title: m.title ?? '',
          text: m.text ?? '',
          sort_order: i,
        })
      );
      await replaceMehrwert(eventId, mehrwertItems);
    }

    // Pakete
    if (Array.isArray(project.packages) && project.packages.length > 0) {
      const packages: PackageInsert[] = project.packages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any, i: number) => ({
          event_id: eventId,
          name: p.name ?? '',
          price: parseFloat(p.price) || 0,
          color: p.color ?? '#e8500a',
          slots: parseInt(p.slots, 10) || 1,
          taken: parseInt(p.taken, 10) || 0,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
          highlight: p.highlight ?? false,
          sort_order: i,
        })
      );
      await replacePackages(eventId, packages);
    }

    // Pipeline
    if (Array.isArray(project.pipeline) && project.pipeline.length > 0) {
      for (const entry of project.pipeline) {
        await migratePipelineEntry(eventId, entry);
      }
    }
  } catch (e) {
    result.errors.push(`Event "${project.name}" Fehler: ${e}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migratePipelineEntry(eventId: string, entry: any): Promise<void> {
  const validStatuses = ['draft', 'sent', 'negotiating', 'confirmed', 'rejected'];
  const status = validStatuses.includes(entry.status) ? entry.status : 'draft';

  const pipelineInsert: PipelineInsert = {
    event_id: eventId,
    contact_id: null,
    company: entry.company ?? '',
    contact: entry.contact ?? null,
    email: entry.email ?? null,
    phone: entry.phone ?? null,
    package: entry.package ?? null,
    status,
    value: parseFloat(entry.value) || 0,
    notes: entry.notes ?? null,
    pitch_sent: entry.pitchSent ?? false,
    opened: entry.opened ?? null,
    agreement: entry.agreement ?? null,
    post_event_doc: entry.postEventDoc ?? null,
    sponsor_materials: entry.sponsorMaterials ?? null,
    package_extras: entry.packageExtras ?? null,
  };

  const pipelineEntry = await upsertPipelineEntry(pipelineInsert);
  const pipelineId = pipelineEntry.id;

  // Calls migrieren
  if (Array.isArray(entry.calls)) {
    for (const call of entry.calls) {
      const validResults = ['interested', 'callback', 'rejected', 'confirmed', 'no_answer'];
      const callInsert: CallInsert = {
        pipeline_id: pipelineId,
        date: call.date ?? '',
        time: call.time ?? null,
        duration: call.duration ?? null,
        result: validResults.includes(call.result) ? call.result : null,
        notes: call.notes ?? null,
        done: call.done ?? false,
      };
      await upsertCall(callInsert);
    }
  }

  // Appointments migrieren
  if (Array.isArray(entry.appointments)) {
    for (const appt of entry.appointments) {
      const apptInsert: AppointmentInsert = {
        pipeline_id: pipelineId,
        title: appt.title ?? null,
        date: appt.date ?? '',
        time: appt.time ?? null,
        location: appt.location ?? null,
        notes: appt.notes ?? null,
        done: appt.done ?? false,
      };
      await upsertAppointment(apptInsert);
    }
  }
}

// ---- Einzelnen Kontakt migrieren ----------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateContact(userId: string, contact: any, result: MigrationResult): Promise<void> {
  try {
    const contactInsert: ContactInsert = {
      user_id: userId,
      company: contact.company ?? '',
      contact: contact.contact ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      notes: contact.notes ?? null,
      tags: Array.isArray(contact.tags) ? contact.tags : [],
      event_history: Array.isArray(contact.eventHistory) ? contact.eventHistory.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h: any) => ({
          eventId: h.eventId ?? '',
          eventName: h.eventName ?? '',
          package: h.package ?? '',
          status: h.status ?? '',
          year: parseInt(h.year, 10) || new Date().getFullYear(),
        })
      ) : [],
    };

    await upsertContact(contactInsert);
    result.contactsCount++;
  } catch (e) {
    result.errors.push(`Kontakt "${contact.company}" Fehler: ${e}`);
  }
}
