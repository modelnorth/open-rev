# OpenRev — Claude Code Guide

OpenRev is a TypeScript monorepo (software intelligence & reverse-engineering
platform). Full operating guide for any assistant: **read `AGENTS.md` first** — it
contains the non-negotiable rules, command reference, and repo map.

## Quick facts

- **TypeScript runs directly from source** via `tsx` (`node --import tsx`). No `dist`.
- **`workspace:*` is banned** — use `file:` refs in package.json (CI npm rejects it).
- Strict TS, `moduleResolution: Bundler`, explicit `.ts`/`.tsx` import extensions.
- Tests: `node:test`, no framework. Typecheck: `tsc --noEmit` across all packages.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build        # typecheck + vite UI build
npm run dev          # React UI on :3000
npm run cli -- --json deps      # real dependency health checks
npm run mcp          # MCP server (stdio)
```

## MCP registration for Claude Code

```bash
claude mcp add openrev -- node --import tsx <abs>/packages/mcp-server/src/index.ts
```

Tools: `list_capabilities`, `check_dependencies`, `analyze_target`, `search_graph`,
`query_graph_api`, `generate_report`, `run_workflow`, `analyze_provider`,
`create_plugin`, `list_dependencies`.

## Notes

- Adapters/AI paths are partially **simulated** — don't claim real analysis.
- Dependency health checks are **real** (spawn binaries on PATH); never stub `true`.
- Don't add code comments unless essential.
- Don't modify frozen architecture (`ARCHITECTURE_FREEZE.md`) without an RFC.
