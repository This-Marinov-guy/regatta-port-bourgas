drop index if exists public.registrations_email_idx;

alter table public.registrations
  drop column if exists email;
