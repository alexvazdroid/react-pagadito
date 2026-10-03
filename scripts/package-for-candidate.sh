#!/usr/bin/env bash
# Produces a zip of everything a candidate should receive, excluding evaluator-only
# material, git history, and build artifacts. See evaluator/PACKAGING.md.
set -euo pipefail

cd "$(dirname "$0")/.."

OUTPUT="paytest-mobile-candidate.zip"
rm -f "$OUTPUT"

zip -r "$OUTPUT" . \
  -x "evaluator/*" \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".expo/*" \
  -x "dist/*" \
  -x "*.tsbuildinfo" \
  -x "android/*" \
  -x "ios/*" \
  -x ".DS_Store" \
  -x "$OUTPUT"

echo "Wrote $OUTPUT"
echo "Verifying no evaluator/ content leaked in:"
if unzip -l "$OUTPUT" | grep -q "evaluator/"; then
  echo "LEAK DETECTED: evaluator/ content is in the zip. Do not send this file." >&2
  exit 1
else
  echo "OK — evaluator/ not present."
fi
