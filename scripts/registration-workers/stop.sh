#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

BLANKS_FUNCTION="$(stack_output RegistrationBlanksFunctionName)"
NOTIFICATIONS_FUNCTION="$(stack_output RegistrationNotificationsFunctionName)"

for function_name in "$BLANKS_FUNCTION" "$NOTIFICATIONS_FUNCTION"; do
  uuid="$(function_mapping_uuid "$function_name")"
  aws lambda update-event-source-mapping \
    --uuid "$uuid" \
    --no-enabled \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" >/dev/null
  echo "Stopped event source mapping for $function_name ($uuid)"
done
