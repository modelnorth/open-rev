# OpenRev — Software Intelligence & Reverse Engineering Platform

**OpenRev** is a cross-platform desktop software intelligence and reverse-engineering platform built around generic software artifacts and capability-based tool orchestration. It combines an artifact knowledge graph, a RAG-powered AI copilot, and a modular adapter/plugin ecosystem in a local-first, offline-capable desktop application.

## Highlights

- **Local-First & Offline Capable** — all storage, indexing, and analysis run on your machine using SQLite and embedded indexes.
- **Capability-Based Tool Runtime** — express intent (`Analyze APK`, `Extract Endpoints`, `Decompile Native SO`) and the engine selects the right adapters.
- **Artifact Knowledge Graph** — connected graph schema with nodes (`APK`, `Manifest`, `Activity`, `Compose Screen`, `Layout`, `ApiEndpoint`, `Native SO`, `Permissions`, `Strings`) and directed relationships.
- **Graph-Driven & RAG AI Copilot** — OpenAI, Anthropic, Ollama, vLLM, and LM Studio query the knowledge graph and indexed source chunks instead of re-reading raw binaries.
- **Extensible Plugin Marketplace** — first- and third-party plugins with independent versioning and sandboxed execution.

## Monorepo Layout

| Package | Description |
|---|---|
| `packages/core` | Core engine, capability registry, artifact store, event store, scheduler |
| `packages/desktop` | Tauri / Rust desktop host |
| `packages/ui` | React + TypeScript UI workspace |
| `packages/sdk` | Public SDK |
| `packages/ui-sdk` | UI SDK for panels and custom views |
| `packages/plugin-sdk` | Plugin SDK for third-party extensions |
| `packages/provider-sdk` | Provider SDK |
| `packages/providers` | Built-in providers (Android, ELF) |
| `packages/marketplace` | Marketplace registry & installer |
| `plugins/static-analysis` | Static analysis plugin |
| `workflows/` | YAML analysis workflows (`full_analysis`, `api_discovery`) |
| `tests/` | Unit and adapter test suites |

## Getting Started

```bash
npm install
npm run dev        # launch the UI workspace
npm run build      # build all monorepo workspaces
npm test           # run the core & adapter test suites
node bin/openrev.js import SampleApp.apk   # CLI smoke test
```

## Documentation

- [Architecture](docs/architecture.md)
- [Plugin SDK](docs/plugin-sdk.md)
- [RFCs](docs/rfcs/0001-capabilities.md)
- [Benchmarks](docs/BENCHMARKS.md)
- [Release Criteria](docs/RELEASE_CRITERIA.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Architectural contracts are frozen in [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md) — breaking changes require an RFC under `docs/rfcs/`.

## Security

See [SECURITY.md](SECURITY.md) for the security policy and vulnerability reporting.

## License

Apache-2.0 — see [LICENSE](LICENSE).
