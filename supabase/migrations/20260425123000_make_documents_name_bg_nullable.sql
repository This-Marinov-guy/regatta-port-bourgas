update public.documents
set name_bg = nullif(trim(name_bg), '');

alter table public.documents
  alter column name_bg drop not null;
