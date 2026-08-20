# Back to Life Mental Health — Pre-Launch SEO Plan

Last reviewed: 2026-08-20

## Goal

Prepare the new Back to Life Mental Health website for launch with accurate, local, people-first SEO focused on psychiatric evaluation and medication management in Anthem, nearby North Valley communities, and Arizona telehealth.

## Brand rule

Always use the full public name **Back to Life Mental Health**. Never shorten the practice name to “Back to Life.”

## Completed pre-launch page audit

A page-by-page SEO review was completed on 2026-08-20 for the primary service, condition, patient-resource, About, and Contact pages.

### Metadata refined

- `ptsd.html` — shortened an overlong title to `PTSD Treatment in Anthem, AZ | Back to Life Mental Health` and made the description more useful for PTSD/trauma treatment intent.
- `ocd.html` — shortened an overlong title to `OCD Treatment in Anthem, AZ | Back to Life Mental Health` and clarified the description around evaluation, medication management, and evidence-based therapy coordination.
- `life-transitions.html` — added natural Anthem relevance to the title and strengthened the description without changing patient-facing content.
- `new-patients.html` — changed a generic title to `New Patients in Anthem, AZ | Back to Life Mental Health` and made the description reflect scheduling, psychiatric evaluation, and treatment planning.
- `telehealth.html` — changed `Telehealth Psychiatry in Arizona` to the more precise `Telehealth Psychiatric Care in Arizona` and clarified statewide telehealth plus Anthem in-person availability.

### Reviewed and intentionally left unchanged

These pages already had clear search intent, appropriate local relevance, useful patient-facing copy, sound heading structure, descriptive internal links, appropriate image alt text where images are used, clean canonical tags, and no meaningful content-overlap problem requiring a rewrite:

- `medication-management.html`
- `adhd.html`
- `anxiety.html`
- `depression.html`
- `bipolar.html`
- `grief-loss.html`
- `services.html`
- `insurance-payment.html`
- `faq.html`
- `about.html`
- `contact.html`

The existing H1 copy was preserved where it was already patient-friendly. No photographs were replaced, and the homepage hero image was not changed.

## Current strengths

- Major pages have unique titles and meta descriptions.
- Canonical URLs are present on public content pages.
- `robots.txt` and `sitemap.xml` exist and remain aligned to the intended public canonical routes.
- The homepage has `MedicalClinic` structured data.
- Shared JavaScript adds `WebSite` site-name structured data on the homepage and `BreadcrumbList` structured data on major public information pages.
- Shared JavaScript provides OpenGraph/Twitter metadata fallbacks while preserving page-specific canonical URLs and descriptions.
- Internal links connect services, condition pages, medication management, new-patient information, insurance, telehealth, FAQs, About, and Contact.
- Condition pages include a shared next-step bridge to New Patients and Medication Management.
- Real practice/local photography is used with descriptive accessibility-first alt text where applicable.
- The 404 page remains `noindex`.
- A Cloud Run/Nginx production-serving configuration now maps clean canonical routes to real HTML with HTTP 200 and redirects direct `.html` requests to clean URLs.

## Primary search themes

Use naturally; do not keyword-stuff.

### Practice / homepage
- psychiatric care Anthem AZ
- psychiatric medication management Anthem AZ
- psychiatric evaluation Anthem AZ
- psychiatric mental health nurse practitioner Anthem AZ
- mental health medication management Anthem AZ
- Arizona telehealth psychiatric care

Supporting geography: Anthem, North Phoenix, New River, Desert Hills, Cave Creek, Carefree, Norterra, Arizona.

Do not represent the clinician as an MD/DO psychiatrist. Psychiatric care/psychiatry language is appropriate, but credential language must remain accurate to PMHNP-BC.

### Core pages
- Medication Management: psychiatric medication management Anthem AZ; medication management Anthem AZ; psychiatric medication management Arizona telehealth
- Telehealth: telehealth psychiatric care Arizona; psychiatric telehealth Arizona; online psychiatric medication management Arizona
- Anxiety: anxiety treatment Anthem AZ; anxiety medication management Anthem AZ
- Depression: depression treatment Anthem AZ; depression medication management Anthem AZ
- ADHD: ADHD treatment Anthem AZ; ADHD medication management Anthem AZ; ADHD psychiatric evaluation Anthem AZ; adult/adolescent ADHD care Anthem AZ
- PTSD: PTSD treatment Anthem AZ; trauma psychiatric care Anthem AZ; PTSD medication management Anthem AZ
- OCD: OCD treatment Anthem AZ; OCD medication management Anthem AZ
- Bipolar: bipolar treatment Anthem AZ; bipolar medication management Anthem AZ
- New Patients: psychiatric evaluation Anthem AZ; psychiatric appointment Anthem AZ

