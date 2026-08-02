import test from 'node:test';
import assert from 'node:assert';
import { runCli } from '../../packages/core/src/cli.ts';

const FIXTURE = 'tests/fixtures/FixtureApp.apk';

/**
 * runCli prints JSON via console.log / logs via console.error. These helpers
 * capture process output so tests can assert on real exit codes and content.
 */
function capture() {
  const logs: string[] = [];
  const errors: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (m?: unknown) => logs.push(String(m));
  console.error = (m?: unknown) => errors.push(String(m));
  return {
    logs,
    errors,
    restore() {
      console.log = origLog;
      console.error = origErr;
    }
  };
}

test('CLI: version prints 0.1.0-alpha.2 and exits 0', async () => {
  const cap = capture();
  try {
    const code = await runCli(['version']);
    assert.strictEqual(code, 0);
    assert.ok(cap.logs.join('\n').includes('0.1.0-alpha.2'));
  } finally {
    cap.restore();
  }
});

test('CLI: help exits 0', async () => {
  const cap = capture();
  try {
    const code = await runCli(['help']);
    assert.strictEqual(code, 0);
    assert.ok(cap.logs.join('\n').includes('Usage: openrev'));
  } finally {
    cap.restore();
  }
});

test('CLI: unknown command exits 2', async () => {
  const cap = capture();
  try {
    const code = await runCli(['frobnicate']);
    assert.strictEqual(code, 2);
  } finally {
    cap.restore();
  }
});

test('CLI: analyze with no target exits 2', async () => {
  const cap = capture();
  try {
    const code = await runCli(['analyze']);
    assert.strictEqual(code, 2);
  } finally {
    cap.restore();
  }
});

test('CLI: analyze runs real pipeline on fixture', async () => {
  const cap = capture();
  try {
    const code = await runCli(['analyze', FIXTURE, '--json']);
    assert.strictEqual(code, 0);
    const json = cap.logs.join('\n');
    const data = JSON.parse(json);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.packageName, 'com.example.two_rings');
    assert.strictEqual(data.graphNodes, 33);
    assert.ok(data.exportedComponents.length === 6);
  } finally {
    cap.restore();
  }
});

test('CLI: analyze on missing file exits 1 with FILE_NOT_FOUND', async () => {
  const cap = capture();
  try {
    const code = await runCli(['analyze', 'does-not-exist.apk', '--json']);
    assert.strictEqual(code, 1);
    assert.ok(cap.errors.join('\n').includes('FILE_NOT_FOUND'));
  } finally {
    cap.restore();
  }
});

test('CLI: graph returns 33 nodes', async () => {
  const cap = capture();
  try {
    const code = await runCli(['graph', FIXTURE, '--json']);
    assert.strictEqual(code, 0);
    const data = JSON.parse(cap.logs.join('\n'));
    assert.strictEqual(data.nodes.length, 33);
    assert.strictEqual(data.edges.length, 32);
  } finally {
    cap.restore();
  }
});

test('CLI: search finds INTERNET permission', async () => {
  const cap = capture();
  try {
    const code = await runCli(['search', FIXTURE, 'android.permission.INTERNET', '--json']);
    assert.strictEqual(code, 0);
    const data = JSON.parse(cap.logs.join('\n'));
    assert.strictEqual(data.indexedDocuments, 10);
    assert.ok(data.results.length >= 1);
  } finally {
    cap.restore();
  }
});

test('CLI: report generates real markdown', async () => {
  const cap = capture();
  try {
    const code = await runCli(['report', FIXTURE]);
    assert.strictEqual(code, 0);
    const md = cap.logs.join('\n');
    assert.ok(md.includes('com.example.two_rings'));
    assert.ok(md.includes('graph TD'));
  } finally {
    cap.restore();
  }
});

test('CLI: workflow runs static analyze step honestly', async () => {
  const cap = capture();
  try {
    const code = await runCli(['workflow', FIXTURE, '--json']);
    assert.strictEqual(code, 0);
    const data = JSON.parse(cap.logs.join('\n'));
    assert.strictEqual(data.results.step_static.success, true);
    // decompile step must NOT fake success when jadx is absent
    assert.strictEqual(data.results.step_decompile.success, false);
  } finally {
    cap.restore();
  }
});

test('CLI: deps reports real health checks', async () => {
  const cap = capture();
  try {
    const code = await runCli(['deps', '--json']);
    assert.strictEqual(code, 0);
    const data = JSON.parse(cap.logs.join('\n'));
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  } finally {
    cap.restore();
  }
});
