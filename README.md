# OpenRev — Software Intelligence & Reverse Engineering Platform

**OpenRev** is a cross-platform software intelligence and reverse-engineering platform
built around generic software artifacts and capability-based tool orchestration. It
combines an artifact knowledge graph, a RAG-powered AI copilot, and a modular
adapter/plugin ecosystem in a local-first, offline-capable desktop application.

> **Status: Alpha.** The architecture, graph schema, SDKs, and pipeline scaffolding
> are in place and tested (13/13 unit + adapter tests green, full typecheck across all
> workspaces). Several external-tool adapters and AI provider paths are still
> **simulated** — see [Maturity](#maturity) below. The repo is safe for AI assistants
> to work in; read [`AGENTS.md`](AGENTS.md) before contributing.

## Highlights

- **Local-First & Offline Capable** — all storage, indexing, and analysis run on your machine.
- **Capability-Based Tool Runtime** — express intent (`Analyze APK`, `Extract Endpoints`)
  and the engine selects the right adapters.
- **Artifact Knowledge Graph** — connected graph schema with nodes (`APK`, `Manifest`,
  `Activity`, `Layout`, `ApiEndpoint`, `Native SO`, `Permissions`, `Strings`) and
  directed relationships.
- **Graph-Driven & RAG AI Copilot** — OpenAI, Anthropic, Ollama, vLLM, and LM Studio
  query the knowledge graph and indexed source chunks instead of re-reading raw binaries.
- **Extensible Plugin Marketplace** — first- and third-party plugins with independent
  versioning and sandboxed execution.
- **MCP Server** — expose OpenRev capabilities to AI coding assistants
  (Claude Code, Antigravity, OpenCode) via the Model Context Protocol.
- **Real dependency health checks** — external RE tools (jadx, apktool, adb, frida,
  ghidra, mitmproxy, radare2, mobsfscan) are probed on PATH and reported as
  `installed` / `missing` / `outdated` / `error` — no fake "installed".

## Monorepo Layout

| Package | Description |
|---|---|
| `packages/core` | Core engine, capability registry, artifact store, event store, scheduler, CLI |
| `packages/desktop` | Tauri / Rust desktop host |
| `packages/ui` | React + TypeScript UI workspace (Vite) |
| `packages/sdk` | Public SDK |
| `packages/ui-sdk` | UI SDK for panels and custom views |
| `packages/plugin-sdk` | Plugin SDK for third-party extensions |
| `packages/provider-sdk` | Provider SDK (`BaseProvider` contract) |
| `packages/providers` | Built-in providers (Android, ELF) |
| `packages/marketplace` | Marketplace registry & installer |
| `packages/mcp-server` | MCP server (stdio) for AI assistants |
| `packages/adapters` | Tool adapters (jadx, adb, ghidra, frida, apktool) |
| `plugins/static-analysis` | Static analysis plugin |
| `workflows/` | YAML analysis workflows (`full_analysis`, `api_discovery`) |
| `tests/` | Unit and adapter test suites |

## Getting Started

```bash
npm install
npm run dev        # launch the UI workspace (http://localhost:3000)
npm run typecheck  # typecheck ALL workspaces
npm test           # run the core & adapter test suites
npm run build      # typecheck + build the UI (packages/ui/dist)
node --import tsx bin/openrev.js deps --json   # CLI: real dependency health checks
npm run mcp        # start the MCP server
```

## CLI

```bash
openrev analyze <file>         Run the static analysis pipeline
openrev deps                   Run real dependency health checks
openrev graph                  Print the Artifact Knowledge Graph
openrev search <query>         Search graph nodes and indexed documents
openrev report [--out file.md] Generate a Markdown analysis report
openrev workflow <target>      Run the default audit workflow DAG
openrev capabilities           List capability contracts
```

Add `--json` for machine-readable output. Exit codes: `0` success, `1` error, `2` usage.

## MCP Server (AI Assistant Integration)

OpenRev exposes its capabilities over MCP so any AI coding assistant can call them
as tools:

```bash
# Claude Code
claude mcp add openrev -- node --import tsx /abs/path/packages/mcp-server/src/index.ts

# OpenCode (opencode.json)
# "mcp": { "openrev": { "type": "stdio", "command": "node",
#          "args": ["--import", "tsx", "/abs/path/packages/mcp-server/src/index.ts"] } }
```

Tools: `list_capabilities`, `check_dependencies`, `analyze_target`, `search_graph`,
`query_graph_api`, `generate_report`, `run_workflow`, `analyze_provider`,
`create_plugin`, `list_dependencies`.

## Maturity

| Area | Status |
|---|---|
| Architecture / SDKs / Plugin contracts | Implemented (frozen via `ARCHITECTURE_FREEZE.md`) |
| Knowledge Graph, Search, Events, Scheduler | Implemented (in-memory) |
| Dependency health checks | **Real** (binary probes on PATH) |
| CLI + MCP server | Implemented |
| React UI (Vite) | Implemented (builds & typechecks; demo data) |
| Tauri desktop | Scaffolded (requires Rust toolchain + `npm run build` in `packages/desktop`) |
| Adapters (jadx/adb/ghidra/frida/apktool) | **Simulated** — return canned output; real integration pending |
| SQLite workspace persistence | **Simulated** — in-memory Map; real SQLite pending |
| AI copilot / RAG | **Simulated** — template responses; real provider calls pending |
| Marketplace installer | **Simulated** — records installs in memory; download/extract pending |

## Documentation

- [Architecture](docs/architecture.md)
- [Plugin SDK](docs/plugin-sdk.md)
- [RFCs](docs/rfcs/0001-capabilities.md)
- [Benchmarks](docs/BENCHMARKS.md)
- [Release Criteria](docs/RELEASE_CRITERIA.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md). Architectural
contracts are frozen in [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md) — breaking
changes require an RFC under `docs/rfcs/`.

## Security

See [SECURITY.md](SECURITY.md) for the security policy and vulnerability reporting.

## License

Apache-2.0 — see [LICENSE](LICENSE).
