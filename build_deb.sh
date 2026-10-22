#!/usr/bin/env bash
# Build dist/deutschheft_<version>_all.deb, the offline Deutschheft app for Debian and Ubuntu.
# Usage: ./build_deb.sh [version]        Install with: sudo apt install ./dist/deutschheft_<version>_all.deb
# Maintainer field: set DEBFULLNAME / DEBEMAIL to override.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG=deutschheft
VERSION="${1:-1.0.0}"
MAINTAINER="${DEBFULLNAME:-Deutschheft} <${DEBEMAIL:-lincanecdl@gmail.com}>"
STAGE="$DIR/build/${PKG}_${VERSION}_all"
OUT="$DIR/dist/${PKG}_${VERSION}_all.deb"
WMCLASS="127.0.0.1__index.html"   # what Chrome names an --app window for this URL; lets the dock show our icon

python3 "$DIR/build_app.py"

rm -rf "$STAGE"
mkdir -p "$STAGE/DEBIAN" "$STAGE/usr/bin" "$STAGE/usr/share/$PKG" "$STAGE/usr/share/applications" "$STAGE/usr/share/doc/$PKG" "$DIR/dist"
cp -r "$DIR/app" "$STAGE/usr/share/$PKG/app"
cp "$DIR/serve_app.py" "$STAGE/usr/share/$PKG/serve_app.py"

cat > "$STAGE/usr/bin/$PKG" <<'EOF'
#!/bin/sh
# Deutschheft: serve the app on 127.0.0.1:47613 (the server quits after a minute idle), then open it in an app window.
for b in google-chrome-stable google-chrome chromium chromium-browser microsoft-edge-stable microsoft-edge brave-browser; do
  if command -v "$b" >/dev/null 2>&1; then BROWSER="$b"; break; fi
done
if [ -z "${BROWSER:-}" ]; then
  msg="Deutschheft needs Google Chrome, Chromium, Microsoft Edge or Brave."
  command -v notify-send >/dev/null 2>&1 && notify-send "Deutschheft" "$msg"
  echo "$msg" >&2
  exit 1
fi
python3 /usr/share/deutschheft/serve_app.py --daemon || true
exec "$BROWSER" --app="http://127.0.0.1:47613/index.html" "$@"
EOF

cat > "$STAGE/usr/share/applications/$PKG.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Deutschheft
GenericName=German practice
Comment=A1 German with explained grammar and spaced repetition
Exec=$PKG
Icon=$PKG
Terminal=false
Categories=Education;Languages;
Keywords=German;Deutsch;language;vocabulary;flashcards;grammar;
StartupWMClass=$WMCLASS
EOF

python3 - "$DIR/assets/icons/icon-512.png" "$STAGE/usr/share/icons/hicolor" <<'EOF'
import pathlib, sys
from PIL import Image
src, dest = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
for size in (48, 64, 128, 192, 256, 512):
    d = dest / f"{size}x{size}" / "apps"
    d.mkdir(parents=True, exist_ok=True)
    Image.open(src).resize((size, size), Image.LANCZOS).save(d / "deutschheft.png", optimize=True)
EOF

cat > "$STAGE/usr/share/doc/$PKG/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: Deutschheft

Files: *
Copyright: $(date +%Y) $MAINTAINER
License: other
 All rights reserved by the author.

Files: usr/share/deutschheft/app/fonts/*
Copyright: The Atkinson Hyperlegible, Caveat and Jost authors
License: OFL-1.1
 SIL Open Font License 1.1, see https://openfontlicense.org
EOF
printf '%s (%s) unstable; urgency=low\n\n  * Offline release of Deutschheft.\n\n -- %s  %s\n' \
  "$PKG" "$VERSION" "$MAINTAINER" "$(date -R)" | gzip -9n > "$STAGE/usr/share/doc/$PKG/changelog.gz"

find "$STAGE" -type d -exec chmod 755 {} +
find "$STAGE" -type f -exec chmod 644 {} +
chmod 755 "$STAGE/usr/bin/$PKG" "$STAGE/usr/share/$PKG/serve_app.py"

cat > "$STAGE/DEBIAN/control" <<EOF
Package: $PKG
Version: $VERSION
Section: education
Priority: optional
Architecture: all
Depends: python3 (>= 3.7), google-chrome-stable | chromium | chromium-browser | microsoft-edge-stable | brave-browser
Installed-Size: $(du -sk --exclude=DEBIAN "$STAGE" | cut -f1)
Maintainer: $MAINTAINER
Description: A1 German course with spaced repetition and explained grammar
 Deutschheft teaches beginner German (CEFR level A1) in 11 units: short
 lessons, about 380 words and phrases, and 23 grammar skills drilled with
 freshly generated exercises. Every answer comes with an explanation.
 Cards follow a spaced-repetition schedule, and grammar points you get
 wrong become weak spots with their own drills.
 .
 The app runs offline in a Chromium-based browser's app window and keeps
 your progress on this computer, optionally in a JSON save file you choose.
EOF
(cd "$STAGE" && find usr -type f -exec md5sum {} + | sort -k2 > DEBIAN/md5sums)
chmod 644 "$STAGE/DEBIAN/control" "$STAGE/DEBIAN/md5sums"

dpkg-deb --root-owner-group -Zxz --build "$STAGE" "$OUT" >/dev/null
echo "Built $OUT"
echo "Install:   sudo apt install $OUT"
echo "Uninstall: sudo apt remove $PKG"
