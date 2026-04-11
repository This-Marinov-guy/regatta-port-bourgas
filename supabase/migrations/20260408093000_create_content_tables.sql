create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bg text not null,
  description_en text,
  description_bg text,
  thumbnail_img text,
  status smallint not null default 1 check (status in (1, 2, 3)),
  start_date date not null,
  end_date date not null,
  documents text[] not null default '{}',
  notice_board text[] not null default '{}',
  results text[] not null default '{}',
  register_form text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_order_check check (end_date >= start_date)
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bg text not null,
  description_en text,
  description_bg text,
  attachments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bg text not null,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists set_news_updated_at on public.news;
create trigger set_news_updated_at
before update on public.news
for each row
execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();
