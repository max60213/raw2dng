import { describe, expect, it } from "vitest";
import { appendEmbeddedThumbnailIfd, createEmbeddedPreview, type LinearExtractionResult } from "../../packages/raw-core/src";

describe("embedded preview helpers", () => {
  it("downscales 16-bit linear RGB data into an 8-bit embedded preview", () => {
    const input: LinearExtractionResult = {
      width: 2,
      height: 1,
      bitDepth: 16,
      channels: 3,
      imageData: new Uint16Array([65535, 32768, 0, 257, 514, 771]),
      metadata: {
        make: "Test",
        model: "Camera",
        orientation: 1,
        colorMatrix1: [1,0,0,0,1,0,0,0,1],
        asShotNeutral: [1,1,1],
        calibrationIlluminant1: 21
      }
    };
    const preview = createEmbeddedPreview(input, 256);
    expect(preview.width).toBe(2);
    expect(preview.height).toBe(1);
    expect(Array.from(preview.imageData)).toEqual([255, 128, 0, 1, 2, 3]);
  });

  it("appends a thumbnail IFD to an existing DNG byte stream", () => {
    const base = new Uint8Array(8 + 2 + 2 * 12 + 4);
    const view = new DataView(base.buffer);
    base[0] = 0x49;
    base[1] = 0x49;
    view.setUint16(2, 42, true);
    view.setUint32(4, 8, true);
    view.setUint16(8, 2, true);
    view.setUint16(10, 256, true);
    view.setUint16(12, 4, true);
    view.setUint32(14, 1, true);
    view.setUint32(18, 2, true);
    view.setUint16(22, 257, true);
    view.setUint16(24, 4, true);
    view.setUint32(26, 1, true);
    view.setUint32(30, 2, true);
    view.setUint32(34, 0, true);

    const preview = { width: 1, height: 1, imageData: new Uint8Array([255, 0, 0]) };
    const output = appendEmbeddedThumbnailIfd(base, preview);
    const outputView = new DataView(output.buffer);
    const nextIfdOffset = outputView.getUint32(34, true);
    expect(nextIfdOffset).toBeGreaterThan(base.byteLength);
    expect(outputView.getUint16(nextIfdOffset, true)).toBeGreaterThan(0);
  });
});
