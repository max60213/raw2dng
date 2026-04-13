import { describe, expect, it } from "vitest";
import { gateFile } from "../../packages/raw-core/src";
import type { CapabilityProfile } from "../../packages/raw-core/src";

const mobileCapability: CapabilityProfile = {
  formFactor: "mobile",
  hardwareConcurrency: 4,
  maxConcurrentJobs: 1,
  maxBatchItems: 3,
  maxFileBytes: 20 * 1024 * 1024,
  recommendedMaxPixels: 20_000_000,
  notes: [],
  supportsFileSystemAccess: false
};

describe("gateFile", () => {
  it("rejects unknown extensions", () => {
    const file = new File([new Uint8Array(128)], "holiday.jpg");
    const decision = gateFile(file, mobileCapability);
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toMatch(/Unsupported extension/);
  });

  it("rejects files above the mobile-safe limit", () => {
    const file = new File([new Uint8Array(25 * 1024 * 1024)], "camera.cr3");
    const decision = gateFile(file, mobileCapability);
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toMatch(/mobile-safe limit/);
  });
});
