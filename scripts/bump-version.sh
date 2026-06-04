#!/usr/bin/env bash
set -euo pipefail

# Print usage
usage() {
  echo "Usage: $0 [major | minor | patch]"
  echo "Defaults to 'patch' if no bump type is specified."
  exit 1
}

# Determine bump type
BUMP_TYPE="${1:-patch}"

if [[ "$BUMP_TYPE" != "major" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "patch" ]]; then
  echo "Error: Invalid bump type '$BUMP_TYPE'."
  usage
fi

# Ensure working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo "Error: Working directory has uncommitted changes. Please stash or commit them."
  exit 1
fi

# Ensure we are on main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Warning: You are not on the 'main' branch (current: $CURRENT_BRANCH)."
  read -p "Do you want to proceed anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "Bumping version ($BUMP_TYPE)..."
npm version "$BUMP_TYPE" -m "chore(release): bump version to %s"

echo "Success! Package version bumped and tag created locally."
echo "Run 'git push origin --follow-tags' to publish changes."
