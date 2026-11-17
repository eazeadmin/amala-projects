#!/usr/bin/env python3
"""Rebrand the Plane AIO image as AMALA Projects at build time.

Finds Plane's built web/admin/space files wherever they live in the image,
swaps icons, rewrites meta text, and injects brand.css + brand.js into each
static index.html. Fails the build loudly if it can't find anything, so a
Plane update that moves files never ships half-branded.
"""
import fnmatch
import os
import re
import shutil
import sys

BRAND = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BRAND, "assets")
NAME = "AMALA Projects"
SKIP_DIRS = {"proc", "sys", "dev", "node_modules", ".git", "__pycache__", "site-packages", "dist-packages"}

# hashed build file pattern -> our replacement
ICONS = [
    ("favicon-16x16-*.png", "favicon-16x16.png"),
    ("favicon-32x32-*.png", "favicon-32x32.png"),
    ("favicon-*.ico", "favicon.ico"),
    ("favicon.ico", "favicon.ico"),
    ("icon-180x180-*.png", "icon-180x180.png"),
    ("icon-192x192-*.png", "icon-192x192.png"),
    ("icon-512x512-*.png", "icon-512x512.png"),
    ("apple-touch-icon-*.png", "apple-touch-icon.png"),
    ("og-image-*.png", "og-image.png"),
    ("logo-spinner-dark-*.gif", "logo-spinner-dark.gif"),
    ("logo-spinner-light-*.gif", "logo-spinner-light.gif"),
]

TEXT = [
    ("Plane | Simple, extensible, open-source project management tool.", NAME),
    ("Plane Publish | Make your Plane boards public with one-click", NAME),
    ("Open-source project management tool to manage work items, cycles, and product roadmaps easily",
     "AMALA Agency project management"),
    ("Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
     "AMALA Agency project management"),
    ("Plane Publish is a customer feedback management tool built on top of plane.so",
     "AMALA Agency project management"),
    ('name="application-name" content="Plane"', 'name="application-name" content="%s"' % NAME),
    ('content="Plane"', 'content="%s"' % NAME),
]

css = open(os.path.join(BRAND, "brand.css")).read()
js = open(os.path.join(BRAND, "brand.js")).read()
INJECT = '<style id="amala-brand">%s</style><script id="amala-brand-js">%s</script>' % (css, js)

counts = {"icons": 0, "html": 0, "manifest": 0, "email": 0, "subjects": 0}


def walk():
    for root, dirs, files in os.walk("/"):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if root.startswith(BRAND):
            continue
        for f in files:
            yield root, f


def rewrite(path, fn):
    try:
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
    except (UnicodeDecodeError, OSError):
        return False
    out = fn(src)
    if out != src:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(out)
        return True
    return False


def looks_like_plane_app(path):
    try:
        with open(path, encoding="utf-8") as fh:
            head = fh.read(20000)
    except (UnicodeDecodeError, OSError):
        return False
    return "__reactRouterContext" in head or "Plane |" in head or "logo-spinner" in head


def brand_html(src):
    for a, b in TEXT:
        src = src.replace(a, b)
    if "amala-brand" not in src and "<head>" in src:
        src = src.replace("<head>", "<head>" + INJECT, 1)
    return src


def brand_manifest(src):
    return re.sub(r'("(?:short_)?name"\s*:\s*")Plane[^"]*(")', r"\1%s\2" % NAME, src)


EMAIL_LOGO = "https://projects.amala.agency/amala-email-logo.png"


def brand_email(src):
    src = re.sub(r'https://media\.docs\.plane\.so/logo/[^"\s)]+', EMAIL_LOGO, src)
    src = src.replace('alt="Plane"', 'alt="AMALA"')
    src = re.sub(r"Plane Software,?\s*Inc\.?", "AMALA Agency", src)
    # "Plane" as a word, but not plane.so URLs or plane-* identifiers
    return re.sub(r"(?<![\w./-])Plane(?!\w|-|\.so)", NAME, src)


SUBJECTS = [
    (" on Plane\"", " on %s\"" % NAME),
    ("Your unique Plane login code", "Your %s login code" % NAME),
    ("your Plane account", "your %s account" % NAME),
]


def brand_subjects(src):
    for a, b in SUBJECTS:
        src = src.replace(a, b)
    return src


for root, f in walk():
    path = os.path.join(root, f)
    is_static = "/assets" in root or "/public" in root or "/build" in root or "/client" in root or "/static" in root
    if is_static:
        for pat, repl in ICONS:
            if fnmatch.fnmatch(f, pat):
                shutil.copyfile(os.path.join(ASSETS, repl), path)
                counts["icons"] += 1
                break
    if f.endswith(".html") and "/templates/emails" in root:
        if rewrite(path, brand_email):
            counts["email"] += 1
    elif f.endswith(".html") and looks_like_plane_app(path):
        if rewrite(path, brand_html):
            counts["html"] += 1
            shutil.copyfile(os.path.join(ASSETS, "amala-email-logo.png"), os.path.join(root, "amala-email-logo.png"))
    elif f.endswith(".py") and "/bgtasks" in root:
        if rewrite(path, brand_subjects):
            counts["subjects"] += 1
    elif f in ("manifest.json", "site.webmanifest.json") or f.endswith(".webmanifest"):
        if rewrite(path, brand_manifest):
            counts["manifest"] += 1

print("AMALA branding applied:", counts)
if counts["icons"] == 0 or counts["html"] == 0:
    print("ERROR: Plane's build files weren't found where expected. Branding not applied.", file=sys.stderr)
    sys.exit(1)
