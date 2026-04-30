import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getMyposConfigurationStatus, getMyposCheckoutEndpoint } from '@/lib/mypos/server'
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda'
import nodemailer from 'nodemailer'

type CheckResult = {
  status: 'ok' | 'error'
  latency?: number
  detail?: string
}

type HealthReport = {
  status: 'ok' | 'degraded'
  timestamp: string
  checks: Record<string, CheckResult>
}

async function timed(fn: () => Promise<void>): Promise<CheckResult> {
  const start = Date.now()
  try {
    await fn()
    return { status: 'ok', latency: Date.now() - start }
  } catch (err) {
    return {
      status: 'error',
      latency: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

async function checkSupabase(): Promise<CheckResult> {
  return timed(async () => {
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase
      .from('events')
      .select('id')
      .limit(1)
    if (error) throw new Error(error.message)
  })
}

async function checkSns(): Promise<CheckResult> {
  const topicArn = process.env.AWS_REGISTRATION_EVENTS_TOPIC_ARN
  if (!topicArn) return { status: 'error', detail: 'AWS_REGISTRATION_EVENTS_TOPIC_ARN not set' }

  return timed(async () => {
    const client = new SNSClient({ region: process.env.AWS_REGION || 'eu-central-1' })
    await client.send(new GetTopicAttributesCommand({ TopicArn: topicArn }))
  })
}

async function checkS3(): Promise<CheckResult> {
  const bucket = 'regatta-registration-proc-registrationartifactsbuc-usp6mvfconkw'
  return timed(async () => {
    const client = new S3Client({ region: process.env.AWS_REGION || 'eu-central-1' })
    await client.send(new HeadBucketCommand({ Bucket: bucket }))

    const testKey = 'health/ping'
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: 'ok',
      ContentType: 'text/plain',
    }))
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }))
  })
}

async function checkLambda(functionName: string): Promise<CheckResult> {
  return timed(async () => {
    const client = new LambdaClient({ region: process.env.AWS_REGION || 'eu-central-1' })
    const res = await client.send(new GetFunctionCommand({ FunctionName: functionName }))
    const state = res.Configuration?.State
    if (state !== 'Active') throw new Error(`Function state: ${state}`)
  })
}

async function checkSmtp(): Promise<CheckResult> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE !== 'false'

  if (!host || !user || !pass) {
    return { status: 'error', detail: 'SMTP_HOST / SMTP_USER / SMTP_PASSWORD not set' }
  }

  return timed(async () => {
    const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
    await transport.verify()
  })
}

async function checkGoogleDrive(): Promise<CheckResult> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const folderId = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID
  if (!apiKey || !folderId) {
    return { status: 'error', detail: 'GOOGLE_DRIVE_API_KEY or GOOGLE_DRIVE_GALLERY_FOLDER_ID not set' }
  }

  return timed(async () => {
    const url = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents&key=${apiKey}&pageSize=1&fields=files(id)`
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Drive API ${res.status}: ${body.slice(0, 120)}`)
    }
  })
}

async function checkMypos(): Promise<CheckResult> {
  const config = getMyposConfigurationStatus()

  if (!config.enabled) {
    return {
      status: 'error',
      detail: [
        config.missing.length ? `${config.missing.join(', ')} not set` : null,
        ...config.invalid,
      ]
        .filter(Boolean)
        .join('; '),
    }
  }

  return timed(async () => {
    const checkoutUrl = getMyposCheckoutEndpoint()
    const res = await fetch(checkoutUrl, { method: 'HEAD' })

    if (res.status >= 500) {
      const body = await res.text()
      throw new Error(`myPOS ${res.status}: ${body.slice(0, 120)}`)
    }
  })
}

export async function GET() {
  const [
    supabase,
    sns,
    s3,
    lambdaBlanks,
    lambdaNotifications,
    smtp,
    googleDrive,
    mypos,
  ] = await Promise.allSettled([
    checkSupabase(),
    checkSns(),
    checkS3(),
    checkLambda('registration-blanks'),
    checkLambda('registration-notifications'),
    checkSmtp(),
    checkGoogleDrive(),
    checkMypos(),
  ])

  function settled(r: PromiseSettledResult<CheckResult>): CheckResult {
    if (r.status === 'fulfilled') return r.value
    return { status: 'error', detail: r.reason instanceof Error ? r.reason.message : String(r.reason) }
  }

  const checks: HealthReport['checks'] = {
    supabase: settled(supabase),
    sns: settled(sns),
    s3: settled(s3),
    lambda_blanks: settled(lambdaBlanks),
    lambda_notifications: settled(lambdaNotifications),
    smtp: settled(smtp),
    google_drive: settled(googleDrive),
    mypos: settled(mypos),
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')

  const report: HealthReport = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }

  return NextResponse.json(report, { status: allOk ? 200 : 207 })
}
