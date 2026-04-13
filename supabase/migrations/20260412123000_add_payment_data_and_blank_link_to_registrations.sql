alter table public.registrations
  add column if not exists payment_data jsonb,
  add column if not exists blank_link text;

update public.registrations
set
  payment_data = coalesce(payment_data, '{}'::jsonb),
  blank_link = coalesce(blank_link, generated_form_url)
where payment_data is null
   or blank_link is null;

alter table public.registrations
  alter column payment_data set default '{}'::jsonb;
