# OpenRev Release Audit — v0.1.0-alpha.1

**Date**: 2026-08-02
**Auditor**: Automated + manual honesty pass (no fabricated claims)
**Scope**: The full monorepo against `docs/RELEASE_CRITERIA.md`.

---

## Verified (passing gates)

| Gate | Evidence |
| :--- | :--- |
| G1 typecheck | `npm run typecheck` → exit 0 (core + UI) |
| G2 tests | `npm test` → 29/29 pass, 0 fail |
| G3 coverage measured | `npm run test:coverage` → 85.2% line / 74.9% branch / 80.4% funcs (`COVERAGE_REPORT.md`) |
| G4 CLI real pipeline | `openrev analyze tests/fixtures/FixtureApp.apk --json` → package `com.example.two_rings`, 33 graph nodes |
| G5 MCP over stdio | initialize + `analyze_target` → 33 nodes, `query_graph_api` exported_components = 6 |
| G6 no stdout pollution | MCP stdio output is clean JSON; all library debug logs on stderr |
| G7 SQLite persistence | integration test asserts workspace record + artifact on disk |
| G8 Zip Slip / traversal | `SecuritySanitizer` tests + `zip_reader` containment/CRC32 |
| G9 adapters never fake | adapter tests assert honest `TOOL_NOT_FOUND` |
| G10 performance measured | `scripts/benchmark.mjs` → fixture 4.7 ms, 178 MB APK 498 ms pipeline (`BENCHMARKS.md`, `BENCHMARK_RESULTS.md`) |

## Blocked / not verified (honest)

| Gate | Why |
| :--- | :--- |
| G11 jadx decompile e2e | jadx/apktool/Docker not installed on this machine |
| G12 Ghidra e2e | `analyzeHeadless` not installed |
| G13 real device runtime | no Android device attached (0 devices) |
| G14 AI/RAG | no LLM provider keys |
| G15 desktop UI | browser build cannot bundle `node:*` core modules (vite) |
| G16 cross-platform CI | requires a GitHub Actions run (workflow committed) |

## Supply chain & security

- `npm audit` (production deps): **0 vulnerabilities**.
- `npm audit` (full): 2 dev-only (vite/esbuild dev-server advisory) in experimental UI.
- No hardcoded secrets in 110 tracked files; no sensitive files committed; no secrets in CI.
- See `SECURITY_REPORT.md`.

## Fabrications removed during this pass

Confirmed removed: CapabilityEngine canned SampleApp graph, remote_execution hardcoded
container id, ElfProvider canned symbols, PluginInstaller fake download, ReportGenerator
fake endpoints, fabricated BENCHMARKS/RELEASE_CRITERIA docs.

## Audit conclusion

The release is **REAL and honest** for everything it claims: binary parsing, pipeline,
search, SQLite, adapters (TOOL_NOT_FOUND path), CLI, MCP. It is **not yet** a full
"everything works" release: decompile/device/AI/desktop remain experimental or blocked,
as documented. Version stays `0.1.0-alpha.1`.
