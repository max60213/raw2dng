# Architecture

## Product direction

This implementation is optimized for mobile browsers first:

- single-worker processing on constrained devices
- strict file-size gating before allocation
- no server-side fallback
- explicit failure when the native RAW runtime is missing

## Runtime flow

1. Main thread detects device capability and upload limits.
2. User drops or selects files.
3. Accepted files become queued conversion tasks.
4. A dedicated worker receives one task at a time on mobile, or limited concurrency on larger devices.
5. The worker asks the `LibRaw` adapter to probe and extract raw payload.
6. `raw-core` normalizes metadata.
7. `dng-writer` builds a DNG blob in-browser.
8. Main thread exposes downloads and error states.

## Key design choice

The DNG writer is implemented in TypeScript and does not depend on `LibRaw`. `LibRaw` is only responsible for extracting raw sensor payload and metadata. This keeps the browser pipeline testable even before the native WASM bundle is compiled.
