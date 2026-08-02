# OpenRev Test Report

**Generated**: 2026-08-02 · Node v24.18.0 · Windows
**Command**: `npm test` (unit + CLI + adapters + integration + decompile + MCP)

## Result

| | |
| :--- | :--- |
| **Tests** | **57** |
| **Pass** | **57** |
| **Fail** | **0** |
| **Skipped** | 0 (decompile suite runs because jadx + apktool are installed) |
| **Duration** | ~9 s (includes real jadx + apktool runs) |

## Test suites

### `tests/unit/core.test.ts` — core engine, graph, security, SDK, platform APIs
- SecuritySanitizer Path Traversal & Zip Slip prevention
- ProductionAndroidProvider output normalization
- OpenRevSDK high-level `analyzeTarget` (real pipeline)
- Milestone 0 vertical slice (real pipeline)
- ArtifactKnowledgeGraph node/edge management
- ExtensionHostManager, RemoteExecutionGateway, KnowledgeGraphQueryAPI,
  WorkspaceSnapshotEngine, DependencyRegistry (real PATH probes)

### `tests/unit/cli.test.ts` — CLI exit codes + real commands
- `version` prints `0.1.0-alpha.2` (0), `help` (0), unknown command (2),
  `analyze` without target (2), missing file → 1 + `FILE_NOT_FOUND`
- `analyze`/`graph`/`search`/`report`/`workflow`/`deps` on real fixture data

### `tests/adapters/adapters.test.ts` — real tool adapters + runtime
- JADX/Apktool/Frida/Ghidra probe honestly; `TOOL_NOT_FOUND` when absent
- ADB lists real devices
- `runCommand` output/timeout; `probeTool` detects node
- **New**: `compareVersions`, version-minimum validation, custom executable path
  resolution, missing-path not found, `verifyChecksum` match/mismatch, JADX custom
  path + version validated

### `tests/integration/pipeline.test.ts` — real end-to-end pipeline
- Fixture → real manifest decode, graph, SQLite persistence, search, FILE_NOT_FOUND

### `tests/integration/decompile.test.ts` — REAL external-tool success paths
Requires jadx + apktool (auto-detected; skips honestly when absent).
- jadx decompiles SampleApp.apk → real `MainActivity.java` (≈1.8 s)
- apktool decodes SampleApp.apk → manifest + smali + 11 real layout XMLs (≈1.2 s)
- Full pipeline with `decompile.enabled` → graph populated + real tool output
- Tool versions meet minimums

### `tests/mcp/mcp.test.ts` — real MCP client over in-memory transport
- `tools/list` schemas; analyze/query/report/provider; typed `FILE_NOT_FOUND`

## What the tests do NOT cover (honesty)

- Ghidra success path (analyzeHeadless not installed) — `TOOL_NOT_FOUND` only.
- Real device interaction (no device attached).
- AI/RAG (no LLM provider).
- Browser UI / Tauri (experimental).
- Decompile tests skip (do not run) on machines without jadx/apktool — they never fake success.

## Test suites & coverage areas

### `tests/unit/core.test.ts` — core engine, graph, security, SDK, platform APIs
- SecuritySanitizer Path Traversal & Zip Slip prevention
- ProductionAndroidProvider output normalization
- OpenRevSDK high-level `analyzeTarget` (real pipeline)
- Milestone 0 vertical slice (real pipeline)
- ArtifactKnowledgeGraph node/edge management
- ExtensionHostManager process spawning/termination
- RemoteExecutionGateway multi-target routing (docker really probed; remote → honest error)
- KnowledgeGraphQueryAPI domain queries
- WorkspaceSnapshotEngine snapshots/restores
- DependencyRegistry health checks (real PATH probes)

### `tests/unit/cli.test.ts` — CLI exit codes + real commands
- `version` prints `0.1.0-alpha.2`, exit 0
- `help` exit 0
- unknown command → exit 2
- `analyze` without target → exit 2
- `analyze` on fixture → real pipeline, package `com.example.two_rings`, 33 graph nodes, 6 exported
- `analyze` on missing file → exit 1 with `FILE_NOT_FOUND`
- `graph` → 33 nodes / 32 edges
- `search` → finds INTERNET permission (10 indexed docs)
- `report` → real Markdown with package + Mermaid graph
- `workflow` → static step real success, decompile step honest failure when jadx absent
- `deps` → real health checks

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

### `tests/mcp/mcp.test.ts` — real MCP client over in-memory transport
- `tools/list` exposes all 10 tools with input schemas
- `analyze_target` runs the real pipeline (33 nodes)
- `analyze_target` on missing file → `isError` with typed `FILE_NOT_FOUND`
- `query_graph_api` returns 6 exported components after analysis
- `generate_report` returns real Markdown (package + Mermaid)
- `analyze_provider` unknown provider → honest `isError`
- `analyze_provider` `provider.jadx` → honest `TOOL_NOT_FOUND` when absent (or success when installed)

## What the tests do NOT cover (honesty)

- jadx/apktool/ghidra **success paths** (tools not installed — only `TOOL_NOT_FOUND` paths exercised).
- Real device interaction (no device attached).
- AI/RAG (no LLM provider).
- Browser UI / Tauri (experimental).
- Malformed-archive error branches in `zip_reader.ts` (recommended follow-up).
