-- ─────────────────────────────────────────────────────────────────────────────
-- Regatta registration form
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),

  -- ── Event ────────────────────────────────────────────────────────────────
  event_id uuid not null references public.events(id) on delete cascade,

  -- ── Boat information ──────────────────────────────────────────────────────
  email                              text not null,
  boat_name                          text not null,
  border_number                      integer,
  country                            text not null,
  certificate_of_navigation          integer,
  certificate_of_navigation_expiry   date,
  model_design                       text not null,
  sail_number                        text not null,
  boat_age                           integer not null,          -- year of production
  port_of_registry                   text,
  gph_irc                            text not null,
  loa                                double precision not null,   -- length overall in metres
  boat_color                         text,
  yacht_club                         text,

  -- ── Skipper information ───────────────────────────────────────────────────
  skipper_name                          text not null,
  skipper_yacht_club                    text not null,
  charterer_name                        text,
  certificate_of_competency             text not null,
  certificate_of_competency_expiry      date,

  -- ── Contact person ────────────────────────────────────────────────────────
  contact_name                       text not null,
  contact_phone                      text not null,
  contact_email                      text not null,

  -- ── Preferences ──────────────────────────────────────────────────────────
  receive_documents_by_email         boolean not null default true,

  -- ── Insurance declarations ────────────────────────────────────────────────
  crew_insurance                     boolean not null default false,
  third_party_insurance              boolean not null default false,

  -- ── Legal ─────────────────────────────────────────────────────────────────
  disclaimer_accepted                boolean not null default false,
  gdpr_accepted                      boolean not null default false,

  -- ── Crew list ─────────────────────────────────────────────────────────────
  -- Expected shape: [{ name: string, role?: string, email?: string }]
  crew_list                          jsonb not null default '[]'::jsonb,

  -- ── Status ────────────────────────────────────────────────────────────────
  status                             text not null default 'pending'
                                       check (status in ('pending', 'approved', 'rejected')),

  -- ── Timestamps ───────────────────────────────────────────────────────────
  created_at                         timestamptz not null default now(),
  updated_at                         timestamptz not null default now()
);

-- Index for fast per-event queries
create index if not exists registrations_event_id_idx
  on public.registrations (event_id);

-- Index for per-email lookup
create index if not exists registrations_email_idx
  on public.registrations (email);

-- Auto-update updated_at
drop trigger if exists set_registrations_updated_at on public.registrations;
create trigger set_registrations_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- ── Row-level security ────────────────────────────────────────────────────────
alter table public.registrations enable row level security;

-- Public can insert (submit a registration)
create policy "Anyone can submit a registration"
  on public.registrations
  for insert
  with check (true);

-- Only authenticated admins can read / update / delete
create policy "Admins can manage registrations"
  on public.registrations
  for all
  using (auth.role() = 'authenticated');
