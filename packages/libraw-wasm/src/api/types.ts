import type { LinearExtractionResult, RawExtractionResult, RawProbeResult } from "@raw-core/types";

export interface RawEmbeddedJpegThumbnail {
  format: "jpeg";
  width: number;
  height: number;
  orientation: number;
  data: Uint8Array;
}

export interface LibRawAdapter {
  probe(input: ArrayBuffer): Promise<RawProbeResult>;
  extract(input: ArrayBuffer): Promise<RawExtractionResult>;
  extractLinear(input: ArrayBuffer): Promise<LinearExtractionResult>;
  extractEmbeddedThumbnail(input: ArrayBuffer): Promise<RawEmbeddedJpegThumbnail | null>;
}