## Local search landscape

Current search review shows meaningful competition from Anthem Healthcare / Anthem AZ Health, Strategies for Success, BritePath Medical / ADD Clinics of Arizona, Psychology Today directory pages, and Anthem Psychiatry.

Compete on specificity and trust rather than generic keyword volume: accurate Anthem location information, clear PMHNP credentialing, real photography, detailed medication-management content, useful condition pages, clear new-patient information, Arizona telehealth, current insurance information, and Google Business Profile consistency.

## Clean URL implementation status

The static GitHub Pages compatibility layer still uses `noindex` JavaScript redirect shells at clean route directories because GitHub Pages cannot provide the desired server-side routing behavior.

A production Cloud Run serving configuration has now been added to the repository:

- `Dockerfile`
- `cloud-run/default.conf.template`
- `scripts/verify-production-routes.sh`
- `GOOGLE_CLOUD_DEPLOYMENT.md`

The Cloud Run image deliberately does not copy the compatibility route directories. Instead, Nginx serves the corresponding real page HTML directly at the clean canonical route with HTTP 200 and redirects repository-internal `.html` URLs to the clean canonical path.

The default `*.run.app` preview hostname receives `X-Robots-Tag: noindex, nofollow` so a technical preview is not treated as a second public website. The production custom hostname is intended to remain indexable.

### Canonical routes handled by the Cloud Run configuration

- `/services-overview`
- `/medication-management`
- `/new-patients`
- `/insurance-payment`
- `/telehealth`
- `/faq`
- `/about-us`
- `/contactus`
- `/anxiety`
- `/depression`
- `/attention-deficit-hyperactive-disorder`
- `/post-traumatic-stress-disorder`
- `/obsessive-compulsive-disorder`
- `/bipolar`
- `/loss-bereavement`
- `/life-changes`
- `/privacy`

The legacy `/pricing` route redirects server-side to `/insurance-payment` in the Cloud Run configuration and remains out of the sitemap.

The remaining clean-route dependency is deployment and production-domain verification, not repository routing design.

## Structured data

Keep and validate:
- `MedicalClinic` — homepage
- `WebSite` — homepage, preferred site name `Back to Life Mental Health`
- `BreadcrumbList` — major internal pages

Only add truthful fields. Do not invent business hours, prices, credentials, coordinates, reviews, or services for schema completeness.

## Remaining launch tasks

- Deploy a Cloud Run preview from this repository and run `bash scripts/verify-production-routes.sh <run.app-url> preview`.
- Complete desktop/mobile visual and functional review on the Cloud Run build.
- Attach the production domain/front end only after the preview passes review.
- Run `bash scripts/verify-production-routes.sh https://www.back-to-life-mental-health.com production` after cutover.
- Test every sitemap URL against the deployed production host before sitemap submission or indexing requests.
- Confirm every intended public page returns indexable HTML and the 404 page remains `noindex`.
- Re-check titles, descriptions, canonicals, OpenGraph URLs/images, and JSON-LD on the deployed origin.
- Validate `robots.txt` and confirm it references the production sitemap.
- Validate structured data with Google-supported validation tools.
- Run mobile and desktop PageSpeed/Core Web Vitals checks.
- Check image dimensions, compression, lazy loading, and layout shift without replacing intentionally selected photography.
- Verify Google Business Profile name, address, phone, and website match the production site.
- Confirm no stale Odoo metadata or legacy host URLs appear in deployed HTML.

## Search Console steps after launch

1. Verify a Domain property for `back-to-life-mental-health.com` in Google Search Console.
2. Confirm the preferred `www` production host and HTTPS behavior resolve consistently.
3. Submit `https://www.back-to-life-mental-health.com/sitemap.xml`.
4. Use URL Inspection on the homepage plus `/services-overview`, `/medication-management`, `/new-patients`, `/telehealth`, `/contactus`, `/anxiety`, `/depression`, and `/attention-deficit-hyperactive-disorder`.
5. Confirm Google sees the clean URL as indexable HTML with the declared canonical—not as a `noindex` redirect shell.
6. Request indexing for the highest-priority pages after the production routing check passes.
7. Review Page indexing for redirect, `noindex`, duplicate-canonical, soft-404, and crawl errors during the first several weeks.
8. Track queries and pages by impressions, clicks, CTR, and average position; refine from actual Search Console data rather than generic keyword volume.

## Ongoing local SEO

- Keep Google Business Profile synchronized with the website.
- Earn legitimate local referral links where appropriate.
- Maintain accurate insurance and service information.
- Publish useful patient education rather than thin keyword pages.
- Review Search Console monthly during the first 3–6 months after launch.
