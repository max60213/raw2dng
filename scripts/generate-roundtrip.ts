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
  const extraction = await adapter.extractLinear(
    fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
  );
  const whiteLevel = findWhiteLevel(extraction.imageData);

  const blob = buildDng({
    width: extraction.width,
    height: extraction.height,
    bitDepth: 16,
    imageData: extraction.imageData,
    metadata: normalizeRawMetadata({
      width: extraction.width,
      height: extraction.height,
      bitDepth: 16,
      cfaPattern: [0, 1, 1, 2],
      blackLevel: 0,
      whiteLevel,
      activeArea: [0, 0, extraction.height, extraction.width],
      imageData: extraction.imageData,
      metadata: {
        ...extraction.metadata,
        orientation: 1
      }
    }),
    kind: "linear",
    channels: 3
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
        bitDepth: 16,
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

function findWhiteLevel(imageData: Uint16Array): number {
  let maxValue = 0;
  for (let index = 0; index < imageData.length; index += 1) {
    if (imageData[index] > maxValue) {
      maxValue = imageData[index];
    }
  }
  return Math.max(maxValue, 1);
}
