#!/usr/bin/env bash
# Usage:
#   ./tools/scripts/gen-secret.sh              # prints one 40-char secret
#   ./tools/scripts/gen-secret.sh CRON_SECRET  # prints KEY=<secret>
#
# Generates a cryptographically random, URL-safe secret using openssl.
# 30 random bytes → 40 base64url characters (no +, /, or = padding).

set -euo pipefail

SECRET=$(openssl rand -base64 30 | tr '+/' '-_' | tr -d '=')

if [[ $# -gt 0 ]]; then
  echo "${1}=${SECRET}"
else
  echo "$SECRET"
fi
