#!/usr/bin/env bash
# Regenerates all six app icon assets from the HTML sources in this folder,
# using headless Chrome as a pixel-exact rasterizer. Each source is a bare
# HTML page sized to the platform's exact required canvas; Chrome's
# --default-background-color=00000000 flag is what produces a true alpha
# channel for the layers that need one (foreground, monochrome, splash) —
# omit it and the page's own opaque background bakes in as true RGB with
# no alpha channel at all, which iOS requires for the main icon.
#
# Usage: bash scripts/icons/generate.sh
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
if [ ! -f "$CHROME" ]; then
  CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
fi
HERE_WIN="$(pwd -W 2>/dev/null || pwd)"
OUT_WIN="$(cd ../../assets && pwd -W 2>/dev/null || pwd)"

render() {
  local html="$1" size="$2" out="$3" transparent="$4"
  local extra=()
  if [ "$transparent" = "yes" ]; then extra=(--default-background-color=00000000); fi
  "$CHROME" --headless --disable-gpu --force-device-scale-factor=1 --hide-scrollbars \
    "${extra[@]}" --screenshot="$OUT_WIN/$out" --window-size="$size,$size" \
    "file://$HERE_WIN/$html"
  echo "wrote $OUT_WIN/$out"
}

render icon.html                 1024 icon.png                       no
render splash.html                1024 splash-icon.png                yes
render adaptive-foreground.html   512  android-icon-foreground.png    yes
render adaptive-background.html   512  android-icon-background.png    no
render adaptive-monochrome.html   432  android-icon-monochrome.png    yes
render favicon.html               48   favicon.png                    no

echo "Done. Run 'npx expo-doctor' to sanity-check the updated assets."
