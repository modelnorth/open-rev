import test from 'node:test';
import assert from 'node:assert';
import { AgentOtelTracer } from '../../packages/core/src/observability/otel_tracer.ts';
import { BinaryWikiEngine } from '../../packages/core/src/wiki/binary_wiki.ts';

test('AgentOtelTracer starts, tracks attributes, adds events, and ends spans', () => {
  const tracer = new AgentOtelTracer();
  assert.ok(tracer.traceId.startsWith('trace_'));

  const rootSpan = tracer.startSpan('root_analysis', undefined, { 'target.file': 'App.apk' });
  assert.ok(rootSpan.startsWith('span_'));

  const childSpan = tracer.startSpan('decompile_step', rootSpan, { 'tool.name': 'jadx' });
  tracer.setAttribute(childSpan, 'classes.extracted', 42);
  tracer.addEvent(childSpan, 'jadx_stdout', { lines: 150 });

  const endedChild = tracer.endSpan(childSpan, 'OK');
  assert.ok(endedChild);
  assert.strictEqual(endedChild?.status, 'OK');
  assert.strictEqual(endedChild?.attributes['classes.extracted'], 42);
  assert.strictEqual(endedChild?.events.length, 1);

  const endedRoot = tracer.endSpan(rootSpan, 'OK');
  assert.strictEqual(tracer.getCompletedSpans().length, 2);

  const json = tracer.exportTraceJson();
  assert.ok(json.includes('root_analysis'));
  assert.ok(json.includes('decompile_step'));
});

test('BinaryWikiEngine ingests entities, tracks de-obfuscation aliases, detects contradictions, and compiles Markdown', () => {
  const wiki = new BinaryWikiEngine();

  // Ingest obfuscated class with de-obfuscated alias
  wiki.ingestEntity({
    name: 'a.b.c.v',
    category: 'Class',
    description: 'Handles network token refresh and payload encryption',
    deobfuscatedName: 'AuthTokenManager',
    attributes: {
      encryptionAlgorithm: 'AES/GCM/NoPadding',
      isExported: false
    },
    references: ['MainActivity', 'KeyStoreService'],
    source: 'JadxDecompiler'
  });

  // Ingest crypto key entity
  wiki.ingestEntity({
    name: 'AES_GCM_HARDCODED_KEY',
    category: 'CryptoKey',
    description: 'Found 32-byte static literal in native string table',
    attributes: {
      hex: '4a6f686e446f655365637265744b6579',
      lengthBytes: 16
    },
    references: ['a.b.c.v'],
    source: 'ElfStringScanner'
  });

  // Record a contradiction between static claims and dynamic behavior
  wiki.recordContradiction(
    'NetworkSecurityConfig',
    'Cleartext traffic blocked (usesCleartextTraffic=false)',
    'Plaintext HTTP GET detected to http://api.telemetry.insecure on port 80',
    'critical'
  );

  assert.strictEqual(wiki.getAllEntities().length, 2);
  assert.strictEqual(wiki.getContradictions().length, 1);

  // Compile individual entity markdown
  const entityMd = wiki.compileEntityMarkdown('a.b.c.v');
  assert.ok(entityMd.includes('AuthTokenManager (a.b.c.v)'));
  assert.ok(entityMd.includes('AES/GCM/NoPadding'));
  assert.ok(entityMd.includes('[[MainActivity]]'));

  // Compile master index markdown
  const indexMd = wiki.generateIndexMarkdown();
  assert.ok(indexMd.includes('Binary Knowledge Graph Wiki'));
  assert.ok(indexMd.includes('[[a.b.c.v]]'));
  assert.ok(indexMd.includes('Flagged Contradictions'));
  assert.ok(indexMd.includes('Plaintext HTTP GET detected'));
});
