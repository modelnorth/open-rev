/**
 * OpenRev CLI Entrypoint
 *
 * Commands:
 *   openrev analyze <file> [--out report.md]   Run the real analysis pipeline
 *   openrev deps                                Run real dependency health checks
 *   openrev graph <file>                        Print the knowledge graph from a real analysis
 *   openrev search <file> <query>               Search a real analysis' indexed documents
 *   openrev report <file> [--out file.md]       Generate a Markdown analysis report
 *   openrev workflow <target>                   Run the audit workflow DAG (honest results)
 *   openrev capabilities                        List capability contracts
 *   openrev version                             Print version
 *
 * Global flags:
 *   --json    Emit machine-readable JSON on stdout (logs go to stderr)
 *   --help    Show help
 *
 * Exit codes: 0 success, 1 error, 2 usage error.
 */

import {
  DependencyRegistry,
  CapabilityRegistry,
  ArtifactKnowledgeGraph,
  CapabilityEngine,
  SearchIndexer,
  SQLiteWorkspace,
  WorkflowEngine,
  AnalysisPipeline
} from './index.ts';

import { writeFile } from 'node:fs/promises';

interface CliOptions {
  json: boolean;
}

const VERSION = '0.1.0-alpha.2';

function log(...args: unknown[]): void {
  console.error(...args);
}

function output(data: unknown, options: CliOptions): void {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    log(JSON.stringify(data, null, 2));
  }
}

function parseArgs(argv: string[]): { command: string; args: string[]; options: CliOptions } {
  const options: CliOptions = { json: false };
  const rest: string[] = [];
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') return { command: 'help', args: [], options };
    else rest.push(arg);
  }
  return { command: rest[0] || 'help', args: rest.slice(1), options };
}

const HELP = `OpenRev CLI v${VERSION}
Usage: openrev <command> [args] [--json]

Commands:
  analyze <file>          Run the real analysis pipeline
  deps                    Run real dependency health checks
  graph <file>            Print the knowledge graph from a real analysis
  search <file> <query>   Search a real analysis' indexed documents
  report <file> [--out]   Generate a Markdown analysis report
  workflow <target>       Run the default audit workflow DAG
  capabilities            List capability contracts
  version                 Print version
  help                    Show this help

Global flags:
  --json    Emit machine-readable JSON on stdout
  --help    Show help
`;

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as any;
    const code = typeof anyErr.code === 'string' ? `[${anyErr.code}] ` : '';
    const remediation = typeof anyErr.remediation === 'string' ? ` ${anyErr.remediation}` : '';
    return `${code}${err.message}${remediation}`;
  }
  return String(err);
}

