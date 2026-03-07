#!/usr/bin/env bash
# Copies desktop baseline screenshots from the Playwright snapshot directory
# to packages/mcp/screenshots/ for use by the MCP preview_component tool.
#
# Run after: pnpm test:e2e --update-snapshots

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$E2E_DIR/../.." && pwd)"

SCREENSHOT_SRC="$E2E_DIR/tests/__screenshots__/visual.spec.ts"
MCP_DEST="$REPO_ROOT/packages/mcp/screenshots"

if [ ! -d "$SCREENSHOT_SRC" ]; then
  echo "Error: No baseline screenshots found at $SCREENSHOT_SRC"
  echo "Run 'pnpm test:e2e --update-snapshots' first."
  exit 1
fi

mkdir -p "$MCP_DEST"

# Copy only desktop content-type screenshots (not home page or mobile)
count=0
for f in "$SCREENSHOT_SRC"/*-desktop.png; do
  [ -f "$f" ] || continue
  basename="$(basename "$f")"
  # Skip home page — only content type previews
  if [ "$basename" = "home-desktop.png" ]; then
    continue
  fi
  cp "$f" "$MCP_DEST/$basename"
  count=$((count + 1))
done

echo "Synced $count desktop screenshots to $MCP_DEST"
