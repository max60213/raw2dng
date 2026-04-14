// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createAdobeDngAdapterNode } from "../../packages/adobe-dng-wasm/src/node";
import { GeneratedLibRawAdapter } from "../../packages/libraw-wasm/src/bindings/generatedAdapter";
import { createGeneratedRuntimeNode } from "../../packages/libraw-wasm/src/loader/createGeneratedRuntimeNode";
import { loadGeneratedModule } from "../../packages/libraw-wasm/src/loader/loadGeneratedModule";
import { normalizeRawMetadata } from "../../packages/raw-core/src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

describe("Adobe DNG wasm prototype", () => {
  it("encodes a Canon CR2 sample into a readable DNG", async () => {
    const libraw = await createAdapter();
    const fixture = await readFixture("canon-eos5d-sample.cr2");
    const extraction = await libraw.extract(fixture);
    const adapter = await createAdobeDngAdapterNode();
    if (!adapter.isAvailable()) {
      return;
    }

    const blob = await adapter.encode({
      width: extraction.width,
      height: extraction.height,
      bitDepth: extraction.bitDepth,
      imageData: extraction.imageData,
      metadata: normalizeRawMetadata(extraction)
    });

    expect(blob.size).toBeGreaterThan(1024);

    const bytes = await blob.arrayBuffer();
    const probe = await libraw.probe(bytes);
    expect(probe.supported).toBe(true);
    expect(probe.width).toBe(extraction.width);
    expect(probe.height).toBe(extraction.height);
  }, 120_000);
});

async function createAdapter() {
  const factory = await loadGeneratedModule();
  if (!factory) {
    throw new Error("Generated LibRaw wasm module is unavailable.");
  }
  const runtime = await createGeneratedRuntimeNode(factory);
  return new GeneratedLibRawAdapter(
    runtime as ConstructorParameters<typeof GeneratedLibRawAdapter>[0]
  );
}

async function readFixture(fileName: string): Promise<ArrayBuffer> {
  const buffer = await readFile(path.resolve(repoRoot, "tests/fixtures/raw", fileName));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
