# Website Migration Plan

This file tracks the move from the current Odoo website to the custom Back to Life Mental Health website on Cloudflare Pages.

## Migration principle

Do not point the production domain away from Odoo until the Cloudflare staging site has passed route, desktop/mobile, integration, content, and 404 QA. Keep Odoo active through the initial production-stability period.

Primary/canonical hostname remains:

`https://www.back-to-life-mental-health.com/`

Cloudflare staging/underlying hosting:

`https://back-to-life-mental-health.pages.dev/`

The `pages.dev` hostname is not the intended public practice URL.

## Selected production architecture

The public site remains static HTML/CSS/vanilla JavaScript with local images and video. Cloudflare Pages is the selected production-serving layer.

Pushes to `main` deploy through `.github/workflows/deploy-pages.yml`.

The build creates `public-dist`, runs `scripts/prepare-cloudflare-site.py`, generates the browser-compatible provider MP4, and deploys the static result to Cloudflare Pages.

Historical GitHub Pages compatibility directories and Cloud Run/Nginx files are not part of the Cloudflare deployment output.

## Cloudflare-native routing

Cloudflare Pages serves a top-level HTML file at the matching extensionless route. For example:

- `services.html` → `/services`
- `about.html` → `/about`
- `adhd.html` → `/adhd`

Cloudflare also normalizes direct `.html` requests to the extensionless version.

The deployment preparation script removes the old JavaScript redirect-shell directories before upload so they cannot shadow these native routes. It also rewrites internal page links and canonical tags in the deployed HTML to point directly at extensionless canonical routes.

The repository `_redirects` file is reserved for real HTTP redirects: old Odoo paths and explicit trailing-slash normalization.

## Canonical route map

| Page | Canonical route |
| --- | --- |
| Home | `/` |
| Services | `/services` |
| Medication Management | `/medication-management` |
| New Patients | `/new-patients` |
| Current Patients | `/current-patients` |
| Insurance & Payment | `/insurance-payment` |
| Telehealth | `/telehealth` |
| FAQ | `/faq` |
| About | `/about` |
| Contact | `/contact` |
| Anxiety | `/anxiety` |
| Depression | `/depression` |
| ADHD | `/adhd` |
| PTSD | `/ptsd` |
| OCD | `/ocd` |
| Bipolar Disorder | `/bipolar` |
| Grief & Loss | `/grief-loss` |
| Life Transitions | `/life-transitions` |
| Privacy | `/privacy` |

## Legacy Odoo URL preservation

The following older public routes redirect directly to the final canonical destination with HTTP 301 behavior through `_redirects`:

| Legacy route | Canonical destination |
| --- | --- |
| `/services-overview` | `/services` |
| `/pricing` | `/insurance-payment` |
| `/about-us` | `/about` |
| `/contactus` | `/contact` |
| `/attention-deficit-hyperactive-disorder` | `/adhd` |
| `/post-traumatic-stress-disorder` | `/ptsd` |
| `/obsessive-compulsive-disorder` | `/ocd` |
| `/loss-bereavement` | `/grief-loss` |
| `/life-changes` | `/life-transitions` |

Existing Odoo routes that already equal the clean canonical route—such as `/medication-management`, `/anxiety`, `/depression`, `/bipolar`, and `/privacy`—remain canonical rather than redirecting to a different name.

Redirect rules point straight to final destinations to avoid chains.

## Search metadata

`sitemap.xml` contains only canonical production URLs on the `www` hostname. `robots.txt` references the production sitemap.

During deployment, HTML canonical tags are normalized to the same route map so canonical metadata, internal navigation, and sitemap URLs agree.

After production cutover:

- verify `robots.txt` and `sitemap.xml` from the custom domain;
- resubmit the sitemap in Google Search Console;
- inspect indexing, redirect, duplicate-canonical, and 404 reports;
- confirm old Odoo URLs are seen as permanent redirects rather than duplicate pages.

## Integrations that routing work must not change

Scheduler currently used by the site:

`https://d2oe0ra32qx05a.cloudfront.net/?practiceKey=k_1_108034`

Do not change the Tebra practice key without confirming the current direct scheduler URL in Tebra Practice Settings.

Tebra Patient Portal:

`https://portal.kareo.com/`

Provider telehealth room:

`https://telehealth.kareo.com/lcarton`

The static site must not collect portal credentials or protected clinical information.

The About page must continue to prefer `assets/video/provider-introduction.mp4` with the MOV fallback, and the real Anthem office image at `assets/images/btlmh-office-main.webp` must remain intact.

## Pre-cutover QA gate

Before DNS changes, verify on `https://back-to-life-mental-health.pages.dev/`:

- all canonical routes return the intended page;
- legacy routes return 301 to the correct final canonical route;
- direct `.html` requests normalize to extensionless URLs;
- there are no redirect loops;
- unknown routes return a real 404 and display `404.html`;
- homepage, Services, Medication Management, New Patients, Current Patients, Insurance & Payment, Telehealth, FAQ, About, Contact, Privacy, and all condition pages render correctly;
- scheduler modal, Tebra Portal, direct telehealth, provider video, office image, insurance logos, phone links, email links, directions, hamburger menu, mobile bottom action bar, and footer work on desktop and mobile.

Use `scripts/verify-production-routes.sh` for HTTP-level route checks, but do not claim browser QA from the script alone.

## DNS cutover — do not execute before QA passes

Before changing website DNS:

1. Inventory every existing DNS record.
2. Preserve Google Workspace MX, SPF, DKIM, DMARC, Google verification TXT, and every other non-web record.
3. Identify only the web-related A/AAAA/CNAME records that need replacement.
4. In Cloudflare Pages, add `www.back-to-life-mental-health.com` as a custom domain and ideally add the apex `back-to-life-mental-health.com` as well.
5. Do not manually point a CNAME at `pages.dev` without first associating the custom domain with the Pages project.
6. Rotate the Cloudflare API token before production cutover, update the GitHub secret, trigger deployment, and verify the workflow is green.

Primary/canonical hostname remains `https://www.back-to-life-mental-health.com/` unless that decision is explicitly changed.

## Post-DNS verification

Immediately verify HTTPS, every canonical route, legacy redirects, CSS/images/video, scheduler, portal, telehealth, mobile navigation, phone/email/directions links, and email sending/receiving.

Keep Odoo active briefly while stability is confirmed.

## `pages.dev` after production

Only after the custom domain is active and verified, configure the Cloudflare-supported redirect from:

`https://back-to-life-mental-health.pages.dev/*`

to:

`https://www.back-to-life-mental-health.com/*`

Preserve path and query string. This is a post-cutover step, not part of the pre-cutover `_redirects` file.

## Final retirement

Cancel Odoo only after the custom production domain, HTTPS, email, redirects, Tebra integrations, local assets, search crawling, and duplicate-host handling are all verified stable.
