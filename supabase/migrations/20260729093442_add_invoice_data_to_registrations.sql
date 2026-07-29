alter table public.registrations
  add column if not exists invoice_data jsonb;
