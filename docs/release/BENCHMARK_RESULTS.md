# OpenRev Benchmark Results

**Date**: 2026-08-02 · **Node**: v24.18.0 · **OS**: Windows 11 (win32)
**Suite**: `scripts/benchmark.mjs` (median of 5 in-process runs)
**Repo**: openrev @ `0.1.0-alpha.1`

## Fixture (committed)

`tests/fixtures/FixtureApp.apk` — 67.8 KiB · sha256 `fae8db2c9ba34bae…`

| Metric | Result |
| :--- | :---: |
| Provider analyze (decode + extract) | **1.1 ms** |
| End-to-end pipeline | **4.7 ms** |
| Search latency (10 docs) | **< 0.1 ms** |
| Heap after pipeline | 12.5 MiB |
| RSS after pipeline | 62.0 MiB |
| Graph produced | 33 nodes / 32 edges |

## Real production APK

`app-debug.apk` — 174.0 MB (286 entries) · package `com.example.two_rings`

| Metric | Result |
| :--- | :---: |
| Provider analyze (decode + extract) | **185.3 ms** |
| End-to-end pipeline | **498.0 ms** |
| Search latency | 0.1 ms |
| Heap after pipeline | 9.2 MiB |
| RSS after pipeline | 408.4 MiB |

## Notes

- Both measurements are medians of 5 back-to-back runs; see `docs/BENCHMARKS.md` for methodology and limitations.
- RSS on the 178 MB APK reflects the full file bytes held for SHA-256 + manifest decode.
- These are evidence, not SLA commitments. No CI performance-regression gate exists yet (known limitation).
