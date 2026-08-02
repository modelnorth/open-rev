import test from 'node:test';
import assert from 'node:assert';
import { JadxAdapter } from '../../packages/adapters/jadx/index.ts';
import { ApktoolAdapter } from '../../packages/adapters/apktool/index.ts';
import { AdbAdapter } from '../../packages/adapters/adb/index.ts';
import { FridaAdapter } from '../../packages/adapters/frida/index.ts';
import { GhidraAdapter } from '../../packages/adapters/ghidra/index.ts';
import { runCommand, probeTool } from '../../packages/adapters/runtime.ts';
import { OpenRevErrorCode } from '../../packages/core/src/errors/openrev_error.ts';

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
