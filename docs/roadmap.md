# Roadmap

## Version 1

- Browser-only RAW to DNG conversion is working end-to-end.
- `LibRaw + WASM` extraction pipeline is integrated into the worker runtime.
- Validation coverage includes fixture smoke tests, browser smoke tests, and `exiftool` checks.

## Completed Milestone

### Adobe DNG SDK integration for true Raw DNG output

This milestone is now completed:

- Added a dedicated `packages/adobe-dng-wasm` package and generated WASM runtime.
- Integrated Adobe DNG SDK encoding in `worker-runtime` as the preferred backend.
- Kept the legacy TypeScript writer as a runtime fallback for availability and recovery safety.
- Added integration coverage for Adobe DNG WASM fixture conversion.

## Next Focus

### Stabilization and quality hardening

1. Improve cross-editor compatibility for Adobe-generated DNG outputs.
2. Reduce quality and metadata drift between camera models.
3. Tighten fallback behavior and observability for backend selection.
4. Expand regression validation across fixtures and external tools.

## Why This Matters

The Adobe DNG SDK milestone closes the core architecture gap, but output quality still depends on iterative validation and metadata tuning. This phase is focused on:

- consistent behavior across editors
- camera-specific metadata fidelity
- predictable conversion outcomes in browser-only workflows
