# Registration Processing

This project now supports an AWS-based registration pipeline:

1. The public registration API inserts the row in Supabase.
2. The API publishes a `registration.created` event to `AWS_REGISTRATION_EVENTS_TOPIC_ARN`.
3. SNS fans out the message to:
   - `registration_blanks`
   - `registration_notifications`
4. Each queue has its own DLQ and `maxReceiveCount: 3`.
5. Lambda workers process the queues:
   - `src/lambdas/registrations/registrationBlanks.ts`
   - `src/lambdas/registrations/registrationNotifications.ts`

## Required environment variables

App / API:

- `AWS_REGION`
- `AWS_REGISTRATION_EVENTS_TOPIC_ARN`

Lambda workers:

- `AWS_REGION`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `AWS_REGISTRATION_OUTPUT_BUCKET`
- `AWS_REGISTRATION_OUTPUT_PUBLIC_BASE_URL` (optional)
- `REGISTRATION_TEMPLATE_PATH` (optional if the PDF template is bundled in the Lambda package)
- `AWS_REGISTRATION_TEMPLATE_BUCKET` and `AWS_REGISTRATION_TEMPLATE_KEY` (optional S3 template source)
- `AWS_REGISTRATION_PDF_FONT_BUCKET` and `AWS_REGISTRATION_PDF_FONT_KEY` (optional S3 font source)
- `REGISTRATION_PDF_FONT_PATH` (optional, defaults to bundled Manrope font)
- `SMTP_HOST` (defaults to `smtp.gmail.com`)
- `SMTP_PORT` (defaults to `465`)
- `SMTP_SECURE` (defaults to `true`)
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `REGISTRATION_NOTIFICATION_EMAILS` (comma-separated)

## Deployment notes

- The AWS SAM stack is in `aws/registration-processing.template.yaml`.
- When the blanks worker succeeds, it uploads the generated PDF to S3, emails the entrant through Gmail SMTP, and stores the public file URL in `public.registrations.generated_form_url`.
- The deploy script uploads `public/documents/register-form-empty.pdf` and `public/fonts/Manrope/Manrope-Regular.ttf` into the stack bucket automatically.

## Hosting outline

1. Fill `.env.local` from `.env.example`.
2. Deploy the full stack with `npm run registration:deploy`.
3. Copy the produced `RegistrationEventsTopicArn` into `AWS_REGISTRATION_EVENTS_TOPIC_ARN` for the Next.js app environment if the web app runs separately.
4. Run the Supabase migrations before testing the flow.
5. Use the helper scripts when needed:
   - `npm run registration:stop`
   - `npm run registration:restart`
   - `npm run registration:update`

## Important credential split

- Use IAM access keys only for local deployment tooling or CI.
- Do not put long-lived AWS access keys into Lambda runtime env vars.
- Lambda should use its execution role for AWS access at runtime.
