import test from 'node:test';
import assert from 'node:assert';
import { MachOParser } from '../../packages/core/src/format/macho_parser.ts';
import { AndroidVersionAuditor, ANDROID_API_REGISTRY } from '../../packages/core/src/format/android_version_matrix.ts';
import { IosProvider } from '../../packages/providers/ios/src/index.ts';
import { writeFile, unlink } from 'node:fs/promises';

test('MachOParser decodes 64-bit ARM64/ARM64e headers, LC_LOAD_DYLIB, and ObjC/Swift symbols', () => {
  // Construct minimal valid Mach-O 64-bit ARM64 header
  // Magic: 0xfeedfacf (MH_MAGIC_64, little-endian)
  const dylibStr = '/System/Library/Frameworks/Security.framework/Security\0';
  const strLen = Buffer.byteLength(dylibStr);
  const cmdsize = 24 + strLen; // 24 bytes header + string

  const buf = Buffer.alloc(128 + cmdsize);
  buf.writeUInt32LE(0xfeedfacf, 0); // MH_MAGIC_64
  buf.writeUInt32LE(0x0100000c, 4); // CPU_TYPE_ARM64
  buf.writeUInt32LE(0x00000002, 8); // CPU_SUBTYPE
  buf.writeUInt32LE(0x00000002, 12); // FILETYPE_EXEC
  buf.writeUInt32LE(1, 16); // ncmds = 1
  buf.writeUInt32LE(cmdsize, 20); // sizeofcmds

  // Load Command: LC_LOAD_DYLIB (0x0c)
  buf.writeUInt32LE(0x0c, 32); // cmd
  buf.writeUInt32LE(cmdsize, 36); // cmdsize
  buf.writeUInt32LE(24, 40); // offset to name within cmd (24)
  buf.write(dylibStr, 56, 'utf8');

  // Embed ObjC and Swift signatures in binary data
  const tailOffset = 56 + strLen + 4;
  buf.write('OBJC_CLASS_$_SecretVaultManager\0$s10TestApp7StorageC11savePayloadyyF\0', tailOffset, 'latin1');

  const parsed = MachOParser.parse(buf);
  assert.strictEqual(parsed.is64Bit, true);
  assert.strictEqual(parsed.cpuType, 'ARM64 / ARM64e');
  assert.ok(parsed.dylibDependencies.some(d => d.includes('Security.framework')));
  assert.ok(parsed.objcClasses.includes('SecretVaultManager'));
  assert.ok(parsed.swiftSymbols.some(s => s.startsWith('$s10TestApp')));
});

test('AndroidVersionAuditor audits targets across Android 4.0 (API 14) to Android 16 (API 36)', () => {
  // 1. Audit legacy KitKat / JellyBean app
  const legacyAudit = AndroidVersionAuditor.auditTarget(16, 21);
  assert.ok(legacyAudit.securityGaps.length >= 2, 'Should warn about legacy targetSdk < 31 and < 28');
  assert.ok(legacyAudit.warnings.some(w => w.includes('multidex')));

  // 2. Audit modern Android 15/16 app
  const modernAudit = AndroidVersionAuditor.auditTarget(26, 35);
  assert.strictEqual(modernAudit.securityGaps.length, 0);
  assert.strictEqual(modernAudit.compatibilityScore, 100);

  // 3. Verify registry contains API 14 to API 36
  assert.strictEqual(ANDROID_API_REGISTRY[14].codename, 'Ice Cream Sandwich');
  assert.strictEqual(ANDROID_API_REGISTRY[36].codename, 'Android 16');
  assert.ok(ANDROID_API_REGISTRY[35].securityMilestones.some(m => m.includes('16 KB')));
});

test('IosProvider creates normalized artifacts and knowledge graph for iOS 18 binaries', async () => {
  const provider = new IosProvider();
  assert.strictEqual(provider.manifest.id, 'provider.ios');
  assert.ok(provider.manifest.capabilities.includes('AnalyzeIPA'));

  // Create temporary Mach-O test file
  const tempPath = 'tests/fixtures/test_macho_bin';
  const buf = Buffer.alloc(128);
  buf.writeUInt32LE(0xfeedfacf, 0); // MH_MAGIC_64
  buf.writeUInt32LE(0x0100000c, 4); // ARM64
  await writeFile(tempPath, buf);

  try {
    const res = await provider.execute({ targetPath: tempPath, outputDir: './out' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.artifactsProduced.length, 1);
    assert.strictEqual(res.artifactsProduced[0].type, 'IPA');
    assert.ok(res.graphNodes.some(n => n.type === 'MachO'));
  } finally {
    await unlink(tempPath).catch(() => {});
  }
});
