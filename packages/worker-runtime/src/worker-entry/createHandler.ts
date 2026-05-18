import { createAdobeDngAdapter } from "../../../adobe-dng-wasm/src";
import { buildDng } from "../../../dng-writer/src";
import { createLibRawAdapter } from "../../../libraw-wasm/src";
import {
  appendEmbeddedJpegThumbnailIfd,
  appendEmbeddedThumbnailIfd,
  createEmbeddedPreview,
  normalizeRawMetadata
} from "../../../raw-core/src";
import type { WorkerRequest, WorkerResponse } from "../protocol/messages";

let adobeAdapterPromise: ReturnType<typeof createAdobeDngAdapter> | null = null;

function getAdobeAdapter() {
  if (!adobeAdapterPromise) {
    adobeAdapterPromise = createAdobeDngAdapter();
  }
  return adobeAdapterPromise;
}

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

      const extraction = await adapter.extract(message.bytes);
      const metadata = normalizeRawMetadata({
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        cfaPattern: extraction.cfaPattern,
        blackLevel: extraction.blackLevel,
        whiteLevel: extraction.whiteLevel,
        activeArea: extraction.activeArea,
        imageData: extraction.imageData,
        metadata: extraction.metadata
      });

      const adobeAdapter = await getAdobeAdapter();
      let backend: "adobe" | "legacy" = adobeAdapter.isAvailable() ? "adobe" : "legacy";

      postMessageFn({
        type: "progress",
        jobId: message.jobId,
        progress: 85,
        phase: "writing",
        message: backend === "adobe" ? "Building DNG with Adobe prototype" : "Building DNG"
      });

      let blob: Blob;
      if (backend === "adobe") {
        try {
          blob = await adobeAdapter.encode({
            width: extraction.width,
            height: extraction.height,
            bitDepth: extraction.bitDepth,
            imageData: extraction.imageData,
            metadata
          });
        } catch {
          backend = "legacy";
          blob = buildDng({
            width: extraction.width,
            height: extraction.height,
            bitDepth: extraction.bitDepth,
            imageData: extraction.imageData,
            metadata
          });
        }
      } else {
        blob = buildDng({
          width: extraction.width,
          height: extraction.height,
          bitDepth: extraction.bitDepth,
          imageData: extraction.imageData,
          metadata
        });
      }

      let outputBytes: Uint8Array | null = null;
      if (backend === "adobe") {
        const preview = createEmbeddedPreview(await adapter.extractLinear(message.bytes));
        outputBytes = appendEmbeddedThumbnailIfd(new Uint8Array(await blob.arrayBuffer()), preview);
      } else {
        const preview = await adapter.extractEmbeddedThumbnail(message.bytes).catch(() => null);
        if (preview) {
          outputBytes = appendEmbeddedJpegThumbnailIfd(new Uint8Array(await blob.arrayBuffer()), {
            width: preview.width,
            height: preview.height,
            orientation: preview.orientation,
            jpegData: preview.data
          });
        }
      }

      if (outputBytes) {
        const outputBuffer = outputBytes.buffer.slice(outputBytes.byteOffset, outputBytes.byteOffset + outputBytes.byteLength) as ArrayBuffer;
        blob = new Blob([outputBuffer], { type: blob.type || "image/x-adobe-dng" });
      }

      postMessageFn({
        type: "success",
        jobId: message.jobId,
        fileName: message.fileName,
        outputName: toDngName(message.fileName),
        probe,
        blob,
        backend
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

function toDngName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") + ".dng";
}
