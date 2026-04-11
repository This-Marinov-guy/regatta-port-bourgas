update public.events
set
  name_bg = nullif(trim(name_bg), ''),
  description_bg = nullif(trim(description_bg), '');

update public.news
set
  name_bg = nullif(trim(name_bg), ''),
  description_bg = nullif(trim(description_bg), ''),
  body_bg = nullif(trim(body_bg), '');

update public.documents
set
  name_bg = nullif(trim(name_bg), '');

alter table public.events
  alter column name_bg drop not null;

alter table public.news
  alter column name_bg drop not null,
  alter column body_bg drop not null;

alter table public.documents
  alter column name_bg drop not null;
