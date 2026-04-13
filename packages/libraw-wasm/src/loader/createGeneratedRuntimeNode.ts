import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { GeneratedFactory } from "./loadGeneratedModule";

export async function createGeneratedRuntimeNode(
  factory: GeneratedFactory
): Promise<unknown> {
  const wasmUrl = new URL("../generated/libraw.wasm", import.meta.url);
  const wasmBinary = new Uint8Array(await readFile(fileURLToPath(wasmUrl)));
  const wasmBytes = wasmBinary.buffer.slice(
    wasmBinary.byteOffset,
    wasmBinary.byteOffset + wasmBinary.byteLength
  ) as ArrayBuffer;

  return factory({
    wasmBinary,
    instantiateWasm(
      info: Record<string, unknown>,
      receiveInstance: (
        instance: WebAssembly.Instance,
        module: WebAssembly.Module
      ) => void
    ) {
      const env = ((info as {
        env?: Record<string, WebAssembly.ImportValue>;
        a?: Record<string, WebAssembly.ImportValue>;
      }).env ??
        (info as { a?: Record<string, WebAssembly.ImportValue> }).a ??
        {}) as Record<string, WebAssembly.ImportValue>;

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
