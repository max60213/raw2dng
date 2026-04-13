#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
PKG_DIR="$ROOT_DIR/packages/adobe-dng-wasm"
SDK_ROOT="$PKG_DIR/vendor/dng_sdk_1_7_1"
SDK_SRC="$SDK_ROOT/dng_sdk/source"
OUTPUT_DIR="$PKG_DIR/src/generated"
BRIDGE="$PKG_DIR/cpp/bridge.cpp"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc is required but not installed." >&2
  exit 1
fi

if [ ! -d "$SDK_SRC" ]; then
  echo "Adobe DNG SDK sources are missing at $SDK_SRC" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

COMMON_FLAGS=(
  -O2
  -std=c++17
  -sMODULARIZE=1
  -sEXPORT_ES6=1
  -sENVIRONMENT=web,worker
  -sALLOW_MEMORY_GROWTH=1
  -sFILESYSTEM=0
  -sINITIAL_MEMORY=134217728
  -DqWeb=1
  -DqDNGUseXMP=0
  -DqDNGValidateTarget=0
  -DqDNGUseLibJPEG=0
  "-sEXPORTED_RUNTIME_METHODS=['ccall','UTF8ToString','HEAPU8','HEAP32','HEAPF64']"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_adobe_dng_create','_adobe_dng_destroy','_adobe_dng_encode_raw','_adobe_dng_last_output_ptr','_adobe_dng_last_output_size','_adobe_dng_last_error']"
  -I"$SDK_SRC"
  -I"$SDK_ROOT/libjxl/libjxl/lib/include"
  -sUSE_ZLIB=1
)

SOURCE_FILES=()
while IFS= read -r file; do
  case "$file" in
    *"/dng_validate.cpp"|*"/dng_jxl.cpp"|*"/dng_xmp.cpp"|*"/dng_xmp_sdk.cpp"|*"/dng_update_meta.cpp"|*"/dng_render.cpp")
      continue
      ;;
  esac
  SOURCE_FILES+=("$file")
done < <(find "$SDK_SRC" -maxdepth 1 -name '*.cpp' | sort)

SOURCE_FILES+=("$BRIDGE" "$PKG_DIR/cpp/dng_jxl_stub.cpp")

emcc \
  "${SOURCE_FILES[@]}" \
  "${COMMON_FLAGS[@]}" \
  -o "$OUTPUT_DIR/adobeDng.js"

echo "Built:"
echo "  $OUTPUT_DIR/adobeDng.js"
echo "  $OUTPUT_DIR/adobeDng.wasm"
