import type { NormalizedRawMetadata } from "@raw-core/types";

export interface AdobeDngEncodeInput {
  width: number;
  height: number;
  bitDepth: number;
  imageData: Uint16Array;
  metadata: NormalizedRawMetadata;
}

export interface AdobeDngAdapter {
  isAvailable(): boolean;
  encode(input: AdobeDngEncodeInput): Promise<Blob>;
}
