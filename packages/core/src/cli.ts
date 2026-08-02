/**
 * OpenRev CLI Entrypoint
 *
 * Commands:
 *   openrev analyze <file>           Run the static analysis pipeline
 *   openrev deps                     Run real dependency health checks
 *   openrev graph                    Print the Artifact Knowledge Graph
 *   openrev search <query>           Search graph nodes and indexed documents
 *   openrev report [--out file.md]   Generate a Markdown analysis report
 *   openrev workflow <target>        Run the default audit workflow DAG
 *   openrev capabilities             List capability contracts
 *   openrev version                  Print version
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
  ReportGenerator,
  WorkflowEngine
} from './index.ts';

import { writeFile } from 'node:fs/promises';

interface CliOptions {
  json: boolean;
}

const VERSION = '1.0.0';

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
  analyze <file>          Run the static analysis pipeline
  deps                    Run real dependency health checks
  graph                   Print the Artifact Knowledge Graph
  search <query>          Search graph nodes and indexed documents
  report [--out file.md]  Generate a Markdown analysis report
  workflow <target>       Run the default audit workflow DAG
  capabilities            List capability contracts
  version                 Print version
  help                    Show this help

Global flags:
  --json    Emit machine-readable JSON on stdout
  --help    Show help
`;

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
      if (!target) {
        log('Error: "analyze" requires a target file path.');
        return 2;
      }
      const registry = new DependencyRegistry();
      const graph = new ArtifactKnowledgeGraph();
      const capEngine = new CapabilityEngine(registry, graph);
      const result = await capEngine.executeCapability('static.analyze_apk', { targetPath: target });
      output(
        {
          success: result.success,
          capabilityId: result.capabilityId,
          toolUsed: result.toolUsed,
          outputSummary: result.outputSummary,
          artifactsProduced: result.artifactsProduced,
          graphNodes: graph.getAllNodes(),
          graphEdges: graph.getAllEdges()
        },
        options
      );
      return result.success ? 0 : 1;
    }
    case 'graph': {
      const registry = new DependencyRegistry();
      const graph = new ArtifactKnowledgeGraph();
      const capEngine = new CapabilityEngine(registry, graph);
      await capEngine.executeCapability('static.analyze_apk', { targetPath: 'SampleApp.apk' });
      output({ nodes: graph.getAllNodes(), edges: graph.getAllEdges() }, options);
      return 0;
    }
    case 'search': {
      const query = args[0];
      if (!query) {
        log('Error: "search" requires a query string.');
        return 2;
      }
      const indexer = new SearchIndexer();
      indexer.addDocument({
        id: 'doc_manifest',
        category: 'manifest',
        title: 'AndroidManifest.xml',
        content: '<uses-permission android:name="android.permission.INTERNET" />',
        filePath: 'AndroidManifest.xml'
      });
      indexer.addDocument({
        id: 'doc_act_main',
        category: 'class',
        title: 'MainActivity',
        content: 'public class MainActivity extends AppCompatActivity',
        filePath: 'com/example/sampleapp/MainActivity.java'
      });
      const results = indexer.search(query);
      output(results, options);
      return 0;
    }
    case 'report': {
      const outIdx = args.indexOf('--out');
      const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
      const registry = new DependencyRegistry();
      const graph = new ArtifactKnowledgeGraph();
      const capEngine = new CapabilityEngine(registry, graph);
      await capEngine.executeCapability('static.analyze_apk', { targetPath: 'SampleApp.apk' });
      const generator = new ReportGenerator(graph);
      const markdown = generator.generateMarkdownReport();
      if (outPath) {
        await writeFile(outPath, markdown, 'utf8');
        output({ reportPath: outPath, bytes: markdown.length }, options);
      } else {
        console.log(markdown);
      }
      return 0;
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
