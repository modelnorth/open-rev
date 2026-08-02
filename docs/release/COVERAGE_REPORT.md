# OpenRev Coverage Report

**Generated**: 2026-08-02, Node v24.18.0, Windows
**Command**: `npm run test:coverage`
**Tool**: Node.js built-in test coverage (`--experimental-test-coverage`, V8-based, source-mapped through tsx)
**Test suite**: `tests/unit/core.test.ts`, `tests/adapters/adapters.test.ts`, `tests/integration/pipeline.test.ts` (29 tests)

## Totals

| Metric | Coverage |
| :--- | :--- |
| **Line** | **85.24%** |
| **Branch** | **74.92%** |
| **Functions** | **80.39%** |
| Files instrumented | 28 |

## Per-file breakdown

| File | Line % | Branch % | Funcs % |
| :--- | :---: | :---: | :---: |
| **adapters** | | | |
| adb/index.ts | 58.91 | 80.00 | 60.00 |
| apktool/index.ts | 61.61 | 100.00 | 80.00 |
| frida/index.ts | 80.95 | 87.50 | 100.00 |
| ghidra/index.ts | 80.00 | 87.50 | 83.33 |
| jadx/index.ts | 77.86 | 70.00 | 100.00 |
| runtime.ts | 85.23 | 66.67 | 75.00 |
| **core/src** | | | |
| api/platform_api.ts | 86.43 | 88.24 | 54.17 |
| api/platform_gateway.ts | 92.86 | 100.00 | 66.67 |
| artifacts/artifact_store.ts | 73.79 | 72.22 | 66.67 |
| capabilities/capability_registry.ts | 64.60 | 100.00 | 50.00 |
| db/sqlite_workspace.ts | 90.52 | 68.57 | 85.71 |
| deps/dependency_registry.ts | 97.38 | 85.37 | 73.53 |
| errors/openrev_error.ts | 84.40 | 100.00 | 66.67 |
| extension_host/extension_host.ts | 98.04 | 85.71 | 83.33 |
| format/axml_decoder.ts | 83.93 | 72.22 | 78.95 |
| format/manifest_extractor.ts | 97.82 | 73.33 | 92.31 |
| format/zip_reader.ts | 70.09 | 53.33 | 73.68 |
| graph/knowledge_graph.ts | 80.65 | 77.78 | 76.92 |
| pipeline/analysis_pipeline.ts | 98.54 | 86.84 | 88.24 |
| report/report_generator.ts | 97.83 | 69.44 | 100.00 |
| runtime/remote_execution.ts | 94.52 | 66.67 | 100.00 |
| search/indexer.ts | 89.77 | 79.03 | 88.24 |
| security/sanitizer.ts | 69.64 | 63.64 | 80.00 |
| vertical_slice_demo.ts | 100.00 | 100.00 | 100.00 |
| **provider-sdk/src** | | | |
| index.ts | 100.00 | 100.00 | 100.00 |
| **providers/android/src** | | | |
| index.ts | 97.57 | 59.26 | 96.15 |
| **sdk/src** | | | |
| index.ts | 100.00 | 88.89 | 100.00 |

## Interpretation

- **Core real-analysis path is the best-covered area**: `analysis_pipeline.ts` 98.5%, `manifest_extractor.ts` 97.8%, `report_generator.ts` 97.8%, `sqlite_workspace.ts` 90.5%. These are the release-critical modules.
- **Adapters are lower** because the tools (jadx/apktool/ghidra) are not installed locally — the `TOOL_NOT_FOUND` path is covered, but the success-path branches (`runViaDocker`, decompile output handling) are not. This matches `RELEASE_CRITERIA.md` gates G11/G12 (BLOCKED).
- **`zip_reader.ts` at 70%** reflects untested error branches (malformed-archive paths, size-limit violations). A follow-up unit test file for these branches is a recommended next improvement.
- No coverage gate is enforced in CI yet; this report is evidence for release review.
