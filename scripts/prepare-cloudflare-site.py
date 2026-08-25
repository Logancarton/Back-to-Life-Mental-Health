#!/usr/bin/env python3
"""Prepare the static Back to Life Mental Health site for Cloudflare Pages.

The production build normalizes clean routes/canonicals, emits crawlable social
and structured metadata, optimizes local raster imagery to WebP, adds intrinsic
image dimensions to reduce layout shift, and injects the shared crisis resource
block into every rendered page.
"""

from __future__ import annotations

import html
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except ImportError as exc:  # pragma: no cover - enforced by CI
    raise RuntimeError(
        "Pillow is required for the production image optimization step."
    ) from exc

PRODUCTION_ORIGIN = "https://www.back-to-life-mental-health.com"
SOURCE_ROOT = Path(__file__).resolve().parent.parent

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

PAGE_LABELS = {
    "/": "Back to Life Mental Health",
    "/services": "Psychiatric Services",
    "/psychiatric-evaluation": "Psychiatric Evaluation",
    "/north-phoenix-psychiatric-care": "North Phoenix & North Valley Psychiatric Care",
    "/medication-management": "Medication Management",
    "/new-patients": "New Patients",
    "/current-patients": "Current Patients",
    "/insurance-payment": "Insurance & Payment",
    "/telehealth": "Telehealth",
    "/faq": "Frequently Asked Questions",
    "/about": "About Back to Life Mental Health",
    "/contact": "Contact Back to Life Mental Health",
    "/anxiety": "Anxiety Treatment",
    "/depression": "Depression Treatment",
    "/adhd": "ADHD Treatment",
    "/ptsd": "PTSD & Trauma-Related Symptoms",
    "/ocd": "OCD Treatment",
    "/bipolar": "Bipolar Disorder Treatment",
    "/grief-loss": "Grief & Loss",
    "/life-transitions": "Life Transitions & Adjustment",
    "/privacy": "Privacy Policy",
}

BREADCRUMB_TRAILS = {
    "/services": [("Home", "/"), ("Psychiatric Services", "/services")],
    "/psychiatric-evaluation": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Psychiatric Evaluation", "/psychiatric-evaluation"),
    ],
    "/north-phoenix-psychiatric-care": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("North Phoenix & North Valley Psychiatric Care", "/north-phoenix-psychiatric-care"),
    ],
    "/medication-management": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Medication Management", "/medication-management"),
    ],
    "/new-patients": [("Home", "/"), ("New Patients", "/new-patients")],
    "/current-patients": [("Home", "/"), ("Current Patients", "/current-patients")],
    "/insurance-payment": [
        ("Home", "/"),
        ("New Patients", "/new-patients"),
        ("Insurance & Payment", "/insurance-payment"),
    ],
    "/telehealth": [
        ("Home", "/"),
        ("New Patients", "/new-patients"),
        ("Telehealth", "/telehealth"),
    ],
    "/faq": [
        ("Home", "/"),
        ("New Patients", "/new-patients"),
        ("Frequently Asked Questions", "/faq"),
    ],
    "/about": [("Home", "/"), ("About Back to Life Mental Health", "/about")],
    "/contact": [("Home", "/"), ("Contact Back to Life Mental Health", "/contact")],
    "/anxiety": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Anxiety Treatment", "/anxiety"),
    ],
    "/depression": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Depression Treatment", "/depression"),
    ],
    "/adhd": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("ADHD Treatment", "/adhd"),
    ],
    "/ptsd": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("PTSD & Trauma-Related Symptoms", "/ptsd"),
    ],
    "/ocd": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("OCD Treatment", "/ocd"),
    ],
    "/bipolar": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Bipolar Disorder Treatment", "/bipolar"),
    ],
    "/grief-loss": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Grief & Loss", "/grief-loss"),
    ],
    "/life-transitions": [
        ("Home", "/"),
        ("Psychiatric Services", "/services"),
        ("Life Transitions & Adjustment", "/life-transitions"),
    ],
    "/privacy": [("Home", "/"), ("Privacy Policy", "/privacy")],
}

SITEWIDE_COPY_REPLACEMENTS = {
    "Independent psychiatric care in Anthem with telehealth available throughout Arizona.":
        "Independent psychiatric care for Anthem, North Phoenix, and the North Valley, with telehealth throughout Arizona.",
    "In-person in Anthem + telehealth across Arizona":
        "Anthem office serving North Phoenix & the North Valley + telehealth across Arizona",
    "Anthem office + Arizona telehealth":
        "Anthem office serving North Phoenix & the North Valley + Arizona telehealth",
}

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

RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg"}
TEXT_EXTENSIONS = {".html", ".css", ".js", ".json", ".xml", ".webmanifest", ".txt"}
SOCIAL_IMAGE_SOURCE = "assets/images/homepage-hero.jpg"
CRISIS_TEXT = (
    "In a crisis? If you are having thoughts of suicide or are in emotional distress, "
    "call or text 988 to reach the 988 Suicide & Crisis Lifeline, or call 911 for a "
    "medical emergency. Back to Life Mental Health is an outpatient practice and does "
    "not provide emergency or after-hours crisis services."
)
CRISIS_BLOCK = (
    '<div class="container crisis-block" role="note" aria-label="Crisis resources">'
    '<p><strong>In a crisis?</strong> If you are having thoughts of suicide or are in '
    'emotional distress, call or text <a href="tel:988"><strong>988</strong></a> to reach '
    'the 988 Suicide &amp; Crisis Lifeline, or call <a href="tel:911"><strong>911</strong></a> '
    'for a medical emergency. Back to Life Mental Health is an outpatient practice and '
    'does not provide emergency or after-hours crisis services.</p></div>'
)

CRISIS_CSS = r"""
/* Shared crisis-resource boundary. Kept in the footer so it is visible but does
   not compete with routine appointment calls to action. */
.crisis-block {
  margin-top: 34px;
  padding-top: 24px;
  padding-bottom: 4px;
  border-top: 1px solid rgba(255,255,255,.18);
}
.crisis-block p {
  max-width: 980px;
  margin: 0;
  color: rgba(255,255,255,.94);
  font-size: 14px;
  line-height: 1.72;
}
.crisis-block strong,
.crisis-block a {
  color: #fff;
}
.crisis-block a {
  font-weight: 800;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
}
.error-page + .site-footer {
  margin-top: 0;
}
.error-page + .site-footer .crisis-block {
  margin-top: 0;
  padding-top: 28px;
  padding-bottom: 28px;
  border-top: 0;
}
@media (max-width: 680px) {
  .crisis-block {
    margin-top: 28px;
    padding-top: 20px;
  }
  .crisis-block p {
    font-size: 13px;
  }
}
""".strip()


def canonical_url(route: str) -> str:
    return f"{PRODUCTION_ORIGIN}{'/' if route == '/' else route}"


def human_bytes(value: int) -> str:
    size = float(value)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def text_files(root: Path) -> list[Path]:
    return sorted(
        path for path in root.rglob("*")
        if path.is_file() and (path.suffix.lower() in TEXT_EXTENSIONS or path.name == "_redirects")
    )


def optimize_images(root: Path) -> tuple[dict[str, str], dict[str, tuple[int, int]], int, int, int, int]:
    images_root = root / "assets" / "images"
    if not images_root.is_dir():
        raise RuntimeError("Expected assets/images in build output.")

    replacements: dict[str, str] = {}
    dimensions: dict[str, tuple[int, int]] = {}
    converted = 0
    source_bytes = 0
    optimized_bytes = 0
    pruned_bytes = 0
    destinations: set[Path] = set()

    raster_files = sorted(
        path for path in images_root.rglob("*")
        if path.is_file() and path.suffix.lower() in RASTER_EXTENSIONS
    )

    for source in raster_files:
        relative_source = source.relative_to(root).as_posix()
        destination = source.with_suffix(".webp")
        if destination in destinations:
            raise RuntimeError(f"WebP filename collision for {relative_source}.")
        destinations.add(destination)

        source_bytes += source.stat().st_size
        try:
            with Image.open(source) as opened:
                image = ImageOps.exif_transpose(opened)
                width, height = image.size
                has_alpha = (
                    image.mode in {"RGBA", "LA"}
                    or (image.mode == "P" and "transparency" in image.info)
                )
                converted_image = image.convert("RGBA" if has_alpha else "RGB")
                save_kwargs = {"format": "WEBP", "method": 6}
                if has_alpha:
                    save_kwargs["lossless"] = True
                else:
                    save_kwargs["quality"] = 82
                converted_image.save(destination, **save_kwargs)
        except (UnidentifiedImageError, OSError) as exc:
            raise RuntimeError(f"Could not optimize image {relative_source}: {exc}") from exc

        relative_destination = destination.relative_to(root).as_posix()
        replacements[relative_source] = relative_destination
        dimensions[relative_destination] = (width, height)
        optimized_bytes += destination.stat().st_size
        converted += 1

    # Keep one broadly compatible JPEG for social crawlers while serving WebP to
    # the website itself. All other raster originals are superseded by WebP.
    for source in raster_files:
        relative_source = source.relative_to(root).as_posix()
        if relative_source == SOCIAL_IMAGE_SOURCE:
            continue
        pruned_bytes += source.stat().st_size
        source.unlink()

    return replacements, dimensions, converted, source_bytes, optimized_bytes, pruned_bytes


