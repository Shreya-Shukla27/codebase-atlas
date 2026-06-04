#!/usr/bin/env bash
# Convert SVG diagrams to PNG using ImageMagick or Inkscape
set -euo pipefail
SVGS=("assets/diagrams/app-architecture.svg" "assets/diagrams/backend-data-flow.svg" "assets/diagrams/recruiter-architecture.svg")

if command -v magick >/dev/null 2>&1; then
  CONVERTER=magick
elif command -v inkscape >/dev/null 2>&1; then
  CONVERTER=inkscape
else
  echo "Install ImageMagick (magick) or Inkscape to run this script." >&2
  exit 2
fi

for svg in "${SVGS[@]}"; do
  if [[ ! -f "$svg" ]]; then
    echo "Skipping missing: $svg"
    continue
  fi
  png="${svg%.svg}.png"
  if [[ "$CONVERTER" == "magick" ]]; then
    magick convert "$svg" "$png"
  else
    inkscape --export-type=png --export-filename="$png" "$svg"
  fi
  echo "Generated $png"
done

echo "Done. Commit the PNG files if you want them included in the repo."
