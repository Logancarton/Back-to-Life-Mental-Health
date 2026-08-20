# Back to Life Mental Health Website

Custom website for Back to Life Mental Health LLC, replacing the public-facing Odoo site over time while keeping the practice in full control of the code and hosting.

## Current build

The current site includes:

- Responsive custom homepage
- Services overview
- Dedicated medication-management page
- New-patient guide
- Insurance and payment page
- Arizona telehealth page
- Frequently asked questions hub
- About page
- Contact page with map and direct contact links
- Dedicated patient-education pages for anxiety, depression, ADHD, PTSD, OCD, bipolar disorder, grief/loss, and life transitions
- Privacy page
- Existing appointment-booking integration
- Official Back to Life Mental Health logo stored locally in the repository
- Owned local provider/practice imagery
- Commercial insurance messaging
- Anthem + Arizona telehealth positioning
- Mobile navigation and lightweight scroll animations
- Search-friendly page titles, canonical routes, social metadata, `robots.txt`, and `sitemap.xml`
- Legacy-route compatibility pages for the Odoo/GitHub Pages migration
- GitHub Pages deployment workflow for static previewing
- Google Cloud Run/Nginx production configuration for real clean canonical routes

## Architecture

This version is intentionally framework-free: plain HTML, CSS, and JavaScript. That keeps deployment simple, fast, portable, and independent of Odoo. Custom practice functionality can later be added as separate modules without rebuilding the public-facing site.

The production-serving layer is also intentionally thin. Nginx on Cloud Run maps clean public URLs to the existing static HTML rather than duplicating or rebuilding the site in a framework.

## Patient journey

The website is organized around the questions a patient is likely to ask rather than duplicating the structure of the old website builder:

1. What does the practice offer?
2. What does starting care look like?
3. Will my insurance work and what should I verify?
4. Can I use telehealth?
5. What happens during medication management?
6. What can a condition feel like, what does evaluation consider, and what happens next?
7. How do I schedule or contact the practice?

The condition pages share the same patient-centered sequence used elsewhere on the site: symptoms and lived experience → evaluation → treatment options → what happens next → FAQs → scheduling.

## Photography

The current homepage hero at `assets/images/homepage-hero.jpg` is intentionally placed and should not be replaced during routine SEO, deployment, or cleanup work.

`PHOTO_PLAN.md` can still guide future photography work, but it should be treated as a planning reference rather than permission to replace photographs that have since been intentionally selected and placed. New photos should be added only where they improve the actual page content.

The site should prefer a small coherent library of real provider/practice photography plus restrained Arizona environment images over generic behavioral-health stock photography.

## Deployment

GitHub Pages remains configured to publish from GitHub Actions and is useful as a static preview/compatibility environment.

For final production hosting, the repository now includes a Cloud Run path using `Dockerfile` and `cloud-run/default.conf.template`. This serves clean canonical routes such as `/anxiety` and `/new-patients` as real HTML with HTTP 200 while redirecting `.html` URLs to the preferred clean routes.

See `GOOGLE_CLOUD_DEPLOYMENT.md` for deployment and verification steps.

The production Odoo domain should remain unchanged until the replacement Cloud Run preview has passed visual, content, route, and policy review.

## Next build priorities

1. Deploy a Google Cloud Run preview and run `bash scripts/verify-production-routes.sh <run.app-url> preview`.
2. Complete desktop/mobile visual QA on the Cloud Run build, preserving the current homepage hero and intentionally placed photography.
3. Review final insurance, payment, privacy, and practice-policy wording before production cutover.
4. Attach the production domain only after the preview and route checks pass.
5. Run the production route verification and then complete Search Console submission/indexing checks.
6. Add custom practice functionality as separate modules rather than coupling it to the marketing site.

## Important

Core public-facing imagery is stored in the repository rather than loaded from Odoo. Keep the Odoo site live until final visual, content, route, production-domain, and rollback checks are complete.
