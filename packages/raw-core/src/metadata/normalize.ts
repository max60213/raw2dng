import type { NormalizedRawMetadata, RawExtractionResult } from "../types";

const DEFAULT_COLOR_MATRIX: NormalizedRawMetadata["colorMatrix1"] = [
  1.745, -0.52, -0.225,
  -0.215, 1.37, -0.155,
  0.015, -0.39, 1.375
];

export function normalizeRawMetadata(extraction: RawExtractionResult): NormalizedRawMetadata {
  const metadata = extraction.metadata;

  return {
    make: metadata.make || "Unknown",
    model: metadata.model || "Unknown",
    orientation: metadata.orientation || 1,
    colorMatrix1: metadata.colorMatrix1 || DEFAULT_COLOR_MATRIX,
    asShotNeutral: metadata.asShotNeutral || [1, 1, 1],
    calibrationIlluminant1: metadata.calibrationIlluminant1 || 21,
    blackLevel: extraction.blackLevel,
    whiteLevel: extraction.whiteLevel,
    activeArea: extraction.activeArea,
    cfaPattern: extraction.cfaPattern
  };
}
