alter table public.events
  alter column register_form type text[]
  using case when register_form is null then array[]::text[] else array[register_form] end,
  alter column register_form set not null,
  alter column register_form set default '{}';
