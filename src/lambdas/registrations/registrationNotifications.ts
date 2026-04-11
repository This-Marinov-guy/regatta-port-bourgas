import type { QueueBatchResponse, QueueEvent, RegistrationCreatedMessage } from '@/lib/registrations/types'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { sendRegistrationNotificationToAdmins } from '@/lib/registrations/email'

function parseMessage(body: string) {
  const parsed = JSON.parse(body) as RegistrationCreatedMessage | { Message?: string }

  if ('Message' in parsed && typeof parsed.Message === 'string') {
    return JSON.parse(parsed.Message) as RegistrationCreatedMessage
  }

  return parsed as RegistrationCreatedMessage
}

export async function handler(event: QueueEvent): Promise<QueueBatchResponse> {
  const batchItemFailures: QueueBatchResponse['batchItemFailures'] = []

  await Promise.all(
    event.Records.map(async (record) => {
      try {
        const message = parseMessage(record.body)
        const registration = await getRegistrationWithEvent(message.registrationId)
        await sendRegistrationNotificationToAdmins(registration)
      } catch (error) {
        console.error('registrationNotifications failed', error)
        batchItemFailures.push({ itemIdentifier: record.messageId })
      }
    })
  )

  return { batchItemFailures }
}

