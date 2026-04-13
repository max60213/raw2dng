#include <cstdint>
#include <cstring>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "dng_camera_profile.h"
#include "dng_exceptions.h"
#include "dng_host.h"
#include "dng_image_writer.h"
#include "dng_matrix.h"
#include "dng_memory_stream.h"
#include "dng_negative.h"
#include "dng_orientation.h"
#include "dng_pixel_buffer.h"
#include "dng_rect.h"
#include "dng_simple_image.h"
#include "dng_tag_types.h"
#include "dng_tag_values.h"

namespace {

using Handle = int32_t;

struct Context {
  std::vector<uint8_t> output;
  std::string lastError;
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

void set_error(Context *context, const std::string &message) {
  if (context) {
    context->lastError = message;
  }
}

uint32_t derive_bayer_phase(const int32_t *cfaPattern) {
  if (!cfaPattern) {
    return 1;
  }

  if (cfaPattern[0] == 0 && cfaPattern[1] == 1 && cfaPattern[2] == 1 && cfaPattern[3] == 2) {
    return 1; // RGGB
  }
  if (cfaPattern[0] == 1 && cfaPattern[1] == 0 && cfaPattern[2] == 2 && cfaPattern[3] == 1) {
    return 0; // GRBG
  }
  if (cfaPattern[0] == 2 && cfaPattern[1] == 1 && cfaPattern[2] == 1 && cfaPattern[3] == 0) {
    return 2; // BGGR
  }
  if (cfaPattern[0] == 1 && cfaPattern[1] == 2 && cfaPattern[2] == 0 && cfaPattern[3] == 1) {
    return 3; // GBRG
  }

  return 1;
}

dng_matrix matrix_from_array(const double *values, uint32_t rows, uint32_t cols) {
  dng_matrix matrix(rows, cols);
  if (!values) {
    matrix.SetIdentity(rows);
    return matrix;
  }
  for (uint32_t row = 0; row < rows; ++row) {
    for (uint32_t col = 0; col < cols; ++col) {
      matrix[row][col] = values[row * cols + col];
    }
  }
  return matrix;
}

dng_vector vector_from_array(const double *values, uint32_t count) {
  dng_vector vector(count);
  for (uint32_t index = 0; index < count; ++index) {
    vector[index] = values ? values[index] : 1.0;
  }
  return vector;
}

void attach_profile(dng_negative &negative,
                    const char *cameraName,
                    const double *colorMatrix1,
                    const double *colorMatrix2,
                    const double *forwardMatrix1,
                    const double *forwardMatrix2,
                    int32_t calibrationIlluminant1,
                    int32_t calibrationIlluminant2) {
  AutoPtr<dng_camera_profile> profile(new dng_camera_profile());
  profile->SetName("raw2dng Adobe DNG SDK prototype");
  if (cameraName && cameraName[0] != '\0') {
    profile->SetUniqueCameraModelRestriction(cameraName);
  }
  profile->SetCalibrationIlluminant1(calibrationIlluminant1 > 0 ? static_cast<uint32_t>(calibrationIlluminant1) : 21u);
  profile->SetColorMatrix1(matrix_from_array(colorMatrix1, 3, 3));

  if (colorMatrix2 && calibrationIlluminant2 > 0) {
    profile->SetCalibrationIlluminant2(static_cast<uint32_t>(calibrationIlluminant2));
    profile->SetColorMatrix2(matrix_from_array(colorMatrix2, 3, 3));
  }

  if (forwardMatrix1) {
    profile->SetForwardMatrix1(matrix_from_array(forwardMatrix1, 3, 3));
  }
  if (forwardMatrix2) {
    profile->SetForwardMatrix2(matrix_from_array(forwardMatrix2, 3, 3));
  }

  negative.AddProfile(profile);
}

bool has_nonzero_triplet(const double *values) {
  if (!values) {
    return false;
  }
  return values[0] != 0.0 || values[1] != 0.0 || values[2] != 0.0;
}

} // namespace

extern "C" {

int adobe_dng_create() {
  const Handle handle = g_nextHandle++;
  g_instances.emplace(handle, Context{});
  return handle;
}

void adobe_dng_destroy(int handle) {
  g_instances.erase(handle);
}

const char *adobe_dng_last_error(int handle) {
  Context *context = lookup(handle);
  return context ? context->lastError.c_str() : "Invalid Adobe DNG handle";
}

const uint8_t *adobe_dng_last_output_ptr(int handle) {
  Context *context = lookup(handle);
  return (context && !context->output.empty()) ? context->output.data() : nullptr;
}

int adobe_dng_last_output_size(int handle) {
  Context *context = lookup(handle);
  return context ? static_cast<int>(context->output.size()) : 0;
}

int adobe_dng_encode_raw(
  int handle,
  const uint16_t *imageData,
  int imageValueCount,
  int width,
  int height,
  int bitDepth,
  int activeTop,
  int activeLeft,
  int activeBottom,
  int activeRight,
  int blackLevel,
  int whiteLevel,
  const int32_t *cfaPattern,
  int orientation,
  const char *make,
  const char *model,
  const double *colorMatrix1,
  const double *colorMatrix2,
  const double *forwardMatrix1,
  const double *forwardMatrix2,
  const double *cameraCalibration1,
  const double *cameraCalibration2,
  const double *asShotNeutral,
  const double *analogBalance,
  int calibrationIlluminant1,
  int calibrationIlluminant2,
  double baselineExposure,
  int hasBaselineExposure
) {
  Context *context = lookup(handle);
  if (!context) {
    return -1;
  }

  context->output.clear();
  context->lastError.clear();

  if (!imageData || width <= 0 || height <= 0 || bitDepth <= 0 || imageValueCount < width * height) {
    set_error(context, "Invalid Adobe DNG encode input.");
    return -2;
  }

  try {
    dng_host host;
    AutoPtr<dng_negative> negative(dng_negative::Make(host));

    const std::string uniqueCameraModel = std::string(make ? make : "") +
      ((make && make[0] && model && model[0]) ? " " : "") +
      std::string(model ? model : "Unknown");

    negative->SetModelName(uniqueCameraModel.c_str());
    negative->SetBaseOrientation(dng_orientation::TIFFtoDNG(static_cast<uint32_t>(orientation > 0 ? orientation : 1)));
    negative->SetDefaultCropOrigin(static_cast<uint32_t>(activeLeft > 0 ? activeLeft : 0), static_cast<uint32_t>(activeTop > 0 ? activeTop : 0));
    negative->SetDefaultCropSize(
      static_cast<uint32_t>(activeRight > activeLeft ? activeRight - activeLeft : width),
      static_cast<uint32_t>(activeBottom > activeTop ? activeBottom - activeTop : height)
    );
    negative->SetActiveArea(dng_rect(activeTop, activeLeft, activeBottom > activeTop ? activeBottom : height, activeRight > activeLeft ? activeRight : width));
    negative->SetBlackLevel(static_cast<real64>(blackLevel));
    negative->SetWhiteLevel(static_cast<uint32_t>(whiteLevel > 0 ? whiteLevel : ((1 << bitDepth) - 1)));
    negative->SetRGB();
    negative->SetBayerMosaic(derive_bayer_phase(cfaPattern));
    negative->SetCameraNeutral(vector_from_array(asShotNeutral, 3));

    if (has_nonzero_triplet(analogBalance)) {
      negative->SetAnalogBalance(vector_from_array(analogBalance, 3));
    }
    if (hasBaselineExposure) {
      negative->SetBaselineExposure(baselineExposure);
    }
    if (cameraCalibration1) {
      negative->SetCameraCalibration1(matrix_from_array(cameraCalibration1, 3, 3));
    }
    if (cameraCalibration2) {
      negative->SetCameraCalibration2(matrix_from_array(cameraCalibration2, 3, 3));
    }

    attach_profile(*negative.Get(),
                   uniqueCameraModel.c_str(),
                   colorMatrix1,
                   colorMatrix2,
                   forwardMatrix1,
                   forwardMatrix2,
                   calibrationIlluminant1,
                   calibrationIlluminant2);

    dng_rect bounds(static_cast<uint32_t>(height), static_cast<uint32_t>(width));
    dng_pixel_buffer pixelBuffer(bounds, 0, 1, ttShort, pcPlanar, const_cast<uint16_t *>(imageData));
    AutoPtr<dng_image> image(new dng_simple_image(pixelBuffer, host.Allocator()));
    negative->SetStage1Image(image);
    negative->SynchronizeMetadata();
    negative->FindRawImageDigest(host);
    negative->FindNewRawImageDigest(host);
    negative->FindRawDataUniqueID(host);

    dng_memory_stream stream(host.Allocator());
    dng_image_writer writer;
    writer.WriteDNG(host, stream, *negative.Get(), nullptr, dngVersion_SaveDefault, true, false);
    stream.Flush();

    AutoPtr<dng_memory_block> output(stream.AsMemoryBlock(host.Allocator()));
    const auto *bytes = static_cast<const uint8_t *>(output->Buffer());
    context->output.assign(bytes, bytes + output->LogicalSize());

    return 0;
  } catch (const dng_exception &error) {
    set_error(context, error.what());
    return static_cast<int>(error.ErrorCode());
  } catch (const std::exception &error) {
    set_error(context, error.what());
    return -3;
  } catch (...) {
    set_error(context, "Unknown Adobe DNG SDK failure.");
    return -4;
  }
}

}
