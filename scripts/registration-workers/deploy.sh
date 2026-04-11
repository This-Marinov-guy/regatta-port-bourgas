#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

require_var NEXT_PUBLIC_SUPABASE_URL
require_var SUPABASE_SERVICE_KEY
require_var REGISTRATION_SMTP_USER
require_var REGISTRATION_SMTP_PASSWORD
require_var REGISTRATION_SMTP_FROM

cd "$ROOT_DIR"

sam build --template-file aws/registration-processing.template.yaml

sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$REGISTRATION_STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --parameter-overrides \
    SupabaseUrl="$NEXT_PUBLIC_SUPABASE_URL" \
    SupabaseServiceKey="$SUPABASE_SERVICE_KEY" \
    RegistrationSmtpUser="$REGISTRATION_SMTP_USER" \
    RegistrationSmtpPassword="$REGISTRATION_SMTP_PASSWORD" \
    RegistrationSmtpFrom="$REGISTRATION_SMTP_FROM" \
    RegistrationSmtpHost="${REGISTRATION_SMTP_HOST:-smtp.gmail.com}" \
    RegistrationSmtpPort="${REGISTRATION_SMTP_PORT:-465}" \
    RegistrationSmtpSecure="${REGISTRATION_SMTP_SECURE:-true}" \
    RegistrationNotificationEmails="${REGISTRATION_NOTIFICATION_EMAILS:-}" \
    RegistrationOutputPublicBaseUrl="${AWS_REGISTRATION_OUTPUT_PUBLIC_BASE_URL:-}" \
    RegistrationArtifactsBucketName="${AWS_REGISTRATION_OUTPUT_BUCKET:-}" \
    RegistrationTemplateKey="$REGISTRATION_TEMPLATE_S3_KEY" \
    RegistrationPdfFontKey="$REGISTRATION_FONT_S3_KEY"

ARTIFACTS_BUCKET="$(stack_output RegistrationArtifactsBucketName)"

aws s3 cp \
  "$ROOT_DIR/public/documents/register-form-empty.pdf" \
  "s3://$ARTIFACTS_BUCKET/$REGISTRATION_TEMPLATE_S3_KEY" \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION"

aws s3 cp \
  "$ROOT_DIR/public/fonts/Manrope/Manrope-Regular.ttf" \
  "s3://$ARTIFACTS_BUCKET/$REGISTRATION_FONT_S3_KEY" \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION"

echo "Stack deployed: $REGISTRATION_STACK_NAME"
echo "Registration topic ARN: $(stack_output RegistrationEventsTopicArn)"
echo "Artifacts bucket: $ARTIFACTS_BUCKET"
