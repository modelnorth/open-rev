import test from 'node:test';
import assert from 'node:assert';
import { JadxAdapter } from '../../packages/adapters/jadx/index.ts';
import { AdbAdapter } from '../../packages/adapters/adb/index.ts';
import { GhidraAdapter } from '../../packages/adapters/ghidra/index.ts';

test('JADX Adapter Invocation', async () => {
  const adapter = new JadxAdapter();
  const res = await adapter.decompile('SampleApp.apk', {
    decompileCode: true,
    exportResources: true,
    outputDir: './out'
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.outputDir, './out');
});

test('ADB Adapter Devices Listing', async () => {
  const adb = new AdbAdapter();
  const devices = await adb.listDevices();
  assert.ok(devices.length > 0);
});

test('Ghidra Adapter ELF Analysis', async () => {
  const ghidra = new GhidraAdapter();
  const res = await ghidra.analyzeElf('libnative.so');
  assert.ok(res.symbols.length > 0);
  assert.ok(res.decompiledC.includes('secret_key_derive'));
});
