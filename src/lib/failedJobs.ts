import { createSupabaseServiceClient } from '@/lib/supabase/service'

export type FailedJobSource = 'webhook' | 'aws_event'

type JsonObject = Record<string, unknown>

type RecordFailedJobArgs = {
  source: FailedJobSource
  jobType: string
  handler: string
  dedupeKey: string
  request: JsonObject
  response?: JsonObject | null
  details?: JsonObject
  error: unknown
  maxAttempts?: number
  nextRetryAt?: string | null
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
      name: error.name,
    }
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown job failure.',
    stack: null,
    name: 'UnknownError',
  }
}

export async function recordFailedJob(args: RecordFailedJobArgs) {
  const serializedError = serializeError(args.error)

  try {
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.rpc('record_failed_job', {
      p_source: args.source,
      p_job_type: args.jobType,
      p_handler: args.handler,
      p_dedupe_key: args.dedupeKey,
      p_request: args.request,
      p_response: args.response ?? null,
      p_details: {
        ...args.details,
        error_name: serializedError.name,
      },
      p_error_message: serializedError.message,
      p_error_stack: serializedError.stack,
      p_max_attempts: args.maxAttempts ?? null,
      p_next_retry_at: args.nextRetryAt ?? null,
    })

    if (error) {
      throw new Error(error.message)
    }
  } catch (loggingError) {
    console.error('Unable to record failed job:', loggingError)
  }
}

export async function resolveFailedJob(args: {
  source: FailedJobSource
  dedupeKey: string
  response?: JsonObject
}) {
  try {
    const now = new Date().toISOString()
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase
      .from('failed_jobs')
      .update({
        status: 'resolved',
        response: args.response ?? { status: 'resolved' },
        resolved_at: now,
        last_attempt_at: now,
        next_retry_at: null,
      })
      .eq('source', args.source)
      .eq('dedupe_key', args.dedupeKey)
      .neq('status', 'resolved')

    if (error) {
      throw new Error(error.message)
    }
  } catch (loggingError) {
    console.error('Unable to resolve failed job:', loggingError)
  }
}
