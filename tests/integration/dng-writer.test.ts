import { describe, expect, it } from "vitest";
import { buildDng } from "../../packages/dng-writer/src";

describe("buildDng", () => {
  it("writes a TIFF/DNG header and payload", async () => {
    const blob = buildDng({
      width: 2,
      height: 2,
      bitDepth: 16,
      imageData: new Uint16Array([100, 200, 300, 400]),
      metadata: {
        make: "Test",
        model: "Camera",
        orientation: 1,
        colorMatrix1: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        asShotNeutral: [1, 1, 1],
        calibrationIlluminant1: 21,
        blackLevel: 64,
        whiteLevel: 16383,
        activeArea: [0, 0, 2, 2],
        cfaPattern: [0, 1, 1, 2]
      }
    });

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(blob.type).toBe("image/x-adobe-dng");
    expect(bytes[0]).toBe(0x49);
    expect(bytes[1]).toBe(0x49);
    expect(bytes[2]).toBe(42);
    expect(bytes.length).toBeGreaterThan(128);
  });
});
