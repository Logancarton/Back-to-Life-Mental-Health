# Homepage: guided starting points

## Change record

```json
{
  "change_id": "2026-09-06-homepage-guided-care",
  "date": "2026-09-06",
  "surface": "website",
  "page_or_asset": "https://www.back-to-life-mental-health.com/",
  "change": "Condensed repeated homepage messaging; added four selectable starting points; refreshed typography, photography, connected care timeline, condition links, and practical resources.",
  "hypothesis": "Helping visitors find information for their situation should make fit and next steps clearer, while a shorter page reduces reading effort.",
  "target_stage": "TRUST_FIT",
  "expected_signal": "More appropriate appointment requests relative to comparable homepage traffic; fewer questions about where to start.",
  "observation_window": "Review after 2–4 weeks of comparable traffic; allow longer if request volume is small.",
  "status": "implemented",
  "result": "insufficient-data",
  "notes": "Design hypothesis, not a measured conversion result. No new tracking, stored selections, free-text intake, or external requests are introduced by the starting-point interaction. Existing Tebra workflows and shared scripts remain unchanged."
}
```

## Implementation

- `homepage.css` and `homepage.js` load only on the homepage.
- The four paths are static HTML. Without JavaScript, all are readable and the selectors are ordinary anchor links.
- JavaScript enhances the links into an accessible tab interface with arrow keys, Home/End, Space/Enter, a single tab stop, and associated focusable panels.
- The interface respects a path fragment on load and hash changes. Normal tab choices do not write browser history or storage.
- The practical section uses the shared resource marker to prevent `script.js` from inserting a duplicate resource grid.
- The existing portraits, provider quotation, insurance positioning, geographic link, article, and booking/portal destinations are retained.
- Motion is limited to a brief panel transition and only enabled when the visitor has not requested reduced motion.

## Validation before deployment

- Production preparation and social-metadata scripts completed; image dimensions, canonical metadata, and crisis resources passed their existing build checks.
- JavaScript syntax and Git whitespace checks passed.
- DOM integration checks passed for local asset/link targets, unique IDs, all four paths, keyboard wrap/Home/End/focus, fragment selection, no stored selections, no duplicate resource section, and scheduler open/close with focus return.
- Browser rendering is verified on the existing hosted site because this environment's cloud browser blocks local preview URLs.

## Follow-up measurement

Use the practice's existing approved reporting sources to compare appropriate appointment requests against comparable traffic. No selection-level analytics is added here. Changes in inquiry volume alone do not establish causation.
