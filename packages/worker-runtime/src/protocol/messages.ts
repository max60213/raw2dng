import type { RawProbeResult } from "@raw-core/types";

export interface ConvertJobRequest {
  type: "convert";
  jobId: string;
  fileName: string;
  bytes: ArrayBuffer;
}

export interface RuntimePingRequest {
  type: "ping";
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

export interface RuntimeReady {
  type: "ready";
}

export interface RuntimeUnavailable {
  type: "runtime-error";
  error: string;
}

export type WorkerRequest = ConvertJobRequest | RuntimePingRequest;
export type WorkerResponse =
  | ConvertJobProgress
  | ConvertJobSuccess
  | ConvertJobFailure
  | RuntimeReady
  | RuntimeUnavailable;
