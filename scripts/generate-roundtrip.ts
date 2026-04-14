import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GeneratedLibRawAdapter } from "../packages/libraw-wasm/src/bindings/generatedAdapter";
import { createGeneratedRuntimeNode } from "../packages/libraw-wasm/src/loader/createGeneratedRuntimeNode";
import { loadGeneratedModule } from "../packages/libraw-wasm/src/loader/loadGeneratedModule";
import { createAdobeDngAdapterNode } from "../packages/adobe-dng-wasm/src/node";
import { appendEmbeddedThumbnailIfd, createEmbeddedPreview, normalizeRawMetadata } from "../packages/raw-core/src";
import { buildDng } from "../packages/dng-writer/src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main() {
  const sourceName = process.argv[2] ?? "canon-eos5d-sample.cr2";
  const outputName = process.argv[3] ?? `${sourceName.replace(/\.[^.]+$/, "")}-adobe-prototype.dng`;

  const [factory, fixture] = await Promise.all([
    loadGeneratedModule(),
    readFile(path.resolve(repoRoot, "tests/fixtures/raw", sourceName))
  ]);
  if (!factory) {
    throw new Error("Generated LibRaw wasm module is unavailable.");
  }
  const runtime = await createGeneratedRuntimeNode(factory);
  const adapter = new GeneratedLibRawAdapter(
    runtime as ConstructorParameters<typeof GeneratedLibRawAdapter>[0]
  );
  const extraction = await adapter.extract(
    fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
  );

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

  const adobeAdapter = await createAdobeDngAdapterNode();
  const blob = adobeAdapter.isAvailable()
    ? await adobeAdapter.encode({
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        imageData: extraction.imageData,
        metadata
      })
    : buildDng({
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        imageData: extraction.imageData,
        metadata
      });

  let outputBytes = new Uint8Array(await blob.arrayBuffer());
  try {
    const linear = await adapter.extractLinear(
      fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
    );
    outputBytes = appendEmbeddedThumbnailIfd(outputBytes, createEmbeddedPreview(linear));
  } catch {
    // keep base DNG bytes when a preview cannot be rendered
  }

  const outputBuffer = Buffer.from(outputBytes.buffer.slice(outputBytes.byteOffset, outputBytes.byteOffset + outputBytes.byteLength) as ArrayBuffer);
  const outputPath = path.resolve(repoRoot, "tests/expected", outputName);
  await writeFile(outputPath, outputBuffer);

  process.stdout.write(
    JSON.stringify(
      {
        sourceName,
        outputName,
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        make: extraction.metadata.make,
        model: extraction.metadata.model,
        outputBytes: outputBuffer.length,
        backend: adobeAdapter.isAvailable() ? "adobe" : "legacy"
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
