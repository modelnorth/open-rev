# OpenRev Known Limitations

**Version**: `0.1.0-alpha.1` · **Updated**: 2026-08-02

This document is the honest ledger of what OpenRev does **not** do yet, what is
experimental, and what is blocked on this machine. Nothing here is hidden behind a
success claim.

---

## 1. Blocked on this machine (gates G11–G15)

These features are implemented with **real** adapters/paths, but the external
prerequisite is absent locally, so the success path has not been end-to-end verified.

| Feature | Prerequisite | Status here |
|---|---|---|
| jadx decompilation (`provider.jadx`, `static.decompile`) | `jadx` binary or Docker + `DOCKER_JADX_IMAGE` | `TOOL_NOT_FOUND` path tested; success path unverified |
| apktool decode (`provider.apktool`) | `apktool` binary or Docker + `DOCKER_APKTOOL_IMAGE` | `TOOL_NOT_FOUND` path tested; success path unverified |
| Ghidra headless symbols (`provider.ghidra`, `AnalyzeNative`) | `analyzeHeadless` on PATH | `TOOL_NOT_FOUND` path tested; success path unverified |
| Device runtime (`provider.adb`, `device.inspect`) | connected Android device | `adb devices -l` path tested; 0 devices present, install/logcat/dumpsys unverified on a real device |
| AI copilot / RAG | LLM provider (API key or local model) | experimental; never faked |
| Cross-platform CI green | GitHub Actions run | pending (CI configured for ubuntu/windows/macos × Node 22/24) |

## 2. Experimental areas (never claim as production)

- **`packages/ui` (React/Vite)**: the browser bundle cannot include `node:*` core
  modules (Zip reader, `node:sqlite`, adapters). `vite build` fails with
  `"promisify" is not exported by "__vite-browser-external"`. The UI is experimental;
  `npm run build` (root) intentionally does not build it.
- **`packages/desktop` (Tauri)**: requires the Rust toolchain (`cargo`), which is not
  installed locally. Scaffolded only.
- **`packages/marketplace` installer**: `installPlugin()` returns an honest
  "not implemented" error; no download/extract/verify pipeline exists.
- **`packages/providers/elf`**: parses the real ELF header (class, endianness,
  machine/architecture, entry point) but does **not** extract a symbol table. Use the
  Ghidra adapter for symbols. The old fabricated `{architecture:'x86_64', symbols:[…]}`
  canned response was removed.
- **AI/RAG (`ai_agent.ts`, `rag_indexer.ts`)**: require an LLM provider. Without one
  no AI output is produced.

## 3. Known gaps & debt

- **`zip_reader.ts` coverage ~70%** — malformed-archive error branches are under-tested
  (see `COVERAGE_REPORT.md`). A dedicated negative-test file is recommended.
- **No CI performance-regression gate** — benchmarks are measured and committed
  (`docs/BENCHMARKS.md`) but not enforced in CI.
- **No coverage gate in CI** — coverage is reported, not enforced.
- **No dependabot / dependency update automation** and **no secret-scanning step in CI**
  (e.g. gitleaks) — recommended before production.
- **2 dev-only npm vulnerabilities** (`vite`/`esbuild`, GHSA-67mh-4wv8-2f99) in the
  experimental UI workspace. Production deps: 0 vulnerabilities.
- **`packages/adapters` is not a workspace package** (no `package.json`); it is imported
  by relative path from core/mcp-server. It should be promoted to a proper workspace
  package before a 0.1.0 release.
- **No archive size guard for the whole-file hash** — a multi-GB APK will be read fully
  into memory for SHA-256 + parse (RSS ~408 MB measured on a 178 MB APK).
- **MCP tool calls run concurrently** — a client must await `analyze_target` before
  calling `query_graph_api`/`generate_report`/`search_graph` for dependent data.
- **No auth/rate-limiting** — MCP/CLI run with the calling user's privileges on the
  local machine; there is no sandbox boundary around target file reads.

## 4. Explicitly removed fabrications

As part of the honesty pass, the following canned/simulated outputs were removed or
replaced with real behavior:

- `CapabilityEngine` hardcoded `SampleApp.apk` graph + fake counts (`12 Activities`,
  `4 API Endpoints`, `POST /api/v1/auth/login`, `api.example.com`) → real pipeline.
- `remote_execution.ts` hardcoded `cnt_8f93a1` container id → real docker probe/run or
  honest `UNSUPPORTED_FORMAT`.
- `CapabilityRegistry`/`ReportGenerator` fabricated endpoints/counts → real graph data.
- `ElfProvider` canned `x86_64`/`crypto_encrypt` → real ELF header parse.
- `PluginInstaller` fake "downloaded & extracted" → honest not-implemented error.
- Fabricated `docs/BENCHMARKS.md` and `docs/RELEASE_CRITERIA.md` → replaced with
  measured benchmarks and honest gates.
