alter table public.registrations
  add column if not exists generated_form_url text;
