import test from 'node:test';
import assert from 'node:assert';
import { AnalysisPipeline } from '../../packages/core/src/pipeline/analysis_pipeline.ts';
import { ArtifactKnowledgeGraph } from '../../packages/core/src/graph/knowledge_graph.ts';
import { SearchIndexer } from '../../packages/core/src/search/indexer.ts';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function cleanupDir(dir: string) {
  for (let i = 0; i < 20; i++) {
    try {
      (globalThis as any).gc?.();
      await rm(dir, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  await rm(dir, { recursive: true, force: true });
}

const FIXTURE = 'tests/fixtures/FixtureApp.apk';

test('AnalysisPipeline parses real APK fixture end-to-end', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'openrev-pipe-test-'));
  try {
    const pipe = new AnalysisPipeline({
      workspaceDbPath: join(dir, 'ws.db'),
      artifactsDir: join(dir, 'artifacts')
    });
    const r = await pipe.run(FIXTURE);

    assert.strictEqual(r.analysis.packageName, 'com.example.two_rings');
    assert.strictEqual(r.analysis.versionCode, 1);
    assert.ok(r.analysis.activities.length >= 9, `activities >= 9, got ${r.analysis.activities.length}`);
    assert.strictEqual(r.analysis.launchActivity, 'com.example.two_rings.MainActivity');
    assert.ok(r.hash.length === 64, 'sha256 hex length');
    assert.ok(r.analysis.entryCount >= 4, 'entryCount >= 4');
    assert.ok(r.graph.nodes.length >= 20, `nodes >= 20, got ${r.graph.nodes.length}`);
    assert.ok(r.graph.edges.length >= 18, `edges >= 18, got ${r.graph.edges.length}`);
    assert.ok(r.searchResultCount >= 9, `search docs >= 9, got ${r.searchResultCount}`);
    assert.strictEqual(r.artifactCount, 1);
    assert.ok(r.reportMarkdown.includes('com.example.two_rings'));
    assert.ok(r.reportMarkdown.includes('Permissions Requested'));
    assert.ok(r.elapsedMs > 0);
  } finally {
    await cleanupDir(dir);
  }
});

test('AnalysisPipeline produces a structurally valid graph', async () => {
  const pipe = new AnalysisPipeline({ storeArtifacts: false });
  const r = await pipe.run(FIXTURE);

  const graph = new ArtifactKnowledgeGraph();
  for (const n of r.graph.nodes) graph.addNode(n as any);
  for (const e of r.graph.edges) graph.addEdge(e as any);

  const validation = graph.validate();
  assert.strictEqual(validation.valid, true, JSON.stringify(validation.issues));
  assert.strictEqual(validation.nodeCount, r.graph.nodes.length);
  assert.strictEqual(validation.edgeCount, r.graph.edges.length);
});

test('AnalysisPipeline persists workspace + artifacts to SQLite', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'openrev-pipe-persist-'));
  try {
    const dbPath = join(dir, 'ws.db');
    const pipe = new AnalysisPipeline({ workspaceDbPath: dbPath, storeArtifacts: true });
    const r = await pipe.run(FIXTURE);

    const { SQLiteWorkspace } = await import('../../packages/core/src/db/sqlite_workspace.ts');
    const ws = new SQLiteWorkspace(dbPath);
    await ws.init();
    const record = await ws.getRecord('workspaces', r.workspace.recordId);
    assert.ok(record, 'workspace record persisted');
    assert.strictEqual(record.name, 'FixtureApp.apk');
    const artifacts = await ws.listArtifacts();
    assert.ok(artifacts.length >= 1, 'artifacts persisted to sqlite');
    const docs = await ws.loadSearchDocuments();
    assert.ok(docs.length >= 9, `search docs persisted, got ${docs.length}`);
    await ws.close();
  } finally {
    await cleanupDir(dir);
  }
});

test('AnalysisPipeline reports FILE_NOT_FOUND for missing target', async () => {
  const pipe = new AnalysisPipeline({ storeArtifacts: false });
  await assert.rejects(
    pipe.run('tests/fixtures/does_not_exist.apk'),
    (err: any) => err.code === 'FILE_NOT_FOUND'
  );
});

test('SearchIndexer ranks exact keyword matches', () => {
  const idx = new SearchIndexer();
  idx.addDocument({
    id: 'a',
    category: 'manifest',
    title: 'AndroidManifest.xml',
    content: 'permission=android.permission.INTERNET activity=MainActivity'
  });
  idx.addDocument({
    id: 'b',
    category: 'class',
    title: 'MainActivity',
    content: 'class MainActivity { String URL = "https://api.example.com"; }'
  });
  idx.addDocument({
    id: 'c',
    category: 'resource',
    title: 'colors.xml',
    content: 'color primary #FF0000'
  });

  const internet = idx.search('INTERNET');
  assert.strictEqual(internet.length, 1);
  assert.strictEqual(internet[0].id, 'a');

  const main = idx.search('MainActivity');
  assert.strictEqual(main.length, 2);
  assert.strictEqual(main[0].id, 'b');

  const api = idx.search('api.example');
  assert.strictEqual(api.length, 1);
  assert.strictEqual(api[0].id, 'b');
});

test('SearchIndexer supports regex mode and category filter', () => {
  const idx = new SearchIndexer();
  idx.addDocument({ id: '1', category: 'manifest', title: 'mf', content: 'android.permission.INTERNET' });
  idx.addDocument({ id: '2', category: 'class', title: 'cls', content: 'android.permission.LOCATION' });

  const regex = idx.search('regex:android\\.permission\\.');
  assert.strictEqual(regex.length, 2);

  const filtered = idx.search('regex:android\\.permission\\.', 'class');
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].id, '2');
});

test('SearchIndexer throws on invalid regex', () => {
  const idx = new SearchIndexer();
  idx.addDocument({ id: '1', category: 'manifest', title: 'mf', content: 'abc' });
  assert.throws(() => idx.search('regex:['), /Invalid search regex/);
});
