import test from 'node:test';
import assert from 'node:assert';
import { ArtifactKnowledgeGraph } from '../../packages/core/src/graph/knowledge_graph.ts';
import { DependencyRegistry } from '../../packages/core/src/deps/dependency_registry.ts';
import { KnowledgeGraphQueryAPI, WorkspaceSnapshotEngine } from '../../packages/core/src/api/platform_api.ts';
import { ExtensionHostManager } from '../../packages/core/src/extension_host/extension_host.ts';
import { RemoteExecutionGateway } from '../../packages/core/src/runtime/remote_execution.ts';
import { VerticalSliceRunner } from '../../packages/core/src/vertical_slice_demo.ts';
import { SecuritySanitizer } from '../../packages/core/src/security/sanitizer.ts';
import { ProductionAndroidProvider } from '../../packages/providers/android/src/index.ts';
import { OpenRevSDK } from '../../packages/sdk/src/index.ts';

test('SecuritySanitizer Path Traversal & Zip Slip Prevention', () => {
  assert.throws(
    () => SecuritySanitizer.sanitizePath('../etc/passwd'),
    (err: any) => err.code === 'PATH_TRAVERSAL_DETECTED'
  );
  assert.throws(
    () => SecuritySanitizer.validateZipEntry('../../../malicious.exe'),
    (err: any) => err.code === 'ZIP_SLIP_ATTEMPT'
  );
  assert.strictEqual(SecuritySanitizer.sanitizePath('valid/dir/app.apk'), 'valid/dir/app.apk');
});

