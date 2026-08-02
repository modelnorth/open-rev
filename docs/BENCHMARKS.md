# OpenRev Performance Benchmarks

Measured on a real machine. All timings are median of 5 runs (`scripts/benchmark.mjs`). No fabricated numbers.

**Runner**: Windows 11, Node v24.18.0, platform win32.

---

## Fixture (committed test artifact)

`tests/fixtures/FixtureApp.apk` — 67.8 KiB, package `com.example.two_rings`, 4 entries (real binary AndroidManifest.xml + resources.arsc + classes.dex stub + META-INF/MANIFEST.MF).

| Metric | Measured (median of 5) |
| :--- | :--- |
| Provider analyze (decode + extract manifest) | 1.1 ms |
| End-to-end pipeline (decode → graph → index → SQLite → report) | 4.7 ms |
| Search latency (10 indexed docs) | < 0.1 ms |
| Heap used after pipeline | 12.5 MiB |
| RSS after pipeline | 62.0 MiB |

## Real production APK

`app-debug.apk` — 174,000 KiB (178.1 MB), 286 entries, package `com.example.two_rings`.

| Metric | Measured (median of 5) |
| :--- | :--- |
| Provider analyze (decode + extract manifest) | 185.3 ms |
| End-to-end pipeline (decode → graph → index → SQLite → report) | 498.0 ms |
| Search latency | 0.1 ms |
| Heap used after pipeline | 9.2 MiB |
| RSS after pipeline | 408.4 MiB |

---

## Running locally

```bash
node --import tsx scripts/benchmark.mjs                 # fixture
$env:OPENREV_BENCH_TARGET="path/to/app.apk"; node --import tsx scripts/benchmark.mjs   # any APK
```

## Notes

- RSS on the 178 MB APK reflects the full file bytes held in memory for SHA-256 hashing and manifest decoding.
- These timings are single-threaded in-process medians on this machine; they are evidence, not SLA guarantees. JIT warm-up effects are small because runs are back-to-back.
- The 60-second "North Star" SLA in the old fabricated doc was never actually enforced by automation. No performance regression gate is wired into CI yet — this is a known limitation.
