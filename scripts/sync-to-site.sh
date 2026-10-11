#!/usr/bin/env bash
# Copy the deployable atlas files into your website source tree,
# then deploy the site as usual (rsync).
#
# Usage: ./scripts/sync-to-site.sh /path/to/toa-site/ecosystem
set -euo pipefail

DEST="${1:?Usage: sync-to-site.sh /path/to/toa-site/ecosystem}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$DEST/data"
cp "$SRC/index.html" "$SRC/atlas-data.js" "$SRC/map-style-dark.json" "$DEST/"
cp "$SRC"/data/*.yml "$DEST/data/"

echo "✓ Synced index.html + atlas-data.js + data/*.yml + map-style-dark.json → $DEST"
echo "  Now rsync your site as usual. The atlas will be live at /ecosystem/"
