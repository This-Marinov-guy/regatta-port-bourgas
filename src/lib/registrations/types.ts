import type { AppLocale } from '@/lib/locale'

export type RegistrationCreatedMessage = {
  registrationId: string
  eventId: string
  createdAt: string
  locale?: AppLocale
}

export type QueueRecord = {
  messageId: string
  body: string
  receiptHandle?: string
  eventSource?: string
  eventSourceARN?: string
  awsRegion?: string
  attributes?: Record<string, string>
  messageAttributes?: Record<string, unknown>
  md5OfBody?: string
}

export type QueueEvent = {
  Records: QueueRecord[]
}

export type QueueBatchResponse = {
  batchItemFailures: Array<{ itemIdentifier: string }>
}
