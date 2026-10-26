import test from 'node:test';
import assert from 'node:assert';
import { SovereignGrammarCompiler } from '../../packages/core/src/ai/sovereign/sovereign_grammar.ts';
import { SovereignRouter } from '../../packages/core/src/ai/sovereign/sovereign_router.ts';

test('SovereignGrammarCompiler generates valid JSON schemas and regex constraints', () => {
  const tools = SovereignGrammarCompiler.getStandardOpenRevTools();
  assert.ok(tools.length >= 4);

  const compiled = SovereignGrammarCompiler.compileTools(tools);
  assert.strictEqual(compiled.length, tools.length);

  const analyzeGrammar = compiled.find(c => c.toolName === 'analyze_target');
  assert.ok(analyzeGrammar);
  assert.strictEqual(analyzeGrammar?.jsonSchema.type, 'object');
  assert.strictEqual(analyzeGrammar?.jsonSchema.properties.tool.const, 'analyze_target');
  assert.ok(analyzeGrammar?.regexConstraint.includes('analyze_target'));
});

test('SovereignRouter routes "analyze" requests to analyze_target with targetPath parameter', async () => {
  const engine = new SovereignRouter();
  const res = await engine.routeIntent('Can you analyze sample_target.apk for vulnerabilities?');

  assert.strictEqual(res.tool, 'analyze_target');
  assert.strictEqual(res.parameters.targetPath, 'sample_target.apk');
  assert.strictEqual(res.source, 'sovereign-embedded');
  assert.ok(res.latencyMs >= 0);
});

test('SovereignRouter routes "search" requests with regex and query options', async () => {
  const engine = new SovereignRouter();
  const res = await engine.routeIntent('Please search for "ACCESS_FINE_LOCATION" using pattern regex');

  assert.strictEqual(res.tool, 'search_artifacts');
  assert.strictEqual(res.parameters.query, 'ACCESS_FINE_LOCATION');
  assert.strictEqual(res.parameters.regex, true);
});

test('SovereignRouter routes graph queries for exported components', async () => {
  const engine = new SovereignRouter();
  const res = await engine.routeIntent('Query the knowledge graph for exported activities');

  assert.strictEqual(res.tool, 'query_graph');
  assert.strictEqual(res.parameters.nodeType, 'Activity');
  assert.strictEqual(res.parameters.exportedOnly, true);
});

test('SovereignRouter routes framework detection requests', async () => {
  const engine = new SovereignRouter();
  const res = await engine.routeIntent('Detect the framework used in target_flutter.apk');

  assert.strictEqual(res.tool, 'detect_framework');
  assert.strictEqual(res.parameters.targetPath, 'target_flutter.apk');
});

test('SovereignRouter throws structured OpenRevError for unknown intents', async () => {
  const engine = new SovereignRouter();
  await assert.rejects(
    async () => await engine.routeIntent('What is the weather in Paris today?'),
    {
      code: 'CAPABILITY_NOT_FOUND'
    }
  );
});
