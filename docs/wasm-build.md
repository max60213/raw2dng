# LibRaw WASM build notes

This repository vendors `LibRaw` sources and commits generated WASM artifacts.

Expected local prerequisites:

- `emcc`
- activated emsdk environment

Build entrypoint:

```bash
packages/libraw-wasm/scripts/build-wasm.sh
```

Expected output:

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`
