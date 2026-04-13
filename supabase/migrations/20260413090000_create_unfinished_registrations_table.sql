-- ─────────────────────────────────────────────────────────────────────────────
-- Unfinished / draft regatta registrations
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.unfinished_registrations (
  id uuid primary key default gen_random_uuid(),
  reference_id uuid not null default gen_random_uuid(),

  -- ── Event ────────────────────────────────────────────────────────────────
  event_id uuid references public.events(id) on delete cascade,

  -- ── Boat information ──────────────────────────────────────────────────────
  boat_name text,
  border_number integer,
  country text,
  certificate_of_navigation integer,
  certificate_of_navigation_expiry date,
  model_design text,
  sail_number text,
  boat_age integer,
  port_of_registry text,
  gph_irc text,
  loa double precision,
  boat_color text,
  yacht_club text,

  -- ── Skipper information ───────────────────────────────────────────────────
  skipper_name text,
  skipper_yacht_club text,
  charterer_name text,
  certificate_of_competency text,
  certificate_of_competency_expiry date,

  -- ── Contact person ────────────────────────────────────────────────────────
  contact_name text,
  contact_phone text,
  contact_email text,

  -- ── Preferences & declarations ───────────────────────────────────────────
  receive_documents_by_email boolean,
  crew_insurance boolean,
  third_party_insurance boolean,
  disclaimer_accepted boolean,
  gdpr_accepted boolean,

  -- ── Supporting files ──────────────────────────────────────────────────────
  insurance_documents jsonb default '[]'::jsonb,

  -- ── Crew list ─────────────────────────────────────────────────────────────
  crew_list jsonb default '[]'::jsonb,

  -- ── Payment & generated files ────────────────────────────────────────────
  payment_data jsonb default '{}'::jsonb,
  blank_link text,

  -- ── Timestamps ───────────────────────────────────────────────────────────
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists unfinished_registrations_reference_id_idx
  on public.unfinished_registrations (reference_id);

create index if not exists unfinished_registrations_event_id_idx
  on public.unfinished_registrations (event_id);

drop trigger if exists set_unfinished_registrations_updated_at on public.unfinished_registrations;
create trigger set_unfinished_registrations_updated_at
  before update on public.unfinished_registrations
  for each row execute function public.set_updated_at();

alter table public.unfinished_registrations enable row level security;

create policy "Anyone can manage unfinished registrations"
  on public.unfinished_registrations
  for all
  using (true)
  with check (true);
