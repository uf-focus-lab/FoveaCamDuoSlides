#!/usr/bin/env bash
# Package dist/ into a single self-contained portable executable using redbean
# (https://redbean.dev). The output runs natively on Windows, Linux, and macOS
# (x86_64 + arm64) with zero runtime dependencies: double-click / run it and it
# serves the deck at http://localhost:8080, opening the browser automatically.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
OUT="$ROOT/foveacam-slides.com"
# Pinned build from Cosmopolitan's official binary distribution
# (redbean.dev currently has an expired TLS certificate).
REDBEAN_VERSION="4.0.2"
REDBEAN_URL="https://cosmo.zip/pub/cosmos/v/${REDBEAN_VERSION}/bin/redbean"
CACHE="$ROOT/node_modules/.cache/redbean/redbean-${REDBEAN_VERSION}.com"

if [ ! -f "$DIST/index.html" ]; then
  echo "error: $DIST/index.html not found — run 'pnpm build' first" >&2
  exit 1
fi

if [ ! -f "$CACHE" ]; then
  echo "Downloading redbean ${REDBEAN_VERSION}..."
  mkdir -p "$(dirname "$CACHE")"
  curl -fSL -o "$CACHE.tmp" "$REDBEAN_URL"
  mv "$CACHE.tmp" "$CACHE"
fi

cp "$CACHE" "$OUT"

# Stage redbean config files that must live at the zip root.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# History-mode SPA: paths without a file extension that don't match an asset
# (e.g. deep links like /12) fall back to index.html. Extension-bearing misses
# still 404 via default routing.
cat > "$STAGE/.init.lua" <<'LUA'
function OnHttpRequest()
  local path = GetPath()
  if GetAssetMode(path) == nil and not string.match(path, "%.[A-Za-z0-9]+$") then
    ServeAsset("/index.html")
  else
    Route()
  end
end

if not os.getenv("REDBEAN_NO_BROWSER") then
  pcall(LaunchBrowser, "/")
end
LUA

(cd "$STAGE" && zip -q "$OUT" .init.lua)
(cd "$DIST" && zip -qr "$OUT" .)
chmod +x "$OUT"

echo "Created $(basename "$OUT") ($(du -h "$OUT" | cut -f1))"
echo "Run it on any OS to serve the deck at http://localhost:8080"
