#!/usr/bin/env python3
"""Prepare the static Back to Life Mental Health site for Cloudflare Pages.

The repository still contains historical GitHub Pages compatibility directories.
They are intentionally kept out of the Cloudflare deployment. The deployed HTML
is also normalized so internal navigation and canonical metadata use the clean,
extensionless production routes.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

PRODUCTION_ORIGIN = "https://www.back-to-life-mental-health.com"

PUBLIC_PAGES = {
    "index.html": "/",
    "services.html": "/services",
    "medication-management.html": "/medication-management",
    "new-patients.html": "/new-patients",
    "current-patients.html": "/current-patients",
    "insurance-payment.html": "/insurance-payment",
    "telehealth.html": "/telehealth",
    "faq.html": "/faq",
    "about.html": "/about",
    "contact.html": "/contact",
    "anxiety.html": "/anxiety",
    "depression.html": "/depression",
    "adhd.html": "/adhd",
    "ptsd.html": "/ptsd",
    "ocd.html": "/ocd",
    "bipolar.html": "/bipolar",
    "grief-loss.html": "/grief-loss",
    "life-transitions.html": "/life-transitions",
    "privacy.html": "/privacy",
}

# These directories are old JavaScript redirect shells created for GitHub Pages.
# If deployed to Cloudflare they can shadow the real extensionless HTML routes.
COMPATIBILITY_DIRECTORIES = {
    "about-us",
    "anxiety",
    "attention-deficit-hyperactive-disorder",
    "bipolar",
    "contactus",
    "current-patients",
    "depression",
    "faq",
    "insurance-payment",
    "life-changes",
    "loss-bereavement",
    "medication-management",
    "new-patients",
    "obsessive-compulsive-disorder",
    "post-traumatic-stress-disorder",
    "pricing",
    "privacy",
    "services-overview",
    "telehealth",
}


def canonical_url(route: str) -> str:
    return f"{PRODUCTION_ORIGIN}{route}"


def normalize_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    # Make every internal page link point directly at its canonical route.
    for filename, route in PUBLIC_PAGES.items():
        text = text.replace(f'href="{filename}', f'href="{route}')

    route = PUBLIC_PAGES.get(path.name)
    if route:
        url = canonical_url(route)
        text, canonical_count = re.subn(
            r'<link rel="canonical" href="[^"]+">',
            f'<link rel="canonical" href="{url}">',
            text,
            count=1,
        )
        if canonical_count != 1:
            raise RuntimeError(
                f"Expected exactly one canonical tag in {path.name}; found {canonical_count}."
            )

        # Keep an explicitly declared Open Graph URL aligned when a page has one.
        text = re.sub(
            r'<meta property="og:url" content="[^"]+">',
            f'<meta property="og:url" content="{url}">',
            text,
            count=1,
        )

    known_files = "|".join(re.escape(name) for name in PUBLIC_PAGES)
    if re.search(rf'href="(?:{known_files})(?:[?#][^"]*)?"', text):
        raise RuntimeError(f"Unnormalized internal .html link remains in {path.name}.")

    path.write_text(text, encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: prepare-cloudflare-site.py <build-directory>", file=sys.stderr)
        return 2

    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        print(f"Build directory does not exist: {root}", file=sys.stderr)
        return 2

    removed = []
    for dirname in sorted(COMPATIBILITY_DIRECTORIES):
        target = root / dirname
        if target.exists():
            shutil.rmtree(target)
            removed.append(dirname)

    missing = [name for name in PUBLIC_PAGES if not (root / name).is_file()]
    if missing:
        raise RuntimeError(f"Missing expected public page(s): {', '.join(missing)}")

    html_files = sorted(root.glob("*.html"))
    for path in html_files:
        normalize_html(path)

    print(f"Removed {len(removed)} compatibility route directorie(s).")
    print(f"Normalized {len(html_files)} top-level HTML file(s) for Cloudflare Pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
