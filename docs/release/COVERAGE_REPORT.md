# OpenRev Coverage Report

**Generated**: 2026-08-02, Node v24.18.0, Windows
**Command**: `npm run test:coverage`
**Tool**: Node.js built-in test coverage (`--experimental-test-coverage`, V8-based, source-mapped through tsx)
**Test suite**: unit + CLI + adapters + integration + decompile + MCP (57 tests)

## Totals

| Metric | Coverage |
| :--- | :--- |
| **Line** | **83.01%** |
| **Branch** | **71.94%** |
| **Functions** | **74.90%** |
| Files instrumented | 46 |

## Release-critical modules (highest confidence)

| File | Line % |
| :--- | :---: |
| pipeline/analysis_pipeline.ts | 97.89 |
| cli.ts | 97.17 |
| format/manifest_extractor.ts | 97.82 |
| report/report_generator.ts | 97.83 |
| db/sqlite_workspace.ts | 90.52 |
| search/indexer.ts | 91.48 |
| capabilities/index.ts | 86.93 |
| mcp-server/src/index.ts | 82.46 |
| providers/android/src/index.ts | 97.92 |
| sdk/src/index.ts | 100.00 |
| **adapters/jadx/index.ts** | **82.43** (success path now exercised) |
| **adapters/apktool/index.ts** | **72.53** (success path now exercised) |
| **adapters/runtime.ts** | **90.23** |

## Notes

- The decompile integration suite (`tests/integration/decompile.test.ts`) now exercises
  the REAL jadx + apktool success paths, raising adapter + runtime coverage.
- Lower-coverage infrastructure modules (event_store, telemetry, worker_pool, scheduler,
  security_sandbox, plugin-sdk, elf ~50–60%) are **not** on the critical analysis path.
- Ghidra success path remains uncovered (analyzeHeadless not installed).
- No coverage gate is enforced in CI yet; this report is evidence for release review.
