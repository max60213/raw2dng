# raw2dng

[繁體中文版 README](./README.zh-TW.md)

Website: https://raw2dng.maxlin.tw

This project exists so RAW files can be handled on mobile devices too.

Many professional tools that handle RAW files well are paid, such as Lightroom or Photomator. Converting RAW files into the open DNG format makes them usable in a much wider range of software.

P.S. This tool is specifically motivated by Google Snapseed. Snapseed is genuinely free and great to use, but its RAW support is limited enough that it pushed me to build this converter.

## Current status

- Mobile-safe queue, capability gating, worker protocol, and DNG writer are implemented.
- `LibRaw` is compiled to WebAssembly and committed under `packages/libraw-wasm/src/generated`.
- Adobe DNG SDK WebAssembly integration is completed under `packages/adobe-dng-wasm`.
- The primary export flow now prefers the Adobe DNG SDK backend and falls back to the legacy writer when runtime availability or encoding fails.
- The repository still keeps an experimental `Linear Raw / Linear DNG` path for ongoing quality work.

## Commands

```bash
npm install
npm run dev
npm run check
```

## Browser smoke

Run a real browser smoke check with the committed Canon fixture:

```bash
bash scripts/browser-smoke.sh
```

Playwright session artifacts are written under `.playwright-cli/` and ignored by git.

Inspect round-trip DNG metadata with `exiftool`:

```bash
bash scripts/exiftool-smoke.sh
```

## Roadmap

Future plans are tracked in [docs/roadmap.md](./docs/roadmap.md).
The Adobe DNG SDK integration milestone is done. The next phase focuses on compatibility hardening, output consistency, and quality validation across editors.

## Project layout

- `apps/web`: mobile-first React app
- `packages/raw-core`: task models, capability heuristics, normalization
- `packages/dng-writer`: browser-side DNG writer
- `packages/libraw-wasm`: LibRaw adapter boundary and WASM loader
- `packages/adobe-dng-wasm`: Adobe DNG SDK WASM adapter and runtime loader
- `packages/worker-runtime`: worker message contracts and conversion orchestration

## WASM artifacts

Generated artifacts are committed at:

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`
- `packages/adobe-dng-wasm/src/generated/adobeDng.js`
- `packages/adobe-dng-wasm/src/generated/adobeDng.wasm`

To rebuild them locally, activate emsdk and run:

```bash
source .tools/emsdk/emsdk_env.sh
bash packages/libraw-wasm/scripts/build-wasm.sh
bash packages/adobe-dng-wasm/scripts/build-wasm.sh
```
