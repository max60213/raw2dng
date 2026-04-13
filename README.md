# raw2dng

Mobile-first browser tool for converting RAW files to DNG entirely on the client.

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
