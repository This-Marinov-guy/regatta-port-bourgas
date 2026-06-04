import { recordFailedJob, resolveFailedJob } from '@/lib/failedJobs'
import type { QueueRecord } from '@/lib/registrations/types'

function getDedupeKey(worker: string, record: QueueRecord) {
  return `${worker}:${record.messageId}`
}

export async function recordFailedRegistrationEvent(args: {
  worker: string
  record: QueueRecord
  error: unknown
}) {
  const { worker, record, error } = args

  await recordFailedJob({
    source: 'aws_event',
    jobType: 'registration.created',
    handler: worker,
    dedupeKey: getDedupeKey(worker, record),
    request: {
      record,
    },
    response: {
      batch_item_failure: {
        itemIdentifier: record.messageId,
      },
    },
    details: {
      event_source: record.eventSource ?? null,
      queue_arn: record.eventSourceARN ?? null,
      aws_region: record.awsRegion ?? null,
      approximate_receive_count:
        record.attributes?.ApproximateReceiveCount ?? null,
      replay: {
        handler: worker,
        event: {
          Records: [record],
        },
      },
    },
    error,
    maxAttempts: 3,
  })
}

export async function resolveFailedRegistrationEvent(args: {
  worker: string
  record: QueueRecord
}) {
  await resolveFailedJob({
    source: 'aws_event',
    dedupeKey: getDedupeKey(args.worker, args.record),
    response: {
      status: 'processed',
      message_id: args.record.messageId,
    },
  })
}
