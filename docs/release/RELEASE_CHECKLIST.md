# OpenRev Release Checklist — v0.1.0-alpha.1

Final go/no-go gate. Every item must be ticked by evidence before a **production**
claim; `0.1.0-alpha.1` remains alpha because items in the **blocked** section are not
done.

## Must-pass (all green now)

- [x] `npm run typecheck` exits 0
- [x] `npm test` → 29/29 pass
- [x] `npm run test:coverage` produces a coverage report (85.2% line)
- [x] CLI `analyze` runs the real pipeline on the committed fixture
- [x] MCP server completes initialize + `analyze_target` over stdio
- [x] stdout is protocol-safe (no library `console.log`)
- [x] SQLite workspace persists on disk (integration test)
- [x] No Zip Slip / path traversal (tests pass)
- [x] Adapters return honest `TOOL_NOT_FOUND` when tools absent
- [x] Benchmarks measured and committed (`docs/BENCHMARKS.md`)
- [x] Security audit run; prod deps 0 vulnerabilities (`docs/release/SECURITY_REPORT.md`)
- [x] No hardcoded secrets / sensitive files committed
- [x] Deliverables present: `TEST_REPORT`, `COVERAGE_REPORT`, `BENCHMARK_RESULTS`,
      `SECURITY_REPORT`, `RELEASE_AUDIT`, `CHANGELOG`, `KNOWN_LIMITATIONS`
- [x] Fabricated claims removed (audit listed in `RELEASE_AUDIT.md`)

## Blocked (documented, NOT ticked — do not claim these)

- [ ] jadx decompile end-to-end verified (tool absent)
- [ ] apktool decode end-to-end verified (tool absent)
- [ ] Ghidra headless verified (tool absent)
- [ ] Real Android device runtime verified (no device)
- [ ] AI/RAG verified (no LLM keys)
- [ ] Desktop UI (Tauri) runs (no Rust toolchain; browser build incompatible)
- [ ] Cross-platform CI green (pending GitHub Actions run)

## Release decision

**Verdict: `0.1.0-alpha.1` (alpha).** Ship the real pipeline + honest docs; keep the
experimental/blocked areas clearly labeled. A `0.1.0` production claim requires:
1. jadx/apktool/ghidra installed and success-path integration tests added;
2. a device-backed adb test;
3. AI/RAG behind a real provider integration or explicitly removed;
4. desktop/UI either fixed to bundle core or removed from "platform" claims;
5. a green cross-platform CI run.
