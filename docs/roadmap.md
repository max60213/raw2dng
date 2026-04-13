# Roadmap

## Version 1

- Browser-only RAW to DNG conversion is working end-to-end.
- The current default output favors a smaller, more broadly openable DNG path.
- Validation coverage includes fixture smoke tests, browser smoke tests, and `exiftool` checks.

## Next Major Goal

### Move to Adobe DNG SDK for true Raw DNG output

The current implementation relies on:

- `LibRaw + WASM` for RAW parsing
- a custom TypeScript DNG writer for output packaging

This is enough for a working v1, but it is not the long-term target for high-fidelity RAW preservation.

The next planned direction is:

1. Integrate Adobe DNG SDK into the conversion pipeline.
2. Replace the custom output path for the primary export flow.
3. Generate true Raw DNG instead of the current fallback-oriented path.
4. Preserve more original sensor structure and camera-specific metadata.
5. Reduce color/rendering drift across external RAW editors.

## Why This Matters

The custom writer is useful for iteration speed, but it is not ideal for:

- exact RAW semantics
- consistent camera metadata handling
- cross-editor color fidelity
- long-term compatibility with professional RAW tooling

Adobe DNG SDK is the intended path for the next quality jump.
