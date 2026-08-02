# OpenRev Test Report

**Generated**: 2026-08-02 · Node v24.18.0 · Windows
**Command**: `npm test` (`node --import tsx --test --test-timeout=60000 tests/unit/core.test.ts tests/adapters/adapters.test.ts tests/integration/pipeline.test.ts`)

## Result

| | |
| :--- | :--- |
| **Tests** | **29** |
| **Pass** | **29** |
| **Fail** | **0** |
| **Skipped / Todo** | 0 |
| **Duration** | ~1.2 s |

## Test suites & coverage areas

### `tests/unit/core.test.ts` — core engine, graph, security, SDK, platform APIs
- SecuritySanitizer Path Traversal & Zip Slip prevention
- ProductionAndroidProvider output normalization
- OpenRevSDK high-level `analyzeTarget` (real pipeline)
- Milestone 0 vertical slice (real pipeline)
- ArtifactKnowledgeGraph node/edge management
- ExtensionHostManager process spawning/termination
- RemoteExecutionGateway multi-target routing (docker really probed; remote → honest `UNSUPPORTED_FORMAT`)
- KnowledgeGraphQueryAPI domain queries
- WorkspaceSnapshotEngine snapshots/restores
- DependencyRegistry health checks (real PATH probes)

### `tests/adapters/adapters.test.ts` — real tool adapters
- JADX: probes availability honestly; decompile → `TOOL_NOT_FOUND` when absent
- Apktool: probes availability honestly
- ADB: lists real devices only (`adb devices -l`)
- Frida: probes availability honestly; attach → `TOOL_NOT_FOUND` when absent
- Ghidra: probes availability honestly; analyzeElf → `TOOL_NOT_FOUND` when absent
- `runCommand`: real process output, surfaces `TOOL_NOT_FOUND`, times out on blocking process
- `probeTool`: detects `node` itself

### `tests/integration/pipeline.test.ts` — real end-to-end pipeline
- Parses real APK fixture end-to-end (manifest decode → graph → search docs → SQLite → report)
- Produces a structurally valid graph (33 nodes / 32 edges, validated)
- Persists workspace + artifacts + graph + search docs to SQLite (disk round-trip)
- Reports `FILE_NOT_FOUND` for a missing target
- SearchIndexer ranks exact keyword matches
- SearchIndexer supports `regex:` mode + category filter
- SearchIndexer throws on invalid regex

## What the tests do NOT cover (honesty)

- jadx/apktool/ghidra **success paths** (tools not installed — only `TOOL_NOT_FOUND` paths are exercised). See `KNOWN_LIMITATIONS.md`.
- Real device interaction (no device attached).
- AI/RAG (no LLM provider).
- Browser UI / Tauri (experimental).
- Line/branch coverage of the above gaps is reflected in `COVERAGE_REPORT.md` (85.2% line overall).
