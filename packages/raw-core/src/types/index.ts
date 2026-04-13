export type TaskPhase =
  | "queued"
  | "gated"
  | "probing"
  | "extracting"
  | "writing"
  | "complete"
  | "error";

export interface CapabilityProfile {
  formFactor: "mobile" | "desktop";
  hardwareConcurrency: number;
  deviceMemoryGb?: number;
  maxConcurrentJobs: number;
  maxBatchItems: number;
  maxFileBytes: number;
  recommendedMaxPixels: number;
  notes: string[];
  supportsFileSystemAccess: boolean;
}

export interface GateDecision {
  accepted: boolean;
  reason?: string;
  warning?: string;
}

export interface ConversionTask {
  id: string;
  fileName: string;
  size: number;
  status: TaskPhase;
  progress: number;
  message: string;
  outputFileName?: string;
  outputBlob?: Blob;
  error?: string;
  warning?: string;
}

export interface RawProbeResult {
  supported: boolean;
  formatHint: string;
  width?: number;
  height?: number;
  bitDepth?: number;
  fileSize: number;
  reason?: string;
}

export interface RawCameraMetadata {
  make: string;
  model: string;
  orientation: number;
  colorMatrix1: [number, number, number, number, number, number, number, number, number];
  colorMatrix2?: [number, number, number, number, number, number, number, number, number];
  forwardMatrix1?: [number, number, number, number, number, number, number, number, number];
  forwardMatrix2?: [number, number, number, number, number, number, number, number, number];
  cameraCalibration1?: [number, number, number, number, number, number, number, number, number];
  cameraCalibration2?: [number, number, number, number, number, number, number, number, number];
  asShotNeutral: [number, number, number];
  analogBalance?: [number, number, number];
  calibrationIlluminant1: number;
  calibrationIlluminant2?: number;
  baselineExposure?: number;
  opcodeList3?: Uint8Array;
}

export interface RawExtractionResult {
  width: number;
  height: number;
  bitDepth: number;
  cfaPattern: [number, number, number, number];
  blackLevel: number;
  whiteLevel: number;
  activeArea: [number, number, number, number];
  imageData: Uint16Array;
  metadata: RawCameraMetadata;
}

export interface NormalizedRawMetadata {
  make: string;
  model: string;
  orientation: number;
  colorMatrix1: [number, number, number, number, number, number, number, number, number];
  colorMatrix2?: [number, number, number, number, number, number, number, number, number];
  forwardMatrix1?: [number, number, number, number, number, number, number, number, number];
  forwardMatrix2?: [number, number, number, number, number, number, number, number, number];
  cameraCalibration1?: [number, number, number, number, number, number, number, number, number];
  cameraCalibration2?: [number, number, number, number, number, number, number, number, number];
  asShotNeutral: [number, number, number];
  analogBalance?: [number, number, number];
  calibrationIlluminant1: number;
  calibrationIlluminant2?: number;
  baselineExposure?: number;
  opcodeList3?: Uint8Array;
  blackLevel: number;
  whiteLevel: number;
  activeArea: [number, number, number, number];
  cfaPattern: [number, number, number, number];
}

export interface DngBuildInput {
  width: number;
  height: number;
  bitDepth: number;
  imageData: Uint16Array;
  metadata: NormalizedRawMetadata;
}
