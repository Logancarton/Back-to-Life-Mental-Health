# Back to Life Mental Health Website

Custom public website for Back to Life Mental Health LLC, an independent psychiatric practice in Anthem, Arizona.

## Current build

The site is intentionally framework-free: plain HTML, CSS, vanilla JavaScript, local images, and local video. It includes the homepage, services, medication management, new-patient guidance, current-patient resources, insurance/payment, telehealth, FAQ, About, Contact, Privacy, and condition pages for anxiety, depression, ADHD, PTSD, OCD, bipolar disorder, grief/loss, and life transitions.

Sensitive and patient-specific workflows remain with Tebra. The public site does not collect portal credentials or protected clinical information.

## Hosting state

Production is live on Cloudflare Pages:

`www.back-to-life-mental-health.com` → Cloudflare Pages → static Back to Life Mental Health website

The `pages.dev` host remains available for pre-deploy checks:

`https://back-to-life-mental-health.pages.dev/`

`btlmh.com` currently redirects to the `www` production hostname.

## Cloudflare Pages deployment

Pushes to `main` deploy through:

`.github/workflows/deploy-pages.yml`

The deployment copies the static site into `public-dist`, runs `scripts/prepare-cloudflare-site.py`, transcodes the provider introduction video into a browser-safe H.264/AAC MP4, deploys the result with Wrangler, and then runs the HTTP route verification script against the `pages.dev` staging host.

The preparation script is deliberately narrow. It:

- defensively removes any obsolete GitHub Pages JavaScript compatibility-route directories if one is reintroduced, so it cannot shadow a real page;
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

The source introduction video is retained at:

`assets/video/introduction.mov`

(H.264 / AAC, 1280x720, 39s.)

**This video is not currently embedded anywhere on the site.** There is no `<video>` element in any page, and no HTML, CSS, or JS references either video file. The deployment still runs an ffmpeg step that produces `assets/video/provider-introduction.mp4` (H.264, AAC, `yuv420p`, `faststart`), so the MP4 is generated at build time and is not committed to the repository.

Either wire the video into `about.html` or remove the transcode step from the deploy workflow. Do not commit a renamed `.mov` as the `.mp4`.

## Historical deployment files

The obsolete GitHub Pages JavaScript compatibility-route directories have been removed from `main`. `Dockerfile`, `cloud-run/`, and `GOOGLE_CLOUD_DEPLOYMENT.md` remain as historical migration artifacts for now and are not copied into the Cloudflare deployment. Cloudflare Pages is the selected production-hosting path.

## Verification

Every push deployment now runs:

`bash scripts/verify-production-routes.sh https://back-to-life-mental-health.pages.dev preview`

after the Cloudflare upload. You can also run the same command manually before DNS cutover. After cutover, use:

`bash scripts/verify-production-routes.sh https://www.back-to-life-mental-health.com production`

Route checks do not replace browser QA. Desktop/mobile review should still cover navigation, scheduler modal, Tebra Portal and telehealth links, provider video, office photo, insurance presentation, phone/email/directions links, mobile navigation, footer, and 404 behavior.

## Post-cutover notes

DNS cutover is complete. Preserve all Google Workspace and other non-web DNS records when editing zone settings. Verify production routes after any structural change:

`bash scripts/verify-production-routes.sh https://www.back-to-life-mental-health.com production`

## Images

All site imagery is WebP, generated by `scripts/optimize-images.py` and sized to
its display width. Filenames are lowercase kebab-case. `scripts/image-manifest.json`
records the source name and intrinsic dimensions of each converted file.

`assets/images/og-homepage.jpg` is kept as JPEG for social-preview compatibility.

Re-run the script after adding new imagery, then commit the `.webp` output rather
than the source PNG or JPEG.
