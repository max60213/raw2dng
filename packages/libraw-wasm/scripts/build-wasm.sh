#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
LIBRAW_DIR="$ROOT_DIR/packages/libraw-wasm/cpp/libraw"
OUTPUT_DIR="$ROOT_DIR/packages/libraw-wasm/src/generated"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc is required but not installed."
  exit 1
fi

if [ ! -d "$LIBRAW_DIR" ]; then
  echo "LibRaw sources are missing at $LIBRAW_DIR"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Scaffold only: add bridge.cpp and exact emcc flags for your vendored LibRaw version."
echo "Expected outputs:"
echo "  $OUTPUT_DIR/libraw.js"
echo "  $OUTPUT_DIR/libraw.wasm"
