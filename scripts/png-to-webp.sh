#!/usr/bin/env bash
# Convert every PNG in a directory tree to WebP (same basename), then delete
# the original PNG after successful conversion.
# Usage: bash scripts/png-to-webp.sh <dir>
set -euo pipefail
dir="${1:?usage: png-to-webp.sh <dir>}"
shopt -s nullglob globstar

count=0
for png in "$dir"/**/*.png; do
  webp="${png%.png}.webp"
  cwebp -quiet -q 90 "$png" -o "$webp"
  rm -f "$png"
  printf '  %s -> %s\n' "${png##*/}" "${webp##*/}"
  count=$((count + 1))
done
echo "Converted and removed $count PNG(s) under $dir (recursive)."