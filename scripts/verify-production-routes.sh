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

canonical_routes=(
  "/"
  "/services"
  "/psychiatric-evaluation"
  "/north-phoenix-psychiatric-care"
  "/medication-management"
  "/new-patients"
  "/current-patients"
  "/insurance-payment"
  "/telehealth"
  "/faq"
  "/about"
  "/contact"
  "/anxiety"
  "/depression"
  "/adhd"
  "/ptsd"
  "/ocd"
  "/bipolar"
  "/grief-loss"
  "/life-transitions"
  "/privacy"
)

legacy_redirects=(
  "/services-overview|/services"
  "/pricing|/insurance-payment"
  "/about-us|/about"
  "/contactus|/contact"
  "/attention-deficit-hyperactive-disorder|/adhd"
  "/post-traumatic-stress-disorder|/ptsd"
  "/obsessive-compulsive-disorder|/ocd"
  "/loss-bereavement|/grief-loss"
  "/life-changes|/life-transitions"
)

html_redirects=(
  "/index.html|/"
  "/services.html|/services"
  "/psychiatric-evaluation.html|/psychiatric-evaluation"
  "/north-phoenix-psychiatric-care.html|/north-phoenix-psychiatric-care"
  "/medication-management.html|/medication-management"
  "/new-patients.html|/new-patients"
  "/current-patients.html|/current-patients"
  "/insurance-payment.html|/insurance-payment"
  "/telehealth.html|/telehealth"
  "/faq.html|/faq"
  "/about.html|/about"
  "/contact.html|/contact"
  "/anxiety.html|/anxiety"
  "/depression.html|/depression"
  "/adhd.html|/adhd"
  "/ptsd.html|/ptsd"
  "/ocd.html|/ocd"
  "/bipolar.html|/bipolar"
  "/grief-loss.html|/grief-loss"
  "/life-transitions.html|/life-transitions"
  "/privacy.html|/privacy"
)

failures=0

check_status() {
  local url="$1"
  local expected="$2"
  local actual
  actual="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $url -> $actual (expected $expected)"
    failures=$((failures + 1))
  else
    echo "OK   $url -> $actual"
  fi
}

check_redirect() {
  local source="$1"
  local destination="$2"
  local expected_code="$3"
  local result actual location expected_url
  result="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code} %{redirect_url}' "${BASE_URL}${source}")"
  actual="${result%% *}"
  location="${result#* }"
  expected_url="${BASE_URL}${destination}"

  if [[ "$actual" != "$expected_code" || "$location" != "$expected_url" ]]; then
    echo "FAIL ${BASE_URL}${source} -> $actual $location (expected $expected_code $expected_url)"
    failures=$((failures + 1))
  else
    echo "OK   ${BASE_URL}${source} -> $actual $location"
  fi
}

check_permanent_redirect() {
  local source="$1"
  local destination="$2"
  local result actual location expected_url
  result="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code} %{redirect_url}' "${BASE_URL}${source}")"
  actual="${result%% *}"
  location="${result#* }"
  expected_url="${BASE_URL}${destination}"

  if [[ ( "$actual" != "301" && "$actual" != "308" ) || "$location" != "$expected_url" ]]; then
    echo "FAIL ${BASE_URL}${source} -> $actual $location (expected permanent redirect to $expected_url)"
    failures=$((failures + 1))
  else
    echo "OK   ${BASE_URL}${source} -> $actual $location"
  fi
}

echo "Checking canonical routes..."
for route in "${canonical_routes[@]}"; do
  check_status "${BASE_URL}${route}" "200"
done

echo
echo "Checking legacy Odoo redirects..."
for pair in "${legacy_redirects[@]}"; do
  source="${pair%%|*}"
  destination="${pair#*|}"
  check_redirect "$source" "$destination" "301"
  check_redirect "${source}/" "$destination" "301"
done

echo
echo "Checking canonical trailing-slash normalization..."
for route in "${canonical_routes[@]}"; do
  [[ "$route" == "/" ]] && continue
  check_permanent_redirect "${route}/" "$route"
done

echo
echo "Checking Cloudflare .html normalization..."
for pair in "${html_redirects[@]}"; do
  source="${pair%%|*}"
  destination="${pair#*|}"
  check_permanent_redirect "$source" "$destination"
done

echo
echo "Checking required public files..."
check_status "${BASE_URL}/robots.txt" "200"
check_status "${BASE_URL}/sitemap.xml" "200"

echo
echo "Checking unknown-route behavior..."
check_status "${BASE_URL}/this-page-should-not-exist" "404"

echo
echo "Checking indexing response header for $MODE mode..."
headers="$(curl -sS --max-time 20 -I "${BASE_URL}/")"
if [[ "$MODE" == "production" ]]; then
  if grep -qi '^X-Robots-Tag:.*noindex' <<<"$headers"; then
    echo "FAIL production host is sending X-Robots-Tag: noindex"
    failures=$((failures + 1))
  else
    echo "OK   production host is not sending an X-Robots-Tag noindex header"
  fi
else
  if grep -qi '^X-Robots-Tag:.*noindex' <<<"$headers"; then
    echo "OK   preview host is noindex at the response-header level"
  else
    echo "WARN preview host is not sending X-Robots-Tag: noindex; resolve duplicate-host indexing before final launch"
  fi
fi

if (( failures > 0 )); then
  echo
  echo "$failures check(s) failed." >&2
  exit 1
fi

echo
echo "All required route checks passed."
