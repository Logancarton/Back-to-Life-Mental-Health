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
- Owned local provider imagery for the homepage and About page
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
6. What can a condition feel like, what does evaluation consider, and what happens next?
7. How do I schedule or contact the practice?

The condition pages now share the same patient-centered sequence used elsewhere on the site: symptoms and lived experience → evaluation → treatment options → what happens next → FAQs → scheduling.

## Deployment

GitHub Pages is configured to publish from GitHub Actions. A push to `main` triggers `.github/workflows/deploy-pages.yml` and deploys the static site.

The production Odoo domain should remain unchanged until the replacement site has been visually reviewed and approved.

## Next build priorities

1. Continue visual QA across desktop and mobile breakpoints, especially the homepage hero crop and the updated condition pages.
2. Add selected office photography if useful and refine image presentation without introducing generic stock-style mental-health graphics.
3. Continue migrating older shared markup directly into HTML where that reduces reliance on JavaScript enhancement without creating regressions.
4. Review final insurance, payment, privacy, and practice-policy wording before production cutover.
5. Connect the production domain only after review.
6. Add custom practice functionality as separate modules rather than coupling it to the marketing site.

## Important

Core public-facing imagery used by the custom homepage is now stored in the repository rather than loaded from Odoo. The Odoo site should still remain live until final visual, content, route, and production-domain checks are complete.
