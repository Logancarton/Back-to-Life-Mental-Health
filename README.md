# Back to Life Mental Health Website

Custom website for Back to Life Mental Health LLC, replacing the public-facing Odoo site over time while keeping the practice in full control of the code and hosting.

## Current build

The first foundation includes:

- Responsive custom homepage
- Services and medication-management page
- About page
- Contact page with map and direct contact links
- Existing appointment-booking integration
- Commercial insurance messaging
- Anthem + Arizona telehealth positioning
- Mobile navigation and lightweight scroll animations
- Search-friendly page titles and descriptions

## Architecture

This first version is intentionally framework-free: plain HTML, CSS, and JavaScript. That keeps deployment simple and avoids vendor lock-in. It can later be migrated or extended when the practice adds custom functionality.

## Files

- `index.html` — homepage
- `services.html` — services, medication management, and conditions
- `about.html` — provider and office manager information
- `contact.html` — contact details and office map
- `styles.css` — shared responsive design system
- `script.js` — mobile navigation, header state, and reveal effects

## Next build priorities

1. Replace temporary/remote imagery with owned local assets and the exact current logo.
2. Rebuild the individual condition education pages.
3. Add the final privacy policy and required website notices.
4. Add structured SEO/local-business metadata and social sharing metadata.
5. Configure preview hosting, then connect the production domain only after review.
6. Add custom practice functionality as separate modules rather than coupling it to the marketing site.

## Important

The current homepage uses one image from the existing Back to Life Mental Health Odoo site as a temporary visual reference. Before retiring Odoo, copy all desired owned image assets into this repository so the new website does not depend on the old site.
