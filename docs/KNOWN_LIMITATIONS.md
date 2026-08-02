# OpenRev Known Limitations

**Version**: `0.1.0-alpha.2` · **Updated**: 2026-08-02

This document is the honest ledger of what OpenRev does **not** do yet, what is
experimental, and what is blocked on this machine. Nothing here is hidden behind a
success claim.

---

## 1. Verified vs blocked (gates)

### ✅ Verified on this machine (real execution)

| Feature | Evidence |
|---|---|
| jadx decompilation (`provider.jadx`, `static.decompile`) | **Verified end-to-end** on `tests/fixtures/SampleApp.apk` (jadx 1.5.6): real `MainActivity.java` decompiled in ~1.8 s (`tests/integration/decompile.test.ts`) |
| apktool decode (`provider.apktool`) | **Verified end-to-end** on SampleApp.apk (apktool 3.0.3): decoded manifest + `MainActivity.smali` + 11 real layout XMLs in ~1.2 s |
| Full pipeline with real tools | `decompile` pipeline stage populates graph + real tool output (3.1 s) |
| Executable auto-discovery + custom paths + version validation + checksum | Covered by `tests/adapters/adapters.test.ts` (probeTool custom path, `compareVersions`, `verifyChecksum`, version minimums) |
| Windows `.bat`/`.cmd` execution | `runtime.ts` resolves batch files through `cmd.exe`; exercised by the decompile tests on Windows |

### 🔴 Still blocked / pending

| Feature | Prerequisite | Status here |
|---|---|---|
| Ghidra headless symbols (`provider.ghidra`, `AnalyzeNative`) | `analyzeHeadless` on PATH | `TOOL_NOT_FOUND` path tested; success path unverified |
| Device runtime (`provider.adb`, `device.inspect`) | connected Android device | `adb devices -l` path tested; 0 devices present, install/logcat/dumpsys unverified on a real device |
| AI copilot / RAG | LLM provider (API key or local model) | experimental; never faked |
| Cross-platform CI green | GitHub Actions run | pending — CI (incl. new `desktop-build` job) configured for ubuntu/windows/macos; push to `main` to trigger |

> The decompile integration tests (`tests/integration/decompile.test.ts`) require
> jadx + apktool. They auto-detect `OPENREV_JADX`/`OPENREV_APKTOOL` (or the tools on
> PATH / a local `openrev-tools` dir) and **skip honestly** when absent — they never
> fake success. Install jadx (https://github.com/skylot/jadx) and apktool
> (https://apktool.org), or set the env vars, to run them.

## 2. Desktop / UI status (was experimental; now verified on Windows)

### ✅ Verified on this machine (Windows)

- **Frontend is browser-safe**: the React UI (`packages/ui`) no longer imports
  `@openrev/core` (which pulled `node:*` modules). All filesystem/process work is
  delegated to Tauri commands through `src/tauri.ts` (IPC client). `vite build`
  succeeds with no `node:*` bundling errors.
- **Tauri shell builds and launches**: `cargo build` (debug) and `cargo build --release`
  both succeed; the app launches with **no startup crash** (verified 5 s alive on both
  debug and release binaries). WebView2 + MSVC Build Tools are the required host deps.
- **Rust command bridge is real**: `pick_apk` (native file dialog), `analyze_apk`
  (spawns the real Node analysis sidecar `packages/desktop/sidecar/analyze.mjs` and
  returns its JSON), `report_error`, `get_version`. The old fabricated
  `run_tool_command` was removed.
- **UI smoke tests pass** (`npm run test:ui`): launch → import APK via IPC → render
  manifest / resources / graph / code / report with **no console errors**, plus a
  crash-screen + workspace-recovery test.
- UI states implemented: loading screen (indeterminate progress), crash screen,
  error boundary + error reporting, workspace recovery (Retry), progress indicator.

### 🔴 Still pending

- **macOS / Linux builds** — cannot be built on a Windows machine. A dedicated
  `desktop-build` GitHub Actions job (ubuntu-latest / macos-latest / windows-latest,
  with WebKitGTK deps on Linux) now compiles the Tauri app on all three OSes. Push to
  `main` (or open a PR) to trigger it and view results in the **Actions** tab.
- **Real end-to-end in the webview** — the app shell launches, but driving "Open APK →
  real file dialog → real IPC → real analysis in the live window" requires interactive
  use (or a webview automation harness). The equivalent path is covered by the UI smoke
  test (IPC mocked at the JS boundary) + the sidecar integration test (real analysis).
- **Analysis sidecar runtime dependency**: the desktop analysis backend spawns
  `node --import tsx <sidecar>` from the repo checkout. A packaged installer would need
  to bundle the sidecar + a Node runtime (documented; dev build uses the repo).

## 3. Other experimental areas (never claim as production)

- **`packages/marketplace` installer**: `installPlugin()` returns an honest
  "not implemented" error; no download/extract/verify pipeline exists.
- **`packages/providers/elf`**: parses the real ELF header (class, endianness,
  machine/architecture, entry point) but does **not** extract a symbol table. Use the
  Ghidra adapter for symbols.
- **AI/RAG (`ai_agent.ts`, `rag_indexer.ts`)**: require an LLM provider. Without one
  no AI output is produced.

## 4. Known gaps & debt

- **`zip_reader.ts` coverage ~70%** — malformed-archive error branches are under-tested
  (see `COVERAGE_REPORT.md`). A dedicated negative-test file is recommended.
- **No CI performance-regression gate** — benchmarks are measured and committed
  (`docs/BENCHMARKS.md`) but not enforced in CI.
- **No coverage gate in CI** — coverage is reported, not enforced.
- **No dependabot / dependency update automation** and **no secret-scanning step in CI**
  (e.g. gitleaks) — recommended before production.
- **2 dev-only npm vulnerabilities** (`vite`/`esbuild`, GHSA-67mh-4wv8-2f99) in the
  UI workspace. Production deps: 0 vulnerabilities.
- **`packages/adapters` is not a workspace package** (no `package.json`); it is imported
  by relative path from core/mcp-server. It should be promoted to a proper workspace
  package before a 0.1.0 release.
- **No archive size guard for the whole-file hash** — a multi-GB APK will be read fully
  into memory for SHA-256 + parse (RSS ~408 MB measured on a 178 MB APK).
- **MCP tool calls run concurrently** — a client must await `analyze_target` before
  calling `query_graph_api`/`generate_report`/`search_graph` for dependent data.
- **No auth/rate-limiting** — MCP/CLI run with the calling user's privileges on the
  local machine; there is no sandbox boundary around target file reads.

## 5. Explicitly removed fabrications

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
