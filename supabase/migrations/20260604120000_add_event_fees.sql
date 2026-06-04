alter table public.events
  add column if not exists fee_amount_cents integer,
  add column if not exists fee_type text;

alter table public.events
  drop constraint if exists events_fee_amount_positive,
  add constraint events_fee_amount_positive
    check (fee_amount_cents is null or fee_amount_cents > 0),
  drop constraint if exists events_fee_type_valid,
  add constraint events_fee_type_valid
    check (fee_type is null or fee_type in ('per_crew', 'total')),
  drop constraint if exists events_fee_fields_together,
  add constraint events_fee_fields_together
    check (
      (fee_amount_cents is null and fee_type is null)
      or
      (fee_amount_cents is not null and fee_type is not null)
    );
