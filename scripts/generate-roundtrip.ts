import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GeneratedLibRawAdapter } from "../packages/libraw-wasm/src/bindings/generatedAdapter";
import { createGeneratedRuntimeNode } from "../packages/libraw-wasm/src/loader/createGeneratedRuntimeNode";
import { loadGeneratedModule } from "../packages/libraw-wasm/src/loader/loadGeneratedModule";
import { createAdobeDngAdapterNode } from "../packages/adobe-dng-wasm/src/node";
import {
  appendEmbeddedJpegThumbnailIfd,
  appendEmbeddedThumbnailIfd,
  createEmbeddedPreview,
  normalizeRawMetadata
} from "../packages/raw-core/src";
import { buildDng } from "../packages/dng-writer/src";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const defaultFixture = "canon-eos5d-sample.cr2";

async function main() {
  const sourceArg = process.argv[2];
  const outputArg = process.argv[3];
  const sourcePath = await resolveSourcePath(sourceArg);
  const sourceName = path.basename(sourcePath);
  const outputPath = resolveOutputPath(sourcePath, outputArg);
  const outputName = displayPath(outputPath);

  const [factory, fixture] = await Promise.all([
    loadGeneratedModule(),
    readFile(sourcePath)
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
  const useAdobe = adobeAdapter.isAvailable();
  const blob = useAdobe
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
  if (useAdobe) {
    const linear = await adapter.extractLinear(
      fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
    );
    outputBytes = appendEmbeddedThumbnailIfd(outputBytes, createEmbeddedPreview(linear));
  } else {
    const embeddedThumbnail = await adapter.extractEmbeddedThumbnail(
      fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength)
    ).catch(() => null);

    if (embeddedThumbnail) {
      outputBytes = appendEmbeddedJpegThumbnailIfd(outputBytes, {
        width: embeddedThumbnail.width,
        height: embeddedThumbnail.height,
        orientation: embeddedThumbnail.orientation,
        jpegData: embeddedThumbnail.data
      });
    }
  }

  const outputBuffer = Buffer.from(outputBytes.buffer.slice(outputBytes.byteOffset, outputBytes.byteOffset + outputBytes.byteLength) as ArrayBuffer);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, outputBuffer);

  process.stdout.write(
    JSON.stringify(
      {
        sourceName: displayPath(sourcePath),
        outputName,
        width: extraction.width,
        height: extraction.height,
        bitDepth: extraction.bitDepth,
        make: extraction.metadata.make,
        model: extraction.metadata.model,
        outputBytes: outputBuffer.length,
        backend: useAdobe ? "adobe" : "legacy"
      },
      null,
      2
    )
  );
}

function resolveOutputPath(sourcePath: string, outputArg: string | undefined): string {
  if (!outputArg) {
    const outputName = `${path.basename(sourcePath).replace(/\.[^.]+$/, "")}.dng`;
    return path.resolve(repoRoot, "tests/expected", outputName);
  }

  if (path.isAbsolute(outputArg)) {
    return outputArg;
  }

  if (outputArg.includes("/") || outputArg.includes(path.sep)) {
    return path.resolve(repoRoot, outputArg);
  }

  return path.resolve(repoRoot, "tests/expected", outputArg);
}

async function resolveSourcePath(sourceArg: string | undefined): Promise<string> {
  if (!sourceArg) {
    return path.resolve(repoRoot, "tests/fixtures/raw", defaultFixture);
  }

  const candidates = [path.resolve(repoRoot, sourceArg)];
  if (path.isAbsolute(sourceArg)) {
    candidates.unshift(sourceArg);
  } else {
    candidates.push(path.resolve(repoRoot, "tests/fixtures/raw", sourceArg));
  }

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Input RAW file not found. Tried:\n- ${candidates.join("\n- ")}`
  );
}

function displayPath(filePath: string): string {
  const relative = path.relative(repoRoot, filePath);
  return relative.startsWith("..") ? filePath : relative;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
