import type { RawExtractionResult, RawProbeResult } from "@raw-core/types";

export interface LibRawAdapter {
  probe(input: ArrayBuffer): Promise<RawProbeResult>;
  extract(input: ArrayBuffer): Promise<RawExtractionResult>;
}
