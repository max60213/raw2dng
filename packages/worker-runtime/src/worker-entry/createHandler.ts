import { buildDng } from "../../../dng-writer/src";
import { createLibRawAdapter } from "../../../libraw-wasm/src";
import { normalizeRawMetadata } from "../../../raw-core/src";
import type { WorkerRequest, WorkerResponse } from "../protocol/messages";

export function createWorkerHandler(postMessageFn: (message: WorkerResponse) => void) {
  return async function handleMessage(message: WorkerRequest): Promise<void> {
    if (message.type !== "convert") {
      return;
    }

    try {
      const adapter = await createLibRawAdapter();

      postMessageFn({
        type: "progress",
        jobId: message.jobId,
        progress: 20,
        phase: "probing",
        message: "Checking RAW file"
      });

      const probe = await adapter.probe(message.bytes);

      postMessageFn({
        type: "progress",
        jobId: message.jobId,
        progress: 55,
        phase: "extracting",
        message: "Extracting sensor payload"
      });

      const extraction = await adapter.extract(message.bytes);
      const metadata = normalizeRawMetadata(extraction);

      postMessageFn({
        type: "progress",
        jobId: message.jobId,
        progress: 85,
        phase: "writing",
        message: "Building DNG"
      });

      const blob = buildDng({
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        imageData: extraction.imageData,
        metadata
      });

      postMessageFn({
        type: "success",
        jobId: message.jobId,
        fileName: message.fileName,
        outputName: message.fileName.replace(/\.[^.]+$/, ".dng"),
        probe,
        blob
      });
    } catch (error) {
      postMessageFn({
        type: "failure",
        jobId: message.jobId,
        fileName: message.fileName,
        error: error instanceof Error ? error.message : "Unknown conversion failure"
      });
    }
  };
}
