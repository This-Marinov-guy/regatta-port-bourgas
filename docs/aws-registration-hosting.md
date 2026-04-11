# AWS Registration Hosting Guide

## 1. Create deployment credentials

Use an IAM user only for deployment, not for runtime.

Recommended permissions for that deploy user:

- CloudFormation
- Lambda
- IAM role pass/create for the stack
- S3
- SNS
- SQS

Suggested flow:

1. Open AWS IAM.
2. Create a user for deployment, for example `regatta-deployer`.
3. Attach a deployment policy or an admin policy during initial setup.
4. Create an access key for that user.
5. Save the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` immediately.
6. On your machine run:

```bash
aws configure --profile regatta-prod
```

Then enter:

- Access key ID
- Secret access key
- Region, for example `eu-central-1`
- Output format, for example `json`

Set this in `.env.local`:

```bash
AWS_PROFILE=regatta-prod
AWS_REGION=eu-central-1
REGISTRATION_STACK_NAME=regatta-registration-processing
```

## 2. Fill local env

Copy `.env.example` into `.env.local` and fill:

- Supabase URL and service key
- Gmail SMTP user / app password / from email
- notification recipients
- optional custom bucket name or public base URL

## 3. Deploy the worker stack

Run:

```bash
npm run registration:deploy
```

This will:

1. build the SAM application
2. deploy the AWS stack
3. create the S3 bucket, SNS topic, SQS queues, DLQs, and both Lambda functions
4. upload the blank PDF template and the Manrope font into the stack bucket

## 4. Wire the web app

After deploy, copy the SNS topic ARN from the deploy output or from the stack output:

- `RegistrationEventsTopicArn`

Add that value to the web app environment:

```bash
AWS_REGISTRATION_EVENTS_TOPIC_ARN=...
```

The Next.js registration API will publish new registration events there.

## 5. Runtime model

- Next.js app publishes to SNS
- SNS fans out to `registration_blanks` and `registration_notifications`
- SQS invokes the two Lambdas
- Lambda uses its execution role for AWS access
- Lambda uses Supabase service key + Gmail SMTP from environment

## 6. Worker control

Stop queue consumption:

```bash
npm run registration:stop
```

Restart queue consumption:

```bash
npm run registration:restart
```

Redeploy updated code and refresh uploaded assets:

```bash
npm run registration:update
```
