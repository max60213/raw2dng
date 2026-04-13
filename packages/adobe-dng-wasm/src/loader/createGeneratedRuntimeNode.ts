import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { GeneratedFactory } from "./loadGeneratedModule";

export async function createGeneratedRuntimeNode(factory: GeneratedFactory): Promise<unknown> {
  const wasmUrl = new URL("../generated/adobeDng.wasm", import.meta.url);
  const wasmBinary = new Uint8Array(await readFile(fileURLToPath(wasmUrl)));
  return factory({ wasmBinary });
}
