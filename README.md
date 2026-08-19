# Back to Life Mental Health Website

Custom website for Back to Life Mental Health LLC, replacing the public-facing Odoo site over time while keeping the practice in full control of the code and hosting.

## Current build

The current foundation includes:

- Responsive custom homepage
- Services overview
- Dedicated medication-management page
- About page
- Contact page with map and direct contact links
- Dedicated patient-education pages for anxiety, depression, ADHD, PTSD, OCD, bipolar disorder, grief/loss, and life transitions
- Privacy page
- Existing appointment-booking integration
- Commercial insurance messaging
- Anthem + Arizona telehealth positioning
- Mobile navigation and lightweight scroll animations
- Search-friendly page titles and descriptions
- `robots.txt` and `sitemap.xml`
- GitHub Pages deployment workflow

## Architecture

This version is intentionally framework-free: plain HTML, CSS, and JavaScript. That keeps deployment simple, fast, portable, and independent of Odoo. Custom practice functionality can later be added as separate modules without rebuilding the public-facing site.

## Deployment

GitHub Pages is configured to publish from GitHub Actions. A push to `main` triggers `.github/workflows/deploy-pages.yml` and deploys the static site.

The production Odoo domain should remain unchanged until the replacement site has been visually reviewed and approved.

## Next build priorities

1. Replace temporary/remote imagery with owned local assets and the exact practice logo.
2. Refine the header, footer, homepage, and provider presentation against the current Odoo site.
3. Add structured local-business/medical-practice metadata and social sharing metadata.
4. Verify responsive behavior and accessibility across the full page set.
5. Connect the production domain only after review.
6. Add custom practice functionality as separate modules rather than coupling it to the marketing site.

## Important

The homepage still uses one image from the existing Back to Life Mental Health Odoo site as a temporary visual reference. Before retiring Odoo, desired owned image assets should be copied into this repository so the replacement website has no runtime dependency on the old site.
