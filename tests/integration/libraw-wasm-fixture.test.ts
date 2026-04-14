// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildDng } from "../../packages/dng-writer/src";
import { GeneratedLibRawAdapter } from "../../packages/libraw-wasm/src/bindings/generatedAdapter";
import { createGeneratedRuntimeNode } from "../../packages/libraw-wasm/src/loader/createGeneratedRuntimeNode";
import { loadGeneratedModule } from "../../packages/libraw-wasm/src/loader/loadGeneratedModule";
import { normalizeRawMetadata } from "../../packages/raw-core/src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

describe("LibRaw WASM real fixtures", () => {
  it("probes and extracts an iPhone DNG sample", async () => {
    const adapter = await createAdapter();
    const fixture = await readFixture("iphone8-sample.dng");
    const probe = await adapter.probe(fixture);
    expect(probe.supported).toBe(true);
    expect(probe.width).toBeGreaterThan(0);
    expect(probe.height).toBeGreaterThan(0);

    const extraction = await adapter.extract(fixture);
    expect(extraction.width).toBeGreaterThan(0);
    expect(extraction.height).toBeGreaterThan(0);
    expect(extraction.imageData.length).toBe(extraction.width * extraction.height);
    expect(extraction.metadata.colorMatrix2).toBeDefined();
    expect(extraction.metadata.baselineExposure).toBeDefined();
    expect(extraction.metadata.opcodeList3?.byteLength).toBeGreaterThan(0);

    const output = buildDng({
      width: extraction.width,
      height: extraction.height,
      bitDepth: extraction.bitDepth,
      imageData: extraction.imageData,
      metadata: normalizeRawMetadata(extraction)
    });

    expect(output.size).toBeGreaterThan(1024);

    const roundTripBytes = await output.arrayBuffer();
    const roundTripProbe = await adapter.probe(roundTripBytes);
    expect(roundTripProbe.supported).toBe(true);
    expect(roundTripProbe.width).toBe(extraction.width);
    expect(roundTripProbe.height).toBe(extraction.height);

    const roundTripExtraction = await adapter.extract(roundTripBytes);
    expect(roundTripExtraction.width).toBe(extraction.width);
    expect(roundTripExtraction.height).toBe(extraction.height);
  }, 60_000);

  it("probes and extracts a Canon CR2 sample", async () => {
    const adapter = await createAdapter();
    const fixture = await readFixture("canon-eos5d-sample.cr2");
    const probe = await adapter.probe(fixture);
    expect(probe.supported).toBe(true);
    expect(probe.width).toBeGreaterThan(0);
    expect(probe.height).toBeGreaterThan(0);

    const extraction = await adapter.extract(fixture);
    expect(extraction.width).toBeGreaterThan(0);
    expect(extraction.height).toBeGreaterThan(0);
    expect(extraction.metadata.make.toLowerCase()).toContain("canon");
    expect(extraction.imageData.length).toBe(extraction.width * extraction.height);
  }, 60_000);

  it("can build a linear DNG from a Canon CR2 sample", async () => {
    const adapter = await createAdapter();
    const fixture = await readFixture("canon-eos5d-sample.cr2");
    const linear = await adapter.extractLinear(fixture);
    expect(linear.channels).toBe(3);
    expect(linear.bitDepth).toBe(16);
    expect(linear.imageData.length).toBe(linear.width * linear.height * 3);

    const output = buildDng({
      width: linear.width,
      height: linear.height,
      bitDepth: 16,
      imageData: linear.imageData,
      metadata: normalizeRawMetadata({
        width: linear.width,
        height: linear.height,
        bitDepth: 16,
        cfaPattern: [0, 1, 1, 2],
        blackLevel: 0,
        whiteLevel: 0xffff,
        activeArea: [0, 0, linear.height, linear.width],
        imageData: linear.imageData,
        metadata: linear.metadata
      }),
      kind: "linear",
      channels: 3
    });

    const bytes = new Uint8Array(await output.arrayBuffer());
    expect(bytes[0]).toBe(0x49);
    expect(bytes[1]).toBe(0x49);
    expect(bytes[2]).toBe(42);
    expect(output.size).toBeGreaterThan(1024);
  }, 60_000);

  it("extracts the source embedded JPEG thumbnail from Canon CR2", async () => {
    const adapter = await createAdapter();
    const fixture = await readFixture("canon-eos5d-sample.cr2");
    const thumbnail = await adapter.extractEmbeddedThumbnail(fixture);
    expect(thumbnail).not.toBeNull();
    expect(thumbnail?.format).toBe("jpeg");
    expect(thumbnail?.width ?? 0).toBeGreaterThan(0);
    expect(thumbnail?.height ?? 0).toBeGreaterThan(0);
    expect(thumbnail?.data?.[0]).toBe(0xff);
    expect(thumbnail?.data?.[1]).toBe(0xd8);
  }, 60_000);
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
