import type { QueueBatchResponse, QueueEvent, RegistrationCreatedMessage } from '@/lib/registrations/types'
import { getRegistrationWithEvent, setGeneratedRegistrationFormUrl } from '@/lib/registrations/data'
import { generateRegistrationPdf, uploadRegistrationPdf } from '@/lib/registrations/pdf'
import { sendRegistrationPdfToEntrant } from '@/lib/registrations/email'

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
        const { fileName, pdfBuffer } = await generateRegistrationPdf(registration)
        const uploaded = await uploadRegistrationPdf({
          registration,
          fileName,
          pdfBuffer,
        })

        await setGeneratedRegistrationFormUrl(registration.id, uploaded.url)
        await sendRegistrationPdfToEntrant({
          registration: { ...registration, generated_form_url: uploaded.url },
          fileName,
          pdfBuffer,
          generatedFormUrl: uploaded.url,
          locale: message.locale,
        })
      } catch (error) {
        console.error('registrationBlanks failed', error)
        batchItemFailures.push({ itemIdentifier: record.messageId })
      }
    })
  )

  return { batchItemFailures }
}
