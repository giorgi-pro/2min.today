#!/usr/bin/env bash
# Usage:
#   ./tools/scripts/init-env.sh                        # copies apps/web/.env.example → apps/web/.env
#   ./tools/scripts/init-env.sh path/to/.env.example   # copies the given example file

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXAMPLE="${1:-$REPO_ROOT/apps/web/.env.example}"
TARGET="${EXAMPLE%.example}"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "error: example file not found: $EXAMPLE" >&2
  exit 1
fi

if [[ -f "$TARGET" ]]; then
  echo "error: $TARGET already exists — delete it first if you want to reset" >&2
  exit 1
fi

cp "$EXAMPLE" "$TARGET"
echo "created $TARGET"
