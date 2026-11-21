#!/usr/bin/env bash
set -e
TASK_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$TASK_ROOT"
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin/node; do
    if [ -x "$candidate" ]; then export PATH="$(dirname -- "$candidate"):$PATH"; fi
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 22.12+ and run npm ci --ignore-scripts --legacy-peer-deps.' >&2
  exit 1
fi
exec node scripts/launcher.mjs
