-- ============================================================
-- Migration 003: Events, Packages, Pipeline, Contacts
-- ============================================================

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  name         text not null default '',
  date         text,
  location     text,
  audience     integer,
  reach        text,
  email        text,
  description  text,
  category     text,
  banner_url   text,
  sort_order   integer default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Users can manage own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger events_updated_at before update on public.events
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- EVENT MEHRWERT (Value-Props pro Event)
-- ============================================================
create table public.event_mehrwert (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade not null,
  icon       text not null default 'Ziel',
  title      text not null default '',
  text       text not null default '',
  sort_order integer default 0
);

alter table public.event_mehrwert enable row level security;

create policy "Users can manage own event_mehrwert"
  on public.event_mehrwert for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_mehrwert.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = event_mehrwert.event_id
      and events.user_id = auth.uid()
    )
  );

-- ============================================================
-- PACKAGES (Sponsoring-Pakete pro Event)
-- ============================================================
create table public.packages (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade not null,
  name       text not null default '',
  price      numeric not null default 0,
  color      text not null default '#e8500a',
  slots      integer not null default 1,
  taken      integer not null default 0,
  benefits   text[] not null default '{}',
  highlight  boolean not null default false,
  sort_order integer default 0
);

alter table public.packages enable row level security;

create policy "Users can manage own packages"
  on public.packages for all
  using (
    exists (
      select 1 from public.events
      where events.id = packages.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = packages.event_id
      and events.user_id = auth.uid()
    )
  );

-- ============================================================
-- PIPELINE (Sponsoring-Akquise-Einträge pro Event)
-- ============================================================
create table public.pipeline (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade not null,
  contact_id  uuid,  -- FK zu contacts, wird via ALTER TABLE gesetzt (circular dependency)
  company     text not null default '',
  contact     text,
  email       text,
  phone       text,
  package     text,
  status      text not null default 'draft'
    check (status in ('draft', 'sent', 'negotiating', 'confirmed', 'rejected')),
  value       numeric not null default 0,
  notes       text,
  pitch_sent  boolean not null default false,
  opened      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pipeline enable row level security;

create policy "Users can manage own pipeline"
  on public.pipeline for all
  using (
    exists (
      select 1 from public.events
      where events.id = pipeline.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = pipeline.event_id
      and events.user_id = auth.uid()
    )
  );

create trigger pipeline_updated_at before update on public.pipeline
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- CALLS (Telefonate pro Pipeline-Eintrag)
-- ============================================================
create table public.calls (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid references public.pipeline(id) on delete cascade not null,
  date        text not null default '',
  time        text,
  result      text check (result in ('interested', 'callback', 'rejected', 'confirmed', 'no_answer')),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.calls enable row level security;

create policy "Users can manage own calls"
  on public.calls for all
  using (
    exists (
      select 1 from public.pipeline
      join public.events on events.id = pipeline.event_id
      where pipeline.id = calls.pipeline_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pipeline
      join public.events on events.id = pipeline.event_id
      where pipeline.id = calls.pipeline_id
      and events.user_id = auth.uid()
    )
  );

-- ============================================================
-- APPOINTMENTS (Termine pro Pipeline-Eintrag)
-- ============================================================
create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid references public.pipeline(id) on delete cascade not null,
  title       text,
  date        text not null default '',
  time        text,
  location    text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Users can manage own appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.pipeline
      join public.events on events.id = pipeline.event_id
      where pipeline.id = appointments.pipeline_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pipeline
      join public.events on events.id = pipeline.event_id
      where pipeline.id = appointments.pipeline_id
      and events.user_id = auth.uid()
    )
  );

-- ============================================================
-- CONTACTS (Globale Kontaktdatenbank)
-- ============================================================
create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  company       text not null default '',
  contact       text,
  email         text,
  phone         text,
  notes         text,
  tags          text[] not null default '{}',
  event_history jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Users can manage own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger contacts_updated_at before update on public.contacts
  for each row execute procedure public.update_updated_at();

-- FK: pipeline.contact_id -> contacts (nach contacts-Erstellung)
alter table public.pipeline
  add constraint pipeline_contact_id_fkey
  foreign key (contact_id) references public.contacts(id) on delete set null;

-- ============================================================
-- EVENT GALLERY (Bilder pro Event)
-- ============================================================
create table public.event_gallery (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade not null,
  image_url  text not null,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

alter table public.event_gallery enable row level security;

create policy "Users can manage own event_gallery"
  on public.event_gallery for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_gallery.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = event_gallery.event_id
      and events.user_id = auth.uid()
    )
  );
