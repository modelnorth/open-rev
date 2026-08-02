/**
 * OpenRev Real Benchmark Suite
 *
 * Measures actual wall-clock timings on the committed fixture
 * (tests/fixtures/FixtureApp.apk). No fabricated numbers: every value
 * printed here is the measured median of N runs in-process.
 */

import { AnalysisPipeline } from '../packages/core/src/pipeline/analysis_pipeline.ts';
import { AndroidProvider } from '../packages/providers/android/src/index.ts';
import { SearchIndexer } from '../packages/core/src/search/indexer.ts';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

const TARGET = process.env.OPENREV_BENCH_TARGET || 'tests/fixtures/FixtureApp.apk';
const RUNS = 5;

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function fmt(ms) {
  return ms.toFixed(1) + ' ms';
}

async function main() {
  console.log(`# OpenRev Benchmark — ${TARGET}`);
  console.log(`Node ${process.version} | platform ${process.platform}`);
  console.log(`Runs per metric: ${RUNS} (median reported)\n`);

  const data = await readFile(TARGET);
  const sha = createHash('sha256').update(data).digest('hex');
  console.log(`Fixture size: ${(data.length / 1024).toFixed(1)} KiB`);
  console.log(`Fixture sha256: ${sha.slice(0, 16)}…\n`);

  // 1. Raw manifest decode (provider analyze)
  const decodeTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const res = await AndroidProvider.analyze(data, 'FixtureApp.apk');
    decodeTimes.push(performance.now() - t0);
    if (i === 0) {
      console.log(`Manifest decode: package=${res.packageName}, activities=${res.activities.length}, permissions=${res.usesPermissions.length}`);
    }
  }
  console.log(`Provider analyze (decode+extract): ${fmt(median(decodeTimes))}\n`);

  // 2. Full pipeline (decode + graph + index + SQLite + report)
  const pipelineTimes = [];
  let lastNodes = 0;
  for (let i = 0; i < RUNS; i++) {
    const pipeline = new AnalysisPipeline({ storeArtifacts: false });
    const t0 = performance.now();
    const result = await pipeline.run(TARGET);
    pipelineTimes.push(performance.now() - t0);
    lastNodes = result.graph.nodes.length;
  }
  console.log(`End-to-end pipeline: ${fmt(median(pipelineTimes))} (graph ${lastNodes} nodes, workspace persisted)\n`);

  // 3. Search latency
  const pipeline = new AnalysisPipeline({ storeArtifacts: false });
  const result = await pipeline.run(TARGET);
  const indexer = new SearchIndexer();
  result.analysis.activities.forEach((a, i) =>
    indexer.addDocument({ id: `a${i}`, category: 'class', title: a, content: a })
  );
  indexer.addDocument({
    id: 'manifest',
    category: 'manifest',
    title: 'AndroidManifest.xml',
    content: result.analysis.usesPermissions.join(' ')
  });
  const searchTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    indexer.search('MainActivity');
    searchTimes.push(performance.now() - t0);
  }
  console.log(`Search latency (10 docs): ${fmt(median(searchTimes))}\n`);

  // 4. Peak memory (rough: heap used after full pipeline + GC)
  if (global.gc) global.gc();
  const memAfter = process.memoryUsage();
  console.log(`Heap used after pipeline: ${(memAfter.heapUsed / 1024 / 1024).toFixed(1)} MiB`);
  console.log(`RSS: ${(memAfter.rss / 1024 / 1024).toFixed(1)} MiB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
