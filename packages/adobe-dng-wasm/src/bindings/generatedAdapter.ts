import type { AdobeDngAdapter, AdobeDngEncodeInput } from "../api/types";

type AdobeRuntime = {
  HEAPU8: Uint8Array;
  HEAP32: Int32Array;
  HEAPF64: Float64Array;
  _malloc(size: number): number;
  _free(pointer: number): void;
  ccall(name: string, returnType: string | null, argTypes: string[], args: unknown[]): number | string;
};

export class GeneratedAdobeDngAdapter implements AdobeDngAdapter {
  private readonly handle: number;

  constructor(private readonly runtime: AdobeRuntime) {
    this.handle = Number(this.runtime.ccall("adobe_dng_create", "number", [], []));
  }

  isAvailable() {
    return true;
  }

  async encode(input: AdobeDngEncodeInput): Promise<Blob> {
    const imagePointer = this.copyUint16Array(input.imageData);
    const cfaPointer = this.copyInt32Array(Int32Array.from(input.metadata.cfaPattern));
    const makePointer = this.copyString(input.metadata.make);
    const modelPointer = this.copyString(input.metadata.model);
    const colorMatrix1Pointer = this.copyFloat64Array(Float64Array.from(input.metadata.colorMatrix1));
    const colorMatrix2Pointer = input.metadata.colorMatrix2
      ? this.copyFloat64Array(Float64Array.from(input.metadata.colorMatrix2))
      : 0;
    const forwardMatrix1Pointer = input.metadata.forwardMatrix1
      ? this.copyFloat64Array(Float64Array.from(input.metadata.forwardMatrix1))
      : 0;
    const forwardMatrix2Pointer = input.metadata.forwardMatrix2
      ? this.copyFloat64Array(Float64Array.from(input.metadata.forwardMatrix2))
      : 0;
    const cameraCalibration1Pointer = input.metadata.cameraCalibration1
      ? this.copyFloat64Array(Float64Array.from(input.metadata.cameraCalibration1))
      : 0;
    const cameraCalibration2Pointer = input.metadata.cameraCalibration2
      ? this.copyFloat64Array(Float64Array.from(input.metadata.cameraCalibration2))
      : 0;
    const asShotNeutralPointer = this.copyFloat64Array(Float64Array.from(input.metadata.asShotNeutral));
    const analogBalancePointer = input.metadata.analogBalance
      ? this.copyFloat64Array(Float64Array.from(input.metadata.analogBalance))
      : 0;

    try {
      const status = Number(this.runtime.ccall(
        "adobe_dng_encode_raw",
        "number",
        [
          "number", "number", "number", "number", "number", "number",
          "number", "number", "number", "number", "number", "number",
          "number", "number", "number", "number", "number", "number",
          "number", "number", "number", "number", "number", "number",
          "number", "number", "number", "number"
        ],
        [
          this.handle,
          imagePointer,
          input.imageData.length,
          input.width,
          input.height,
          input.bitDepth,
          input.metadata.activeArea[0],
          input.metadata.activeArea[1],
          input.metadata.activeArea[2],
          input.metadata.activeArea[3],
          input.metadata.blackLevel,
          input.metadata.whiteLevel,
          cfaPointer,
          input.metadata.orientation,
          makePointer,
          modelPointer,
          colorMatrix1Pointer,
          colorMatrix2Pointer,
          forwardMatrix1Pointer,
          forwardMatrix2Pointer,
          cameraCalibration1Pointer,
          cameraCalibration2Pointer,
          asShotNeutralPointer,
          analogBalancePointer,
          input.metadata.calibrationIlluminant1,
          input.metadata.calibrationIlluminant2 ?? 0,
          input.metadata.baselineExposure ?? 0,
          input.metadata.baselineExposure !== undefined ? 1 : 0
        ]
      ));

      if (status !== 0) {
        const errorMessage = String(this.runtime.ccall("adobe_dng_last_error", "string", ["number"], [this.handle]));
        throw new Error(errorMessage || `Adobe DNG encode failed with status ${status}`);
      }

      const outputPointer = Number(this.runtime.ccall("adobe_dng_last_output_ptr", "number", ["number"], [this.handle]));
      const outputSize = Number(this.runtime.ccall("adobe_dng_last_output_size", "number", ["number"], [this.handle]));
      const bytes = this.runtime.HEAPU8.slice(outputPointer, outputPointer + outputSize);
      return new Blob([bytes], { type: "image/x-adobe-dng" });
    } finally {
      for (const pointer of [
        imagePointer,
        cfaPointer,
        makePointer,
        modelPointer,
        colorMatrix1Pointer,
        colorMatrix2Pointer,
        forwardMatrix1Pointer,
        forwardMatrix2Pointer,
        cameraCalibration1Pointer,
        cameraCalibration2Pointer,
        asShotNeutralPointer,
        analogBalancePointer
      ]) {
        if (pointer) {
          this.runtime._free(pointer);
        }
      }
    }
  }

  private copyUint16Array(values: Uint16Array): number {
    const pointer = this.runtime._malloc(values.byteLength);
    new Uint16Array(this.runtime.HEAPU8.buffer, pointer, values.length).set(values);
    return pointer;
  }

  private copyInt32Array(values: Int32Array): number {
    const pointer = this.runtime._malloc(values.byteLength);
    new Int32Array(this.runtime.HEAPU8.buffer, pointer, values.length).set(values);
    return pointer;
  }

  private copyFloat64Array(values: Float64Array): number {
    const pointer = this.runtime._malloc(values.byteLength);
    new Float64Array(this.runtime.HEAPU8.buffer, pointer, values.length).set(values);
    return pointer;
  }

  private copyString(value: string): number {
    const bytes = new TextEncoder().encode(value + "\0");
    const pointer = this.runtime._malloc(bytes.byteLength);
    this.runtime.HEAPU8.set(bytes, pointer);
    return pointer;
  }
}
