# Back to Life Mental Health — Pre-Launch SEO Plan

Last reviewed: 2026-08-24

## Goal

Prepare the custom Back to Life Mental Health website for launch with accurate, local, people-first SEO focused on psychiatric evaluation and medication management in Anthem, North Phoenix, nearby North Valley communities, and Arizona telehealth.

## Geographic architecture

The physical office remains anchored in **Anthem, Arizona**. The broader local market is **North Phoenix and the North Valley**.

Primary local geography:

- Anthem
- North Phoenix
- Norterra
- Tramonto
- North Gateway
- Desert Hills
- New River
- Cave Creek
- Carefree

Statewide access is represented separately as **Arizona telehealth**.

The website must never imply that Back to Life Mental Health has separate physical offices in North Phoenix, Norterra, New River, Cave Creek, or other surrounding communities. The accurate public positioning is: **Anthem office serving North Phoenix and the North Valley, with telehealth available across Arizona when appropriate.**

Use one substantive regional landing page (`/north-phoenix-psychiatric-care`) rather than thin near-duplicate city pages. Do not create individual doorway pages for each surrounding community.

## Brand rule

Always use the full public name **Back to Life Mental Health**. Never shorten the practice name to “Back to Life.”

## Current strengths

- Major pages have unique titles and meta descriptions.
- Public content pages have canonical metadata.
- `robots.txt` and `sitemap.xml` exist and use the intended production `www` hostname.
- The homepage contains `MedicalClinic` structured data with the actual Anthem address and a broader truthful `areaServed` list.
- Shared JavaScript adds site-name and breadcrumb structured data where appropriate.
- Internal links connect services, psychiatric evaluation, North Phoenix/North Valley access, medication management, patient resources, condition pages, About, Contact, insurance/payment, telehealth, and FAQs.
- Real practice/local photography is used, including the Anthem office image.
- The provider introduction video is deployed in a browser-compatible H.264/AAC MP4 format with the original MOV retained as fallback.
- The 404 page remains `noindex`.

## Cloudflare clean-URL implementation

Cloudflare Pages is now the selected production hosting layer.

The canonical public routes are:

- `/`
- `/services`
- `/psychiatric-evaluation`
- `/north-phoenix-psychiatric-care`
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

During deployment, `scripts/prepare-cloudflare-site.py` removes the historical GitHub Pages JavaScript redirect-shell directories from the Cloudflare build, normalizes internal links and canonical metadata, and keeps shared North Valley geographic copy consistent across public pages.

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

Primary service/location themes:

- psychiatric care Anthem AZ
- psychiatric care North Phoenix
- psychiatric care North Valley AZ
- psychiatric evaluation Anthem AZ
- psychiatric evaluation North Phoenix
- psychiatric medication management Anthem AZ
- psychiatric medication management North Phoenix
- psychiatric nurse practitioner Anthem AZ
- PMHNP Anthem / North Phoenix
- Arizona telehealth psychiatric care

Supporting geography includes Anthem, North Phoenix, Norterra, Tramonto, North Gateway, New River, Desert Hills, Cave Creek, Carefree, and Arizona.

Do not represent the clinician as an MD/DO psychiatrist. Psychiatric-care language is appropriate, but credential language must remain accurate to PMHNP-BC.

Core condition pages should remain primarily condition-focused. Do not force every city name into every title or heading. Regional relevance comes from the homepage, core service pages, Contact, structured data, the shared footer, internal links, and the dedicated North Phoenix/North Valley page.

## Local search approach

Compete on specificity and trust rather than generic keyword volume: accurate Anthem office information, clear North Phoenix/North Valley service-area language, accurate PMHNP credentialing, real photography, detailed evaluation and medication-management content, useful condition pages, clear new-patient information, Arizona telehealth, current insurance information, and Google Business Profile consistency.

The regional landing page should remain patient-useful: actual office location, communities served, in-person versus telehealth access, available psychiatric services, and clear disclosure that the practice has one physical office in Anthem.

## Structured data

Keep and validate truthful fields only:

- `MedicalClinic` on the homepage with the Anthem address and truthful `areaServed` geography;
- `MedicalClinic` on the North Phoenix/North Valley landing page using the same clinic identity and actual Anthem address;
- `WebSite` with preferred site name `Back to Life Mental Health`;
- `BreadcrumbList` on major internal pages.

Do not invent business hours, prices, credentials, coordinates, reviews, offices, or services for schema completeness.

## Remaining launch / migration checks

- run `bash scripts/verify-production-routes.sh https://back-to-life-mental-health.pages.dev preview`;
- verify all canonical routes return 200 and legacy Odoo routes return direct permanent redirects to final destinations;
- confirm `/north-phoenix-psychiatric-care` returns 200 and `/north-phoenix-psychiatric-care.html` permanently redirects to it;
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
4. Inspect the homepage plus `/services`, `/psychiatric-evaluation`, `/north-phoenix-psychiatric-care`, `/medication-management`, `/new-patients`, `/telehealth`, `/contact`, `/anxiety`, `/depression`, and `/adhd`.
5. Confirm Google sees the clean URL as indexable HTML with the declared canonical.
6. Monitor Page indexing for redirects, `noindex`, duplicate canonicals, soft 404s, and crawl errors.
7. Track queries/pages by impressions, clicks, CTR, and average position; refine geographic wording from actual Search Console data rather than creating thin city pages preemptively.

## Ongoing local SEO

- Keep Google Business Profile synchronized with the actual Anthem office.
- Use the website and directory profiles to describe the broader North Valley service area without inventing additional locations.
- Earn legitimate local referral links where appropriate.
- Maintain accurate insurance and service information.
- Publish useful patient education rather than thin keyword pages.
- Review Search Console regularly during the first months after launch.
