# Back to Life Mental Health Website

Custom public website for Back to Life Mental Health LLC, an independent psychiatric practice in Anthem, Arizona.

## Current build

The site is intentionally framework-free: plain HTML, CSS, vanilla JavaScript, local images, and local video. It includes the homepage, services, medication management, new-patient guidance, current-patient resources, insurance/payment, telehealth, FAQ, About, Contact, Privacy, and condition pages for anxiety, depression, ADHD, PTSD, OCD, bipolar disorder, grief/loss, and life transitions.

Sensitive and patient-specific workflows remain with Tebra. The public site does not collect portal credentials or protected clinical information.

## Hosting state

Production is still the Odoo-hosted site at:

`https://www.back-to-life-mental-health.com/`

Cloudflare Pages staging is:

`https://back-to-life-mental-health.pages.dev/`

The intended final architecture is:

`www.back-to-life-mental-health.com` → Cloudflare Pages → static Back to Life Mental Health website

Do not change DNS until pre-cutover QA passes.

## Cloudflare Pages deployment

Pushes to `main` deploy through:

`.github/workflows/deploy-pages.yml`

The deployment copies the static site into `public-dist`, runs `scripts/prepare-cloudflare-site.py`, transcodes the provider introduction video into a browser-safe H.264/AAC MP4, and deploys the result with Wrangler.

The preparation script is deliberately narrow. It:

- removes historical GitHub Pages JavaScript compatibility-route directories from the Cloudflare build so they cannot shadow real pages;
- rewrites internal page links to clean extensionless canonical routes;
- aligns HTML canonical metadata with the production `www` hostname;
- leaves Tebra links, media, styles, scripts, phone/email links, and patient workflows unchanged.

Cloudflare Pages natively serves a top-level file such as `about.html` at `/about` and normalizes direct `.html` requests to the extensionless route.

## Canonical public routes

- `/`
- `/services`
- `/medication-management`
- `/new-patients`
- `/current-patients`
- `/insurance-payment`
- `/telehealth`
- `/faq`
- `/about`
- `/contact`
- `/anxiety`
- `/depression`
- `/adhd`
- `/ptsd`
- `/ocd`
- `/bipolar`
- `/grief-loss`
- `/life-transitions`
- `/privacy`

The `_redirects` file preserves old Odoo URLs with direct HTTP 301 redirects to the final canonical destination and normalizes trailing slashes. Examples include `/services-overview` → `/services`, `/about-us` → `/about`, `/contactus` → `/contact`, and the older long-form ADHD/PTSD/OCD routes → `/adhd`, `/ptsd`, and `/ocd`.

`robots.txt`, `sitemap.xml`, and HTML canonical metadata use `https://www.back-to-life-mental-health.com/` as the primary production hostname.

## Tebra boundaries

Current scheduler URL used by the site:

`https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034`

Do not replace the practice key unless current Tebra Practice Settings confirms a different direct scheduling URL.

Patient Portal:

`https://portal.kareo.com/`

Provider telehealth room:

`https://telehealth.kareo.com/lcarton`

Never build a custom Back to Life Mental Health portal login on the static site.

## Provider video

The original introduction video remains:

`assets/video/introduction.mov`

During deployment, ffmpeg creates a genuine browser-compatible:

`assets/video/provider-introduction.mp4`

using H.264 video, AAC audio, `yuv420p`, and `faststart`. `about.html` prefers the MP4 and retains the MOV as fallback. Do not revert this to a renamed MOV.

## Historical deployment files

`Dockerfile`, `cloud-run/`, `GOOGLE_CLOUD_DEPLOYMENT.md`, and the old compatibility-route directories remain as historical migration artifacts for now. They are not copied into the Cloudflare deployment. Cloudflare Pages is the selected production-hosting path.

## Verification

Use:

`bash scripts/verify-production-routes.sh https://back-to-life-mental-health.pages.dev preview`

before DNS cutover, and after cutover:

`bash scripts/verify-production-routes.sh https://www.back-to-life-mental-health.com production`

Route checks do not replace browser QA. Desktop/mobile review should still cover navigation, scheduler modal, Tebra Portal and telehealth links, provider video, office photo, insurance presentation, phone/email/directions links, mobile navigation, footer, and 404 behavior.

## Cutover rule

Do not move DNS or cancel Odoo until Cloudflare staging has passed routing, visual, functional, and content QA. Preserve all Google Workspace and other non-web DNS records during the eventual cutover. Rotate the Cloudflare API token before production because the current token was previously visible during setup.
