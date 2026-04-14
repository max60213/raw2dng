
import { describe, expect, it } from "vitest";
import { selectColorMatrix } from "../../packages/libraw-wasm/src/runtime/selectColorMatrix";

describe("selectColorMatrix", () => {
  const dng = [1,2,3,4,5,6,7,8,9] as [number, number, number, number, number, number, number, number, number];
  const camXyz = [0.7,-0.2,-0.05,-0.5,1.3,0.25,-0.1,0.18,0.65] as [number, number, number, number, number, number, number, number, number];
  const rgbCam = [1.6,-0.42,-0.21,-0.13,1.54,-0.41,0.01,-0.42,1.4] as [number, number, number, number, number, number, number, number, number];

  it("prefers embedded DNG matrix when available", () => {
    expect(selectColorMatrix("Sony", dng, camXyz, rgbCam)).toEqual(dng);
  });

  it("prefers cam_xyz fallback for Sony when no DNG matrix exists", () => {
    expect(selectColorMatrix("Sony", null, camXyz, rgbCam)).toEqual(camXyz);
  });

  it("falls back to rgb_cam for non-Sony cameras without DNG matrix", () => {
    expect(selectColorMatrix("Canon", null, camXyz, rgbCam)).toEqual(rgbCam);
  });
});