export async function runCli(argv: string[]): Promise<number> {
  const { command, args, options } = parseArgs(argv);

  switch (command) {
    case 'help': {
      console.log(HELP);
      return 0;
    }
    case 'version': {
      console.log(VERSION);
      return 0;
    }
    case 'capabilities': {
      const registry = new CapabilityRegistry();
      const caps = registry.listCapabilities().map((c) => ({
        name: c.name,
        providerId: c.providerId,
        description: c.description
      }));
      output(caps, options);
      return 0;
    }
    case 'deps': {
      const registry = new DependencyRegistry();
      const deps = registry.listAll();
      await registry.runHealthChecks();
      output(
        deps.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          executable: d.executableName,
          minVersion: d.minVersion,
          installedVersion: d.installedVersion ?? null,
          status: d.status
        })),
        options
      );
      return 0;
    }
    case 'analyze': {
      const target = args[0];
      const outIdx = args.indexOf('--out');
      const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
      if (!target) {
        log('Error: "analyze" requires a target file path.');
        return 2;
      }
      const pipeline = new AnalysisPipeline({ storeArtifacts: true });
      try {
        const result = await pipeline.run(target);
        if (outPath) {
          await writeFile(outPath, result.reportMarkdown, 'utf8');
        }
        output(
          {
            success: true,
            fileName: result.fileName,
            sha256: result.hash,
            packageName: result.analysis.packageName,
            versionCode: result.analysis.versionCode,
            versionName: result.analysis.versionName ?? null,
            minSdkVersion: result.analysis.minSdkVersion ?? null,
            targetSdkVersion: result.analysis.targetSdkVersion ?? null,
            permissions: result.analysis.usesPermissions,
            activities: result.analysis.activities,
            services: result.analysis.services,
            receivers: result.analysis.receivers,
            providers: result.analysis.providers,
            exportedComponents: result.analysis.exportedComponents,
            launchActivity: result.analysis.launchActivity ?? null,
            graphNodes: result.graph.nodes.length,
            graphEdges: result.graph.edges.length,
            searchDocuments: result.searchResultCount,
            artifactsStored: result.artifactCount,
            workspaceId: result.workspace.recordId,
            reportPath: outPath ?? null,
            elapsedMs: result.elapsedMs
          },
          options
        );
        return 0;
      } catch (err) {
        log(`Error: ${formatError(err)}`);
        return 1;
      }
    }
    case 'graph': {
      const target = args[0];
      if (!target) {
        log('Error: "graph" requires a target file path.');
        return 2;
      }
      const pipeline = new AnalysisPipeline({ storeArtifacts: false });
      try {
        const result = await pipeline.run(target);
        output({ nodes: result.graph.nodes, edges: result.graph.edges }, options);
        return 0;
      } catch (err) {
        log(`Error: ${formatError(err)}`);
        return 1;
      }
    }
    case 'search': {
      const target = args[0];
      const query = args[1];
      if (!target || !query) {
        log('Error: "search" requires a target file path and a query string.');
        return 2;
      }
      const workspace = new SQLiteWorkspace(`.openrev/workspaces/search_${Date.now()}.db`);
      try {
        const pipeline = new AnalysisPipeline({
          storeArtifacts: false,
          workspaceDbPath: workspace.dbPathDisplay()
        });
        await pipeline.run(target);
        await workspace.init();
        const docs = await workspace.loadSearchDocuments();
        const indexer = new SearchIndexer();
        for (const doc of docs) {
          indexer.addDocument({
            id: doc.id,
            category: doc.category,
            title: doc.title,
            content: doc.content,
            filePath: doc.file_path ?? undefined,
            metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined
          });
        }
        const results = indexer.search(query);
        output(
          {
            query,
            target,
            indexedDocuments: docs.length,
            results
          },
          options
        );
        return 0;
      } catch (err) {
        log(`Error: ${formatError(err)}`);
        return 1;
      } finally {
        await workspace.close();
      }
    }
    case 'report': {
      const target = args[0];
      const outIdx = args.indexOf('--out');
      const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
      if (!target) {
        log('Error: "report" requires a target file path.');
        return 2;
      }
      const pipeline = new AnalysisPipeline({ storeArtifacts: false });
      try {
        const result = await pipeline.run(target);
        if (outPath) {
          await writeFile(outPath, result.reportMarkdown, 'utf8');
          output({ reportPath: outPath, bytes: result.reportMarkdown.length }, options);
        } else {
          console.log(result.reportMarkdown);
        }
        return 0;
      } catch (err) {
        log(`Error: ${formatError(err)}`);
        return 1;
      }
    }
    case 'workflow': {
      const target = args[0];
      if (!target) {
        log('Error: "workflow" requires a target file path.');
        return 2;
      }
      const registry = new DependencyRegistry();
      const graph = new ArtifactKnowledgeGraph();
      const capEngine = new CapabilityEngine(registry, graph);
      const wfEngine = new WorkflowEngine(capEngine);
      const dag = wfEngine.getDefaultAuditWorkflow();
      const results = await wfEngine.executeDAG(dag, target);
      output({ workflowId: dag.id, workflowName: dag.name, results }, options);
      return 0;
    }
    default: {
      log(`Unknown command: "${command}". Run "openrev help" for usage.`);
      return 2;
    }
  }
}
