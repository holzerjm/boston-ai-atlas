#!/usr/bin/env bash
# Reliable alarm clock for the "Weekly events refresh" GitHub workflow.
#
# GitHub's own cron scheduler delivers this repo's Monday firings hours late
# or not at all (observed: 5-6h late on 2026-09-07, none by 9am on
# 2026-09-14). This script runs from a plain cron on the origin server and
# asks GitHub to start the workflow via workflow_dispatch. It always passes
# check_gate=true, so the workflow's gate still decides (past 7am Eastern?
# live file stale?) — the server cron and GitHub's crons can both fire
# without ever producing a double refresh.
#
# Needs a fine-grained personal access token with ONLY
#   Repository access: holzerjm/boston-ai-atlas
#   Permissions:       Actions → Read and write
# stored (mode 600) in $TOKEN_FILE. Nothing else on this box uses it.
#
# Install (as the forge user on the origin server):
#   cp scripts/trigger-weekly-events.sh ~/bin/ && chmod +x ~/bin/trigger-weekly-events.sh
#   crontab -e →  0 11 * * 1  ~/bin/trigger-weekly-events.sh >> ~/.local/log/weekly-events.log 2>&1
#                 0 12 * * 1  ~/bin/trigger-weekly-events.sh >> ~/.local/log/weekly-events.log 2>&1
#   (11:00 UTC = 7am EDT, 12:00 UTC = 7am EST; the gate skips whichever is wrong.)
set -euo pipefail

REPO="holzerjm/boston-ai-atlas"
WORKFLOW="weekly-events.yml"
TOKEN_FILE="${TOKEN_FILE:-$HOME/.config/boston-ai-atlas/github-token}"
ATTEMPTS="${ATTEMPTS:-3}"

log() { echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"; }

if [ ! -r "$TOKEN_FILE" ]; then
  log "ERROR: token file $TOKEN_FILE missing or unreadable — see header comment"; exit 1
fi
TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")

for i in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS --max-time 30 -X POST \
       -H "Authorization: Bearer $TOKEN" \
       -H "Accept: application/vnd.github+json" \
       -H "X-GitHub-Api-Version: 2022-11-28" \
       "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
       -d '{"ref":"main","inputs":{"check_gate":"true"}}'; then
    log "dispatched $WORKFLOW (attempt $i)"; exit 0
  fi
  log "dispatch attempt $i failed"; sleep 120
done
log "ERROR: all $ATTEMPTS attempts failed"; exit 1
