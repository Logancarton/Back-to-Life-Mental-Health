# Google Cloud Production Deployment

This repository now includes a Cloud Run production-serving path for Back to Life Mental Health. GitHub Pages can continue to serve as the static preview/compatibility environment while production is prepared.

## Why Cloud Run

The public HTML uses clean canonical URLs such as `/anxiety`, `/new-patients`, and `/medication-management`. The GitHub Pages compatibility directories currently use `noindex` JavaScript redirect shells because GitHub Pages cannot provide the server-side route behavior needed for the final SEO architecture.

The Cloud Run container solves that at the web-server layer:

- clean canonical routes serve the real page HTML directly with HTTP 200;
- direct `.html` requests redirect to the preferred clean route;
- legacy aliases such as `/pricing` redirect server-side;
- unknown routes return the existing custom 404 page with HTTP 404;
- the default `*.run.app` preview host sends `X-Robots-Tag: noindex, nofollow` so a temporary Cloud Run URL is not treated as a second public website;
- the production custom domain does not receive that preview-only noindex header.

The route compatibility directories are intentionally not copied into the Cloud Run image.

## Files that own this behavior

- `Dockerfile` — builds the static Nginx container.
- `cloud-run/default.conf.template` — clean routes, redirects, caching, 404 behavior, and preview noindex header.
- `scripts/verify-production-routes.sh` — smoke test for the deployed host.

Do not delete the current compatibility directories while GitHub Pages remains in use for previewing.

## Deploy a preview Cloud Run service

Google Cloud can build a repository containing a Dockerfile directly from source with Cloud Build.

From the repository root:

```bash
# Select the intended Google Cloud project first.
gcloud config set project YOUR_PROJECT_ID

# Enable the core services if they are not already enabled.
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy the current source. Choose the region intentionally for the project.
gcloud run deploy btlmh-website \
  --source . \
  --region YOUR_REGION \
  --allow-unauthenticated
```

Cloud Run injects the container `PORT` environment variable. The Nginx template listens on that value automatically.

After deployment, Google Cloud prints a `run.app` URL. Treat that as a technical preview, not the canonical public website.

## Verify the preview

Run:

```bash
bash scripts/verify-production-routes.sh https://YOUR-SERVICE-URL.run.app preview
```

The script verifies:

- all sitemap/canonical routes return HTTP 200;
- direct `.html` routes return HTTP 301;
- `robots.txt`, `sitemap.xml`, and `/healthz` return HTTP 200;
- an unknown route returns HTTP 404;
- the `run.app` host sends `X-Robots-Tag: noindex`.

Also manually inspect several pages on desktop and mobile before attaching the production domain.

## Production domain cutover

Do not change the existing production DNS until the Cloud Run preview passes visual, content, route, insurance, contact, privacy, and booking checks.

When the production domain is attached to the Google Cloud service or front end, preserve these requirements:

- `https://www.back-to-life-mental-health.com/` is the preferred homepage URL.
- HTTPS is enforced.
- HTTP redirects to HTTPS.
- the non-preferred hostname redirects consistently to the preferred hostname.
- clean canonical routes remain HTTP 200 and serve real HTML.
- `.html` and legacy aliases redirect to their clean canonical routes.
- the production hostname must not send `X-Robots-Tag: noindex`.

The exact DNS/load-balancer/domain-mapping commands depend on the Google Cloud project and chosen front-end architecture, so they are intentionally not hard-coded here.

## Verify production before Search Console submission

After the production hostname is connected:

```bash
bash scripts/verify-production-routes.sh https://www.back-to-life-mental-health.com production
```

Then manually verify that the HTML returned from representative clean routes contains the expected canonical tag. Examples:

- `/medication-management`
- `/new-patients`
- `/anxiety`
- `/attention-deficit-hyperactive-disorder`
- `/telehealth`

Only after the production route check passes should the sitemap be submitted or indexing requests be sent through Google Search Console.

## Rollback principle

Do not retire the Odoo production site until the replacement production host has passed the cutover checks. If a production deployment fails before DNS changes, leave the existing domain untouched. If a problem appears immediately after cutover, restore the prior DNS/hosting target while the issue is corrected.
