import type { AdobeDngAdapter } from "./api/types";
import { GeneratedAdobeDngAdapter } from "./bindings/generatedAdapter";
import { UnavailableAdobeDngAdapter } from "./bindings/unavailableAdapter";
import { createGeneratedRuntime } from "./loader/createGeneratedRuntime";
import { loadGeneratedModule } from "./loader/loadGeneratedModule";

export type { AdobeDngAdapter, AdobeDngEncodeInput } from "./api/types";

export async function createAdobeDngAdapter(): Promise<AdobeDngAdapter> {
  const factory = await loadGeneratedModule();
  if (!factory) {
    return new UnavailableAdobeDngAdapter();
  }

  const runtime = await createGeneratedRuntime(factory);
  return new GeneratedAdobeDngAdapter(runtime as ConstructorParameters<typeof GeneratedAdobeDngAdapter>[0]);
}
