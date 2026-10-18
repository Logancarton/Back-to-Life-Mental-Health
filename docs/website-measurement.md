# Website activity measurement

Status: implemented for review; not yet deployed or connected to live storage.

The public website records aggregate interest. The private report is at
`https://www.back-to-life-mental-health.com/growth-report.html` after deployment.
This address is intentionally absent from public menus and the sitemap.

## Activate once

1. In Cloudflare Pages → this project → Settings → Variables and Secrets,
   set **production** `GROWTH_REPORT_KEY` as a secret to a random password of
   24–256 characters. Save it in your password manager. Do not put it in a URL,
   source file, issue, pull request or public GitHub log.
2. The existing `CLOUDFLARE_API_TOKEN` GitHub secret needs its current Pages
   permission plus **D1 Edit** for the same Cloudflare account. Add that scope
   if needed. Do not paste the token into a chat or repository file.
3. Merge the change. The existing main deployment automatically creates or
   reuses `<Pages project name>-growth`, applies the schema, adds the
   `GROWTH_DB` production binding while preserving other D1 bindings, deploys
   the Pages Function, and verifies the collector with a read-only HEAD request.
   If storage provisioning fails, the job stops before uploading a new website.
4. Open the report, enter the report key and choose dates. No key is saved in
   browser storage. The report requires the header key even if its address is
   known. Production activity begins only after the new deployment is live;
   historical visits cannot be recovered.

## Weekly use

Leave both dates blank for the previous seven complete **America/Phoenix**
days (yesterday through six days before yesterday), or choose a range of up to
93 complete days. Download counts if useful. The first recorded day and
measurement limitations are shown with every report. The first week may be
partial. An empty report is not proof that measurement works.

For those same dates, use the existing Master Practice Database's Weekly
Growth Metrics for aggregate appointment requests and new patients. Assign
each distinct request one acquisition source, including unknown. The sum of
sources plus unknown must equal total requests. Do not enter patient names,
messages, diagnoses, contact details or visit-level records in growth reports.

| Signal | Meaning | Does not establish |
| --- | --- | --- |
| Page loads | Visible production page loads | Unique visitors or sessions |
| Booking clicks | Scheduling link or floating launcher clicked | A request was submitted |
| Scheduler openings | Site opened its modal/new-tab fallback | Tebra loaded or booking completed |
| External-scheduler clicks | Embedded scheduler fallback link clicked | A second patient or appointment |
| Phone clicks | Practice phone link clicked | Connected call or qualified inquiry |
| Appointment requests | Distinct requests confirmed from office/Tebra records | Completed first appointments |
| New patients | Confirmed from practice records | Automatic website attribution |

Do not add booking clicks and scheduler openings together as patients; the
same interaction can produce both. Counts are directional event ratios, not
person-level conversion rates. This intentionally does not join browsing to
patient records or claim a Tebra completion integration.

## What is retained

Only daily counters keyed by date, event, broad page group, coarse source and
button placement. There is no raw-event table or visitor identifier. All eight
condition pages map to `education`. Current-patient resources, FAQs, privacy,
report and unknown routes do not collect. No names, phone numbers, form
entries, IP addresses, full URLs, raw referrers, arbitrary UTMs or diagnoses
are written to this database. Cloudflare still processes ordinary network
requests to host the site; infrastructure processing is separate.

No advertising pixels or cookies are added. The browser tab may remember a
coarse source label in sessionStorage, with no ID. Do Not Track and Global
Privacy Control suppress collection; storage-blocked browsers still work.
Production host only: pages.dev and local tests do not enter production
counts. Known browser automation is excluded, but these are not audited bot
or fraud-filtered metrics. A public event endpoint can be spoofed. Repeated
same-action/same-placement clicks within one second are suppressed in-tab.

Source is within-tab attribution, not validated first-touch acquisition. Paid
Facebook needs `utm_source=facebook&utm_medium=paid_social`; paid Google needs
recognized paid tagging or the presence of gclid (its value is not retained).
Instagram remains one source regardless of paid/organic. Missing referrers,
cross-device behavior, new tabs and unrecognized tags can become direct/unknown.

The collector has strict enumerated fields, a 512-byte streamed-body cap,
same-origin checks, prepared SQL and no request-body logs. The read API uses
a secret header, no CORS and no-store responses. Static routes bypass Functions
through `_routes.json`; only the two analytics endpoints invoke server code.
Normal Pages/D1 account limits apply. No paid plan change is configured.

## Verification and rollback

`node --test tests/growth.test.mjs` exercises persistence, validation, private
report authorization, Phoenix dates and setup behavior. With Playwright and
Chromium installed, `node tests/growth-browser.mjs` exercises desktop/mobile
scheduling and the report with intercepted requests; no production events
are generated. PR CI runs both. Deployment retains existing site verification.

After activation, inspect `HEAD /api/growth` for 204, then confirm a normal
non-DNT production visit appears in the private report for that day after it
becomes a complete day. Current-day reporting is deliberately excluded.

To stop recording, remove the growth.js loader at the end of script.js and
redeploy, or roll back to the prior Pages deployment. Existing aggregate data
remains in D1 until the practice chooses to delete it. This change does not
alter DNS, Tebra practice keys, scheduling forms or patient records.
