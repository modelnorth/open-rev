import test from 'node:test';
import assert from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { OpenRevMcpServer } from '../../packages/mcp-server/src/index.ts';

const FIXTURE = 'tests/fixtures/FixtureApp.apk';

type ToolResult = { isError?: boolean; content?: Array<{ type: string; text?: string }> };

function toolText(res: ToolResult): string {
  return (res.content ?? []).find((c) => c.type === 'text')?.text ?? '';
}

async function connectPair() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new OpenRevMcpServer();
  await server.start(serverTransport);
  const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
  return { client, server };
}

test('MCP: tools/list exposes all tools with input schemas', async () => {
  const { client } = await connectPair();
  try {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name).sort();
    for (const expected of [
      'list_capabilities',
      'check_dependencies',
      'analyze_target',
      'search_graph',
      'query_graph_api',
      'generate_report',
      'run_workflow',
      'analyze_provider',
      'create_plugin',
      'list_dependencies'
    ]) {
      assert.ok(names.includes(expected), `missing tool ${expected}`);
    }
    const analyze = result.tools.find((t) => t.name === 'analyze_target');
    assert.ok(analyze, 'analyze_target tool present');
    assert.ok(analyze.inputSchema && typeof analyze.inputSchema === 'object', 'analyze_target has input schema');
  } finally {
    await client.close();
  }
});

test('MCP: analyze_target runs the real pipeline', async () => {
  const { client } = await connectPair();
  try {
    const res = (await client.callTool({
      name: 'analyze_target',
      arguments: { targetPath: FIXTURE }
    })) as unknown as ToolResult;
    const data = JSON.parse(toolText(res));
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.toolUsed, 'OpenRev Android Provider');
    assert.strictEqual(data.graphNodes.length, 33);
  } finally {
    await client.close();
  }
});

test('MCP: analyze_target on missing file returns isError with typed code', async () => {
  const { client } = await connectPair();
  try {
    const res = (await client.callTool({
      name: 'analyze_target',
      arguments: { targetPath: 'nope.apk' }
    })) as unknown as ToolResult;
    assert.strictEqual(res.isError, true);
    assert.ok(toolText(res).includes('FILE_NOT_FOUND'), `expected FILE_NOT_FOUND in ${toolText(res)}`);
  } finally {
    await client.close();
  }
});

test('MCP: query_graph_api returns exported components after analysis', async () => {
  const { client } = await connectPair();
  try {
    await client.callTool({ name: 'analyze_target', arguments: { targetPath: FIXTURE } });
    const res = (await client.callTool({ name: 'query_graph_api', arguments: { kind: 'exported_components' } })) as unknown as ToolResult;
    const exported = JSON.parse(toolText(res));
    assert.strictEqual(exported.length, 6);
  } finally {
    await client.close();
  }
});

test('MCP: generate_report returns real Markdown', async () => {
  const { client } = await connectPair();
  try {
    await client.callTool({ name: 'analyze_target', arguments: { targetPath: FIXTURE } });
    const res = (await client.callTool({ name: 'generate_report', arguments: {} })) as unknown as ToolResult;
    const md = toolText(res);
    assert.ok(md.includes('com.example.two_rings'));
    assert.ok(md.includes('graph TD'));
  } finally {
    await client.close();
  }
});

test('MCP: analyze_provider with unknown provider returns isError', async () => {
  const { client } = await connectPair();
  try {
    const res = (await client.callTool({
      name: 'analyze_provider',
      arguments: { providerId: 'provider.does_not_exist', targetPath: FIXTURE, outputDir: '.' }
    })) as unknown as ToolResult;
    assert.strictEqual(res.isError, true);
    assert.ok(toolText(res).includes('not available'), `expected not-available error in ${toolText(res)}`);
  } finally {
    await client.close();
  }
});

test('MCP: analyze_provider provider.jadx returns honest TOOL_NOT_FOUND when absent', async () => {
  const { client } = await connectPair();
  try {
    const res = (await client.callTool({
      name: 'analyze_provider',
      arguments: { providerId: 'provider.jadx', targetPath: FIXTURE, outputDir: '.' }
    })) as unknown as ToolResult;
    const text = toolText(res);
    // If jadx is installed the call succeeds; if absent it must be an honest error.
    if (res.isError) {
      assert.ok(text.includes('TOOL_NOT_FOUND') || text.includes('jadx'), `expected honest jadx error in ${text}`);
    } else {
      const parsed = JSON.parse(text);
      assert.strictEqual(parsed.success, true);
    }
  } finally {
    await client.close();
  }
});
