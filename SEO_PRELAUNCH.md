# Back to Life Mental Health — Pre-Launch SEO Plan

Last reviewed: 2026-08-23

## Goal

Prepare the custom Back to Life Mental Health website for launch with accurate, local, people-first SEO focused on psychiatric evaluation and medication management in Anthem, nearby North Valley communities, and Arizona telehealth.

## Brand rule

Always use the full public name **Back to Life Mental Health**. Never shorten the practice name to “Back to Life.”

## Current strengths

- Major pages have unique titles and meta descriptions.
- Public content pages have canonical metadata.
- `robots.txt` and `sitemap.xml` exist and use the intended production `www` hostname.
- The homepage contains `MedicalClinic` structured data.
- Shared JavaScript adds site-name and breadcrumb structured data where appropriate.
- Internal links connect services, medication management, patient resources, condition pages, About, Contact, insurance/payment, telehealth, and FAQs.
- Real practice/local photography is used, including the Anthem office image.
- The provider introduction video is deployed in a browser-compatible H.264/AAC MP4 format with the original MOV retained as fallback.
- The 404 page remains `noindex`.

## Cloudflare clean-URL implementation

Cloudflare Pages is now the selected production hosting layer.

The canonical public routes are:

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

Cloudflare Pages natively serves top-level HTML files at their extensionless route and redirects direct `.html` requests to the extensionless version.

During deployment, `scripts/prepare-cloudflare-site.py` removes the historical GitHub Pages JavaScript redirect-shell directories from the Cloudflare build and normalizes internal links plus canonical metadata to the route list above.

The repository `_redirects` file provides direct permanent redirects for old Odoo slugs:

- `/services-overview` → `/services`
- `/pricing` → `/insurance-payment`
- `/about-us` → `/about`
- `/contactus` → `/contact`
- `/attention-deficit-hyperactive-disorder` → `/adhd`
- `/post-traumatic-stress-disorder` → `/ptsd`
- `/obsessive-compulsive-disorder` → `/ocd`
- `/loss-bereavement` → `/grief-loss`
- `/life-changes` → `/life-transitions`

Older Odoo paths that already equal their clean route, including `/medication-management`, `/anxiety`, `/depression`, `/bipolar`, and `/privacy`, remain canonical pages rather than redirects.

The sitemap contains only the final canonical URLs, preventing redirected legacy paths from competing with destination pages.

## Primary search themes

Use naturally; do not keyword-stuff.

Practice/homepage themes include psychiatric care in Anthem, psychiatric evaluation in Anthem, psychiatric medication management in Anthem, psychiatric mental health nurse practitioner in Anthem, and Arizona telehealth psychiatric care.

Supporting geography includes Anthem, North Phoenix, New River, Desert Hills, Cave Creek, Carefree, Norterra, and Arizona.

Do not represent the clinician as an MD/DO psychiatrist. Psychiatric-care language is appropriate, but credential language must remain accurate to PMHNP-BC.

Core page themes include medication management, Arizona telehealth psychiatric care, and locally relevant anxiety, depression, ADHD, PTSD, OCD, and bipolar treatment/evaluation terms where they fit naturally.

## Local search approach

Compete on specificity and trust rather than generic keyword volume: accurate Anthem location information, clear PMHNP credentialing, real photography, detailed medication-management content, useful condition pages, clear new-patient information, Arizona telehealth, current insurance information, and Google Business Profile consistency.

## Structured data

Keep and validate truthful fields only:

- `MedicalClinic` on the homepage;
- `WebSite` with preferred site name `Back to Life Mental Health`;
- `BreadcrumbList` on major internal pages.

Do not invent business hours, prices, credentials, coordinates, reviews, or services for schema completeness.

## Remaining pre-launch checks

Before production DNS cutover:

- run `bash scripts/verify-production-routes.sh https://back-to-life-mental-health.pages.dev preview`;
- verify all canonical routes return 200 and legacy Odoo routes return direct 301s to final destinations;
- confirm unknown routes return a real 404;
- inspect deployed page source to ensure canonical tags use `https://www.back-to-life-mental-health.com/` plus the correct clean route;
- verify internal navigation uses extensionless routes in the deployed HTML;
- re-check titles, descriptions, canonical tags, Open Graph metadata, and structured data;
- complete desktop/mobile visual and functional QA;
- verify scheduler, Patient Portal, direct telehealth, video, office image, insurance presentation, phone/email/directions links, mobile navigation, and footer;
- validate `robots.txt` and `sitemap.xml`;
- confirm no stale Odoo-hosted assets or legacy host URLs remain in deployed public content.

## Search Console after cutover

1. Verify the domain property for `back-to-life-mental-health.com`.
2. Confirm the `www` production hostname and HTTPS behavior resolve consistently.
3. Submit `https://www.back-to-life-mental-health.com/sitemap.xml`.
4. Inspect the homepage plus `/services`, `/medication-management`, `/new-patients`, `/telehealth`, `/contact`, `/anxiety`, `/depression`, and `/adhd`.
5. Confirm Google sees the clean URL as indexable HTML with the declared canonical.
6. Monitor Page indexing for redirects, `noindex`, duplicate canonicals, soft 404s, and crawl errors.
7. Track queries/pages by impressions, clicks, CTR, and average position; refine from actual Search Console data.

## Ongoing local SEO

- Keep Google Business Profile synchronized with the website.
- Earn legitimate local referral links where appropriate.
- Maintain accurate insurance and service information.
- Publish useful patient education rather than thin keyword pages.
- Review Search Console regularly during the first months after launch.
