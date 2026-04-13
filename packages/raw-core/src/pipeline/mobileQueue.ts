import type { CapabilityProfile } from "@raw-core/types";

export function createQueueWindow(capability: CapabilityProfile, pendingCount: number): number {
  return Math.max(1, Math.min(capability.maxConcurrentJobs, pendingCount));
}
