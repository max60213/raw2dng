import { describe, expect, it } from "vitest";
import { normalizeRawMetadata } from "../../packages/raw-core/src";
import type { RawExtractionResult } from "../../packages/raw-core/src";

describe("normalizeRawMetadata", () => {
  it("collapses LibRaw second-green CFA values into DNG green", () => {
    const extraction: RawExtractionResult = {
      width: 2,
      height: 2,
      bitDepth: 12,
      cfaPattern: [0, 1, 3, 2],
      blackLevel: 64,
      whiteLevel: 4095,
      activeArea: [0, 0, 2, 2],
      imageData: new Uint16Array([1, 2, 3, 4]),
      metadata: {
        make: "Canon",
        model: "EOS",
        orientation: 1,
        colorMatrix1: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        asShotNeutral: [1, 1, 1],
        calibrationIlluminant1: 21
      }
    };

    const normalized = normalizeRawMetadata(extraction);
    expect(normalized.cfaPattern).toEqual([0, 1, 1, 2]);
  });
});
