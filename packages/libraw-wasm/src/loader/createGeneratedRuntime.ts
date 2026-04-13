import type { GeneratedFactory } from "./loadGeneratedModule";

export async function createGeneratedRuntime(factory: GeneratedFactory): Promise<unknown> {
  const wasmBinary = await loadWasmBinary();
  const wasmBytes = toArrayBuffer(wasmBinary);

  return factory({
    wasmBinary,
    instantiateWasm(info: Record<string, unknown>, receiveInstance: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void) {
      const env = ((info as { env?: Record<string, WebAssembly.ImportValue>; a?: Record<string, WebAssembly.ImportValue> }).env
        ?? (info as { a?: Record<string, WebAssembly.ImportValue> }).a
        ?? {}) as Record<string, WebAssembly.ImportValue>;

      const imports = {
        env,
        a: env
      } as WebAssembly.Imports;

      WebAssembly.instantiate(wasmBytes, imports).then((result) => {
        receiveInstance(result.instance, result.module);
      });

      return {};
    }
  });
}

async function loadWasmBinary(): Promise<Uint8Array> {
  if (typeof window === "undefined" && typeof process !== "undefined") {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const url = new URL("../generated/libraw.wasm", import.meta.url);
    return new Uint8Array(await readFile(fileURLToPath(url)));
  }

  const url = new URL("../generated/libraw.wasm", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load LibRaw wasm: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
