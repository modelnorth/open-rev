import test from 'node:test';
import assert from 'node:assert';
import { AnalysisPipeline } from '../../packages/core/src/pipeline/analysis_pipeline.ts';
import { FrameworkDetector } from '../../packages/core/src/format/framework_detector.ts';
import { ZipReader } from '../../packages/core/src/format/zip_reader.ts';
import { DexHeaderParser, ElfHeaderParser } from '../../packages/core/src/format/native_parsers.ts';
import { JniCrossLinker } from '../../packages/core/src/graph/jni_cross_linker.ts';
import { ArtifactKnowledgeGraph } from '../../packages/core/src/graph/knowledge_graph.ts';
import { EpistemicLedger } from '../../packages/core/src/epistemic/evidence_ledger.ts';
import { SovereignRouter } from '../../packages/core/src/ai/sovereign/sovereign_router.ts';
import { readFile } from 'node:fs/promises';

test('Full System Audit: Real APK pipeline parses, detects frameworks, extracts headers, cross-links JNI, and routes AI tools', async () => {
  const targetApk = 'tests/fixtures/FixtureApp.apk';
  const apkBytes = await readFile(targetApk);

  // 1. Full pipeline execution on real APK
  const pipeline = new AnalysisPipeline({ storeArtifacts: false });
  const pipelineRes = await pipeline.run(targetApk);

  assert.strictEqual(pipelineRes.analysis.packageName, 'com.example.two_rings');
  assert.ok(pipelineRes.graph.nodes.length >= 30, 'Knowledge graph should contain >=30 nodes');
  assert.ok(pipelineRes.reportMarkdown.includes('com.example.two_rings'));
  assert.ok(pipelineRes.analysis.exportedComponents.length > 0);

  // 2. Framework Detection on real APK entries
  const zip = await ZipReader.open(apkBytes);
  const entryNames = zip.getEntries().map(e => e.name);
  const fw = FrameworkDetector.detect(entryNames);
  assert.ok(['flutter', 'react-native', 'unity', 'native-kotlin-java'].includes(fw.framework));

  // 3. Native DEX Header Extraction on classes.dex from real APK
  const dexEntry = zip.getEntries().find(e => e.name.endsWith('.dex'));
  assert.ok(dexEntry, 'APK must contain at least one .dex file');
  const dexBytes = await zip.readEntry(dexEntry.name);
  const dexParsed = DexHeaderParser.parse(dexBytes);

  assert.strictEqual(dexParsed.version, '035');
  assert.strictEqual(dexParsed.fileSize, dexBytes.length);

  // 4. JNI Cross-Linking into Knowledge Graph
  const graph = new ArtifactKnowledgeGraph();
  const ledger = new EpistemicLedger();
  const dexMethods = [
    { className: 'com.example.two_rings.NativeBridge', methodName: 'verifyKey' }
  ];
  const elfSymbols = {
    'libnative.so': ['Java_com_example_two_rings_NativeBridge_verifyKey']
  };

  const links = JniCrossLinker.link(graph, ledger, dexMethods, elfSymbols);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].nativeSymbol, 'Java_com_example_two_rings_NativeBridge_verifyKey');
  assert.strictEqual(graph.getAllNodes().filter(n => n.type === 'JniBridge').length, 1);

  // 5. Offline Sovereign Autonomous Tool Routing Verification
  const router = new SovereignRouter();
  const route = await router.routeIntent(`Please analyze ${targetApk} and find all exported activities`);
  assert.strictEqual(route.tool, 'analyze_target');
  assert.strictEqual(route.parameters.targetPath, targetApk);
});
