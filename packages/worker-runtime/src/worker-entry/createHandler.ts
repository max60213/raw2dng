import { createAdobeDngAdapter } from "../../../adobe-dng-wasm/src";
import { buildDng } from "../../../dng-writer/src";
import { createLibRawAdapter } from "../../../libraw-wasm/src";
import { appendEmbeddedJpegThumbnailIfd, normalizeRawMetadata } from "../../../raw-core/src";
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

      const preview = await adapter.extractEmbeddedThumbnail(message.bytes).catch(() => null);

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

      if (preview) {
        const outputBytes = appendEmbeddedJpegThumbnailIfd(new Uint8Array(await blob.arrayBuffer()), {
          width: preview.width,
          height: preview.height,
          orientation: preview.orientation,
          jpegData: preview.data
        });
        const outputBuffer = outputBytes.buffer.slice(outputBytes.byteOffset, outputBytes.byteOffset + outputBytes.byteLength) as ArrayBuffer;
        blob = new Blob([outputBuffer], { type: blob.type || "image/x-adobe-dng" });
      }

      postMessageFn({
        type: "success",
        jobId: message.jobId,
        fileName: message.fileName,
        outputName: message.fileName.replace(/\.[^.]+$/, backend === "adobe" ? "-adobe-prototype.dng" : ".dng"),
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
