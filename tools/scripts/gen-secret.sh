#!/usr/bin/env bash
# Usage:
#   ./tools/scripts/gen-secret.sh              # prints one 40-char secret
#   ./tools/scripts/gen-secret.sh CRON_SECRET  # prints KEY="<secret>"
#
# Generates a cryptographically random, URL-safe secret using openssl.
# 30 random bytes → 40 base64url characters (no +, /, or = padding).
# The raw secret value is always copied to the clipboard.

set -euo pipefail

SECRET=$(openssl rand -base64 30 | tr '+/' '-_' | tr -d '=')

if [[ $# -gt 0 ]]; then
  OUTPUT="${1}=\"${SECRET}\""
else
  OUTPUT="$SECRET"
fi

if command -v pbcopy &>/dev/null; then
  printf '%s' "$OUTPUT" | pbcopy
elif command -v xclip &>/dev/null; then
  printf '%s' "$OUTPUT" | xclip -selection clipboard
elif command -v xsel &>/dev/null; then
  printf '%s' "$OUTPUT" | xsel --clipboard --input
fi

echo "$OUTPUT"
