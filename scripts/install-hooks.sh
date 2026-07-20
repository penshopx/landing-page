#!/usr/bin/env bash
# Install Gustafta git hooks into .git/hooks/.
# Run once after every fresh clone: bash scripts/install-hooks.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [[ ! -d "$HOOKS_SRC" ]]; then
  echo "Error: hook sources not found at $HOOKS_SRC" >&2
  exit 1
fi

for HOOK in "$HOOKS_SRC"/*; do
  NAME="$(basename "$HOOK")"
  DEST="$HOOKS_DIR/$NAME"
  cp "$HOOK" "$DEST"
  chmod +x "$DEST"
  echo "Installed: .git/hooks/$NAME"
done

echo ""
echo "✔  Git hooks installed. Secrets will now be blocked before every commit."
