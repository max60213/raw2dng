#include <cmath>
#include <cstdint>
#include <cstring>
#include <memory>
#include <unordered_map>

#include "libraw/libraw.h"

namespace {

using Handle = int32_t;

struct Context {
  std::unique_ptr<LibRaw> processor;
  libraw_processed_image_t *processed = nullptr;
};

std::unordered_map<Handle, Context> g_instances;
Handle g_nextHandle = 1;

Context *lookup(Handle handle) {
  const auto it = g_instances.find(handle);
  if (it == g_instances.end()) {
    return nullptr;
  }
  return &it->second;
}

LibRaw *lookupProcessor(Handle handle) {
  Context *context = lookup(handle);
  return context ? context->processor.get() : nullptr;
}

void clear_processed(Context *context) {
  if (context && context->processed) {
    LibRaw::dcraw_clear_mem(context->processed);
    context->processed = nullptr;
  }
}

int derive_bit_depth(LibRaw *processor) {
  if (!processor) {
    return 0;
  }

  const unsigned raw_bps = processor->imgdata.color.raw_bps;
  if (raw_bps > 0 && raw_bps <= 16) {
    return static_cast<int>(raw_bps);
  }

  const unsigned maximum = processor->imgdata.color.maximum;
  if (maximum > 0) {
    return static_cast<int>(std::ceil(std::log2(static_cast<double>(maximum) + 1.0)));
  }

  return 16;
}

const char *safe_text(const char *value) {
  return value ? value : "";
}

void configure_linear_output(LibRaw *processor) {
  if (!processor) {
    return;
  }

  processor->imgdata.params.output_bps = 16;
  processor->imgdata.params.output_color = LIBRAW_COLORSPACE_sRGB;
  processor->imgdata.params.use_camera_wb = 1;
  processor->imgdata.params.use_auto_wb = 0;
  processor->imgdata.params.no_auto_bright = 0;
  processor->imgdata.params.no_auto_scale = 0;
  processor->imgdata.params.use_camera_matrix = 1;
  processor->imgdata.params.gamm[0] = 0.45;
  processor->imgdata.params.gamm[1] = 4.5;
  processor->imgdata.params.bright = 1.0f;
}

} // namespace

extern "C" {

int raw2dng_create() {
  const Handle handle = g_nextHandle++;
  g_instances.emplace(handle, Context{std::make_unique<LibRaw>(0), nullptr});
  return handle;
}

void raw2dng_destroy(int handle) {
  Context *context = lookup(handle);
  if (context) {
    clear_processed(context);
  }
  g_instances.erase(handle);
}

int raw2dng_open_buffer(int handle, const uint8_t *buffer, int size) {
  Context *context = lookup(handle);
  if (!context || !context->processor) {
    return EINVAL;
  }
  clear_processed(context);
  return context->processor->open_buffer(buffer, static_cast<size_t>(size));
}

int raw2dng_unpack(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor) {
    return EINVAL;
  }
  return processor->unpack();
}

int raw2dng_process_linear(int handle) {
  Context *context = lookup(handle);
  if (!context || !context->processor) {
    return EINVAL;
  }

  clear_processed(context);
  configure_linear_output(context->processor.get());

  const int processStatus = context->processor->dcraw_process();
  if (processStatus != LIBRAW_SUCCESS) {
    return processStatus;
  }

  int errcode = 0;
  context->processed = context->processor->dcraw_make_mem_image(&errcode);
  if (!context->processed || errcode != LIBRAW_SUCCESS) {
    clear_processed(context);
    return errcode == 0 ? LIBRAW_UNSPECIFIED_ERROR : errcode;
  }

  return LIBRAW_SUCCESS;
}

void raw2dng_recycle(int handle) {
  Context *context = lookup(handle);
  if (!context || !context->processor) {
    return;
  }
  clear_processed(context);
  context->processor->recycle();
}

int raw2dng_get_raw_width(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.raw_width : 0;
}

int raw2dng_get_raw_height(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.raw_height : 0;
}

int raw2dng_get_visible_width(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.width : 0;
}

int raw2dng_get_visible_height(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.height : 0;
}

int raw2dng_get_top_margin(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.top_margin : 0;
}

int raw2dng_get_left_margin(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.left_margin : 0;
}

int raw2dng_get_flip(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? processor->imgdata.sizes.flip : 0;
}

int raw2dng_get_bit_depth(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return derive_bit_depth(processor);
}

int raw2dng_get_black_level(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? static_cast<int>(processor->imgdata.color.black) : 0;
}

