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
    colorMatrix2: metadata.colorMatrix2,
    forwardMatrix1: metadata.forwardMatrix1,
    forwardMatrix2: metadata.forwardMatrix2,
    cameraCalibration1: metadata.cameraCalibration1,
    cameraCalibration2: metadata.cameraCalibration2,
    asShotNeutral: metadata.asShotNeutral || [1, 1, 1],
    analogBalance: metadata.analogBalance,
    calibrationIlluminant1: metadata.calibrationIlluminant1 || 21,
    calibrationIlluminant2: metadata.calibrationIlluminant2,
    baselineExposure: metadata.baselineExposure,
    opcodeList3: metadata.opcodeList3,
    blackLevel: extraction.blackLevel,
    whiteLevel: extraction.whiteLevel,
    activeArea: extraction.activeArea,
    cfaPattern: extraction.cfaPattern.map(normalizeCfaComponent) as [number, number, number, number]
  };
}

function normalizeCfaComponent(value: number): number {
  if (value === 3) {
    return 1;
  }
  if (value < 0 || value > 2) {
    return 0;
  }
  return value;
}
