# raw2dng

Mobile-first browser tool for converting RAW files to DNG entirely on the client.

## Current status

- Mobile-safe queue, capability gating, worker protocol, and DNG writer are implemented.
- `LibRaw` is integrated as a pluggable WASM adapter boundary.
- Real `LibRaw -> WebAssembly` binaries are not vendored in this repository yet.
- Without the generated WASM bundle, the UI still runs and reports that conversion runtime is unavailable instead of pretending conversion succeeded.

## Commands

```bash
npm install
npm run dev
npm run check
```

## Project layout

- `apps/web`: mobile-first React app
- `packages/raw-core`: task models, capability heuristics, normalization
- `packages/dng-writer`: browser-side DNG writer
- `packages/libraw-wasm`: LibRaw adapter boundary and WASM loader
- `packages/worker-runtime`: worker message contracts and conversion orchestration

## LibRaw WASM

To enable real conversion, provide a generated Emscripten build at:

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`

The build hook is scaffolded in `packages/libraw-wasm/scripts/build-wasm.sh`.
