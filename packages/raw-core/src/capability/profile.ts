import type { CapabilityProfile, GateDecision } from "../types";

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile/i;

export function detectCapabilityProfile(): CapabilityProfile {
  if (typeof navigator === "undefined") {
    return {
      formFactor: "desktop",
      hardwareConcurrency: 4,
      maxConcurrentJobs: 1,
      maxBatchItems: 4,
      maxFileBytes: 25 * 1024 * 1024,
      recommendedMaxPixels: 24_000_000,
      notes: ["Navigator unavailable; using safe defaults."],
      supportsFileSystemAccess: false
    };
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemoryGb = "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) : undefined;
  const isMobile = MOBILE_UA.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
  const lowMemory = deviceMemoryGb !== undefined && deviceMemoryGb <= 4;

  const maxConcurrentJobs = 1;
  const maxFileBytes = isMobile
    ? lowMemory
      ? 32 * 1024 * 1024
      : 128 * 1024 * 1024
    : 256 * 1024 * 1024;
  const maxBatchItems = isMobile ? 3 : 8;
  const recommendedMaxPixels = isMobile ? 20_000_000 : 48_000_000;

  const notes = [
    isMobile ? "Mobile-safe mode is enabled." : "Desktop mode detected.",
    lowMemory ? "Low-memory profile detected; file limits reduced." : "Standard memory profile.",
    "Sequential worker mode is enabled to keep memory pressure predictable."
  ];

  return {
    formFactor: isMobile ? "mobile" : "desktop",
    hardwareConcurrency,
    deviceMemoryGb,
    maxConcurrentJobs,
    maxBatchItems,
    maxFileBytes,
    recommendedMaxPixels,
    notes,
    supportsFileSystemAccess:
      typeof window !== "undefined" && "showSaveFilePicker" in window
  };
}

export function gateFile(file: File, capability: CapabilityProfile): GateDecision {
  if (file.size > capability.maxFileBytes) {
    return {
      accepted: false,
      reason: `File exceeds mobile-safe limit of ${formatMegabytes(capability.maxFileBytes)} MB.`
    };
  }

  if (!/\.(cr2|cr3|nef|arw|raf|rw2|orf|dng)$/i.test(file.name)) {
    return {
      accepted: false,
      reason: "Unsupported extension. Upload a known RAW file type."
    };
  }

  if (file.size > capability.maxFileBytes * 0.8) {
    return {
      accepted: true,
      warning: "Large file for current device; process one file at a time."
    };
  }

  return { accepted: true };
}

function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0);
}
