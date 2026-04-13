#!/usr/bin/env bash
set -euo pipefail

TAG="trajectories"
DIR="public/data/trajectories"

# Collect files to upload: either named args or all JSONs in the directory
if [ $# -gt 0 ]; then
  FILES=("$@")
else
  FILES=("$DIR"/*.json)
fi

# Filter to existing files, exclude manifest
UPLOAD_FILES=()
for f in "${FILES[@]}"; do
  base=$(basename "$f")
  if [ "$base" = "manifest.json" ]; then continue; fi
  if [ ! -f "$f" ]; then
    echo "Warning: $f not found, skipping"
    continue
  fi
  UPLOAD_FILES+=("$f")
done

if [ ${#UPLOAD_FILES[@]} -eq 0 ]; then
  echo "Error: no trajectory files to upload"
  exit 1
fi

# Create the release if it doesn't exist
if ! gh release view "$TAG" &>/dev/null; then
  gh release create "$TAG" --title "Trajectories" --notes "Auto-managed release for trajectory data"
fi

# Upload each file (overwrite if exists)
for f in "${UPLOAD_FILES[@]}"; do
  echo "Uploading $(basename "$f")..."
  gh release upload "$TAG" "$f" --clobber
done

echo ""
echo "Done. ${#UPLOAD_FILES[@]} file(s) uploaded to release '$TAG'."
echo "Assets:"
gh release view "$TAG" --json assets --jq '.assets[].name'