def rewrite_asset_references(root: Path, replacements: dict[str, str]) -> None:
    for path in text_files(root):
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in replacements.items():
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")


def prepare_parallel_css(root: Path) -> None:
    enhancements = root / "enhancements.css"
    if enhancements.is_file():
        css = enhancements.read_text(encoding="utf-8")
        css = re.sub(
            r'^\s*@import\s+url\(["\']enhancements-base\.css["\']\);\s*',
            "",
            css,
            count=1,
        )
        enhancements.write_text(css, encoding="utf-8")

    base_css = root / "enhancements-base.css"
    if not base_css.is_file():
        raise RuntimeError("enhancements-base.css is missing from build output.")
    base_text = base_css.read_text(encoding="utf-8")
    if "Shared crisis-resource boundary" not in base_text:
        base_text = f"{base_text.rstrip()}\n\n{CRISIS_CSS}\n"
        base_css.write_text(base_text, encoding="utf-8")


def extract_title(text: str, page_name: str) -> str:
    match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    if not match:
        raise RuntimeError(f"Missing title in {page_name}.")
    return html.unescape(re.sub(r"\s+", " ", match.group(1)).strip())


def extract_description(text: str, page_name: str) -> str:
    match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\'][^>]*>',
        text,
        flags=re.I,
    )
    if not match:
        match = re.search(
            r'<meta\s+content=["\']([^"\']*)["\']\s+name=["\']description["\'][^>]*>',
            text,
            flags=re.I,
        )
    if not match:
        raise RuntimeError(f"Missing meta description in {page_name}.")
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
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def ensure_stylesheet_link(text: str) -> str:
    if 'href="enhancements.css"' not in text:
        return text
    if 'href="enhancements-base.css"' in text:
        return text
    target = '<link rel="stylesheet" href="enhancements.css">'
    replacement = (
        '<link rel="stylesheet" href="enhancements-base.css">\n'
        f'  {target}'
    )
    return text.replace(target, replacement, 1)


def ensure_crisis_block(text: str) -> str:
    if 'class="container crisis-block"' in text:
        return text

    footer_bottom = '<div class="container footer-bottom">'
    if footer_bottom in text and '<footer class="site-footer">' in text:
        return text.replace(footer_bottom, f"{CRISIS_BLOCK}{footer_bottom}", 1)

    if "</main>" in text:
        footer = f'</main>\n  <footer class="site-footer">{CRISIS_BLOCK}</footer>'
        return text.replace("</main>", footer, 1)

    raise RuntimeError("Unable to place crisis block: no </main> or site footer found.")


def ensure_image_dimensions(text: str, dimensions: dict[str, tuple[int, int]]) -> tuple[str, int, int]:
    total = 0
    sized = 0

    def replace_img(match: re.Match[str]) -> str:
        nonlocal total, sized
        tag = match.group(0)
        total += 1
        src_match = re.search(r'\bsrc=["\']([^"\']+)["\']', tag, flags=re.I)
        if not src_match:
            return tag

        src = html.unescape(src_match.group(1))
        parsed = urlparse(src)
        path = parsed.path.lstrip("/")
        if src.startswith(PRODUCTION_ORIGIN):
            path = src[len(PRODUCTION_ORIGIN):].split("?", 1)[0].split("#", 1)[0].lstrip("/")
        else:
            path = path.split("?", 1)[0].split("#", 1)[0]

        size = dimensions.get(path)
        if not size:
            if re.search(r'\bwidth=["\']\d+["\']', tag, flags=re.I) and re.search(
                r'\bheight=["\']\d+["\']', tag, flags=re.I
            ):
                sized += 1
            return tag

        width, height = size
        if not re.search(r'\bwidth=["\']\d+["\']', tag, flags=re.I):
            tag = re.sub(r"\s*/?>$", f' width="{width}"\\g<0>', tag, count=1)
        if not re.search(r'\bheight=["\']\d+["\']', tag, flags=re.I):
            tag = re.sub(r"\s*/?>$", f' height="{height}"\\g<0>', tag, count=1)

        if re.search(r'\bwidth=["\']\d+["\']', tag, flags=re.I) and re.search(
            r'\bheight=["\']\d+["\']', tag, flags=re.I
        ):
            sized += 1
        return tag

    updated = re.sub(r"<img\b[^>]*>", replace_img, text, flags=re.I | re.S)
    return updated, total, sized


