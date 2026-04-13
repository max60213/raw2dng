import type { GeneratedFactory } from "./loadGeneratedModule";

export async function createGeneratedRuntime(factory: GeneratedFactory): Promise<unknown> {
  const url = new URL("../generated/adobeDng.wasm", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load Adobe DNG wasm: ${response.status} ${response.statusText}`);
  }

  const wasmBinary = new Uint8Array(await response.arrayBuffer());
  return factory({ wasmBinary });
}
