create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

alter table public.events
  add column if not exists slug text;

alter table public.news
  add column if not exists slug text,
  add column if not exists body_en text,
  add column if not exists body_bg text;

with ranked_events as (
  select
    id,
    case
      when public.slugify(name_en) = '' then 'event'
      else public.slugify(name_en)
    end as base_slug,
    row_number() over (
      partition by case
        when public.slugify(name_en) = '' then 'event'
        else public.slugify(name_en)
      end
      order by created_at, id
    ) as slug_rank
  from public.events
)
update public.events as events
set slug = case
  when ranked_events.slug_rank = 1 then ranked_events.base_slug
  else ranked_events.base_slug || '-' || ranked_events.slug_rank
end
from ranked_events
where events.id = ranked_events.id
  and (events.slug is null or btrim(events.slug) = '');

with ranked_news as (
  select
    id,
    case
      when public.slugify(name_en) = '' then 'news'
      else public.slugify(name_en)
    end as base_slug,
    row_number() over (
      partition by case
        when public.slugify(name_en) = '' then 'news'
        else public.slugify(name_en)
      end
      order by created_at, id
    ) as slug_rank
  from public.news
)
update public.news as news
set slug = case
  when ranked_news.slug_rank = 1 then ranked_news.base_slug
  else ranked_news.base_slug || '-' || ranked_news.slug_rank
end
from ranked_news
where news.id = ranked_news.id
  and (news.slug is null or btrim(news.slug) = '');

update public.news
set body_en = coalesce(body_en, description_en, ''),
    body_bg = coalesce(body_bg, description_bg, '')
where body_en is null
   or body_bg is null;

alter table public.events
  alter column slug set not null;

alter table public.news
  alter column slug set not null,
  alter column body_en set not null,
  alter column body_bg set not null;

create unique index if not exists events_slug_key on public.events (slug);
create unique index if not exists news_slug_key on public.news (slug);
