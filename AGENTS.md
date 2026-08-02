# AGENTS.md — Working in the OpenRev Repository

This file is the operating guide for AI coding assistants (Claude Code, Antigravity,
OpenCode, Cursor, Copilot, etc.) and human contributors working in this repository.

## What OpenRev is

OpenRev is a cross-platform **software intelligence & reverse-engineering platform**:
an artifact knowledge graph, capability-based tool orchestration, RAG-backed AI copilot,
and a plugin/provider ecosystem — local-first and offline-capable.

This repo is a **TypeScript monorepo** that runs TypeScript **directly from source**
(no `dist` build; `tsx` is the runtime loader). Do not add a compile-to-dist step.

## Non-negotiable rules

1. **No comments in code** unless essential (JSDoc on public APIs is fine).
2. **`workspace:*` is FORBIDDEN** in any `package.json` — use `file:` references
   (this npm build rejects `workspace:*` on CI). Example:
   `"@openrev/core": "file:../core"`.
3. **Never delete or rename `tsconfig.base.json`** — every package tsconfig extends it.
4. **Never change the frozen architecture** (see `ARCHITECTURE_FREEZE.md`). Breaking
   changes require an RFC under `docs/rfcs/`.
5. **External RE tools are never bundled** — they are discovered on PATH and health
   checked at runtime (`DependencyRegistry`). Adapters must report `missing` honestly,
   not fake `installed`.
6. **No invented client names, deployment counts, or certifications.**
7. **Honesty about maturity**: the core analysis pipeline, SQLite workspace, adapters,
   CLI, and MCP server are **real** (no simulated output). External tools that are not
   installed return honest `TOOL_NOT_FOUND`. The AI/RAG copilot, marketplace installer,
   and desktop/UI are **experimental** — never present them as verified. When a feature
   is unverified, say so and point at `docs/KNOWN_LIMITATIONS.md`.

## Commands (run these, not guesses)

```bash
npm install        # install all workspaces (uses package-lock.json)
npm run typecheck  # tsc --noEmit for ALL packages (core, sdk, ui, ui-sdk, mcp-server, ...)
npm test           # 47 unit + CLI + adapter + integration + MCP tests via node:test + tsx
npm run test:coverage   # same + Node native coverage report
npm run build      # typecheck only (the repo is noEmit; UI browser build is experimental)
npm run cli -- <cmd>   # CLI (see below)
npm run mcp        # start the OpenRev MCP server (stdio)
```

On the UI workspace (experimental):
```bash
npm run typecheck --workspace=@openrev/ui   # typecheck just the UI
npm run build --workspace=@openrev/ui       # vite build the UI (KNOWN to fail: node:* modules)
```

## CLI

```bash
node --import tsx bin/openrev.js help
node --import tsx bin/openrev.js deps --json        # real dependency health checks
node --import tsx bin/openrev.js analyze tests/fixtures/FixtureApp.apk --json
node --import tsx bin/openrev.js graph tests/fixtures/FixtureApp.apk --json
node --import tsx bin/openrev.js search tests/fixtures/FixtureApp.apk "INTERNET" --json
node --import tsx bin/openrev.js report tests/fixtures/FixtureApp.apk --out report.md
node --import tsx bin/openrev.js workflow tests/fixtures/FixtureApp.apk --json
node --import tsx bin/openrev.js capabilities --json
```

Exit codes: `0` success, `1` error, `2` usage error. Use `--json` for machine output.

## MCP server (OpenRev as a tool for AI assistants)

OpenRev exposes itself over the Model Context Protocol. Register it with any MCP-capable
assistant using stdio:

```bash
# Claude Code
claude mcp add openrev -- node --import tsx /absolute/path/to/packages/mcp-server/src/index.ts

# OpenCode (opencode.json)
# {
#   "mcp": {
#     "openrev": {
#       "type": "stdio",
#       "command": "node",
#       "args": ["--import", "tsx", "/absolute/path/to/packages/mcp-server/src/index.ts"]
#     }
#   }
# }

# Antigravity / Cursor: add a stdio MCP server with the same command.
```

Run it manually: `npm run mcp`. Tools exposed: `list_capabilities`,
`check_dependencies`, `analyze_target`, `search_graph`, `query_graph_api`,
`generate_report`, `run_workflow`, `analyze_provider`, `create_plugin`,
`list_dependencies`.

## Repo layout (quick map)

| Path | Purpose |
|---|---|
| `packages/core/` | Engine: capability registry, artifact store, graph, scheduler, RAG, AI, workflows, CLI |
| `packages/sdk/` | High-level public SDK (`OpenRevSDK`) |
| `packages/ui/` | React + TypeScript UI (Vite) |
| `packages/ui-sdk/` | Re-exported UI components for plugin panels |
| `packages/plugin-sdk/` | Typed plugin registration + scaffolder |
| `packages/provider-sdk/` | `BaseProvider` contract for artifact providers |
| `packages/providers/` | Built-in providers (android, elf) |
| `packages/marketplace/` | Plugin registry & installer |
| `packages/mcp-server/` | MCP server over stdio |
| `packages/adapters/` | Tool adapters (jadx, adb, ghidra, frida, apktool, ...) |
| `packages/desktop/` | Tauri desktop host (Rust) |
| `tests/` | `node:test` suites (core + adapters) |
| `bin/openrev.js` | CLI entrypoint |

## Conventions

- **TypeScript**: strict, ES2022, `moduleResolution: Bundler`,
  `allowImportingTsExtensions` (imports use explicit `.ts`/`.tsx` extensions).
- **Runtime**: everything executes through `tsx` (`node --import tsx`). There is no
  compiled output; `packages/*/package.json` `main`/`types` point at `src/*.ts`.
- **Tests**: `node:test` + `node:assert`, no test framework dependency.
- **Browser vs Node**: core is Node-only (static `node:*` imports in several modules,
  e.g. `dependency_registry`, `db/sqlite_workspace`). The React UI cannot bundle the
  full core and is **experimental** — do not try to fix the UI browser build as part of
  core work.
- **New packages**: add to `workspaces` via `packages/*`, use `file:` deps, extend
  `tsconfig.base.json`.

## Dependency health checks

`DependencyRegistry.runHealthChecks()` runs REAL probes: it spawns each tool binary
(`jadx --version`, `adb --version`, ...) with an 8s timeout and parses the version.
Statuses: `installed` / `missing` / `outdated` / `error`. Never stub these to `true`.

## Security

See `SECURITY.md`. Never log secrets or API keys. Paths are sanitized
(`SecuritySanitizer`) against traversal/zip-slip; preserve those guards.
