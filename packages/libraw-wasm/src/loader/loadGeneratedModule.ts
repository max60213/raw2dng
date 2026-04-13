type GeneratedFactory = (options?: unknown) => Promise<unknown>;

export async function loadGeneratedModule(): Promise<GeneratedFactory | null> {
  try {
    const modulePath = "../generated/libraw.js";
    const module = await import(/* @vite-ignore */ modulePath);
    return (module.default || module) as GeneratedFactory;
  } catch {
    return null;
  }
}
