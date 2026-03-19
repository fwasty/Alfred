#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# Ensure we're on a branch
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  git checkout -b master
fi

# Commit any changes (if any)
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  git commit -m "Nightly backup ${TS}" >/dev/null
fi

# Push (will require credentials to be configured)
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
