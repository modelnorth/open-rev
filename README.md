# OpenRev — Software Intelligence & Reverse Engineering Platform

**OpenRev** is a cross-platform software intelligence and reverse-engineering platform
built around generic software artifacts and capability-based tool orchestration. It
combines an artifact knowledge graph, a real binary-analysis pipeline, and a modular
adapter/plugin ecosystem in a local-first, offline-capable toolchain.

> **Status: Alpha.** The core analysis pipeline, binary format decoders, SQLite
> workspace, adapters, CLI, and MCP server are **real** — every stage is backed by real
> file bytes with no fabricated output (29 tests green, full typecheck, measured
> coverage ~85% line). External tools (jadx, apktool, ghidra, …) are probed honestly and
> report `TOOL_NOT_FOUND` when absent. The AI/RAG copilot, marketplace installer, and
> desktop UI are **experimental** — see [Maturity](#maturity).

## Highlights

- **Real binary analysis pipeline** — ZIP/APK parsing, binary `AndroidManifest.xml`
  decoding, component/permission/resource extraction, knowledge graph construction,
  search indexing, and a Markdown report generator. Verified against a 178 MB
  production APK and a committed portable fixture (`tests/fixtures/FixtureApp.apk`).
- **Real SQLite workspace** — `node:sqlite` persistence for workspace records, artifact
  index, graph snapshots, and search documents.
- **Capability-Based Tool Runtime** — express intent (`Analyze APK`, `Decompile Source`)
  and the engine selects the right adapters; uninstalled tools return honest errors.
- **Real external-tool adapters** — jadx, apktool, adb, frida, ghidra with timeouts,
  output caps, and honest `TOOL_NOT_FOUND` when a tool is missing. No canned output.
- **MCP Server** — expose OpenRev capabilities to AI coding assistants
  (Claude Code, Antigravity, OpenCode) over the Model Context Protocol (stdio).
- **CLI** — `analyze`, `graph`, `search`, `report`, `workflow`, `deps` with `--json`.
- **Artifact Knowledge Graph** — connected graph (`APK`, `Manifest`, `Activity`,
  `Service`, `Receiver`, `Permission`, …) with validation and a domain query API.

## Monorepo Layout

| Package | Description |
|---|---|
| `packages/core` | Core engine, capability registry, artifact store, pipeline, SQLite workspace, CLI |
| `packages/adapters` | Real tool adapters (jadx, apktool, adb, frida, ghidra) + shared runtime |
| `packages/providers` | Built-in providers (Android — real; ELF — experimental header parse) |
| `packages/sdk` | Public SDK (`analyzeTarget` runs the real pipeline) |
| `packages/mcp-server` | MCP server (stdio) for AI assistants |
| `packages/provider-sdk` | Provider SDK (`BaseProvider` contract) |
| `packages/plugin-sdk` | Plugin SDK for third-party extensions |
| `packages/ui` | React + Vite UI — **experimental** (browser build cannot bundle `node:*` core) |
| `packages/desktop` | Tauri / Rust desktop host — **experimental** (requires Rust toolchain) |
| `packages/ui-sdk` | UI SDK for panels and custom views |
| `packages/marketplace` | Marketplace registry & installer — **experimental** |
| `tests/` | Unit, adapter, and integration test suites |

## Getting Started

```bash
npm install
npm run typecheck  # typecheck ALL workspaces
npm test           # unit + adapters + integration (29 tests)
npm run test:coverage
npm run build      # typecheck (the repo is noEmit; UI browser build is experimental)
```

### CLI

```bash
node --import tsx bin/openrev.js analyze tests/fixtures/FixtureApp.apk --json
node --import tsx bin/openrev.js graph tests/fixtures/FixtureApp.apk
node --import tsx bin/openrev.js search tests/fixtures/FixtureApp.apk "INTERNET"
node --import tsx bin/openrev.js report tests/fixtures/FixtureApp.apk --out report.md
node --import tsx bin/openrev.js workflow tests/fixtures/FixtureApp.apk
node --import tsx bin/openrev.js deps --json
```

Add `--json` for machine-readable output on stdout (logs go to stderr).
Exit codes: `0` success, `1` error, `2` usage.

### MCP Server (AI Assistant Integration)

```bash
# Claude Code
claude mcp add openrev -- node --import tsx /abs/path/packages/mcp-server/src/index.ts

# OpenCode (opencode.json)
# "mcp": { "openrev": { "type": "stdio", "command": "node",
#          "args": ["--import", "tsx", "/abs/path/packages/mcp-server/src/index.ts"] } }
```

Tools: `list_capabilities`, `check_dependencies`, `analyze_target`, `search_graph`,
`query_graph_api`, `generate_report`, `run_workflow`, `analyze_provider`,
`create_plugin`, `list_dependencies`. `analyze_provider` dispatches to real adapters
(`provider.android`, `provider.jadx`, `provider.apktool`, `provider.ghidra`,
`provider.adb`).

## Maturity

| Area | Status |
|---|---|
| ZIP reader / AXML decoder / manifest extractor | **Real** (pure TS, CRC32-verified, Zip-Slip safe) |
| Android provider (APK/AAB manifest analysis) | **Real** (verified on fixture + 178 MB APK) |
| SQLite workspace persistence | **Real** (`node:sqlite`) |
| Analysis pipeline (hash → decode → graph → index → SQLite → report) | **Real** |
| Search engine | **Real** (inverted index + IDF scoring, `regex:` mode) |
| Adapters (jadx/apktool/adb/frida/ghidra) | **Real probes & execution**; decompile success paths require the tools installed (honest `TOOL_NOT_FOUND` otherwise) |
| CLI + MCP server | **Real** (verified end-to-end) |
| AI copilot / RAG | **Experimental** — requires LLM provider; never faked |
| Marketplace installer | **Experimental** — returns honest "not implemented" |
| ELF provider | **Experimental** — real ELF header parse; no symbol extraction (use ghidra adapter) |
| React UI (Vite) / Tauri desktop | **Experimental** — browser build cannot bundle `node:*` core modules |

## Documentation

- [Architecture](docs/architecture.md)
- [Plugin SDK](docs/plugin-sdk.md)
- [RFCs](docs/rfcs/0001-capabilities.md)
- [Benchmarks (measured)](docs/BENCHMARKS.md)
- [Release Criteria (honest gates)](docs/RELEASE_CRITERIA.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Release deliverables](docs/release/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md). Architectural
contracts are frozen in [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md) — breaking
changes require an RFC under `docs/rfcs/`.

## Security

See [SECURITY.md](SECURITY.md) for the security policy, and
[docs/release/SECURITY_REPORT.md](docs/release/SECURITY_REPORT.md) for the current
audit. No hardcoded secrets; Zip Slip / path traversal protections are enforced and
tested.

## License

Apache-2.0 — see [LICENSE](LICENSE).
