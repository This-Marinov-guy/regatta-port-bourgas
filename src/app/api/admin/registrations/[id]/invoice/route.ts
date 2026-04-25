import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { getStripeServerClient } from '@/lib/stripe/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { RegistrationPaymentData, RegistrationRecord } from '@/types/admin'

function buildInvoiceAmount(registration: RegistrationRecord) {
  const stripe = registration.payment_data?.stripe
  const crewCount = Math.max(
    stripe?.crew_count ?? registration.crew_list.length ?? 0,
    1
  )
  const unitAmount = stripe?.unit_amount ?? 5000

  return {
    crewCount,
    unitAmount,
    totalAmount: stripe?.total_amount ?? crewCount * unitAmount,
    currency: stripe?.currency ?? 'eur',
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const registration = await getRegistrationWithEvent(id)
    const existingStripe =
      registration.payment_data?.stripe &&
      typeof registration.payment_data.stripe === 'object'
        ? registration.payment_data.stripe
        : {}

    if (!registration.event) {
      return NextResponse.json(
        { error: 'This registration is not linked to an event.' },
        { status: 400 }
      )
    }

    if (existingStripe.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Invoice generation is available only after payment is completed.' },
        { status: 400 }
      )
    }

    const stripe = getStripeServerClient()

    if (existingStripe.invoice_id) {
      const existingInvoice = await stripe.invoices.retrieve(existingStripe.invoice_id)

      return NextResponse.json({
        data: {
          invoiceId: existingInvoice.id,
          invoiceNumber: existingInvoice.number,
          hostedInvoiceUrl: existingInvoice.hosted_invoice_url,
          invoicePdf: existingInvoice.invoice_pdf,
        },
      })
    }

    const { totalAmount, currency, crewCount, unitAmount } = buildInvoiceAmount(registration)
    const customerEmail = registration.contact_email
    const customerName = registration.contact_name || registration.skipper_name
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    })
    const customer =
      existingCustomers.data[0] ??
      (await stripe.customers.create({
        email: customerEmail,
        name: customerName,
      }))

    const description = `${registration.event.name_en} registration fee - ${registration.boat_name} / ${registration.skipper_name}`

    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: totalAmount,
      currency,
      description,
      metadata: {
        method: 'regatta-fee',
        'registration-id': registration.id,
        'event-id': registration.event_id,
        'crew-count': String(crewCount),
        'unit-amount': String(unitAmount),
      },
    })

    const draftInvoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: false,
      collection_method: 'send_invoice',
      days_until_due: 30,
      description,
      metadata: {
        method: 'regatta-fee',
        'registration-id': registration.id,
        'event-id': registration.event_id,
      },
    })

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id)
    const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
      paid_out_of_band: true,
    })

    const nextPaymentData: RegistrationPaymentData = {
      ...(registration.payment_data && typeof registration.payment_data === 'object'
        ? registration.payment_data
        : {}),
      stripe: {
        ...existingStripe,
        customer_id: customer.id,
        customer_email: customerEmail,
        invoice_id: paidInvoice.id,
        invoice_number: paidInvoice.number,
        invoice_hosted_url: paidInvoice.hosted_invoice_url,
        invoice_pdf: paidInvoice.invoice_pdf,
        invoice_created_at: new Date().toISOString(),
      },
    }

    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from('registrations')
      .update({ payment_data: nextPaymentData })
      .eq('id', registration.id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      data: {
        registration: {
          ...(data as RegistrationRecord),
          generated_form_url: (data as RegistrationRecord).blank_link ?? null,
        },
        invoiceId: paidInvoice.id,
        invoiceNumber: paidInvoice.number,
        hostedInvoiceUrl: paidInvoice.hosted_invoice_url,
        invoicePdf: paidInvoice.invoice_pdf,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to generate invoice.',
      },
      { status: 400 }
    )
  }
}
