import type { AdobeDngAdapter } from "./api/types";
import { GeneratedAdobeDngAdapter } from "./bindings/generatedAdapter";
import { UnavailableAdobeDngAdapter } from "./bindings/unavailableAdapter";
import { createGeneratedRuntimeNode } from "./loader/createGeneratedRuntimeNode";
import { loadGeneratedModule } from "./loader/loadGeneratedModule";

export type { AdobeDngAdapter, AdobeDngEncodeInput } from "./api/types";

export async function createAdobeDngAdapterNode(): Promise<AdobeDngAdapter> {
  const factory = await loadGeneratedModule();
  if (!factory) {
    return new UnavailableAdobeDngAdapter();
  }

  const runtime = await createGeneratedRuntimeNode(factory);
  return new GeneratedAdobeDngAdapter(runtime as ConstructorParameters<typeof GeneratedAdobeDngAdapter>[0]);
}
