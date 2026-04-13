import { describe, expect, it, vi } from "vitest";
import type { RawExtractionResult, RawProbeResult } from "../../packages/raw-core/src";
import { buildDng } from "../../packages/dng-writer/src";
import { normalizeRawMetadata } from "../../packages/raw-core/src";

describe("worker pipeline contracts", () => {
  it("can normalize metadata and emit a DNG from synthetic extraction output", async () => {
    const probe: RawProbeResult = {
      supported: true,
      formatHint: "cr3",
      fileSize: 1024
    };
    expect(probe.supported).toBe(true);

    const extraction: RawExtractionResult = {
      width: 2,
      height: 2,
      bitDepth: 16,
      cfaPattern: [0, 1, 1, 2],
      blackLevel: 64,
      whiteLevel: 16383,
      activeArea: [0, 0, 2, 2],
      imageData: new Uint16Array([1, 2, 3, 4]),
      metadata: {
        make: "Mock",
        model: "Sensor",
        orientation: 1,
        colorMatrix1: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        asShotNeutral: [1, 1, 1],
        calibrationIlluminant1: 21
      }
    };

    const normalized = normalizeRawMetadata(extraction);
    const blob = buildDng({
      width: extraction.width,
      height: extraction.height,
      bitDepth: extraction.bitDepth,
      imageData: extraction.imageData,
      metadata: normalized
    });

    expect(blob.size).toBeGreaterThan(0);
    expect(vi.isMockFunction(() => {})).toBe(false);
  });
});
