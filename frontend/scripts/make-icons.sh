#!/usr/bin/env bash
# Builds WordVault's PNG and ICO icons and iOS splash screens from its SVG
# icons. Needs rsvg-convert and ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."

rounded=src/assets/wordvault-icon.svg
square=icons/wordvault-icon-maskable.svg
# A plainer tile for favicons, where the card stack turns to mush.
small=icons/wordvault-icon-small.svg

# Android masks the maskable icons itself, and iOS rounds the corners of the
# apple-touch-icon, so those are square. Everything else gets the rounded one.
for size in 192 512; do
  rsvg-convert -w $size -h $size "$square" -o public/manifest-icon-$size.maskable.png
  rsvg-convert -w $size -h $size "$rounded" -o public/manifest-icon-$size.png
done
rsvg-convert -w 180 -h 180 "$square" -o pwa/apple-icon-180.png

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for size in 16 32; do
  rsvg-convert -w $size -h $size "$small" -o "$tmp/$size.png"
done
rsvg-convert -w 48 -h 48 "$rounded" -o "$tmp/48.png"
magick "$tmp/16.png" "$tmp/32.png" "$tmp/48.png" public/favicon.ico

# Splash screens: the icon at 40% of the short side, centered on white.
for f in pwa/apple-splash-*.jpg; do
  dims=${f#pwa/apple-splash-}
  dims=${dims%.jpg}
  w=${dims%-*}
  h=${dims#*-}
  icon=$(( (w < h ? w : h) * 2 / 5 ))
  rsvg-convert -w $icon -h $icon "$rounded" -o "$tmp/splash-icon.png"
  magick -size ${w}x${h} xc:white "$tmp/splash-icon.png" -gravity center \
    -composite -quality 90 "$f"
done
