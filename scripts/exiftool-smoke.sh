#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_NAME="${1:-canon-eos5d-sample.cr2}"
OUTPUT_NAME="${2:-${SOURCE_NAME%.*}.dng}"
OUTPUT_PATH="$ROOT_DIR/tests/expected/$OUTPUT_NAME"

if ! command -v exiftool >/dev/null 2>&1; then
  echo "exiftool is required for this smoke check" >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run inspect:roundtrip -- "$SOURCE_NAME" "$OUTPUT_NAME" >/tmp/raw2dng-exiftool-smoke.json
exiftool "$OUTPUT_PATH" | rg 'File Type|Image Width|Image Height|Bits Per Sample|Camera Model Name|CFA Pattern|Color Matrix 1|As Shot Neutral|Active Area'
