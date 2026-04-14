import { describe, expect, it } from "vitest";
import {
  appendEmbeddedJpegThumbnailIfd,
  appendEmbeddedThumbnailIfd,
  createEmbeddedPreview,
  type LinearExtractionResult
} from "../../packages/raw-core/src";

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
    expect(preview.orientation).toBe(1);
    expect(Array.from(preview.imageData)).toEqual([255, 188, 0, 13, 22, 28]);
  });


  it("keeps sensor-orientation dimensions for rotated images", () => {
    const input: LinearExtractionResult = {
      width: 2,
      height: 3,
      bitDepth: 16,
      channels: 3,
      imageData: new Uint16Array(2 * 3 * 3).fill(1024),
      metadata: {
        make: "Test",
        model: "Camera",
        orientation: 6,
        colorMatrix1: [1,0,0,0,1,0,0,0,1],
        asShotNeutral: [1,1,1],
        calibrationIlluminant1: 21
      }
    };
    const preview = createEmbeddedPreview(input, 1024);
    expect(preview.width).toBe(3);
    expect(preview.height).toBe(2);
    expect(preview.orientation).toBe(6);
  });

  it("maps portrait orientation pixels back to sensor order before tagging orientation", () => {
    const input: LinearExtractionResult = {
      width: 2,
      height: 3,
      bitDepth: 16,
      channels: 3,
      imageData: new Uint16Array([
        // display row 0: a, b
        0, 0, 0,       65535, 0, 0,
        // display row 1: c, d
        0, 65535, 0,   0, 0, 65535,
        // display row 2: e, f
        65535, 65535, 0,   65535, 0, 65535
      ]),
      metadata: {
        make: "Test",
        model: "Camera",
        orientation: 6,
        colorMatrix1: [1,0,0,0,1,0,0,0,1],
        asShotNeutral: [1,1,1],
        calibrationIlluminant1: 21
      }
    };

    const preview = createEmbeddedPreview(input, 1024);
    expect(preview.width).toBe(3);
    expect(preview.height).toBe(2);
    expect(preview.orientation).toBe(6);
    expect(Array.from(preview.imageData)).toEqual([
      // sensor row 0: b, d, f
      255, 0, 0,   0, 0, 255,   255, 0, 255,
      // sensor row 1: a, c, e
      0, 0, 0,   0, 255, 0,   255, 255, 0
    ]);
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

    const preview = { width: 1, height: 1, orientation: 1, imageData: new Uint8Array([255, 0, 0]) };
    const output = appendEmbeddedThumbnailIfd(base, preview);
    const outputView = new DataView(output.buffer);
    const nextIfdOffset = outputView.getUint32(34, true);
    expect(nextIfdOffset).toBeGreaterThan(base.byteLength);
    expect(outputView.getUint16(nextIfdOffset, true)).toBeGreaterThan(0);
  });

  it("appends an embedded JPEG thumbnail IFD", () => {
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

    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const output = appendEmbeddedJpegThumbnailIfd(base, {
      width: 1,
      height: 1,
      orientation: 6,
      jpegData: jpeg
    });

    const outputView = new DataView(output.buffer);
    const nextIfdOffset = outputView.getUint32(34, true);
    expect(nextIfdOffset).toBeGreaterThan(base.byteLength);
    expect(outputView.getUint16(nextIfdOffset, true)).toBeGreaterThan(0);
  });
});
