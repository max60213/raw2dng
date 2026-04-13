import type { RawProbeResult } from "@raw-core/types";

export interface ConvertJobRequest {
  type: "convert";
  jobId: string;
  fileName: string;
  bytes: ArrayBuffer;
}

export interface ConvertJobProgress {
  type: "progress";
  jobId: string;
  progress: number;
  phase: "probing" | "extracting" | "writing";
  message: string;
}

export interface ConvertJobSuccess {
  type: "success";
  jobId: string;
  fileName: string;
  outputName: string;
  probe: RawProbeResult;
  blob: Blob;
}

export interface ConvertJobFailure {
  type: "failure";
  jobId: string;
  fileName: string;
  error: string;
}

export type WorkerRequest = ConvertJobRequest;
export type WorkerResponse = ConvertJobProgress | ConvertJobSuccess | ConvertJobFailure;
