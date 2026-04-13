import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLibRawAdapter } from "../packages/libraw-wasm/src";
import { normalizeRawMetadata } from "../packages/raw-core/src";
import { buildDng } from "../packages/dng-writer/src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function main() {
  const sourceName = process.argv[2] ?? "canon-eos5d-sample.cr2";
  const outputName = process.argv[3] ?? `${sourceName.replace(/\.[^.]+$/, "")}-roundtrip.dng`;

  const [adapter, fixture] = await Promise.all([
    createLibRawAdapter(),
    readFile(path.resolve(repoRoot, "tests/fixtures/raw", sourceName))
  ]);
  const extraction = await adapter.extract(
    fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
  );

  const blob = buildDng({
    width: extraction.width,
    height: extraction.height,
    bitDepth: extraction.bitDepth,
    imageData: extraction.imageData,
    metadata: normalizeRawMetadata({
      width: extraction.width,
      height: extraction.height,
      bitDepth: extraction.bitDepth,
      cfaPattern: extraction.cfaPattern,
      blackLevel: extraction.blackLevel,
      whiteLevel: extraction.whiteLevel,
      activeArea: extraction.activeArea,
      imageData: extraction.imageData,
      metadata: extraction.metadata
    })
  });

  const outputBuffer = Buffer.from(await blob.arrayBuffer());
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
        outputBytes: outputBuffer.length
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
