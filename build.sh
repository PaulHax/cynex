#!/usr/bin/env bash
set -euo pipefail

TAG="trajectories"
REPO="${GITHUB_REPOSITORY:-PaulHax/cynex}"
DIR="public/data/trajectories"
BASE_URL="https://github.com/$REPO/releases/download/$TAG"

mkdir -p "$DIR"

# Get list of assets from the release (using GitHub API, no gh CLI needed)
echo "Fetching asset list from '$TAG' release..."
API_URL="https://api.github.com/repos/$REPO/releases/tags/$TAG"
ASSETS=$(curl -fsSL "$API_URL" | python3 -c "import sys,json; [print(a['name']) for a in json.load(sys.stdin)['assets']]" 2>/dev/null || true)

if [ -z "$ASSETS" ]; then
  echo "Warning: no assets found on release '$TAG'. Building without trajectories."
  exit 0
fi

# Download each asset
for name in $ASSETS; do
  echo "Downloading $name..."
  curl -fsSL -L "$BASE_URL/$name" -o "$DIR/$name"
done

echo "Downloaded $(echo "$ASSETS" | wc -l) trajectory file(s) to $DIR/"
