#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
MODE="${2:-production}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base-url> [production|preview]" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
if [[ "$MODE" != "production" && "$MODE" != "preview" ]]; then
  echo "Mode must be production or preview." >&2
  exit 2
fi

routes=(
  "/"
  "/services-overview"
  "/medication-management"
  "/new-patients"
  "/insurance-payment"
  "/telehealth"
  "/faq"
  "/about-us"
  "/contactus"
  "/anxiety"
  "/depression"
  "/attention-deficit-hyperactive-disorder"
  "/post-traumatic-stress-disorder"
  "/obsessive-compulsive-disorder"
  "/bipolar"
  "/loss-bereavement"
  "/life-changes"
  "/privacy"
)

html_routes=(
  "/index.html"
  "/services.html"
  "/medication-management.html"
  "/new-patients.html"
  "/insurance-payment.html"
  "/telehealth.html"
  "/faq.html"
  "/about.html"
  "/contact.html"
  "/anxiety.html"
  "/depression.html"
  "/adhd.html"
  "/ptsd.html"
  "/ocd.html"
  "/bipolar.html"
  "/grief-loss.html"
  "/life-transitions.html"
  "/privacy.html"
)

failures=0

check_status() {
  local url="$1"
  local expected="$2"
  local actual
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $url -> $actual (expected $expected)"
    failures=$((failures + 1))
  else
    echo "OK   $url -> $actual"
  fi
}

echo "Checking canonical routes..."
for route in "${routes[@]}"; do
  check_status "${BASE_URL}${route}" "200"
done

echo
echo "Checking direct .html normalization..."
for route in "${html_routes[@]}"; do
  check_status "${BASE_URL}${route}" "301"
done

echo
echo "Checking required public files..."
check_status "${BASE_URL}/robots.txt" "200"
check_status "${BASE_URL}/sitemap.xml" "200"
check_status "${BASE_URL}/healthz" "200"

echo
echo "Checking unknown-route behavior..."
check_status "${BASE_URL}/this-page-should-not-exist" "404"

echo
echo "Checking indexing header for $MODE mode..."
headers="$(curl -sS -I "${BASE_URL}/")"
if [[ "$MODE" == "preview" ]]; then
  if grep -qi '^X-Robots-Tag:.*noindex' <<<"$headers"; then
    echo "OK   preview host is noindex"
  else
    echo "FAIL preview host is missing X-Robots-Tag: noindex"
    failures=$((failures + 1))
  fi
else
  if grep -qi '^X-Robots-Tag:.*noindex' <<<"$headers"; then
    echo "FAIL production host is sending X-Robots-Tag: noindex"
    failures=$((failures + 1))
  else
    echo "OK   production host is indexable at the response-header level"
  fi
fi

if (( failures > 0 )); then
  echo
  echo "$failures check(s) failed." >&2
  exit 1
fi

echo
echo "All route checks passed."
