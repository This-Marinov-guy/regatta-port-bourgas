alter table registrations
  add column if not exists preferred_language text not null default 'en',
  add column if not exists rejection_feedback text;
