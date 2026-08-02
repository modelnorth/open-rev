# OpenRev Coverage Report

**Generated**: 2026-08-02, Node v24.18.0, Windows
**Command**: `npm run test:coverage`
**Tool**: Node.js built-in test coverage (`--experimental-test-coverage`, V8-based, source-mapped through tsx)
**Test suite**: unit + CLI + adapters + integration + MCP (47 tests)

## Totals

| Metric | Coverage |
| :--- | :--- |
| **Line** | **82.43%** |
| **Branch** | **73.68%** |
| **Functions** | **73.98%** |
| Files instrumented | 46 |

## Release-critical modules (highest confidence)

| File | Line % |
| :--- | :---: |
| pipeline/analysis_pipeline.ts | 98.54 |
| cli.ts | 97.17 |
| format/manifest_extractor.ts | 97.82 |
| report/report_generator.ts | 97.83 |
| db/sqlite_workspace.ts | 90.52 |
| search/indexer.ts | 91.48 |
| capabilities/index.ts | 86.93 |
| mcp-server/src/index.ts | 82.46 |
| providers/android/src/index.ts | 97.57 |
| sdk/src/index.ts | 100.00 |
| providers/android/index.ts | 100.00 |
| provider-sdk/src/index.ts | 100.00 |

## Newly instrumented this round

MCP server (82.5%), CLI (97.2%), CapabilityEngine (86.9%), workflow engine (100%), and
lower-coverage infrastructure modules: event_store, telemetry, worker_pool, scheduler,
security_sandbox, plugin-sdk, elf provider (~50–60%) — these are **not** on the critical
analysis path.

## Interpretation

- The real-analysis path is the best-covered area (>86% on pipeline/CLI/MCP/provider/search).
- Adapters remain ~60–80% because jadx/apktool/ghidra are not installed locally — the
  `TOOL_NOT_FOUND` path is covered, success paths are not (gates G11/G12, BLOCKED).
- `zip_reader.ts` at 70% reflects untested malformed-archive error branches (recommended
  follow-up test file).
- No coverage gate is enforced in CI yet; this report is evidence for release review.