def mark_existing_schema(text: str, schema_type: str, data_attribute: str) -> tuple[str, bool]:
    pattern = re.compile(
        r'(<script\s+type=["\']application/ld\+json["\'])([^>]*>)(.*?</script>)',
        flags=re.I | re.S,
    )

    def repl(match: re.Match[str]) -> str:
        content = match.group(3)
        if f'"@type": "{schema_type}"' not in content and f'"@type":"{schema_type}"' not in content:
            return match.group(0)
        opening = f"{match.group(1)}{match.group(2)}"
        if data_attribute not in opening:
            opening = opening[:-1] + f" {data_attribute}>"
        repl.found = True
        return opening + content

    repl.found = False
    updated = pattern.sub(repl, text)
    return updated, bool(repl.found)


def ensure_static_schema(text: str, route: str) -> str:
    if route == "/":
        text, found = mark_existing_schema(text, "WebSite", "data-website-schema")
        if not found:
            website = {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": f"{PRODUCTION_ORIGIN}/#website",
                "name": "Back to Life Mental Health",
                "alternateName": "BTLMH",
                "url": f"{PRODUCTION_ORIGIN}/",
            }
            schema = (
                '  <script type="application/ld+json" data-website-schema>'
                + json.dumps(website, separators=(",", ":"), ensure_ascii=False)
                + "</script>\n"
            )
            text = text.replace("</head>", schema + "</head>", 1)
        return text

    trail = BREADCRUMB_TRAILS.get(route)
    if not trail:
        return text

    text, found = mark_existing_schema(text, "BreadcrumbList", "data-breadcrumb-schema")
    if found:
        return text

    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": index,
                "name": name,
                "item": canonical_url(item_route),
            }
            for index, (name, item_route) in enumerate(trail, start=1)
        ],
    }
    schema = (
        '  <script type="application/ld+json" data-breadcrumb-schema>'
        + json.dumps(breadcrumb, separators=(",", ":"), ensure_ascii=False)
        + "</script>\n"
    )
    return text.replace("</head>", schema + "</head>", 1)


def normalize_html(path: Path, dimensions: dict[str, tuple[int, int]]) -> tuple[int, int]:
    text = path.read_text(encoding="utf-8")

    for filename, route in PUBLIC_PAGES.items():
        text = text.replace(f'href="{filename}', f'href="{route}')

    for old, new in SITEWIDE_COPY_REPLACEMENTS.items():
        text = text.replace(old, new)

    if '/north-phoenix-psychiatric-care' not in text:
        services_footer_link = '<a href="/services">Services Overview</a>'
        regional_footer_link = (
            services_footer_link
            + '<a href="/north-phoenix-psychiatric-care">North Phoenix &amp; North Valley</a>'
        )
        text = text.replace(services_footer_link, regional_footer_link, 1)

    text = ensure_stylesheet_link(text)
    text = ensure_crisis_block(text)

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

        title = extract_title(text, path.name)
        description = extract_description(text, path.name)
        social_image = f"{PRODUCTION_ORIGIN}/{SOCIAL_IMAGE_SOURCE}"
        social_alt = f"{PAGE_LABELS.get(route, title)} | Back to Life Mental Health"

        for attribute, key, value in (
            ("property", "og:type", "website"),
            ("property", "og:site_name", "Back to Life Mental Health"),
            ("property", "og:title", title),
            ("property", "og:description", description),
            ("property", "og:url", url),
            ("property", "og:image", social_image),
            ("property", "og:image:alt", social_alt),
            ("name", "twitter:card", "summary_large_image"),
            ("name", "twitter:title", title),
            ("name", "twitter:description", description),
            ("name", "twitter:image", social_image),
            ("name", "twitter:image:alt", social_alt),
        ):
            text = upsert_meta(text, attribute, key, value)

        text = ensure_static_schema(text, route)

    known_files = "|".join(re.escape(name) for name in PUBLIC_PAGES)
    if re.search(rf'href="(?:{known_files})(?:[?#][^"]*)?"', text):
        raise RuntimeError(f"Unnormalized internal .html link remains in {path.name}.")

    text, img_total, img_sized = ensure_image_dimensions(text, dimensions)
    path.write_text(text, encoding="utf-8")
    return img_total, img_sized


