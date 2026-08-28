#!/usr/bin/env python3
"""
One-time image optimization for the Back to Life Mental Health site.

Converts every referenced raster image to WebP at a sensible display width,
normalizes filenames to lowercase kebab-case (removing spaces, ampersands and
parentheses), and rewrites every reference in HTML, CSS and JS.

Run from the repository root:  python3 scripts/optimize-images.py
"""
import os
import re
import glob
import json
from PIL import Image

IMG_DIR = "assets/images"
TEXT_FILES = sorted(glob.glob("*.html") + glob.glob("*.css") + ["script.js"])

# Target display width per image. Anything not listed keeps its native width.
TARGET_WIDTH = {
    "btlmh-logo.png": 600,
    "Aetna.png": 300,
    "BCBS.png": 300,
    "Cigna.png": 300,
    "UHC.png": 300,
    "Me.jpeg": 900,
    "Lobby.png": 1200,
    "Lobby_2.png": 1000,
    "Outside_Front_Salt_Spa_Picture.jpeg": 1200,
    "ANTHEM_Saguaro_in_park.jpg": 990,
    "medication-management-conversation.jpg": 1200,
    "homepage-hero.jpg": 1376,
    # Full-bleed section backgrounds
    "Anxiety.png": 1600,
    "Calm_office.png": 1600,
    "Calm_flower_space.png": 1600,
    "Grief_&_Loss.png": 1600,
    "OCD_organizing.png": 1600,
    "Looking_in_office.png": 1400,
    "about-collaboration.png": 1600,
    "anthem-courage-path.png": 1600,
    "condition-bipolar.png": 1600,
    "condition-depression.png": 1600,
    "condition-life-transitions.png": 1600,
    "PTSD safe.png": 1600,
    "Script Pad.png": 1600,
    "organized desk.png": 1600,
    "Warm_Home_Office Video_Call.png": 1400,
}

QUALITY_PHOTO = 80
QUALITY_ALPHA = 85


def slugify(name: str) -> str:
    """Lowercase kebab-case filename, .webp extension."""
    stem = os.path.splitext(name)[0]
    stem = stem.replace("&", "and")
    stem = re.sub(r"[^A-Za-z0-9]+", "-", stem)
    stem = re.sub(r"-+", "-", stem).strip("-").lower()
    return stem + ".webp"


def referenced_images() -> set:
    """Every assets/images/* path referenced from HTML, CSS or JS."""
    found = set()
    existing = set(os.listdir(IMG_DIR))
    for path in TEXT_FILES:
        text = open(path, encoding="utf-8", errors="ignore").read()
        # Match greedily up to a quote or paren, so filenames with spaces survive.
        for raw in re.findall(r"assets/images/([^\"')]+)", text):
            raw = raw.strip().rstrip("`;,")
            if raw in existing:
                found.add(raw)
            else:
                # Trim trailing junk until it matches a real file.
                parts = raw.split()
                while parts:
                    cand = " ".join(parts)
                    if cand in existing:
                        found.add(cand)
                        break
                    parts.pop()
    return found


def main():
    refs = referenced_images()
    print(f"{len(refs)} referenced images\n")

    rename_map = {}
    before = after = 0

    for name in sorted(refs):
        src = os.path.join(IMG_DIR, name)
        out_name = slugify(name)
        out = os.path.join(IMG_DIR, out_name)

        im = Image.open(src)
        has_alpha = im.mode in ("RGBA", "LA", "P")
        im = im.convert("RGBA" if has_alpha else "RGB")

        target = TARGET_WIDTH.get(name)
        if target and im.width > target:
            h = round(im.height * target / im.width)
            im = im.resize((target, h), Image.LANCZOS)

        im.save(out, "WEBP",
                quality=QUALITY_ALPHA if has_alpha else QUALITY_PHOTO,
                method=6)

        b, a = os.path.getsize(src), os.path.getsize(out)
        before += b
        after += a
        rename_map[name] = {"to": out_name, "w": im.width, "h": im.height}
        print(f"  {b/1e6:6.2f}MB -> {a/1e6:5.3f}MB  {im.width:4d}x{im.height:<4d}  "
              f"{name}  ->  {out_name}")

    # Rewrite every reference. Longest names first so substrings can't clobber.
    for path in TEXT_FILES:
        text = original = open(path, encoding="utf-8").read()
        for old in sorted(rename_map, key=len, reverse=True):
            text = text.replace(f"assets/images/{old}",
                                f"assets/images/{rename_map[old]['to']}")
        if text != original:
            open(path, "w", encoding="utf-8").write(text)
            print(f"  rewrote refs in {path}")

    # Remove the originals we just replaced.
    for name in rename_map:
        old = os.path.join(IMG_DIR, name)
        if os.path.exists(old) and os.path.basename(old) != rename_map[name]["to"]:
            os.remove(old)

    json.dump(rename_map, open("scripts/image-manifest.json", "w"), indent=2)
    print(f"\nreferenced payload: {before/1e6:.1f}MB -> {after/1e6:.1f}MB "
          f"({100*(1-after/before):.1f}% smaller)")


if __name__ == "__main__":
    main()