int raw2dng_get_white_level(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? static_cast<int>(processor->imgdata.color.maximum) : 0;
}

int raw2dng_get_calibration_illuminant(int handle, int index) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || index < 0 || index > 1) {
    return 0;
  }
  return processor->imgdata.color.dng_color[index].illuminant;
}

float raw2dng_get_dng_color_matrix(int handle, int matrixIndex, int row, int column) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || matrixIndex < 0 || matrixIndex > 1 || row < 0 || row > 2 || column < 0 || column > 2) {
    return 0.0f;
  }
  return processor->imgdata.color.dng_color[matrixIndex].colormatrix[row][column];
}

float raw2dng_get_forward_matrix(int handle, int matrixIndex, int row, int column) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || matrixIndex < 0 || matrixIndex > 1 || row < 0 || row > 2 || column < 0 || column > 2) {
    return 0.0f;
  }
  return processor->imgdata.color.dng_color[matrixIndex].forwardmatrix[row][column];
}

float raw2dng_get_camera_calibration(int handle, int matrixIndex, int row, int column) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || matrixIndex < 0 || matrixIndex > 1 || row < 0 || row > 2 || column < 0 || column > 2) {
    return 0.0f;
  }
  return processor->imgdata.color.dng_color[matrixIndex].calibration[row][column];
}

float raw2dng_get_analog_balance(int handle, int index) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || index < 0 || index > 2) {
    return 0.0f;
  }
  return processor->imgdata.color.dng_levels.analogbalance[index];
}

float raw2dng_get_baseline_exposure(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor) {
    return 0.0f;
  }
  return processor->imgdata.color.dng_levels.baseline_exposure;
}

int raw2dng_get_opcode3_len(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor) {
    return 0;
  }
  return static_cast<int>(processor->imgdata.color.dng_levels.rawopcodes[2].len);
}

int raw2dng_get_opcode3_ptr(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || !processor->imgdata.color.dng_levels.rawopcodes[2].data) {
    return 0;
  }
  return static_cast<int>(reinterpret_cast<uintptr_t>(processor->imgdata.color.dng_levels.rawopcodes[2].data));
}

float raw2dng_get_cam_mul(int handle, int index) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || index < 0 || index > 3) {
    return 0.0f;
  }
  return processor->imgdata.color.cam_mul[index];
}

float raw2dng_get_rgb_cam(int handle, int row, int column) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || row < 0 || row > 2 || column < 0 || column > 3) {
    return 0.0f;
  }
  return processor->imgdata.color.rgb_cam[row][column];
}

int raw2dng_get_cfa(int handle, int row, int column) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor) {
    return 0;
  }
  return processor->COLOR(row, column);
}

int raw2dng_get_raw_image_ptr(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor || !processor->imgdata.rawdata.raw_image) {
    return 0;
  }
  return static_cast<int>(reinterpret_cast<uintptr_t>(processor->imgdata.rawdata.raw_image));
}

int raw2dng_get_raw_image_count(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  if (!processor) {
    return 0;
  }
  return processor->imgdata.sizes.raw_width * processor->imgdata.sizes.raw_height;
}

int raw2dng_get_processed_width(int handle) {
  Context *context = lookup(handle);
  return (context && context->processed) ? context->processed->width : 0;
}

int raw2dng_get_processed_height(int handle) {
  Context *context = lookup(handle);
  return (context && context->processed) ? context->processed->height : 0;
}

int raw2dng_get_processed_colors(int handle) {
  Context *context = lookup(handle);
  return (context && context->processed) ? context->processed->colors : 0;
}

int raw2dng_get_processed_bits(int handle) {
  Context *context = lookup(handle);
  return (context && context->processed) ? context->processed->bits : 0;
}

int raw2dng_get_processed_data_ptr(int handle) {
  Context *context = lookup(handle);
  if (!context || !context->processed) {
    return 0;
  }
  return static_cast<int>(reinterpret_cast<uintptr_t>(context->processed->data));
}

int raw2dng_get_processed_data_size(int handle) {
  Context *context = lookup(handle);
  return (context && context->processed) ? static_cast<int>(context->processed->data_size) : 0;
}

const char *raw2dng_get_make(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? safe_text(processor->imgdata.idata.make) : "";
}

const char *raw2dng_get_model(int handle) {
  LibRaw *processor = lookupProcessor(handle);
  return processor ? safe_text(processor->imgdata.idata.model) : "";
}

const char *raw2dng_strerror(int errorCode) {
  return libraw_strerror(errorCode);
}

}
