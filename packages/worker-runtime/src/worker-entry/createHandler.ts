import { buildDng } from "../../../dng-writer/src";
import { createLibRawAdapter } from "../../../libraw-wasm/src";
import { normalizeRawMetadata } from "../../../raw-core/src";
import type { WorkerRequest, WorkerResponse } from "../protocol/messages";

export function createWorkerHandler(postMessageFn: (message: WorkerResponse) => void) {
  return async function handleMessage(message: WorkerRequest): Promise<void> {
    if (message.type === "ping") {
      try {
        await createLibRawAdapter();
        postMessageFn({ type: "ready" });
      } catch (error) {
        postMessageFn({
          type: "runtime-error",
          error: error instanceof Error ? error.message : "Unknown worker runtime failure"
        });
      }
      return;
    }

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

      const extraction = await adapter.extractLinear(message.bytes);
      const whiteLevel = findWhiteLevel(extraction.imageData);
      const metadata = normalizeRawMetadata({
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        cfaPattern: [0, 1, 1, 2],
        blackLevel: 0,
        whiteLevel,
        activeArea: [0, 0, extraction.height, extraction.width],
        imageData: extraction.imageData,
        metadata: {
          ...extraction.metadata,
          orientation: 1
        }
      });

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
        bitDepth: 16,
        imageData: extraction.imageData,
        metadata,
        kind: "linear",
        channels: 3
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

function findWhiteLevel(imageData: Uint16Array): number {
  let maxValue = 0;
  for (let index = 0; index < imageData.length; index += 1) {
    if (imageData[index] > maxValue) {
      maxValue = imageData[index];
    }
  }
  return Math.max(maxValue, 1);
}
