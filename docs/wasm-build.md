# LibRaw WASM build notes

This repository does not vendor `LibRaw` sources or an `emscripten` toolchain.

Expected local prerequisites:

- `emcc`
- vendored `LibRaw` sources under `packages/libraw-wasm/cpp/libraw`

Build entrypoint:

```bash
packages/libraw-wasm/scripts/build-wasm.sh
```

Expected output:

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`
