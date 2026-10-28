create table public.donations (
  id uuid primary key default gen_random_uuid(),
  amount_cents integer not null check (amount_cents between 1 and 99999999),
  currency text not null default 'EUR' check (currency = 'EUR'),
  note text check (note is null or char_length(note) <= 500),
  success_url text not null,
  failure_url text not null,
  order_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'rolled_back')),
  transaction_ref text,
  paid_at timestamptz,
  rolled_back_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index donations_status_created_at_idx on public.donations (status, created_at desc);

create trigger set_donations_updated_at
  before update on public.donations
  for each row execute function public.set_updated_at();

alter table public.donations enable row level security;

-- Donation rows and redirect destinations are read and written only by the API's service role.
revoke all on table public.donations from anon, authenticated;
grant select, insert, update on table public.donations to service_role;
