# Repository Guidelines

## Project Structure & Module Organization

- `apps/web/`: React + Vite client app. Main UI lives under `src/`, static assets under `public/`.
- `packages/raw-core/`: shared domain types, capability gating, metadata normalization.
- `packages/libraw-wasm/`: LibRaw bridge, generated WASM runtime, and build script.
- `packages/dng-writer/`: DNG/TIFF encoding logic.
- `packages/worker-runtime/`: worker protocol and conversion pipeline.
- `tests/integration/`: Vitest coverage for fixture, metadata, worker, and writer behavior.
- `tests/fixtures/raw/`: committed public RAW/DNG samples used for repeatable validation.
- `scripts/`: repo-local smoke and inspection helpers.

## Build, Test, and Development Commands

- `npm run dev`: start the Vite app locally.
- `npm run build`: produce a production bundle in `dist/`.
- `npm run test`: run Vitest with the repo config.
- `npm run check`: run typecheck, tests, and build together.
- `npm run inspect:roundtrip -- <input> <output>`: generate a round-trip DNG for inspection.
- `bash scripts/browser-smoke.sh`: run a Playwright browser smoke flow with a real RAW fixture.
- `bash scripts/exiftool-smoke.sh`: generate a round-trip DNG and inspect key metadata with `exiftool`.
- `source .tools/emsdk/emsdk_env.sh && bash packages/libraw-wasm/scripts/build-wasm.sh`: rebuild the LibRaw WASM artifacts.

## Coding Style & Naming Conventions

- Use TypeScript with strict types and 2-space indentation.
- Prefer small, explicit functions over hidden magic in the conversion pipeline.
- Keep browser-facing paths ESM-safe; use `node:` imports only in clearly server-side helpers.
- Use descriptive filenames: `createHandler.ts`, `normalize.ts`, `buildDng.ts`.
- Do not introduce new dependencies unless clearly justified.

## Testing Guidelines

- Framework: `Vitest`.
- Add or update integration tests for any change to WASM bridge behavior, metadata mapping, or DNG output.
- Test files should end in `.test.ts`.
- Validate both structure and behavior: fixture smoke, `exiftool -validate`, and browser smoke are all relevant here.

## Commit & Pull Request Guidelines

- Use Conventional Commits, e.g. `fix: write structurally valid DNG tags`.
- Keep Lore trailers in the commit body when they add value: `Constraint:`, `Rejected:`, `Confidence:`, `Scope-risk:`, `Directive:`, `Tested:`.
- PRs should explain the user-visible impact, validation performed, and whether output changed for RAW fixtures. Include screenshots or viewer comparisons when color/rendering changes.

## Security & Configuration Tips

- All processing is client-side; do not add server upload paths without explicit approval.
- Treat generated DNGs in `tests/expected/*.dng` as disposable artifacts; keep source fixtures under version control, not derivative outputs.
