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
- Commercial insurance messaging
- Anthem + Arizona telehealth positioning
- Mobile navigation and lightweight scroll animations
- Search-friendly page titles, canonical routes, social metadata, `robots.txt`, and `sitemap.xml`
- Legacy-route compatibility pages for the Odoo migration
- GitHub Pages deployment workflow

## Architecture

This version is intentionally framework-free: plain HTML, CSS, and JavaScript. That keeps deployment simple, fast, portable, and independent of Odoo. Custom practice functionality can later be added as separate modules without rebuilding the public-facing site.

## Patient journey

The website is organized around the questions a patient is likely to ask rather than duplicating the structure of the old website builder:

1. What does the practice offer?
2. What does starting care look like?
3. Will my insurance work and what should I verify?
4. Can I use telehealth?
5. What happens during medication management?
6. Where can I learn more about the condition I am dealing with?
7. How do I schedule or contact the practice?

## Deployment

GitHub Pages is configured to publish from GitHub Actions. A push to `main` triggers `.github/workflows/deploy-pages.yml` and deploys the static site.

The production Odoo domain should remain unchanged until the replacement site has been visually reviewed and approved.

## Next build priorities

1. Replace the remaining Odoo-hosted homepage hero image with an owned local asset.
2. Add selected provider/office photography and refine image presentation.
3. Continue visual QA across desktop and mobile breakpoints.
4. Review final insurance, payment, privacy, and practice-policy wording before production cutover.
5. Connect the production domain only after review.
6. Add custom practice functionality as separate modules rather than coupling it to the marketing site.

## Important

The official practice logo is now local to the repository. The homepage hero still uses one image from the existing Back to Life Mental Health Odoo site as a temporary visual reference. Before retiring Odoo, that image should also be copied into the repository or replaced with another owned asset so the replacement website has no runtime dependency on the old site.
