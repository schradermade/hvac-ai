#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="sync-prod-d1"
source "$HOME/.dotfiles/bin/script-log.sh"

EXPORT_DIR="db/exports"
EXPORT_FILE="$EXPORT_DIR/hvacops_prod.sql"
LOCAL_DB_DIR=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"

log "Exporting prod D1 to $EXPORT_FILE"
mkdir -p "$EXPORT_DIR"
wrangler d1 export hvacops --remote --output "$EXPORT_FILE"

if [ ! -f "$EXPORT_FILE" ]; then
  echo "Export failed: $EXPORT_FILE not found"
  exit 1
fi

log "Make sure wrangler dev and DBeaver are stopped"
log "Removing local SQLite files"
rm -f "$LOCAL_DB_DIR"/*.sqlite*

log "Importing export into local D1"
wrangler d1 execute hvacops --local --file "$EXPORT_FILE"

log "Done. Reopen DBeaver and refresh."
