#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local"
  set +a
fi

AWS_PROFILE="${AWS_PROFILE:-default}"
AWS_REGION="${AWS_REGION:-eu-central-1}"
REGISTRATION_STACK_NAME="${REGISTRATION_STACK_NAME:-regatta-registration-processing}"
REGISTRATION_TEMPLATE_S3_KEY="${REGISTRATION_TEMPLATE_S3_KEY:-registration-assets/register-form-empty.pdf}"
REGISTRATION_FONT_S3_KEY="${REGISTRATION_FONT_S3_KEY:-registration-assets/Manrope-Regular.ttf}"

function require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

function stack_output() {
  local key="$1"
  aws cloudformation describe-stacks \
    --stack-name "$REGISTRATION_STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue | [0]" \
    --output text
}

function function_mapping_uuid() {
  local function_name="$1"
  aws lambda list-event-source-mappings \
    --function-name "$function_name" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --query "EventSourceMappings[0].UUID" \
    --output text
}
