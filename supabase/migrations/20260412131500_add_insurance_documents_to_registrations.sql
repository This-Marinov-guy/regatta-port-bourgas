alter table public.registrations
  add column if not exists insurance_documents jsonb not null default '[]'::jsonb;
