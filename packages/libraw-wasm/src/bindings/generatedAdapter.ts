import { RuntimeUnavailableError } from "../../../raw-core/src/errors";
import type { RawExtractionResult, RawProbeResult } from "../../../raw-core/src/types";
import type { LibRawAdapter } from "../api/types";

type GeneratedRuntime = {
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
    if (!this.runtime.ccall) {
      throw new RuntimeUnavailableError();
    }

    const fileSize = input.byteLength;
    return {
      supported: true,
      formatHint: "raw",
      fileSize
    };
  }

  async extract(): Promise<RawExtractionResult> {
    throw new RuntimeUnavailableError(
      "Generated LibRaw WASM bindings are not wired yet. Add generated/libraw.js + generated/libraw.wasm and bridge exports."
    );
  }
}
