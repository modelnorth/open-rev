# OpenRev Security Report

**Date**: 2026-08-02 · **Scope**: openrev @ `0.1.0-alpha.1`
**Method**: `scripts/security_audit.mjs` (read-only scans) + `npm audit` + manual review of security-critical paths.

---

## Summary

| Area | Result |
| :--- | :--- |
| Hardcoded secrets in 110 tracked files | ✅ None found |
| Sensitive file types committed (`.env`, `.pem`, `.key`, …) | ✅ None found |
| Secrets in CI/CD workflows | ✅ None found (single `ci.yml`, no `pull_request_target`, no secret refs) |
| Zip Slip / path traversal protections | ✅ Enforced + tested |
| Archive integrity (CRC32) | ✅ Enforced |
| `workspace:*` dependency protocol | ✅ Not used |
| Supply-chain: production dependencies | ✅ 0 vulnerabilities (`npm audit --omit=dev`) |
| Supply-chain: full dependency tree | ⚠️ 2 dev-only (vite dev-server, see below) |

---

## 1. Secret scanning

Regex scan (OpenAI `sk-`, Google `AIza`, AWS `AKIA`, GitHub `ghp_`, private-key blocks, Slack tokens, generic `*_KEY/PASSWORD = "…"`) across all 110 tracked files: **no matches**.

## 2. Archive & path safety

`packages/core/src/format/zip_reader.ts`:
- Entry extraction resolves under a fixed root and rejects any resolved path escaping it (`safePath.startsWith(root)` check) — blocks Zip Slip.
- CRC32 of every DEFLATE entry is verified on read (`CRC32 mismatch` → `CORRUPT_ARTIFACT`).
- Missing EOCD, corrupt local headers, truncated data, and oversized archives are rejected with typed errors.

`packages/core/src/security/sanitizer.ts`:
- `sanitizePath` rejects `../`, `..\`, and absolute/Windows-drive traversal.
- `sanitizeArchiveEntry` rejects `../`, leading `/`, and `:` (drive) prefixes.

Covered by `tests/unit/core.test.ts` ("SecuritySanitizer Path Traversal & Zip Slip Prevention") and the ZIP reader integration tests.

## 3. Supply chain

- `npm audit` (production): **0 vulnerabilities**.
- `npm audit` (full): 2 dev-only vulnerabilities in `vite`/`esbuild` (GHSA-67mh-4wv8-2f99 — dev-server request exposure). Affects the **experimental UI workspace only**; `vite` is a devDependency of `packages/ui`. Not shipped to users. `npm audit fix --force` would upgrade to vite 8 (breaking); deferred because UI is experimental. Tracked in `KNOWN_LIMITATIONS.md`.

## 4. Adapter hardening

`packages/adapters/runtime.ts` applies to every external tool invocation:
- Hard timeout (default 120 s) → `PROCESS_TIMEOUT`.
- Output cap (default 10 MB) → `OUTPUT_TOO_LARGE`.
- No shell interpolation — args passed as arrays.
- Missing tools return honest `TOOL_NOT_FOUND` (never fake output).

## 5. Known gaps (not security bugs, but worth noting)

- No dependency update automation / dependabot config yet.
- No secret scanning in CI (e.g., gitleaks) — recommended before production.
- `node:sqlite` workspace files are plaintext on disk (by design — local analysis store).
- MCP/CLI run with the calling user's privileges; target files are read with no sandbox boundary (documented).