test('ProductionAndroidProvider Output Normalization', async () => {
  const provider = new ProductionAndroidProvider();
  const res = await provider.execute({
    targetPath: 'tests/fixtures/FixtureApp.apk',
    outputDir: './out'
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.providerId, 'provider.android');
  assert.strictEqual(res.artifactsProduced.length, 2);
  assert.ok(res.graphNodes.length >= 20, `expected >=20 graph nodes, got ${res.graphNodes.length}`);
  assert.ok(res.graphEdges.length >= 18, `expected >=18 graph edges, got ${res.graphEdges.length}`);
  const apk = res.artifactsProduced[0].payload;
  assert.strictEqual(apk.package, 'com.example.two_rings');
});

test('OpenRevSDK High-Level API Analysis', async () => {
  const sdk = new OpenRevSDK();
  const res = await sdk.analyzeTarget('tests/fixtures/FixtureApp.apk');

  assert.ok(res.artifactsCount >= 1, 'artifacts >= 1');
  assert.ok(res.graphNodesCount >= 20, `graph nodes >= 20, got ${res.graphNodesCount}`);
  assert.strictEqual(res.packageName, 'com.example.two_rings');
  assert.ok(res.hash.length === 64);
});

test('Milestone 0 End-to-End Vertical Slice Execution', async () => {
  const runner = new VerticalSliceRunner();
  const res = await runner.runMilestone0Demo('tests/fixtures/FixtureApp.apk');

  assert.ok(res.artifactsCount >= 1, `artifacts >= 1, got ${res.artifactsCount}`);
  assert.ok(res.graphNodesCount >= 20, `graph nodes >= 20, got ${res.graphNodesCount}`);
  assert.ok(res.searchResultsCount >= 9, `search results >= 9, got ${res.searchResultsCount}`);
  assert.ok(res.snapshotId.startsWith('snap_'));
  assert.strictEqual(res.packageName, 'com.example.two_rings');
});

test('ArtifactKnowledgeGraph Node & Edge Management', () => {
  const graph = new ArtifactKnowledgeGraph();

  graph.addNode({
    id: 'apk_1',
    type: 'APK',
    label: 'TestApp.apk',
    properties: { package: 'com.test.app' }
  });

  graph.addNode({
    id: 'act_main',
    type: 'Activity',
    label: 'MainActivity',
    properties: { exported: true }
  });

  graph.addEdge({
    id: 'e1',
    source: 'apk_1',
    target: 'act_main',
    relationship: 'CONTAINS'
  });

  assert.strictEqual(graph.getAllNodes().length, 2);
  assert.strictEqual(graph.getAllEdges().length, 1);
  assert.strictEqual(graph.getNode('apk_1')?.label, 'TestApp.apk');
});

test('ExtensionHostManager Process Spawning & Termination', async () => {
  const extHost = new ExtensionHostManager();
  const proc = await extHost.spawnExtensionHost({
    id: 'plugin.apk_analyzer',
    name: 'APK Analyzer Plugin',
    version: '1.0.0',
    description: 'Test plugin',
    author: 'OpenRev',
    license: 'Apache-2.0'
  });

  assert.strictEqual(proc.pluginId, 'plugin.apk_analyzer');
  assert.strictEqual(proc.status, 'active');

  const termRes = extHost.terminateExtensionHost('plugin.apk_analyzer');
  assert.strictEqual(termRes, true);
  assert.strictEqual(proc.status, 'terminated');
});

test('RemoteExecutionGateway Multi-Target Routing', async () => {
  const gateway = new RemoteExecutionGateway();
  const localRes = await gateway.execute('provider.android', 'analyze', {}, { target: 'local' });
  assert.strictEqual(localRes.mode, 'local');

  // docker and remote targets must fail honestly when not configured
  await assert.rejects(
    gateway.execute('provider.mobsf', 'scan', {}, { target: 'docker', dockerImage: 'opensec/mobsf' }),
    (err: any) => err.code === 'TOOL_NOT_FOUND' || err.code === 'TOOL_EXECUTION_FAILED'
  );
  await assert.rejects(
    gateway.execute('provider.mobsf', 'scan', {}, { target: 'remote', endpointUrl: 'https://example.com' }),
    (err: any) => err.code === 'UNSUPPORTED_FORMAT'
  );
});

test('KnowledgeGraphQueryAPI Domain Queries', async () => {
  const graph = new ArtifactKnowledgeGraph();
  graph.addNode({
    id: 'apk_1',
    type: 'APK',
    label: 'FixtureApp.apk',
    properties: { package: 'com.example.two_rings' }
  });
  graph.addNode({
    id: 'act_1',
    type: 'Activity',
    label: 'MainActivity',
    properties: { name: 'com.example.two_rings.MainActivity', exported: true }
  });
  graph.addNode({
    id: 'act_2',
    type: 'Activity',
    label: 'SecretActivity',
    properties: { name: 'com.example.two_rings.SecretActivity', exported: false }
  });
  graph.addEdge({
    id: 'e1',
    source: 'apk_1',
    target: 'act_1',
    relationship: 'CONTAINS'
  });

  const queryApi = new KnowledgeGraphQueryAPI(graph);
  const exported = await queryApi.findExportedComponents();
  assert.strictEqual(exported.length, 1);
  assert.strictEqual(exported[0].properties.name, 'com.example.two_rings.MainActivity');
});

test('WorkspaceSnapshotEngine Snapshots & Restores', () => {
  const engine = new WorkspaceSnapshotEngine();
  const snap = engine.createSnapshot('Initial Analysis', { nodes: [] }, ['sha256_abc']);
  assert.ok(snap.id.startsWith('snap_'));

  const restored = engine.restoreSnapshot(snap.id);
  assert.strictEqual(restored?.description, 'Initial Analysis');
});

test('DependencyRegistry Health Checks', async () => {
  const registry = new DependencyRegistry();
  const jadx = registry.get('jadx');
  assert.ok(jadx);
  assert.strictEqual(jadx?.name, 'JADX');

  const health = await registry.runHealthChecks();
  for (const id of Object.keys(health)) {
    assert.strictEqual(typeof health[id], 'boolean');
  }
  assert.strictEqual(registry.get('jadx')?.status, health['jadx'] ? 'installed' : 'missing');
});
