// ============================================================
// SponsorMatch — Datenbank-Typen (generiert aus Migration 003)
// ============================================================

export type Tier = 'free' | 'pro' | 'max';

export type PipelineStatus = 'draft' | 'sent' | 'negotiating' | 'confirmed' | 'rejected';

export type CallResult = 'interested' | 'callback' | 'rejected' | 'confirmed' | 'no_answer';

// ---- PROFILE -----------------------------------------------
export interface Profile {
  id: string;
  name: string;
  accent: string;
  logo_url: string | null;
  bio: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  mwst: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---- SUBSCRIPTION ------------------------------------------
export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  tier: Tier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// ---- EVENT -------------------------------------------------
export interface Event {
  id: string;
  user_id: string;
  name: string;
  date: string | null;
  location: string | null;
  audience: number | null;
  reach: string | null;
  email: string | null;
  description: string | null;
  category: string | null;
  banner_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// ---- EVENT MEHRWERT ----------------------------------------
export interface EventMehrwert {
  id: string;
  event_id: string;
  icon: string;
  title: string;
  text: string;
  sort_order: number;
}

export type EventMehrwertInsert = Omit<EventMehrwert, 'id'> & { id?: string };

// ---- PACKAGE -----------------------------------------------
export interface Package {
  id: string;
  event_id: string;
  name: string;
  price: number;
  color: string;
  slots: number;
  taken: number;
  benefits: string[];
  highlight: boolean;
  sort_order: number;
}

export type PackageInsert = Omit<Package, 'id'> & { id?: string };

// ---- PIPELINE ----------------------------------------------
export interface PipelineEntry {
  id: string;
  event_id: string;
  contact_id: string | null;
  company: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  package: string | null;
  status: PipelineStatus;
  value: number;
  notes: string | null;
  pitch_sent: boolean;
  opened: string | null;
  agreement: Record<string, unknown> | null;
  post_event_doc: Record<string, unknown> | null;
  sponsor_materials: Record<string, unknown> | null;
  package_extras: string[] | null;
  created_at: string;
  updated_at: string;
}

export type PipelineInsert = Omit<PipelineEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// ---- CALL --------------------------------------------------
export interface Call {
  id: string;
  pipeline_id: string;
  date: string;
  time: string | null;
  result: CallResult | null;
  notes: string | null;
  created_at: string;
}

export type CallInsert = Omit<Call, 'id' | 'created_at'> & { id?: string };

// ---- APPOINTMENT -------------------------------------------
export interface Appointment {
  id: string;
  pipeline_id: string;
  title: string | null;
  date: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at'> & { id?: string };

// ---- CONTACT -----------------------------------------------
export interface ContactEventHistory {
  eventId: string;
  eventName: string;
  package: string;
  status: string;
  year: number;
}

export interface Contact {
  id: string;
  user_id: string;
  company: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  event_history: ContactEventHistory[];
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// ---- EVENT GALLERY -----------------------------------------
export interface GalleryImage {
  id: string;
  event_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export type GalleryImageInsert = Omit<GalleryImage, 'id' | 'created_at'> & { id?: string };

// ---- FULL EVENT (aggregiert, für SponsorMatch-Komponente) --
export interface FullEvent extends Event {
  mehrwert: EventMehrwert[];
  packages: Package[];
  pipeline: PipelineEntry[];
  gallery: GalleryImage[];
}
