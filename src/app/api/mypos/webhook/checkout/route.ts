import { after, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { sendRegistrationPaymentConfirmationToEntrant } from '@/lib/registrations/email'
import {
  getMyposConfig,
  getRegistrationIdFromMyposOrder,
  myposAmountToCents,
  verifyMyposFields,
} from '@/lib/mypos/server'
import { normalizeLocale } from '@/lib/locale'
import { recordFailedJob, resolveFailedJob } from '@/lib/failedJobs'
import type { RegistrationPaymentData } from '@/types/admin'

export const runtime = 'nodejs'

type MyposNotifyPayload = Record<string, string>

function parseFormPayload(payload: string) {
  const params = new URLSearchParams(payload)
  const fields: MyposNotifyPayload = {}
  let signature: string | null = null

  for (const [key, value] of params.entries()) {
    if (key === 'Signature') {
      signature = value
    } else {
      fields[key] = value
    }
  }

  return {
    fields,
    signature,
  }
}

function getPayloadValue(payload: MyposNotifyPayload, key: string) {
  const value = payload[key]

  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getWebhookDedupeKey(
  fields: MyposNotifyPayload,
  payload: string
) {
  const fallback = createHash('sha256').update(payload).digest('hex')

  return [
    getPayloadValue(fields, 'IPCmethod') ?? 'unknown',
    getPayloadValue(fields, 'OrderID') ?? 'unknown',
    getPayloadValue(fields, 'RequestSTAN') ?? fallback,
  ].join(':')
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to process myPOS webhook.'
}

function validateNotifyPayload(args: {
  current: RegistrationPaymentData
  payload: MyposNotifyPayload
  orderId: string
  method: 'IPCPurchaseNotify' | 'IPCPurchaseRollback'
}) {
  const { current, payload, orderId, method } = args
  const currentMypos = current?.mypos
  const sid = getPayloadValue(payload, 'SID')
  const amountCents = myposAmountToCents(getPayloadValue(payload, 'Amount'))
  const currency = getPayloadValue(payload, 'Currency')?.toLowerCase()

  if (sid !== getMyposConfig().sid) {
    throw new Error('myPOS notification SID does not match this store.')
  }

  if (!currentMypos || currentMypos.order_id !== orderId) {
    throw new Error('myPOS notification does not match the active checkout order.')
  }

  if (
    currentMypos.total_amount == null ||
    amountCents !== currentMypos.total_amount
  ) {
    throw new Error('myPOS notification amount does not match the checkout order.')
  }

  if (!currentMypos.currency || currency !== currentMypos.currency.toLowerCase()) {
    throw new Error('myPOS notification currency does not match the checkout order.')
  }

  if (
    method === 'IPCPurchaseNotify' &&
    !getPayloadValue(payload, 'IPC_Trnref')
  ) {
    throw new Error('myPOS notification is missing the transaction reference.')
  }
}

function extractPaidPaymentData(args: {
  current: RegistrationPaymentData
  payload: MyposNotifyPayload
  registrationId: string
}) {
  const { current, payload, registrationId } = args
  const existingMypos =
    current?.mypos && typeof current.mypos === 'object' ? current.mypos : {}
  const amountCents =
    myposAmountToCents(getPayloadValue(payload, 'Amount')) ??
    existingMypos.total_amount
  const currency = getPayloadValue(payload, 'Currency') ?? existingMypos.currency
  const locale = normalizeLocale(existingMypos.locale)
  const completedAt = new Date().toISOString()

  return {
    ...(current && typeof current === 'object' ? current : {}),
    mypos: {
      ...existingMypos,
      order_id: getPayloadValue(payload, 'OrderID') ?? existingMypos.order_id,
      status: 'complete',
      payment_status: 'paid',
      method: existingMypos.method ?? 'regatta-fee',
      registration_id: registrationId,
      event_id: existingMypos.event_id ?? null,
      customer_email: existingMypos.customer_email ?? null,
      locale,
      total_amount: amountCents,
      amount: getPayloadValue(payload, 'Amount') ?? existingMypos.amount,
      currency: currency?.toLowerCase(),
      transaction_ref:
        getPayloadValue(payload, 'IPC_Trnref') ?? existingMypos.transaction_ref,
      request_stan:
        getPayloadValue(payload, 'RequestSTAN') ?? existingMypos.request_stan,
      request_datetime:
        getPayloadValue(payload, 'RequestDateTime') ??
        existingMypos.request_datetime,
      raw_status: getPayloadValue(payload, 'Status') ?? existingMypos.raw_status,
      completed_at: existingMypos.completed_at ?? completedAt,
    },
  } satisfies RegistrationPaymentData
}

function extractRolledBackPaymentData(args: {
  current: RegistrationPaymentData
  payload: MyposNotifyPayload
  registrationId: string
}) {
  const { current, payload, registrationId } = args
  const existingMypos =
    current?.mypos && typeof current.mypos === 'object' ? current.mypos : {}
  const amountCents =
    myposAmountToCents(getPayloadValue(payload, 'Amount')) ??
    existingMypos.total_amount
  const currency = getPayloadValue(payload, 'Currency') ?? existingMypos.currency

  return {
    ...(current && typeof current === 'object' ? current : {}),
    mypos: {
      ...existingMypos,
      order_id: getPayloadValue(payload, 'OrderID') ?? existingMypos.order_id,
      status: 'rolled_back',
      payment_status: 'unpaid',
      method: existingMypos.method ?? 'regatta-fee',
      registration_id: registrationId,
      total_amount: amountCents,
      amount: getPayloadValue(payload, 'Amount') ?? existingMypos.amount,
      currency: currency?.toLowerCase(),
      raw_status: 'rollback',
      rolled_back_at: new Date().toISOString(),
    },
  } satisfies RegistrationPaymentData
}

async function updateRegistrationFromNotify(payload: MyposNotifyPayload) {
  const orderId = getPayloadValue(payload, 'OrderID')
  const method = getPayloadValue(payload, 'IPCmethod')

  if (
    method !== 'IPCPurchaseNotify' &&
    method !== 'IPCPurchaseRollback'
  ) {
    throw new Error(`Unsupported myPOS notification method: ${method ?? 'missing'}.`)
  }

  if (!orderId) {
    throw new Error('Missing myPOS OrderID.')
  }

  const registrationId = getRegistrationIdFromMyposOrder(orderId)

  if (!registrationId) {
    throw new Error('Unable to resolve registration from myPOS OrderID.')
  }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('id, payment_data')
    .eq('id', registrationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const currentPaymentData = data.payment_data as RegistrationPaymentData
  validateNotifyPayload({
    current: currentPaymentData,
    payload,
    orderId,
    method,
  })
  const wasPaid =
    currentPaymentData?.mypos?.payment_status === 'paid' ||
    currentPaymentData?.stripe?.payment_status === 'paid'
  const nextPaymentData =
    method === 'IPCPurchaseRollback'
      ? extractRolledBackPaymentData({
          current: currentPaymentData,
          payload,
          registrationId,
        })
      : extractPaidPaymentData({
          current: currentPaymentData,
          payload,
          registrationId,
        })

  const { error: updateError } = await supabase
    .from('registrations')
    .update({ payment_data: nextPaymentData })
    .eq('id', registrationId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return {
    registrationId,
    sendConfirmation: method !== 'IPCPurchaseRollback' && !wasPaid,
    locale: nextPaymentData.mypos?.locale ?? 'en',
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  const { fields, signature } = parseFormPayload(payload)
  const dedupeKey = getWebhookDedupeKey(fields, payload)

  try {
    if (!signature) {
      throw new Error('Missing myPOS signature.')
    }

    if (!verifyMyposFields(fields, signature)) {
      throw new Error('Invalid myPOS signature.')
    }

    const result = await updateRegistrationFromNotify(fields)

    if (result.sendConfirmation) {
      after(async () => {
        try {
          const registration = await getRegistrationWithEvent(result.registrationId)
          await sendRegistrationPaymentConfirmationToEntrant(
            registration,
            result.locale
          )
        } catch (error) {
          console.error('Unable to send myPOS payment confirmation email:', error)
        }
      })
    }

    await resolveFailedJob({
      source: 'webhook',
      dedupeKey,
      response: {
        status_code: 200,
        body: 'OK',
      },
    })

    return new Response('OK', {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Unable to process myPOS checkout notification:', error)
    const message = getErrorMessage(error)

    await recordFailedJob({
      source: 'webhook',
      jobType: 'mypos.checkout.notification',
      handler: 'POST /api/mypos/webhook/checkout',
      dedupeKey,
      request: {
        method: request.method,
        url: request.url,
        headers: {
          content_type: request.headers.get('content-type'),
          user_agent: request.headers.get('user-agent'),
          forwarded_for: request.headers.get('x-forwarded-for'),
        },
        raw_body: payload,
        fields,
        signature,
      },
      response: {
        status_code: 400,
        body: {
          error: message,
        },
      },
      details: {
        ipc_method: getPayloadValue(fields, 'IPCmethod'),
        order_id: getPayloadValue(fields, 'OrderID'),
        request_stan: getPayloadValue(fields, 'RequestSTAN'),
        transaction_ref: getPayloadValue(fields, 'IPC_Trnref'),
        replay: {
          method: 'POST',
          path: '/api/mypos/webhook/checkout',
          content_type: 'application/x-www-form-urlencoded',
          body: payload,
        },
      },
      error,
    })

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 }
    )
  }
}
