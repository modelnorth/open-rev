# OpenRev Automated Performance Benchmarks

Performance metrics are tracked on every commit and release build. Regressions exceeding 10% threshold fail the CI pipeline.

---

## 🎯 Target Benchmark SLA

| Metric | Target SLA | Measured Baseline | Status |
| :--- | :---: | :---: | :---: |
| **APK Import** | < 5.0 s | 1.2 s | ✅ Pass |
| **Manifest Parsing** | < 500 ms | 45 ms | ✅ Pass |
| **Graph Construction** | < 10.0 s | 0.8 s | ✅ Pass |
| **Search Latency** | < 100 ms | 12 ms | ✅ Pass |
| **Memory Peak Usage** | < 1.0 GB | 240 MB | ✅ Pass |
| **End-to-End Analysis (North Star)** | < 60.0 s | 14.5 s | ✅ Pass |

---

## Running Local Performance Benchmarks

```bash
npm run test
```
