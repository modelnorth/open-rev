# OpenRev v1.0 Gate Audit

**Date**: 2026-08-02 · **Version audited**: `0.1.0-alpha.2`
**Standard**: an independent engineer can clone the repo, follow the docs, and everything works as advertised.

Verdict legend: ✅ = verified with real execution on this machine · ⚠️ = partial (implemented but not fully verified) · 🔴 = blocked (cannot be verified here).

---

## Engineering

| Criterion | Status | Evidence |
|---|---|---|
| No production stubs | ✅ | All adapters/providers/pipeline real; `scripts/security_audit.mjs` + grep pass |
| No fake providers | ✅ | Android provider real (verified on 178 MB APK + fixture); ELF real header parse; AI/marketplace return honest errors, never fake |
| No mocked analysis pipeline | ✅ | `AnalysisPipeline` runs real bytes end-to-end (hash→decode→graph→index→SQLite→report) |
| No placeholder UI | ⚠️ | UI exists but is **experimental** and does not bundle core — see KNOWN_LIMITATIONS |
| No simulated reports | ✅ | `ReportGenerator` outputs real graph data only (verified: 33 nodes, real permissions/components) |

## Functionality

| Criterion | Status | Evidence |
|---|---|---|
| Import a real APK | ✅ | Verified on 178 MB APK + fixture; `analyze` test |
| Run real JADX | 🔴 | jadx absent locally; adapter returns honest `TOOL_NOT_FOUND`; success path unverified (G11) |
| Run real Apktool | 🔴 | apktool absent; same as above (G11) |
| Decode AndroidManifest.xml | ✅ | Real binary AXML decoder; 97.8% covered; verified on real APK |
| Extract layouts/resources | ✅ | Layout/resource inventory extracted from real entries |
| Populate the Knowledge Graph | ✅ | 33 nodes/32 edges from fixture; validation passes |
| Search returns real results | ✅ | Inverted index over real manifest docs; test asserts INTERNET hit |
| Export reports from real analysis | ✅ | Real Markdown with package, components, Mermaid graph |

## Desktop

| Criterion | Status | Evidence |
|---|---|---|
| Windows build works | 🔴 | `vite build` fails on `node:*` bundling (experimental UI); Tauri requires Rust toolchain |
| macOS build works | 🔴 | Not runnable here; no CI run yet |
| Linux build works | 🔴 | Not runnable here; no CI run yet |
| No startup crashes | 🔴 | Cannot verify desktop app (does not build) |
| No runtime crashes | 🔴 | Cannot verify desktop app |

## CLI

| Criterion | Status | Evidence |
|---|---|---|
| Every command works | ✅ | 11 CLI tests: analyze/graph/search/report/workflow/deps/version/help |
| Proper exit codes | ✅ | Tested: 0 success, 1 error, 2 usage |
| Helpful error messages | ✅ | Typed `OpenRevError` with code + remediation; `FILE_NOT_FOUND` tested |
| Cross-platform | ⚠️ | Pure-Node code is cross-platform; CI matrix (3 OS) pending a GitHub run |

## MCP Server

| Criterion | Status | Evidence |
|---|---|---|
| Every tool callable | ✅ | 7 MCP tests incl. all 10 tools listed; analyze/query/report/provider exercised |
| JSON schemas validated | ✅ | `tools/list` asserts input schemas; zod validation on args |
| Works with any MCP client | ⚠️ | SDK stdio transport is spec-compliant; real-client test pending (in-memory Client used) |

## Testing

| Criterion | Status | Evidence |
|---|---|---|
| Unit tests | ✅ | core.test.ts |
| Integration tests | ✅ | pipeline.test.ts (real fixture end-to-end) |
| End-to-end tests | ✅ | pipeline + CLI + MCP on real fixture |
| Provider tests | ✅ | Android provider output normalization + pipeline |
| UI tests | 🔴 | UI experimental, does not build |
| CLI tests | ✅ | cli.test.ts (11 tests) |
| MCP tests | ✅ | mcp.test.ts (7 tests, real client) |
| Regression tests | ⚠️ | 47-test suite runs on every `npm test`; CI is the gate |

