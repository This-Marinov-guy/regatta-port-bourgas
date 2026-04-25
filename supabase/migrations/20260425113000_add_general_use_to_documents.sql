alter table public.documents
  add column if not exists general_use boolean not null default false;
