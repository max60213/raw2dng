# raw2dng

This project exists so RAW files can be handled on mobile devices too.

Many professional tools that handle RAW files well are paid, such as Lightroom or Photomator. Converting RAW files into the open DNG format makes them usable in a much wider range of software.

P.S. This tool is specifically motivated by Google Snapseed. Snapseed is genuinely free and great to use, but its RAW support is limited enough that it pushed me to build this converter.

## Current status

- Mobile-safe queue, capability gating, worker protocol, and DNG writer are implemented.
- `LibRaw` is compiled to WebAssembly and committed under `packages/libraw-wasm/src/generated`.
- The browser bundle can load the real `LibRaw` runtime instead of the placeholder unavailable adapter.

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
The next major direction is moving the primary export flow to Adobe DNG SDK so the project can produce true Raw DNG instead of relying on the current custom output path.

## Project layout

- `apps/web`: mobile-first React app
- `packages/raw-core`: task models, capability heuristics, normalization
- `packages/dng-writer`: browser-side DNG writer
- `packages/libraw-wasm`: LibRaw adapter boundary and WASM loader
- `packages/worker-runtime`: worker message contracts and conversion orchestration

## LibRaw WASM

Generated artifacts are committed at:

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`

To rebuild them locally, activate emsdk and run:

```bash
source .tools/emsdk/emsdk_env.sh
bash packages/libraw-wasm/scripts/build-wasm.sh
```
