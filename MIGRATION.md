# Website Migration Plan

This file tracks the move from the current Odoo website to the custom Back to Life Mental Health website.

## Migration principle

Do not point the production domain away from Odoo until the custom site has been visually reviewed, all required owned assets have been copied into the repository, and the production URL behavior has been verified.

## Legacy URL preservation

The current Odoo site already has public URLs that may be indexed, bookmarked, or linked externally. GitHub Pages cannot issue configurable server-side 301 redirects, so this repository preserves the legacy route names with compatibility pages that forward visitors to the new static files.

| Existing public route | New page |
| --- | --- |
| `/services-overview` | `services.html` |
| `/medication-management` | `medication-management.html` |
| `/about-us` | `about.html` |
| `/contactus` | `contact.html` |
| `/anxiety` | `anxiety.html` |
| `/depression` | `depression.html` |
| `/attention-deficit-hyperactive-disorder` | `adhd.html` |
| `/post-traumatic-stress-disorder` | `ptsd.html` |
| `/obsessive-compulsive-disorder` | `ocd.html` |
| `/bipolar` | `bipolar.html` |
| `/loss-bereavement` | `grief-loss.html` |
| `/life-changes` | `life-transitions.html` |
| `/privacy` | `privacy.html` |

Canonical metadata and the sitemap use the established clean production URLs rather than the repository's internal `.html` filenames.

## Asset dependency still to remove

The homepage hero currently references an image hosted by the existing Odoo website. This is intentional only during migration.

Before Odoo is retired:

1. Export the exact Back to Life Mental Health logo used on the current website.
2. Export the homepage/provider/office images that should be retained.
3. Export the accepted-insurance logo files if they will continue to be displayed.
4. Add those files under an `assets/` directory in this repository.
5. Replace every `back-to-life-mental-health.com/web/image/...` runtime reference with a local repository asset.
6. Confirm that the site still renders with the Odoo site unavailable.

## Production-domain cutover gate

Before changing DNS or adding a production `CNAME` file:

- Verify GitHub Pages deployment is green.
- Review desktop and mobile layouts.
- Verify every navigation and booking link.
- Verify phone, email, fax, office address, and directions.
- Verify accepted-insurance statements.
- Verify every condition page.
- Verify privacy copy and any required practice notices.
- Confirm legacy routes resolve correctly.
- Confirm local images, fonts, and styles load with no Odoo dependency.
- Add the production custom domain in GitHub Pages.
- Update DNS only after the preview is approved.

## Post-cutover checks

After the production domain points to the new site:

- Test HTTPS.
- Test all legacy URLs directly.
- Submit the production sitemap to the practice's search-engine tools.
- Watch for 404s and indexing changes.
- Keep Odoo available briefly if practical until the new site is verified in production.

## Architecture boundary

The marketing site remains static HTML/CSS/JavaScript. Future patient tools, intake workflows, forms, scheduling helpers, educational systems, or practice applications should be added as separate modules/services rather than coupling sensitive workflows directly to the public static site.
