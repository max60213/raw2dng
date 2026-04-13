import { RuntimeUnavailableError } from "../../../raw-core/src/errors";
import type { LinearExtractionResult, RawExtractionResult, RawProbeResult } from "../../../raw-core/src/types";
import type { LibRawAdapter } from "../api/types";

type GeneratedRuntime = {
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  UTF8ToString?: (pointer: number) => string;
  _malloc?: (size: number) => number;
  _free?: (pointer: number) => void;
  ccall?: (
    name: string,
    returnType: string | null,
    argumentTypes: string[],
    args: unknown[]
  ) => unknown;
};

export class GeneratedLibRawAdapter implements LibRawAdapter {
  constructor(private readonly runtime: GeneratedRuntime) {}

  async probe(input: ArrayBuffer): Promise<RawProbeResult> {
    assertRuntime(this.runtime);
    const { handle, inputPointer } = this.open(input);
    try {
      const fileSize = input.byteLength;
      const width = this.callNumber("raw2dng_get_raw_width", [handle]);
      const height = this.callNumber("raw2dng_get_raw_height", [handle]);
      const bitDepth = this.callNumber("raw2dng_get_bit_depth", [handle]);

      return {
        supported: width > 0 && height > 0,
        formatHint: "raw",
        width,
        height,
        bitDepth,
        fileSize,
        reason: width > 0 && height > 0 ? undefined : "LibRaw could not read RAW dimensions."
      };
    } finally {
      this.close(handle, inputPointer);
    }
  }

  async extract(input: ArrayBuffer): Promise<RawExtractionResult> {
    assertRuntime(this.runtime);
    const { handle, inputPointer } = this.open(input);
    try {
      const unpackStatus = this.callNumber("raw2dng_unpack", [handle]);
      if (unpackStatus !== 0) {
        throw new RuntimeUnavailableError(this.describeError(unpackStatus));
      }

      const width = this.callNumber("raw2dng_get_raw_width", [handle]);
      const height = this.callNumber("raw2dng_get_raw_height", [handle]);
      const imagePointer = this.callNumber("raw2dng_get_raw_image_ptr", [handle]);
      const pixelCount = this.callNumber("raw2dng_get_raw_image_count", [handle]);
      if (imagePointer === 0 || pixelCount === 0) {
        throw new RuntimeUnavailableError("LibRaw unpacked the file but did not expose a single-plane raw buffer.");
      }

      const heapOffset = imagePointer / Uint16Array.BYTES_PER_ELEMENT;
      const imageData = new Uint16Array(pixelCount);
      imageData.set(this.runtime.HEAPU16.subarray(heapOffset, heapOffset + pixelCount));

      return {
        width,
        height,
        bitDepth: this.callNumber("raw2dng_get_bit_depth", [handle]),
        cfaPattern: [
          this.callNumber("raw2dng_get_cfa", [handle, 0, 0]),
          this.callNumber("raw2dng_get_cfa", [handle, 0, 1]),
          this.callNumber("raw2dng_get_cfa", [handle, 1, 0]),
          this.callNumber("raw2dng_get_cfa", [handle, 1, 1])
        ],
        blackLevel: this.callNumber("raw2dng_get_black_level", [handle]),
        whiteLevel: this.callNumber("raw2dng_get_white_level", [handle]),
        activeArea: [
          this.callNumber("raw2dng_get_top_margin", [handle]),
          this.callNumber("raw2dng_get_left_margin", [handle]),
          this.callNumber("raw2dng_get_top_margin", [handle]) + this.callNumber("raw2dng_get_visible_height", [handle]),
          this.callNumber("raw2dng_get_left_margin", [handle]) + this.callNumber("raw2dng_get_visible_width", [handle])
        ],
        imageData,
        metadata: this.readMetadata(handle)
      };
    } finally {
      this.close(handle, inputPointer);
    }
  }

