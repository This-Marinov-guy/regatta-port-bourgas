create table if not exists public.failed_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('webhook', 'aws_event')),
  job_type text not null,
  handler text not null,
  dedupe_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'retrying', 'resolved', 'discarded')),
  request jsonb not null,
  response jsonb,
  details jsonb not null default '{}'::jsonb,
  error_message text,
  error_stack text,
  attempt_count integer not null default 1 check (attempt_count > 0),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  last_attempt_at timestamptz not null default now(),
  next_retry_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, dedupe_key)
);

create index if not exists failed_jobs_retry_idx
  on public.failed_jobs (status, next_retry_at, created_at);

create index if not exists failed_jobs_type_idx
  on public.failed_jobs (source, job_type, created_at desc);

drop trigger if exists set_failed_jobs_updated_at on public.failed_jobs;
create trigger set_failed_jobs_updated_at
  before update on public.failed_jobs
  for each row execute function public.set_updated_at();

alter table public.failed_jobs enable row level security;

drop policy if exists "Admins can manage failed jobs" on public.failed_jobs;
create policy "Admins can manage failed jobs"
  on public.failed_jobs
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function public.record_failed_job(
  p_source text,
  p_job_type text,
  p_handler text,
  p_dedupe_key text,
  p_request jsonb,
  p_response jsonb default null,
  p_details jsonb default '{}'::jsonb,
  p_error_message text default null,
  p_error_stack text default null,
  p_max_attempts integer default null,
  p_next_retry_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  failed_job_id uuid;
begin
  insert into public.failed_jobs (
    source,
    job_type,
    handler,
    dedupe_key,
    request,
    response,
    details,
    error_message,
    error_stack,
    max_attempts,
    next_retry_at
  )
  values (
    p_source,
    p_job_type,
    p_handler,
    p_dedupe_key,
    p_request,
    p_response,
    coalesce(p_details, '{}'::jsonb),
    p_error_message,
    p_error_stack,
    p_max_attempts,
    p_next_retry_at
  )
  on conflict (source, dedupe_key) do update
  set
    job_type = excluded.job_type,
    handler = excluded.handler,
    status = 'pending',
    request = excluded.request,
    response = excluded.response,
    details = public.failed_jobs.details || excluded.details,
    error_message = excluded.error_message,
    error_stack = excluded.error_stack,
    attempt_count = public.failed_jobs.attempt_count + 1,
    max_attempts = coalesce(excluded.max_attempts, public.failed_jobs.max_attempts),
    last_attempt_at = now(),
    next_retry_at = excluded.next_retry_at,
    resolved_at = null
  returning id into failed_job_id;

  return failed_job_id;
end;
$$;

revoke all on function public.record_failed_job(
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  integer,
  timestamptz
) from public;

grant execute on function public.record_failed_job(
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  integer,
  timestamptz
) to service_role;
