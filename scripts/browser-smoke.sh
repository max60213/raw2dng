#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PWCLI="/Users/maxlin/.codex/skills/playwright/scripts/playwright_cli.sh"
SESSION="raw2dng-smoke"
HOST="127.0.0.1"
PORT="4173"
URL="http://${HOST}:${PORT}/"
FIXTURE="${1:-$ROOT_DIR/tests/fixtures/raw/canon-eos5d-sample.cr2}"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required" >&2
  exit 1
fi

if [ ! -f "$FIXTURE" ]; then
  echo "Fixture not found: $FIXTURE" >&2
  exit 1
fi

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  bash "$PWCLI" --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

(
  cd "$ROOT_DIR"
  npm run dev -- --host "$HOST" --port "$PORT"
) >/tmp/raw2dng-browser-smoke.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 30); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf "$URL" >/dev/null 2>&1; then
  echo "Dev server failed to start; see /tmp/raw2dng-browser-smoke.log" >&2
  exit 1
fi

bash "$PWCLI" --session "$SESSION" open "$URL"
bash "$PWCLI" --session "$SESSION" snapshot
bash "$PWCLI" --session "$SESSION" click e35
bash "$PWCLI" --session "$SESSION" upload "$FIXTURE"
bash "$PWCLI" --session "$SESSION" snapshot
