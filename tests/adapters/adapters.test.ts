import test from 'node:test';
import assert from 'node:assert';
import { JadxAdapter } from '../../packages/adapters/jadx/index.ts';
import { ApktoolAdapter } from '../../packages/adapters/apktool/index.ts';
import { AdbAdapter } from '../../packages/adapters/adb/index.ts';
import { FridaAdapter } from '../../packages/adapters/frida/index.ts';
import { GhidraAdapter } from '../../packages/adapters/ghidra/index.ts';
import { runCommand, probeTool, compareVersions, verifyChecksum } from '../../packages/adapters/runtime.ts';
import { OpenRevErrorCode } from '../../packages/core/src/errors/openrev_error.ts';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

test('JADX Adapter probes availability honestly', async () => {
  const adapter = new JadxAdapter();
  const probe = await adapter.isAvailable();
  assert.strictEqual(typeof probe.found, 'boolean');
});

test('JADX Adapter decompile returns TOOL_NOT_FOUND when unavailable', async () => {
  const adapter = new JadxAdapter();
  const probe = await adapter.isAvailable();
  if (probe.found || probe.dockerAvailable) {
    // Tool present on this machine: just ensure the method resolves to a response.
    const res = await adapter.decompile('tests/fixtures/FixtureApp.apk', {
      decompileCode: true,
      exportResources: true,
      outputDir: './out'
    });
    assert.ok('ok' in res);
  } else {
    const res = await adapter.decompile('tests/fixtures/FixtureApp.apk', {
      decompileCode: true,
      exportResources: true,
      outputDir: './out'
    });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.error.code, OpenRevErrorCode.TOOL_NOT_FOUND);
  }
});

test('Apktool Adapter probes availability honestly', async () => {
  const adapter = new ApktoolAdapter();
  const probe = await adapter.isAvailable();
  assert.strictEqual(typeof probe.found, 'boolean');
});

test('ADB Adapter lists real devices only', async () => {
  const adb = new AdbAdapter();
  const probe = await adb.isAvailable();
  if (!probe.found) {
    const res = await adb.listDevices();
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.error.code, OpenRevErrorCode.TOOL_NOT_FOUND);
    return;
  }
  const res = await adb.listDevices();
  assert.strictEqual(res.ok, true);
  assert.ok(Array.isArray(res.value));
  // Every entry must be a real parsed device record, never canned strings.
  for (const d of res.value) {
    assert.strictEqual(typeof d.serial, 'string');
    assert.ok(['device', 'offline', 'unauthorized', 'unknown'].includes(d.state));
  }
});

test('Frida Adapter probes availability honestly', async () => {
  const adapter = new FridaAdapter();
  const probe = await adapter.isAvailable();
  assert.strictEqual(typeof probe.found, 'boolean');
});

test('Frida Adapter attach returns TOOL_NOT_FOUND when unavailable', async () => {
  const adapter = new FridaAdapter();
  const probe = await adapter.isAvailable();
  if (!probe.found) {
    const res = await adapter.attach('com.example', 'console.log(1)');
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.error.code, OpenRevErrorCode.TOOL_NOT_FOUND);
  }
});

test('Ghidra Adapter probes availability honestly', async () => {
  const adapter = new GhidraAdapter();
  const probe = await adapter.isAvailable();
  assert.strictEqual(typeof probe.found, 'boolean');
});

test('Ghidra Adapter analyzeElf returns TOOL_NOT_FOUND when unavailable', async () => {
  const adapter = new GhidraAdapter();
  const probe = await adapter.isAvailable();
  if (!probe.found) {
    const res = await adapter.analyzeElf('tests/fixtures/libnative.so');
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.error.code, OpenRevErrorCode.TOOL_NOT_FOUND);
  }
});

test('runCommand returns real process output', async () => {
  const res = await runCommand(process.execPath, {
    args: ['-e', 'console.log("hello-from-node")'],
    timeoutMs: 10_000
  });
  assert.strictEqual(res.code, 0);
  assert.ok(res.stdout.includes('hello-from-node'));
});

test('runCommand surfaces TOOL_NOT_FOUND for missing binary', async () => {
  await assert.rejects(
    runCommand('definitely_not_a_real_tool_xyz', { args: [], timeoutMs: 5000 }),
    (err: any) => err.code === OpenRevErrorCode.TOOL_NOT_FOUND
  );
});

test('runCommand times out on a blocking process', async () => {
  await assert.rejects(
    runCommand(process.execPath, { args: ['-e', 'setTimeout(()=>{}, 60000)'], timeoutMs: 500 }),
    (err: any) => err.code === OpenRevErrorCode.PROCESS_TIMEOUT
  );
});

test('probeTool detects node itself', async () => {
  const res = await probeTool(process.execPath, ['--version']);
  assert.strictEqual(res.found, true);
});

test('compareVersions orders dotted versions', () => {
  assert.strictEqual(compareVersions('1.4.7', '1.4.7'), 0);
  assert.strictEqual(compareVersions('1.5.6', '1.4.7'), 1);
  assert.strictEqual(compareVersions('1.4.6', '1.4.7'), -1);
  assert.strictEqual(compareVersions('2.0.0', '1.99.99'), 1);
  assert.strictEqual(compareVersions('1.4.7', '1.4'), 1);
});

test('probeTool validates version against a minimum', async () => {
  const res = await probeTool(process.execPath, ['--version'], undefined, '99.0.0');
  if (res.found) {
    assert.strictEqual(res.versionOk, false);
  }
  const ok = await probeTool(process.execPath, ['--version'], undefined, '1.0.0');
  if (ok.found) {
    assert.strictEqual(ok.versionOk, true);
  }
});

test('probeTool with a custom path resolves and reports executablePath', async () => {
  const res = await probeTool('does-not-exist', ['--version'], undefined, undefined, process.execPath);
  assert.strictEqual(res.found, true);
  assert.strictEqual(res.executablePath, process.execPath);
});

test('probeTool with a missing custom path is not found', async () => {
  const res = await probeTool('anything', ['--version'], undefined, undefined, 'C:/definitely/not/here/tool');
  assert.strictEqual(res.found, false);
});

test('verifyChecksum matches real file SHA-256', async () => {
  const data = await readFile(process.execPath);
  const expected = createHash('sha256').update(data).digest('hex');
  assert.strictEqual(await verifyChecksum(process.execPath, expected), true);
  assert.strictEqual(await verifyChecksum(process.execPath, 'deadbeef'.repeat(8)), false);
});

test('JADX custom executable path is honored and version validated', async () => {
  const custom = process.env.OPENREV_JADX;
  const adapter = new JadxAdapter();
  const probe = await adapter.isAvailable(custom);
  // If a custom tool is configured, it must resolve and validate.
  if (custom || probe.found) {
    assert.strictEqual(probe.found, true);
    assert.ok(probe.version, 'expected a parsed version');
    if (probe.version) assert.strictEqual(probe.versionOk, true);
  }
});
