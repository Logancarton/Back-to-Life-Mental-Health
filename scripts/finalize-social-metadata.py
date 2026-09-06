#!/usr/bin/env python3
"""Finalize static OpenGraph and Twitter metadata in the Cloudflare build."""

from __future__ import annotations

import html
import re
import shutil
import sys
from pathlib import Path

PRODUCTION_ORIGIN = "https://www.back-to-life-mental-health.com"
SOURCE_ROOT = Path(__file__).resolve().parent.parent
SOCIAL_IMAGE_PATH = "assets/images/og-homepage.jpg"
SOCIAL_IMAGE_URL = f"{PRODUCTION_ORIGIN}/{SOCIAL_IMAGE_PATH}"

PUBLIC_PAGES = {
    "index.html": "/",
    "services.html": "/services",
    "psychiatric-evaluation.html": "/psychiatric-evaluation",
    "north-phoenix-psychiatric-care.html": "/north-phoenix-psychiatric-care",
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


def canonical_url(route: str) -> str:
    return f"{PRODUCTION_ORIGIN}{'/' if route == '/' else route}"


def extract_title(text: str, filename: str) -> str:
    match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    if not match:
        raise RuntimeError(f"Missing title in {filename}.")
    return html.unescape(re.sub(r"\s+", " ", match.group(1)).strip())


def extract_description(text: str, filename: str) -> str:
    match = re.search(
        r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>',
        text,
        flags=re.I,
    )
    if not match:
        match = re.search(
            r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']description["\'][^>]*>',
            text,
            flags=re.I,
        )
    if not match:
        raise RuntimeError(f"Missing meta description in {filename}.")
    return html.unescape(match.group(1).strip())


def upsert_meta(text: str, attribute: str, key: str, value: str) -> str:
    escaped = html.escape(value, quote=True)
    pattern = re.compile(
        rf'<meta\s+[^>]*{attribute}=["\']{re.escape(key)}["\'][^>]*>',
        flags=re.I,
    )
    tag = f'<meta {attribute}="{key}" content="{escaped}">'
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    if "</head>" not in text:
        raise RuntimeError("Cannot add social metadata: missing </head>.")
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def ensure_social_image(build_root: Path) -> None:
    source = SOURCE_ROOT / SOCIAL_IMAGE_PATH
    destination = build_root / SOCIAL_IMAGE_PATH
    if not source.is_file():
        raise RuntimeError(f"Social preview image missing from source repository: {source}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    if not destination.is_file() or destination.stat().st_size == 0:
        raise RuntimeError(f"Social preview image was not copied into build output: {destination}")


def finalize_page(path: Path, route: str) -> None:
    text = path.read_text(encoding="utf-8")
    title = extract_title(text, path.name)
    description = extract_description(text, path.name)
    url = canonical_url(route)
    alt = f"{title} | Back to Life Mental Health"

    tags = (
        ("property", "og:type", "website"),
        ("property", "og:site_name", "Back to Life Mental Health"),
        ("property", "og:locale", "en_US"),
        ("property", "og:title", title),
        ("property", "og:description", description),
        ("property", "og:url", url),
        ("property", "og:image", SOCIAL_IMAGE_URL),
        ("property", "og:image:type", "image/jpeg"),
        ("property", "og:image:alt", alt),
        ("name", "twitter:card", "summary_large_image"),
        ("name", "twitter:title", title),
        ("name", "twitter:description", description),
        ("name", "twitter:image", SOCIAL_IMAGE_URL),
        ("name", "twitter:image:alt", alt),
    )
    for attribute, key, value in tags:
        text = upsert_meta(text, attribute, key, value)

    required = (
        f'<meta property="og:title" content="{html.escape(title, quote=True)}">',
        f'<meta property="og:description" content="{html.escape(description, quote=True)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{SOCIAL_IMAGE_URL}">',
        '<meta property="og:image:type" content="image/jpeg">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{html.escape(title, quote=True)}">',
        f'<meta name="twitter:description" content="{html.escape(description, quote=True)}">',
        f'<meta name="twitter:image" content="{SOCIAL_IMAGE_URL}">',
    )
    missing = [needle for needle in required if needle not in text]
    if missing:
        raise RuntimeError(f"{path.name} failed static social metadata validation: {missing}")

    path.write_text(text, encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: finalize-social-metadata.py <build-directory>", file=sys.stderr)
        return 2

    root = Path(sys.argv[1]).resolve()
    if not root.is_dir():
        raise RuntimeError(f"Build directory does not exist: {root}")

    ensure_social_image(root)

    for filename, route in PUBLIC_PAGES.items():
        path = root / filename
        if not path.is_file():
            raise RuntimeError(f"Expected public page missing from build: {filename}")
        finalize_page(path, route)

    print(
        f"Finalized static OpenGraph/Twitter metadata on {len(PUBLIC_PAGES)} public pages "
        f"using {SOCIAL_IMAGE_PATH}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
