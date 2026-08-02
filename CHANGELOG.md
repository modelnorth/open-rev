# Changelog

All notable changes to OpenRev are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/).

## [0.1.0-alpha.2] — 2026-08-02

Honesty & real-implementation release: the simulated/stub layers were replaced with
real implementations, fabrication was removed, and evidence-based release gates were
added. This is still an **alpha** — decompile/device/AI/desktop remain experimental or
blocked (see `docs/KNOWN_LIMITATIONS.md`).

### Added (real implementations)

- **Real ZIP reader** (`packages/core/src/format/zip_reader.ts`): EOCD + central
  directory parsing, STORED/DEFLATE, CRC32 verification, size limits, Zip-Slip-safe
  extraction.
- **Real binary AXML decoder** (`format/axml_decoder.ts`): UTF-8/UTF-16 string pools,
  resource maps, typed values.
- **Real AndroidManifest extractor** (`format/manifest_extractor.ts`): typed
  `DecodedManifest` with permissions, components, intent filters, exported flags.
- **Real ArtifactStore**: content-addressed (SHA-256) disk storage with integrity
  re-verification on read.
- **Real SQLite workspace** (`db/sqlite_workspace.ts`): `node:sqlite` persistence for
  records, artifact index, graph snapshots, search documents.
- **Real Android provider** (`providers/android`): full APK/AAB manifest analysis
  (verified on a 178 MB production APK and a committed fixture).
- **Real analysis pipeline** (`pipeline/analysis_pipeline.ts`): hash → store → decode →
  graph → index → SQLite → report.
- **Real search engine** (`search/indexer.ts`): inverted index + IDF ranking, keyword /
  substring / `regex:` modes, category filters, snippets.
- **Real graph validation + query API**: `validate()` for dangling edges/unknown
  relationships, `KnowledgeGraphQueryAPI` domain queries over real data.
- **Real adapters** (`packages/adapters`): jadx, apktool, adb, frida, ghidra with
  honest `TOOL_NOT_FOUND`, timeouts, output caps; Docker fallbacks.
- **Real CLI** (`packages/core/src/cli.ts`): `analyze`, `graph`, `search`, `report`,
  `workflow`, `deps` on real data with `--json`.
- **Real MCP server** (`packages/mcp-server`): `analyze_target` via the real pipeline,
  `analyze_provider` dispatching to real adapters, typed error mapping.
- **Real ELF header provider**: parses class/endianness/machine/entry point from bytes.
- **Fixtures + integration tests**: `tests/fixtures/FixtureApp.apk` (real binary
  manifest), `scripts/make_fixture.mjs`, `tests/integration/pipeline.test.ts`.
- **Benchmarks**: `scripts/benchmark.mjs` (measured, median of 5).
- **Security audit script**: `scripts/security_audit.mjs`.
- **CI** (`.github/workflows/ci.yml`): Node 22/24 × ubuntu/windows/macos, real fixture
  smoke tests, MCP stdio smoke, no UI-build gate.

### Changed

- All library debug logging routed to stderr (stdout reserved for protocol/JSON).
- `npm run build` now runs typecheck only; UI browser build moved to `npm run build:ui`
  (experimental, known to fail on `node:*` bundling).
- `npm test` gained `--test-timeout=60000`; added `npm run test:coverage` (Node native
  coverage).
- `docs/BENCHMARKS.md` and `docs/RELEASE_CRITERIA.md` replaced (previous content was
  fabricated).

### Removed fabrications

- `CapabilityEngine` canned SampleApp graph/fake counts → real pipeline.
- `remote_execution.ts` hardcoded `cnt_8f93a1` → real docker probe/run or honest error.
- `ElfProvider` canned symbols → real header parse.
- `PluginInstaller` fake download → honest not-implemented error.
- Fake endpoints/counts in `ReportGenerator`/`CapabilityRegistry` → real graph data.

### Fixed

- MCP stdout pollution from library `console.log` (protocol corruption).
- CI referenced nonexistent `SampleApp.apk`.
- CI Node 18/20 matrix (incompatible with `node:sqlite`; now 22/24).

### Known limitations

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md). In short: jadx/apktool/
ghidra/device success paths blocked locally (tools absent); AI/RAG, marketplace,
UI/desktop, ELF-symbols are experimental.

## [0.1.0-alpha.1] — 2026-08-01

Initial tagged alpha: monorepo scaffolding (core, sdk, provider/plugin-sdks, MCP
server, adapters, UI/desktop), capability registry, dependency health checks, first
CLI + MCP server wiring, `v0.1.0-alpha.1` GitHub release (prerelease). Several layers
were still simulated at this point; they were replaced in `0.1.0-alpha.2`.

[0.1.0-alpha.2]: https://github.com/menotbobbybrown/open-rev/releases/tag/v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/menotbobbybrown/open-rev/releases/tag/v0.1.0-alpha.1
