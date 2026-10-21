#!/usr/bin/env bash
# Usage: ./update-image-tag.sh <image-tag> [values-file]
# Run inside a clone of hrms-gitops (from a Jenkins stage after "Push Image to Docker Hub")
set -euo pipefail
TAG="${1:?image tag required}"
FILE="${2:-hrms/values-dev.yaml}"

sed -i "s|^\(  tag:\).*|\1 \"${TAG}\"|" "$FILE"

git config user.name  "jenkins"
git config user.email "jenkins@local"
git add "$FILE"
git diff --cached --quiet && { echo "No change"; exit 0; }
git commit -m "ci: update hrms image to ${TAG}"
git push origin HEAD:main
