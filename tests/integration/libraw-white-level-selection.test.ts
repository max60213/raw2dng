import { describe, expect, it } from "vitest";
import { selectWhiteLevel } from "../../packages/libraw-wasm/src/runtime/selectWhiteLevel";

describe("selectWhiteLevel", () => {
  it("prefers LibRaw linear_max when it provides a tighter white level", () => {
    expect(selectWhiteLevel(16383, [15360, 15360, 15360, 15360])).toBe(15360);
  });

  it("falls back to the original white level when linear_max is empty", () => {
    expect(selectWhiteLevel(3692, [0, 0, 0, 0])).toBe(3692);
  });

  it("ignores invalid linear_max values above the fallback", () => {
    expect(selectWhiteLevel(4095, [5000, 0, -1, 0])).toBe(4095);
  });
});
