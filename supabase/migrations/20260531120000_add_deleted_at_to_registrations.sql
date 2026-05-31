ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS registrations_deleted_at_idx
  ON registrations (deleted_at);