  async extractLinear(input: ArrayBuffer): Promise<LinearExtractionResult> {
    assertRuntime(this.runtime);
    const { handle, inputPointer } = this.open(input);
    try {
      const unpackStatus = this.callNumber("raw2dng_unpack", [handle]);
      if (unpackStatus !== 0) {
        throw new RuntimeUnavailableError(this.describeError(unpackStatus));
      }

      const metadata = this.readMetadata(handle);
      const processStatus = this.callNumber("raw2dng_process_linear", [handle]);
      if (processStatus !== 0) {
        throw new RuntimeUnavailableError(this.describeError(processStatus));
      }

      const width = this.callNumber("raw2dng_get_processed_width", [handle]);
      const height = this.callNumber("raw2dng_get_processed_height", [handle]);
      const channels = this.callNumber("raw2dng_get_processed_colors", [handle]);
      const bitDepth = this.callNumber("raw2dng_get_processed_bits", [handle]);
      const dataPointer = this.callNumber("raw2dng_get_processed_data_ptr", [handle]);
      const dataSize = this.callNumber("raw2dng_get_processed_data_size", [handle]);
      if (channels !== 3 || dataPointer === 0 || dataSize === 0) {
        throw new RuntimeUnavailableError("LibRaw linear processing did not expose a 3-channel bitmap.");
      }

      const heapOffset = dataPointer / Uint16Array.BYTES_PER_ELEMENT;
      const valueCount = dataSize / Uint16Array.BYTES_PER_ELEMENT;
      const imageData = new Uint16Array(valueCount);
      imageData.set(this.runtime.HEAPU16.subarray(heapOffset, heapOffset + valueCount));

      return {
        width,
        height,
        bitDepth,
        channels: 3,
        imageData,
        metadata
      };
    } finally {
      this.close(handle, inputPointer);
    }
  }

  private open(input: ArrayBuffer): { handle: number; inputPointer: number } {
    const handle = this.callNumber("raw2dng_create", []);
    const inputPointer = this.runtime._malloc!(input.byteLength);
    this.runtime.HEAPU8.set(new Uint8Array(input), inputPointer);
    const openStatus = this.callNumber("raw2dng_open_buffer", [handle, inputPointer, input.byteLength]);
    if (openStatus !== 0) {
      this.close(handle, inputPointer);
      throw new RuntimeUnavailableError(this.describeError(openStatus));
    }
    return { handle, inputPointer };
  }

  private close(handle: number, inputPointer: number): void {
    this.callVoid("raw2dng_recycle", [handle]);
    this.callVoid("raw2dng_destroy", [handle]);
    this.runtime._free!(inputPointer);
  }

  private describeError(code: number): string {
    if (!this.runtime.UTF8ToString) {
      throw new RuntimeUnavailableError();
    }
    const pointer = this.callNumber("raw2dng_strerror", [code], "number");
    return this.runtime.UTF8ToString(pointer);
  }

  private callNumber(name: string, args: unknown[], returnType: "number" | "string" = "number"): number {
    return Number(this.runtime.ccall!(name, returnType, new Array(args.length).fill("number"), args));
  }

  private callFloat(name: string, args: unknown[]): number {
    return Number(this.runtime.ccall!(name, "number", new Array(args.length).fill("number"), args));
  }

  private readString(name: string, args: unknown[]): string {
    if (!this.runtime.UTF8ToString) {
      return "";
    }
    const pointer = this.callNumber(name, args, "number");
    return pointer ? this.runtime.UTF8ToString(pointer) : "";
  }

  private callVoid(name: string, args: unknown[]): void {
    this.runtime.ccall!(name, null, new Array(args.length).fill("number"), args);
  }

  private readDngMatrix(
    functionName: "raw2dng_get_dng_color_matrix" | "raw2dng_get_forward_matrix" | "raw2dng_get_camera_calibration",
    handle: number,
    matrixIndex: number
  ): [number, number, number, number, number, number, number, number, number] | null {
    const values = Array.from({ length: 9 }, (_, index) => {
      const row = Math.floor(index / 3);
      const column = index % 3;
      return this.callFloat(functionName, [handle, matrixIndex, row, column]);
    }) as [number, number, number, number, number, number, number, number, number];

    return hasMeaningfulValues(values) ? values : null;
  }

