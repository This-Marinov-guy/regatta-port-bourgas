#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local"
  set +a
fi

BASE_URL="${NEXT_PUBLIC_URL:-http://localhost:3000}"
HEALTH_URL="$BASE_URL/api/health"

# ── colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}Regatta Port Bourgas — Service Health${RESET}"
echo -e "Endpoint: ${HEALTH_URL}"
echo -e "Time:     $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

BODY=$(curl -s -o /tmp/_healthcheck_body.json -w "%{http_code}" "$HEALTH_URL" 2>&1)
HTTP_CODE="$BODY"
BODY=$(cat /tmp/_healthcheck_body.json 2>/dev/null || echo "{}")

if [[ "$HTTP_CODE" == "000" ]]; then
  echo -e "${RED}✗ Could not reach $HEALTH_URL — is the dev server running?${RESET}"
  echo -e "  Run: npm run dev"
  exit 1
fi

OVERALL=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")
TIMESTAMP=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('timestamp',''))" 2>/dev/null || echo "")

if [[ "$OVERALL" == "ok" ]]; then
  echo -e "${GREEN}${BOLD}● Overall: OK${RESET}"
else
  echo -e "${YELLOW}${BOLD}● Overall: DEGRADED${RESET}"
fi
[[ -n "$TIMESTAMP" ]] && echo -e "  Checked at: $TIMESTAMP"
echo ""

# Parse and display each check
echo "$BODY" > /tmp/_healthcheck_display.json
python3 - /tmp/_healthcheck_display.json <<'EOF'
import sys, json

CHECKS_ORDER = [
  ("supabase",             "Supabase (DB)"),
  ("sns",                  "AWS SNS topic"),
  ("s3",                   "AWS S3 bucket"),
  ("lambda_blanks",        "Lambda: registration-blanks"),
  ("lambda_notifications", "Lambda: registration-notifications"),
  ("smtp",                 "Gmail SMTP"),
  ("google_drive",         "Google Drive API"),
  ("mypos",                "myPOS Checkout"),
]

GREEN  = '\033[0;32m'
RED    = '\033[0;31m'
YELLOW = '\033[1;33m'
RESET  = '\033[0m'
BOLD   = '\033[1m'

try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
    checks = data.get("checks", {})
except Exception as e:
    print(f"  Failed to parse response: {e}")
    sys.exit(1)

max_label = max(len(label) for _, label in CHECKS_ORDER)

for key, label in CHECKS_ORDER:
    check = checks.get(key, {})
    status = check.get("status", "unknown")
    latency = check.get("latency")
    detail = check.get("detail", "")

    latency_str = f"  {latency}ms" if latency is not None else ""

    if status == "ok":
        icon = f"{GREEN}✓{RESET}"
        status_str = f"{GREEN}ok{RESET}"
    elif status == "error":
        icon = f"{RED}✗{RESET}"
        status_str = f"{RED}error{RESET}"
    else:
        icon = f"{YELLOW}?{RESET}"
        status_str = f"{YELLOW}{status}{RESET}"

    padded = label.ljust(max_label)
    print(f"  {icon}  {BOLD}{padded}{RESET}  {status_str}{latency_str}")

    if detail:
        print(f"       └─ {detail}")

print("")
EOF

exit $([ "$OVERALL" = "ok" ] && echo 0 || echo 1)
