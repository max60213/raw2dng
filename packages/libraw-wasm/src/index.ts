import type { LibRawAdapter } from "./api/types";
import { GeneratedLibRawAdapter } from "./bindings/generatedAdapter";
import { UnavailableLibRawAdapter } from "./bindings/unavailableAdapter";
import { loadGeneratedModule } from "./loader/loadGeneratedModule";

export type { LibRawAdapter } from "./api/types";

export async function createLibRawAdapter(): Promise<LibRawAdapter> {
  const factory = await loadGeneratedModule();
  if (!factory) {
    return new UnavailableLibRawAdapter();
  }

  const runtime = await factory({});
  return new GeneratedLibRawAdapter(runtime as unknown as ConstructorParameters<typeof GeneratedLibRawAdapter>[0]);
}