  private readRgbCamFallback(handle: number): [number, number, number, number, number, number, number, number, number] {
    return [
      this.callFloat("raw2dng_get_rgb_cam", [handle, 0, 0]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 0, 1]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 0, 2]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 1, 0]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 1, 1]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 1, 2]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 2, 0]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 2, 1]),
      this.callFloat("raw2dng_get_rgb_cam", [handle, 2, 2])
    ];
  }

  private readAnalogBalance(handle: number): [number, number, number] | undefined {
    const values = [
      this.callFloat("raw2dng_get_analog_balance", [handle, 0]),
      this.callFloat("raw2dng_get_analog_balance", [handle, 1]),
      this.callFloat("raw2dng_get_analog_balance", [handle, 2])
    ] as [number, number, number];
    return hasMeaningfulValues(values) ? values : undefined;
  }

  private readBaselineExposure(handle: number): number | undefined {
    const value = this.callFloat("raw2dng_get_baseline_exposure", [handle]);
    return Number.isFinite(value) && value > -998 ? value : undefined;
  }

  private readOpcodeList3(handle: number): Uint8Array | undefined {
    const length = this.callNumber("raw2dng_get_opcode3_len", [handle]);
    const pointer = this.callNumber("raw2dng_get_opcode3_ptr", [handle]);
    if (length <= 0 || pointer === 0) {
      return undefined;
    }
    return new Uint8Array(this.runtime.HEAPU8.slice(pointer, pointer + length));
  }

  private readMetadata(handle: number) {
    return {
      make: this.readString("raw2dng_get_make", [handle]),
      model: this.readString("raw2dng_get_model", [handle]),
      orientation: mapOrientation(this.callNumber("raw2dng_get_flip", [handle])),
      colorMatrix1: this.readDngMatrix("raw2dng_get_dng_color_matrix", handle, 0) ??
        this.readRgbCamFallback(handle),
      colorMatrix2: this.readDngMatrix("raw2dng_get_dng_color_matrix", handle, 1) ?? undefined,
      forwardMatrix1: this.readDngMatrix("raw2dng_get_forward_matrix", handle, 0) ?? undefined,
      forwardMatrix2: this.readDngMatrix("raw2dng_get_forward_matrix", handle, 1) ?? undefined,
      cameraCalibration1: this.readDngMatrix("raw2dng_get_camera_calibration", handle, 0) ?? undefined,
      cameraCalibration2: this.readDngMatrix("raw2dng_get_camera_calibration", handle, 1) ?? undefined,
      asShotNeutral: deriveAsShotNeutral([
        this.callFloat("raw2dng_get_cam_mul", [handle, 0]),
        this.callFloat("raw2dng_get_cam_mul", [handle, 1]),
        this.callFloat("raw2dng_get_cam_mul", [handle, 2])
      ]),
      analogBalance: this.readAnalogBalance(handle),
      calibrationIlluminant1: normalizeIlluminant(this.callNumber("raw2dng_get_calibration_illuminant", [handle, 0])) ?? 21,
      calibrationIlluminant2: normalizeIlluminant(this.callNumber("raw2dng_get_calibration_illuminant", [handle, 1])) ?? undefined,
      baselineExposure: this.readBaselineExposure(handle),
      opcodeList3: this.readOpcodeList3(handle)
    };
  }
}

function assertRuntime(runtime: GeneratedRuntime): asserts runtime is GeneratedRuntime & Required<Pick<GeneratedRuntime, "ccall" | "_malloc" | "_free">> {
  if (!runtime.ccall || !runtime._malloc || !runtime._free) {
    throw new RuntimeUnavailableError("Generated LibRaw WASM runtime is missing expected exports.");
  }
}

function deriveAsShotNeutral(values: [number, number, number]): [number, number, number] {
  const safe = values.map((value) => (value > 0 ? 1 / value : 1)) as [number, number, number];
  const green = safe[1] || 1;
  return [safe[0] / green, 1, safe[2] / green];
}

function mapOrientation(flip: number): number {
  switch (flip) {
    case 3:
      return 3;
    case 5:
      return 8;
    case 6:
      return 6;
    default:
      return 1;
  }
}

function hasMeaningfulValues(values: number[]): boolean {
  return values.some((value) => Number.isFinite(value) && Math.abs(value) > 0.000001);
}

function normalizeIlluminant(value: number): number | undefined {
  if (!Number.isFinite(value) || value <= 0 || value === 65535) {
    return undefined;
  }
  return value;
}