## CI/CD

| Criterion | Status | Evidence |
|---|---|---|
| Ubuntu | ⏳ | CI matrix configured; not yet run on GitHub |
| Windows | ⏳ | CI matrix configured; locally verified |
| macOS | ⏳ | CI matrix configured; not yet run |
| Release artifacts | 🔴 | No package tarballs / binaries published |
| Coverage reports | ✅ | `test:coverage` + `docs/release/COVERAGE_REPORT.md` |
| Security scanning | ✅ | `security_audit.mjs` + `npm audit --omit=dev` in CI |

## Documentation

| Criterion | Status | Evidence |
|---|---|---|
| Installation guide | ✅ | README Getting Started + CI `npm ci` verified (dry-run) |
| Developer guide | ✅ | AGENTS.md (commands, conventions, layout) |
| Plugin SDK | ✅ | docs/plugin-sdk.md |
| Provider SDK | ✅ | package + provider-sdk docs; AGENTS layout |
| API reference | ⚠️ | No generated API docs; typed source is the reference |
| Troubleshooting | ✅ | docs/KNOWN_LIMITATIONS.md |
| Architecture diagrams | ✅ | docs/architecture.md (mermaid) |

## Performance

| Criterion | Status | Evidence |
|---|---|---|
| Real benchmarks | ✅ | `scripts/benchmark.mjs`, median of 5 |
| Measured, not estimated | ✅ | fixture pipeline 4.7 ms; 178 MB APK pipeline 498 ms |
| Meets the North Star metric | ⚠️ | No formal North Star defined/enforced; measured times far exceed any <60 s SLA |

## Security

| Criterion | Status | Evidence |
|---|---|---|
| No critical vulnerabilities | ✅ | `npm audit --omit=dev` = 0; 2 dev-only in experimental UI |
| Dependency audit passes | ✅ | lockfile clean for prod deps |
| Sandboxing verified | 🔴 | No sandbox boundary around tool execution (documented) |
| Plugin permissions enforced | 🔴 | Plugin permission model not enforced at runtime |

## Release Quality

| Criterion | Status | Evidence |
|---|---|---|
| CHANGELOG | ✅ | CHANGELOG.md (alpha.1 + alpha.2) |
| Semantic versioning | ✅ | 0.1.0-alpha.x (semver prerelease) |
| Release notes | ✅ | Per-release CHANGELOG sections |
| Signed release artifacts | 🔴 | Not signed; no binaries published |
| Reproducible builds | ✅ | `npm ci` from committed lockfile (dry-run verified) |

---

## Tally & verdict

| Category | ✅ | ⚠️ | 🔴 / ⏳ |
|---|---|---|---|
| Engineering | 4 | 1 | 0 |
| Functionality | 6 | 0 | 2 |
| Desktop | 0 | 0 | 5 |
| CLI | 3 | 1 | 0 |
| MCP | 2 | 1 | 0 |
| Testing | 6 | 1 | 1 |
| CI/CD | 2 | 0 | 3 |
| Documentation | 6 | 1 | 0 |
| Performance | 2 | 1 | 0 |
| Security | 2 | 0 | 2 |
| Release quality | 4 | 0 | 1 |

**Verdict: NOT v1.0-ready.** The core product (pipeline, CLI, MCP, testing, docs, perf) is real and verified. The blockers for `v1.0.0` are the **Desktop** (5 🔴), **JADX/Apktool success paths** (2 🔴), **UI tests**, **CI run**, **sandboxing/permissions**, and **signed artifacts**.

### Recommended path to v1.0.0-rc.1
1. Install jadx + apktool (or Docker) and add **success-path** integration tests.
2. Fix or drop the desktop/UI claim (currently experimental, does not build).
3. Run the 3-OS CI matrix on GitHub and fix any failures.
4. Add a runtime sandbox + plugin permission enforcement, or explicitly scope them out of v1.0.
5. Get 5–10 external developers to clone/install/analyze real APKs and report blockers.

Until then, the honest release remains **`0.1.0-alpha.2`**.
