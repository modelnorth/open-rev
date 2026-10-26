import test from 'node:test';
import assert from 'node:assert';
import { EpistemicLedger } from '../../packages/core/src/epistemic/evidence_ledger.ts';
import { DexHeaderParser, ElfHeaderParser } from '../../packages/core/src/format/native_parsers.ts';
import { FrameworkDetector } from '../../packages/core/src/format/framework_detector.ts';
import { JniCrossLinker } from '../../packages/core/src/graph/jni_cross_linker.ts';
import { ArtifactKnowledgeGraph } from '../../packages/core/src/graph/knowledge_graph.ts';

test('EpistemicLedger separates proven facts, inferences, and computes coverage', () => {
  const ledger = new EpistemicLedger();
  ledger.assertProven('MainActivity', 'isExported', true, 'ManifestExtractor');
  ledger.assertInferred('CryptoManager', 'potentialKeyHardcoded', 'AES-256', 'StringScanner', 0.85, 'Found 32-byte hex literal');
  ledger.recordSkipped('assets/unreadable.bin', 'Unsupported encryption wrapper');

  const assertions = ledger.getAssertions();
  assert.strictEqual(assertions.length, 2);
  assert.strictEqual(assertions[0].modality, 'proven');
  assert.strictEqual(assertions[0].confidence, 1.0);
  assert.strictEqual(assertions[1].modality, 'inferred');
  assert.strictEqual(assertions[1].confidence, 0.85);

  const coverage = ledger.generateCoverage('App.apk', 1000, 800, ['classes.dex', 'AndroidManifest.xml']);
  assert.strictEqual(coverage.coverageRatio, 0.8);
  assert.strictEqual(coverage.skippedSections.length, 1);
});

test('FrameworkDetector identifies Flutter, React Native, Unity, and Native apps', () => {
  const flutter = FrameworkDetector.detect([
    'lib/arm64-v8a/libflutter.so',
    'lib/arm64-v8a/libapp.so',
    'assets/flutter_assets/kernel_blob.bin'
  ]);
  assert.strictEqual(flutter.framework, 'flutter');
  assert.strictEqual(flutter.confidence, 0.99);

  const rn = FrameworkDetector.detect([
    'assets/index.android.bundle',
    'lib/arm64-v8a/libhermes.so',
    'lib/arm64-v8a/libreactnativejni.so'
  ]);
  assert.strictEqual(rn.framework, 'react-native');

  const unity = FrameworkDetector.detect([
    'lib/arm64-v8a/libunity.so',
    'lib/arm64-v8a/libil2cpp.so',
    'assets/bin/Data/Managed/Metadata/global-metadata.dat'
  ]);
  assert.strictEqual(unity.framework, 'unity');

  const nativeApp = FrameworkDetector.detect([
    'classes.dex',
    'res/layout/activity_main.xml',
    'AndroidManifest.xml'
  ]);
  assert.strictEqual(nativeApp.framework, 'native-kotlin-java');
});

test('ElfHeaderParser parses ELF machine and JNI function symbols without Ghidra', () => {
  // Construct minimal valid ELF header: 0x7f 'E' 'L' 'F', 64-bit, little-endian, AArch64 (0xb7)
  const buf = Buffer.alloc(128);
  buf[0] = 0x7f; buf[1] = 0x45; buf[2] = 0x4c; buf[3] = 0x46;
  buf[4] = 2; // 64-bit
  buf[5] = 1; // little endian
  buf.writeUInt16LE(0xb7, 18); // AArch64
  
  // Embed JNI string in binary
  buf.write('Java_com_example_crypto_AESNative_decryptPayload\0libssl.so\0', 52, 'latin1');

  const res = ElfHeaderParser.parse(buf);
  assert.strictEqual(res.is64Bit, true);
  assert.strictEqual(res.machine, 'AArch64');
  assert.ok(res.jniFunctions.includes('Java_com_example_crypto_AESNative_decryptPayload'));
  assert.ok(res.neededLibraries.includes('libssl.so'));
});

test('JniCrossLinker links DEX native methods to ELF symbols and updates knowledge graph', () => {
  const graph = new ArtifactKnowledgeGraph();
  const ledger = new EpistemicLedger();

  const dexMethods = [
    { className: 'com.example.crypto.AESNative', methodName: 'decryptPayload' }
  ];

  const elfSymbols = {
    'libnative-crypto.so': ['Java_com_example_crypto_AESNative_decryptPayload']
  };

  const links = JniCrossLinker.link(graph, ledger, dexMethods, elfSymbols);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].javaClass, 'com.example.crypto.AESNative');
  assert.strictEqual(links[0].nativeLibrary, 'libnative-crypto.so');

  const jniNodes = graph.getAllNodes().filter(n => n.type === 'JniBridge');
  assert.strictEqual(jniNodes.length, 1);

  const assertions = ledger.getAssertionsByModality('proven');
  assert.strictEqual(assertions.length, 1);
  assert.strictEqual(assertions[0].predicate, 'resolvesToNativeSymbol');
});
