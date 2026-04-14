#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
LIBRAW_DIR="$ROOT_DIR/packages/libraw-wasm/cpp/libraw"
OUTPUT_DIR="$ROOT_DIR/packages/libraw-wasm/src/generated"
BRIDGE="$ROOT_DIR/packages/libraw-wasm/cpp/bridge.cpp"
POST_JS="$ROOT_DIR/packages/libraw-wasm/cpp/post.js"

COMMON_FLAGS=(
  -O3
  -sMODULARIZE=1
  -sEXPORT_ES6=1
  -sENVIRONMENT=web,worker
  -sALLOW_MEMORY_GROWTH=1
  -sFILESYSTEM=0
  -sINITIAL_MEMORY=67108864
  "-sEXPORTED_RUNTIME_METHODS=['ccall','UTF8ToString']"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_raw2dng_create','_raw2dng_destroy','_raw2dng_open_buffer','_raw2dng_unpack','_raw2dng_process_linear','_raw2dng_extract_thumbnail','_raw2dng_recycle','_raw2dng_get_raw_width','_raw2dng_get_raw_height','_raw2dng_get_iwidth','_raw2dng_get_iheight','_raw2dng_get_visible_width','_raw2dng_get_visible_height','_raw2dng_get_raw_inset_crop','_raw2dng_get_top_margin','_raw2dng_get_left_margin','_raw2dng_get_flip','_raw2dng_get_bit_depth','_raw2dng_get_black_level','_raw2dng_get_dng_whitelevel','_raw2dng_get_default_crop','_raw2dng_get_linear_max','_raw2dng_get_white_level','_raw2dng_get_dng_cblack','_raw2dng_get_cam_mul','_raw2dng_get_cmatrix','_raw2dng_get_cam_xyz','_raw2dng_get_rgb_cam','_raw2dng_get_dng_color_matrix','_raw2dng_get_forward_matrix','_raw2dng_get_camera_calibration','_raw2dng_get_calibration_illuminant','_raw2dng_get_analog_balance','_raw2dng_get_baseline_exposure','_raw2dng_get_opcode3_len','_raw2dng_get_opcode3_ptr','_raw2dng_get_cfa','_raw2dng_get_raw_image_ptr','_raw2dng_get_raw_image_count','_raw2dng_get_processed_width','_raw2dng_get_processed_height','_raw2dng_get_processed_colors','_raw2dng_get_processed_bits','_raw2dng_get_processed_data_ptr','_raw2dng_get_processed_data_size','_raw2dng_get_thumb_type','_raw2dng_get_thumb_width','_raw2dng_get_thumb_height','_raw2dng_get_thumb_flip','_raw2dng_get_thumb_data_ptr','_raw2dng_get_thumb_data_size','_raw2dng_get_make','_raw2dng_get_model','_raw2dng_strerror']"
  -Wno-macro-redefined
  -I"$LIBRAW_DIR"
  -I"$LIBRAW_DIR/libraw"
  -DNO_JASPER
  -DLIBRAW_NODLL
  --post-js "$POST_JS"
)

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc is required but not installed."
  exit 1
fi

if [ ! -d "$LIBRAW_DIR" ]; then
  echo "LibRaw sources are missing at $LIBRAW_DIR"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

SOURCE_FILES=()
while IFS= read -r file; do
  case "$file" in
    *"/src/postprocessing/postprocessing_ph.cpp")
      continue
      ;;
  esac
  SOURCE_FILES+=("$file")
done < <(
  find \
    "$LIBRAW_DIR/src/decoders" \
    "$LIBRAW_DIR/src/decompressors" \
    "$LIBRAW_DIR/src/demosaic" \
    "$LIBRAW_DIR/src/metadata" \
    "$LIBRAW_DIR/src/postprocessing" \
    "$LIBRAW_DIR/src/tables" \
    "$LIBRAW_DIR/src/utils" \
    "$LIBRAW_DIR/src/x3f" \
    -name '*.cpp' | sort
)

SOURCE_FILES+=(
  "$LIBRAW_DIR/src/libraw_c_api.cpp"
  "$LIBRAW_DIR/src/libraw_datastream.cpp"
  "$LIBRAW_DIR/src/preprocessing/ext_preprocess.cpp"
  "$LIBRAW_DIR/src/preprocessing/raw2image.cpp"
  "$LIBRAW_DIR/src/preprocessing/subtract_black.cpp"
  "$LIBRAW_DIR/src/write/file_write.cpp"
  "$LIBRAW_DIR/src/write/tiff_writer.cpp"
  "$BRIDGE"
)

emcc \
  "${SOURCE_FILES[@]}" \
  "${COMMON_FLAGS[@]}" \
  -o "$OUTPUT_DIR/libraw.js"

echo "Built:"
echo "  $OUTPUT_DIR/libraw.js"
echo "  $OUTPUT_DIR/libraw.wasm"
