/**
 * OpenRev MCP Server
 * 
 * Exposes OpenRev reverse-engineering capabilities to AI coding assistants
 * (Claude Code, Antigravity, OpenCode, Cursor, etc.) over the Model Context
 * Protocol using stdio transport.
 *
 * Tools exposed:
 *   analyze_target      — run the static analysis pipeline against a binary/APK
 *   list_capabilities   — list registered capability contracts
 *   check_dependencies  — run real health checks against external RE tools
 *   search_graph        — search the Artifact Knowledge Graph
 *   query_graph_api     — run domain queries (exported components, endpoints, permissions)
 *   generate_report     — produce a Markdown analysis report from the graph
 *   run_workflow        — execute a workflow DAG
 *   analyze_provider    — run a registered provider (e.g. provider.android)
 *   create_plugin       — scaffold a new plugin
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  DependencyRegistry,
  CapabilityRegistry,
  ArtifactKnowledgeGraph,
  SearchIndexer,
  ReportGenerator,
  WorkflowEngine,
  CapabilityEngine,
  KnowledgeGraphQueryAPI
} from '@openrev/core';
import { ProductionAndroidProvider } from '@openrev/providers';
import { createPluginScaffold } from '@openrev/plugin-sdk';

const TOOLS_SUMMARY = `OpenRev MCP Server v1.0.0

Exposes reverse-engineering capabilities over MCP. Call tools such as
"list_capabilities" to enumerate available capabilities, "analyze_target"
to run static analysis on a target file, "check_dependencies" to verify
external tools, or "generate_report" to export an analysis report.`;

export class OpenRevMcpServer {
  private server: McpServer;
  private registry: DependencyRegistry;
  private capabilities: CapabilityRegistry;
  private graph: ArtifactKnowledgeGraph;
  private search: SearchIndexer;
  private queryApi: KnowledgeGraphQueryAPI;

  constructor() {
    this.registry = new DependencyRegistry();
    this.capabilities = new CapabilityRegistry();
    this.graph = new ArtifactKnowledgeGraph();
    this.search = new SearchIndexer();
    this.queryApi = new KnowledgeGraphQueryAPI();

    this.server = new McpServer({
      name: 'openrev',
      version: '1.0.0'
    });

    this.registerTools();
  }

  private registerTools(): void {
    this.server.registerTool(
      'list_capabilities',
      {
        title: 'List OpenRev capabilities',
        description: 'Enumerate the capability contracts the OpenRev platform supports.'
      },
      async () => {
        const caps = this.capabilities.listCapabilities().map((c) => ({
          name: c.name,
          providerId: c.providerId,
          description: c.description
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(caps, null, 2) }]
        };
      }
    );

    this.server.registerTool(
      'check_dependencies',
      {
        title: 'Check reverse-engineering tool health',
        description:
          'Run REAL health checks against external RE tools (jadx, apktool, adb, frida, ghidra, mitmproxy, radare2, mobsfscan). Reports installed version and status for each.'
      },
      async () => {
        const deps = this.registry.listAll();
        await this.registry.runHealthChecks();
        const report = deps.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          executable: d.executableName,
          minVersion: d.minVersion,
          installedVersion: d.installedVersion ?? null,
          status: d.status
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(report, null, 2) }]
        };
      }
    );

    this.server.registerTool(
      'analyze_target',
      {
        title: 'Run static analysis pipeline',
        description:
          'Run the static analysis capability pipeline against a target file (APK, DEX, or binary). Populates the Artifact Knowledge Graph and returns an analysis summary.',
        inputSchema: {
          targetPath: z.string().describe('Path to the target binary/APK to analyze')
        }
      },
      async ({ targetPath }) => {
        const capEngine = new CapabilityEngine(this.registry, this.graph);
        const staticRes = await capEngine.executeCapability('static.analyze_apk', { targetPath });
        this.search.addDocument({
          id: `doc_${Date.now()}`,
          category: 'report',
          title: `Analysis of ${targetPath}`,
          content: staticRes.outputSummary
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: staticRes.success,
                  capabilityId: staticRes.capabilityId,
                  toolUsed: staticRes.toolUsed,
                  outputSummary: staticRes.outputSummary,
                  artifactsProduced: staticRes.artifactsProduced,
                  graphNodes: this.graph.getAllNodes().map((n) => ({
                    id: n.id,
                    type: n.type,
                    label: n.label,
                    properties: n.properties
                  })),
                  graphEdges: this.graph.getAllEdges()
                },
                null,
                2
              )
            }
          ]
        };
      }
    );

    this.server.registerTool(
      'search_graph',
      {
        title: 'Search the Artifact Knowledge Graph',
        description:
          'Search graph nodes and indexed documents by query string (package, class, permission, endpoint, etc.).',
        inputSchema: {
          query: z.string().describe('Search query, e.g. "login", "INTERNET", "MainActivity"'),
          category: z.string().optional().describe('Optional document category filter: class, method, string, resource, manifest, log, report')
        }
      },
      async ({ query, category }) => {
        const nodes = this.graph.searchNodes(query);
        const docs = this.search.search(query, category);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  graphNodes: nodes,
                  documents: docs
                },
                null,
                2
              )
            }
          ]
        };
      }
    );

    this.server.registerTool(
      'query_graph_api',
      {
        title: 'Run domain-specific graph queries',
        description:
          'Query the Knowledge Graph for exported components, endpoints requiring auth, or activities using a permission.',
        inputSchema: {
          kind: z
            .enum(['exported_components', 'endpoints_requiring_auth', 'activities_using_permission'])
            .describe('The domain query to run'),
          permission: z.string().optional().describe('Permission name (required for activities_using_permission)')
        }
      },
      async ({ kind, permission }) => {
        let result: unknown;
        switch (kind) {
          case 'exported_components':
            result = await this.queryApi.findExportedComponents();
            break;
          case 'endpoints_requiring_auth':
            result = await this.queryApi.findEndpointsRequiringAuth();
            break;
          case 'activities_using_permission':
            result = await this.queryApi.findActivitiesUsingPermission(permission ?? 'android.permission.INTERNET');
            break;
          default:
            result = { error: 'Unknown query kind' };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    this.server.registerTool(
      'generate_report',
      {
        title: 'Generate a Markdown analysis report',
        description:
          'Compile the Artifact Knowledge Graph into a professional Markdown report (components, API endpoints, Mermaid graph).'
      },
      async () => {
        const generator = new ReportGenerator(this.graph);
        const markdown = generator.generateMarkdownReport();
        return {
          content: [{ type: 'text', text: markdown }]
        };
      }
    );

    this.server.registerTool(
      'run_workflow',
      {
        title: 'Execute a workflow DAG',
        description:
          'Run the default "Full Automated APK Audit Pipeline" workflow against a target path and return per-step results.',
        inputSchema: {
          targetPath: z.string().describe('Target binary/APK path for the workflow')
        }
      },
      async ({ targetPath }) => {
        const capEngine = new CapabilityEngine(this.registry, this.graph);
        const wfEngine = new WorkflowEngine(capEngine);
        const dag = wfEngine.getDefaultAuditWorkflow();
        const results = await wfEngine.executeDAG(dag, targetPath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ workflowId: dag.id, workflowName: dag.name, results }, null, 2)
            }
          ]
        };
      }
    );

    this.server.registerTool(
      'analyze_provider',
      {
        title: 'Run a registered provider',
        description:
          'Execute a registered artifact provider (e.g. provider.android) and return normalized artifacts, graph nodes, and edges.',
        inputSchema: {
          providerId: z.string().describe('Provider id, e.g. "provider.android"'),
          targetPath: z.string().describe('Target file path'),
          outputDir: z.string().describe('Output directory for produced artifacts')
        }
      },
      async ({ providerId, targetPath, outputDir }) => {
        if (providerId === 'provider.android') {
          const provider = new ProductionAndroidProvider();
          const result = await provider.execute({ targetPath, outputDir });
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          };
        }
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Provider "${providerId}" is not available. Use "provider.android".` })
            }
          ]
        };
      }
    );

    this.server.registerTool(
      'create_plugin',
      {
        title: 'Scaffold a new OpenRev plugin',
        description: 'Generate the file structure for a new plugin (package.json, src/index.ts, README).',
        inputSchema: {
          pluginName: z.string().describe('Human-readable plugin name, e.g. "My Analyzer"')
        }
      },
      async ({ pluginName }) => {
        const files = createPluginScaffold(pluginName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ pluginName, files }, null, 2)
            }
          ]
        };
      }
    );

    this.server.registerTool(
      'list_dependencies',
      {
        title: 'List managed RE tool dependencies',
        description: 'List the external reverse-engineering tools OpenRev manages (no health check is run).'
      },
      async () => {
        const deps = this.registry.listAll().map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          executable: d.executableName,
          minVersion: d.minVersion,
          status: d.status
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(deps, null, 2) }]
        };
      }
    );
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    console.error(TOOLS_SUMMARY);
    await this.server.connect(transport);
  }
}

export async function runMcpServer(): Promise<void> {
  const server = new OpenRevMcpServer();
  await server.start();
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href) {
  runMcpServer().catch((err) => {
    console.error('[openrev-mcp] Failed to start:', err);
    process.exit(1);
  });
}
