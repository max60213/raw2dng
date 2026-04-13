type GeneratedFactory = (options?: unknown) => Promise<unknown>;

export async function loadGeneratedModule(): Promise<GeneratedFactory | null> {
  try {
    const module = await import("../generated/adobeDng.js");
    return (module.default || module) as GeneratedFactory;
  } catch {
    return null;
  }
}

export type { GeneratedFactory };
