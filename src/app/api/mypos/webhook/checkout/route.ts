import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { sendRegistrationPaymentConfirmationToEntrant } from '@/lib/registrations/email'
import {
  getRegistrationIdFromMyposOrder,
  myposAmountToCents,
  verifyMyposFields,
} from '@/lib/mypos/server'
import { normalizeLocale } from '@/lib/locale'
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
    method &&
    method !== 'IPCPurchaseNotify' &&
    method !== 'IPCPurchaseRollback'
  ) {
    return {
      ignored: true,
      reason: `Unsupported IPCmethod: ${method}`,
    }
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

  if (method !== 'IPCPurchaseRollback' && !wasPaid) {
    const registration = await getRegistrationWithEvent(registrationId)
    await sendRegistrationPaymentConfirmationToEntrant(
      registration,
      nextPaymentData.mypos?.locale ?? 'en'
    )
  }

  return {
    ignored: false,
    registrationId,
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  const { fields, signature } = parseFormPayload(payload)

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing myPOS signature.' },
      { status: 400 }
    )
  }

  try {
    if (!verifyMyposFields(fields, signature)) {
      return NextResponse.json(
        { error: 'Invalid myPOS signature.' },
        { status: 400 }
      )
    }

    await updateRegistrationFromNotify(fields)

    return new Response('OK', {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to process myPOS webhook.',
      },
      { status: 400 }
    )
  }
}
