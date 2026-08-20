# Back to Life Mental Health — Pre-Launch SEO Plan

Last reviewed: 2026-08-20

## Goal

Prepare the new Back to Life Mental Health website for launch with accurate, local, people-first SEO focused on psychiatric evaluation and medication management in Anthem, nearby North Valley communities, and Arizona telehealth.

## Brand rule

Always use the full public name **Back to Life Mental Health**. Never shorten the practice name to “Back to Life.”

## Current strengths

- Major pages already have unique titles and meta descriptions.
- Canonical URLs are present.
- `robots.txt` and `sitemap.xml` exist.
- The homepage has `MedicalClinic` structured data.
- Internal links connect services, conditions, new-patient information, insurance, telehealth, FAQs, About, and Contact.
- Real practice/local photography is being integrated with descriptive alt text.
- Shared JavaScript now adds consistent social metadata, `WebSite` site-name structured data on the homepage, and `BreadcrumbList` structured data on public information pages.

## Primary search themes

Use naturally; do not keyword-stuff.

### Practice / homepage
- psychiatric care Anthem AZ
- psychiatric medication management Anthem AZ
- psychiatric evaluation Anthem AZ
- psychiatric nurse practitioner Anthem AZ
- mental health medication management Anthem AZ
- Arizona telehealth psychiatric care

Supporting geography: Anthem, North Phoenix, New River, Desert Hills, Cave Creek, Carefree, Arizona.

Do not represent the clinician as an MD/DO psychiatrist. Psychiatric care/psychiatry language is appropriate, but credential language must remain accurate to PMHNP-BC.

### Core pages
- Medication Management: psychiatric medication management Anthem AZ; medication management Anthem AZ; psychiatric medication management Arizona telehealth
- Telehealth: telehealth psychiatry Arizona; psychiatric telehealth Arizona; online psychiatric medication management Arizona
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

## Important launch blocker: clean URL handling

Production HTML currently declares clean canonical URLs such as `/services-overview`, `/new-patients`, `/anxiety`, and `/attention-deficit-hyperactive-disorder`.

On the current static GitHub Pages compatibility layer, many clean paths are `noindex` JavaScript redirect shells that forward to `.html` files.

Before the final domain is pointed at the new production host, the hosting layer should serve the actual page content at the clean canonical URL with HTTP 200, or use appropriate server-side rewrites/redirects. Do not submit a production sitemap that primarily points Google at `noindex` redirect shells.

Preferred final behavior: `https://www.back-to-life-mental-health.com/anxiety` directly serves the Anxiety page content with HTTP 200 and remains canonical.

Resolve this in the Google Cloud deployment configuration rather than duplicating every page.

## Homepage review

Preferred static title direction:

`Psychiatric Care in Anthem, AZ | Back to Life Mental Health`

Preferred description direction:

`Psychiatric evaluation and medication management for adolescents and adults in Anthem, Arizona, with telehealth available throughout Arizona.`

Avoid stuffing Phoenix, Anthem, Arizona, telehealth, multiple conditions, and insurance names into one title.

## Structured data

Use and validate:
- `MedicalClinic` — homepage
- `WebSite` — homepage, preferred site name `Back to Life Mental Health`
- `BreadcrumbList` — major internal pages

Only add truthful fields. Do not invent business hours, prices, credentials, coordinates, or services for schema completeness.

## Before launch

- Resolve clean canonical URL hosting behavior.
- Re-check every title and meta description.
- Validate canonical tags.
- Validate sitemap URLs against actual HTTP responses.
- Validate `robots.txt`.
- Run structured-data validation.
- Run mobile/desktop PageSpeed checks.
- Check image sizes and layout shift.
- Verify Google Business Profile name/address/phone/website match the site.
- Confirm no accidental `noindex` on public content pages.

## Immediately after launch

1. Verify the domain in Google Search Console.
2. Submit `sitemap.xml`.
3. Request indexing for the homepage, services, medication management, new patients, contact, anxiety, depression, and ADHD.
4. Check indexing for redirects, duplicate canonicals, and crawl errors.
5. Track queries/pages by impressions, clicks, CTR, and average position.
6. Refine from real Search Console data rather than generic keyword suggestions.

## Ongoing local SEO

- Keep Google Business Profile synchronized with the website.
- Earn legitimate local referral links where appropriate.
- Maintain accurate insurance/service information.
- Publish useful patient education rather than thin keyword pages.
- Review Search Console monthly during the first 3–6 months after launch.
