alter table public.news
  add column if not exists status smallint;

update public.news
set status = 1
where status is null;

alter table public.news
  alter column status set default 1,
  alter column status set not null;

alter table public.news
  drop constraint if exists news_status_check;

alter table public.news
  add constraint news_status_check check (status in (1, 2, 3));
