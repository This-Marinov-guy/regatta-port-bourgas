alter table public.donations
  add column name text check (name is null or char_length(name) <= 200);
