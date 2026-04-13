import type { AdobeDngAdapter, AdobeDngEncodeInput } from "../api/types";

export class UnavailableAdobeDngAdapter implements AdobeDngAdapter {
  isAvailable() {
    return false;
  }

  async encode(_input: AdobeDngEncodeInput): Promise<Blob> {
    throw new Error("Adobe DNG SDK wasm runtime is unavailable.");
  }
}