def source_lastmod(filename: str) -> str:
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", filename],
            cwd=SOURCE_ROOT,
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        )
        value = result.stdout.strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
    except (OSError, subprocess.SubprocessError):
        pass

    source = SOURCE_ROOT / filename
    if source.is_file():
        return datetime.fromtimestamp(source.stat().st_mtime).date().isoformat()
    raise RuntimeError(f"Cannot determine lastmod for {filename}.")


def stamp_sitemap(root: Path) -> int:
    sitemap = root / "sitemap.xml"
    if not sitemap.is_file():
        raise RuntimeError("sitemap.xml missing from build output.")

    text = sitemap.read_text(encoding="utf-8")
    stamped = 0
    for filename, route in PUBLIC_PAGES.items():
        loc = canonical_url(route)
        lastmod = source_lastmod(filename)
        pattern = re.compile(
            rf"<url><loc>{re.escape(loc)}</loc>(?:<lastmod>\d{{4}}-\d{{2}}-\d{{2}}</lastmod>)?</url>"
        )
        replacement = f"<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>"
        text, count = pattern.subn(replacement, text, count=1)
        if count != 1:
            raise RuntimeError(f"Expected sitemap entry for {loc}.")
        stamped += 1

    sitemap.write_text(text, encoding="utf-8")
    return stamped


def prune_unused_media(root: Path) -> int:
    pruned = 0
    all_text = "\n".join(path.read_text(encoding="utf-8") for path in text_files(root))

    video_dir = root / "assets" / "video"
    if video_dir.exists() and "assets/video/" not in all_text:
        pruned += sum(path.stat().st_size for path in video_dir.rglob("*") if path.is_file())
        shutil.rmtree(video_dir)

    for junk in root.rglob(".DS_Store"):
        if junk.is_file():
            pruned += junk.stat().st_size
            junk.unlink()

    return pruned


def verify_crisis_blocks(html_files: list[Path]) -> None:
    for path in html_files:
        text = path.read_text(encoding="utf-8")
        if text.count('class="container crisis-block"') != 1:
            raise RuntimeError(f"Expected exactly one crisis block in {path.name}.")
        plain = re.sub(r"<[^>]+>", "", text)
        plain = html.unescape(re.sub(r"\s+", " ", plain))
        if CRISIS_TEXT not in plain:
            raise RuntimeError(f"Crisis wording changed in {path.name}.")
        if 'href="tel:988"' not in text or 'href="tel:911"' not in text:
            raise RuntimeError(f"Crisis telephone links missing in {path.name}.")


def verify_public_metadata(root: Path) -> None:
    for filename, route in PUBLIC_PAGES.items():
        text = (root / filename).read_text(encoding="utf-8")
        url = canonical_url(route)
        required = [
            f'<link rel="canonical" href="{url}">',
            '<meta property="og:title"',
            '<meta property="og:description"',
            f'<meta property="og:url" content="{url}">',
            '<meta property="og:image"',
            '<meta name="twitter:card" content="summary_large_image">',
        ]
        missing = [needle for needle in required if needle not in text]
        if missing:
            raise RuntimeError(f"{filename} missing static metadata: {', '.join(missing)}")


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

    (
        replacements,
        dimensions,
        converted_count,
        source_image_bytes,
        optimized_image_bytes,
        image_pruned_bytes,
    ) = optimize_images(root)
    rewrite_asset_references(root, replacements)
    prepare_parallel_css(root)

    html_files = sorted(root.glob("*.html"))
    img_total = 0
    img_sized = 0
    for path in html_files:
        total, sized = normalize_html(path, dimensions)
        img_total += total
        img_sized += sized

    sitemap_count = stamp_sitemap(root)
    media_pruned_bytes = prune_unused_media(root)
    verify_crisis_blocks(html_files)
    verify_public_metadata(root)

    if img_total and img_sized != img_total:
        unsized = img_total - img_sized
        raise RuntimeError(f"{unsized} <img> element(s) still lack width/height.")

    total_pruned = image_pruned_bytes + media_pruned_bytes
    print(f"Removed {len(removed)} compatibility route directorie(s).")
    print(
        f"Optimized {converted_count} raster image(s): "
        f"{human_bytes(source_image_bytes)} source -> {human_bytes(optimized_image_bytes)} WebP."
    )
    print(f"Pruned {human_bytes(total_pruned)} of superseded originals and unused media.")
    print(f"Normalized {len(html_files)} top-level HTML file(s) for Cloudflare Pages.")
    print(f"Added intrinsic width/height to {img_sized} of {img_total} <img> element(s).")
    print(f"Stamped {sitemap_count} sitemap URL(s) with source-derived lastmod dates.")
    print(f"Verified crisis resources on {len(html_files)} page(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
