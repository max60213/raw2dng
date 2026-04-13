#include "dng_exceptions.h"
#include "dng_jxl.h"
#include "dng_image.h"
#include "dng_pixel_buffer.h"

#include <memory>

using dng_bmff_box_list = std::vector<std::shared_ptr<dng_bmff_box>>;

dng_jxl_decoder::~dng_jxl_decoder() = default;

void dng_jxl_decoder::Decode(dng_host &, dng_stream &) {
  ThrowProgramError("JPEG XL is disabled in the Adobe DNG wasm prototype.");
}

void dng_jxl_decoder::ProcessExifBox(dng_host &, const std::vector<uint8> &) {}
void dng_jxl_decoder::ProcessXMPBox(dng_host &, const std::vector<uint8> &) {}
void dng_jxl_decoder::ProcessBox(dng_host &, const dng_string &, const std::vector<uint8> &) {}

void EncodeJXL_Tile(dng_host &, dng_stream &, const dng_pixel_buffer &, const dng_jxl_color_space_info &, const dng_jxl_encode_settings &) {
  ThrowProgramError("JPEG XL is disabled in the Adobe DNG wasm prototype.");
}

void EncodeJXL_Tile(dng_host &, dng_stream &, const dng_image &, const dng_jxl_color_space_info &, const dng_jxl_encode_settings &) {
  ThrowProgramError("JPEG XL is disabled in the Adobe DNG wasm prototype.");
}

void EncodeJXL_Container(dng_host &, dng_stream &, const dng_image &, const dng_jxl_encode_settings &, const dng_jxl_color_space_info &, const dng_metadata *, const bool, const bool, const bool, const dng_bmff_box_list *) {
  ThrowProgramError("JPEG XL is disabled in the Adobe DNG wasm prototype.");
}

void EncodeJXL_Container(dng_host &, dng_stream &, const dng_pixel_buffer &, const dng_jxl_encode_settings &, const dng_jxl_color_space_info &, const dng_metadata *, const bool, const bool, const bool, const dng_bmff_box_list *) {
  ThrowProgramError("JPEG XL is disabled in the Adobe DNG wasm prototype.");
}

real32 JXLQualityToDistance(uint32) {
  return 0.0f;
}

dng_jxl_encode_settings *JXLQualityToSettings(uint32) {
  return new dng_jxl_encode_settings();
}

void PreviewColorSpaceToJXLEncoding(const PreviewColorSpaceEnum, const uint32, dng_jxl_color_space_info &) {}

bool SupportsJXL(const dng_image &) {
  return false;
}
