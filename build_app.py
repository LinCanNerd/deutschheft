#!/usr/bin/env python3
"""Build the offline Deutschheft app into ./app from the same sources as the Claude artifact.

index.html is written for the artifact host, which supplies the <html>/<head> skeleton. This script wraps it in a
full document, swaps Google Fonts for local copies, and adds a web-app manifest and a service worker so the
folder works offline: opened from disk (file://) or served over http(s) and installed as a PWA.

Run it again after changing index.html, content.js, engine.js or app.js.
"""
import hashlib
import json
import pathlib
import re
import shutil
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "app"
FONT_DIR = ROOT / "assets" / "fonts"
ICON_DIR = ROOT / "assets" / "icons"
JS_FILES = ["content.js", "engine.js", "app.js"]
FONTS_URL = ("https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400"
             "&family=Caveat:wght@600;700&family=Jost:wght@400;500;600;700&display=swap")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# The artifact host's skeleton: charset, viewport and a small reset. The page's own CSS builds on it.
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="A1 German practice: spaced-repetition cards, explained grammar drills and weak-spot tracking.">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E2A26" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
"""
SW_REGISTER = """<script>
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  // a rebuilt app activates its new service worker right away; reload once so the new files are used
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register("sw.js");
}
</script>
"""


def fetch_fonts():
    """Download the latin subset of the three Google Fonts once into assets/fonts (it covers ä, ö, ü and ß)."""
    css_path = FONT_DIR / "fonts.css"
    if css_path.exists():
        return True
    try:
        css = urllib.request.urlopen(urllib.request.Request(FONTS_URL, headers={"User-Agent": UA}), timeout=20).read().decode()
        blocks = [b for subset, b in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S) if subset == "latin"]
        FONT_DIR.mkdir(parents=True, exist_ok=True)
        files, out = {}, []
        for block in blocks:
            url = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", block).group(1)
            if url not in files:
                name = hashlib.sha1(url.encode()).hexdigest()[:12] + ".woff2"
                (FONT_DIR / name).write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=20).read())
                files[url] = name
            out.append(block.replace(url, files[url]))
        css_path.write_text("\n".join(out) + "\n")
        return True
    except Exception as err:  # offline: keep the Google Fonts link; system fonts are the fallback
        print(f"fonts: couldn't download ({err}); the app will use Google Fonts when online")
        return False


def main():
    src = (ROOT / "index.html").read_text()
    head_part, body_part = src.split('<div id="app">', 1)
    body_part = '<div id="app">' + body_part
    head_part = head_part.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "icons").mkdir(parents=True)

    local_fonts = fetch_fonts()
    if local_fonts:
        head_part = re.sub(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts\.[^"]*"[^>]*>\n?', "", head_part)
        head_part = '<link rel="stylesheet" href="fonts/fonts.css">\n' + head_part
        shutil.copytree(FONT_DIR, OUT / "fonts")

    for name in ("icon-192.png", "icon-512.png", "icon-maskable-512.png"):
        shutil.copy(ICON_DIR / name, OUT / "icons" / name)
    for name in JS_FILES:
        shutil.copy(ROOT / name, OUT / name)

    html = HEAD + head_part.strip() + "\n</head>\n<body>\n" + body_part.strip() + "\n" + SW_REGISTER + "</body>\n</html>\n"
    (OUT / "index.html").write_text(html)

    manifest = {
        "name": "Deutschheft", "short_name": "Deutschheft", "description": "A1 German practice with explained grammar and spaced repetition.",
        "id": "./", "start_url": "./index.html", "scope": "./", "display": "standalone",
        "background_color": "#F1F3F7", "theme_color": "#FFFFFF", "categories": ["education"],
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (OUT / "manifest.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n")

    # Cache-first service worker; the cache name changes whenever any file changes, so a rebuild ships an update.
    files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file())
    digest = hashlib.sha1(b"".join((OUT / f).read_bytes() for f in files)).hexdigest()[:10]
    sw = f"""const CACHE = "deutschheft-{digest}";
const FILES = {json.dumps(["./"] + files)};
self.addEventListener("install", (e) => {{ e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); }});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((hit) => hit || fetch(e.request)));
}});
"""
    (OUT / "sw.js").write_text(sw)
    print(f"Built {OUT} ({len(files) + 1} files, fonts {'bundled' if local_fonts else 'from Google'}).")


if __name__ == "__main__":
    main()
