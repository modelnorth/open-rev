# OpenRev Release Criteria

This document defines the honest, machine-verifiable gates for an OpenRev release. Every item must be either **verified by evidence** (test/CI output captured in this repo) or explicitly marked **BLOCKED / NOT VERIFIED** with a reason. No claim is made without evidence.

Gates are evaluated by `scripts/` and the CI workflow `.github/workflows/ci.yml`, plus the deliverables in `docs/release/`.

---

## Gates

| # | Gate | How it is verified | Status |
| :-: | :--- | :--- | :---: |
| G1 | `tsc --noEmit` typechecks the entire monorepo | `npm run typecheck` | ✅ passes |
| G2 | Full test suite passes (unit + adapters + integration) | `npm test` (29 tests) | ✅ passes |
| G3 | Test coverage is measured and reported | `npm run test:coverage` → `docs/release/COVERAGE_REPORT.md` | ✅ measured (85.2% line / 74.9% branch) |
| G4 | CLI runs the real pipeline on a real APK fixture | `node --import tsx bin/openrev.js analyze tests/fixtures/FixtureApp.apk --json` | ✅ passes |
| G5 | MCP server completes initialize + `analyze_target` over stdio | CI MCP smoke step | ✅ passes |
| G6 | No library code writes to stdout (protocol safety) | MCP/CLI smoke tests assert clean JSON | ✅ fixed (all debug logs routed to stderr) |
| G7 | Real SQLite workspace persists on disk | pipeline integration test | ✅ passes |
| G8 | No Zip Slip / path traversal in archive handling | SecuritySanitizer test + zip_reader tests | ✅ passes |
| G9 | External tool adapters never fabricate output | adapter tests assert honest TOOL_NOT_FOUND when tools absent | ✅ passes |
| G10 | Performance measured on real artifacts | `scripts/benchmark.mjs` → `docs/BENCHMARKS.md` | ✅ measured |
| G11 | Decompile (jadx/apktool) verified end-to-end | requires jadx/apktool/docker installed | 🔴 BLOCKED (tools absent locally; adapter TOOL_NOT_FOUND path verified only) |
| G12 | Ghidra headless (analyzeHeadless) verified | requires Ghidra installed | 🔴 BLOCKED (absent locally) |
| G13 | Device runtime verified against a real Android device | requires connected device | 🔴 BLOCKED (0 devices; `adb devices -l` path verified only) |
| G14 | AI/RAG capabilities verified | requires LLM provider keys | 🔴 BLOCKED (marked experimental, never faked) |
| G15 | Desktop UI (Tauri) runs without manual editing | `npm run build:ui` (vite build) | 🔴 BLOCKED (browser build cannot bundle `node:*` core; UI marked experimental) |
| G16 | Cross-platform green build | CI matrix (ubuntu/windows/macos × Node 22/24) | ⏳ pending CI run on GitHub |

---

## Honest status summary

- **Verified now (this machine)**: G1–G10.
- **Blocked on this machine (documented, not faked)**: G11–G15.
- **Pending external verification**: G16 (requires a GitHub Actions run).

A release can proceed with G1–G10 green and all BLOCKED gates documented in
`KNOWN_LIMITATIONS.md` — but it **cannot** claim jadx/apktool/ghidra/device/AI/desktop
capabilities as verified until the respective tools are available and the gates flip green.
