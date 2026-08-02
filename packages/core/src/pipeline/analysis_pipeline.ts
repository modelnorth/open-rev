/**
 * OpenRev Analysis Pipeline
 *
 * Real end-to-end pipeline: hash → content-addressed store → decode → extract →
 * knowledge graph → search index → SQLite workspace → report. Every stage is
 * backed by real file bytes and real parsing; no stage fabricates output.
 *
 * Node-only: uses node: builtins via dynamic import.
 */

import { AndroidProvider, type AndroidAnalysisResult } from '../../../providers/android/src/index.ts';
import { ArtifactStore } from '../artifacts/artifact_store.ts';
import { SQLiteWorkspace } from '../db/sqlite_workspace.ts';
import { ArtifactKnowledgeGraph, type GraphNode, type GraphEdge } from '../graph/knowledge_graph.ts';
import { SearchIndexer, type SearchDocument } from '../search/indexer.ts';
import { ReportGenerator } from '../report/report_generator.ts';
import { OpenRevError, OpenRevErrorCode } from '../errors/openrev_error.ts';

export interface PipelineOptions {
  workspaceDbPath?: string;
  artifactsDir?: string;
  storeArtifacts?: boolean;
}

export interface PipelineResult {
  hash: string;
  fileName: string;
  analysis: AndroidAnalysisResult;
  artifactCount: number;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  searchResultCount: number;
  reportMarkdown: string;
  workspace: { dbPath: string; recordId: string };
  elapsedMs: number;
}

export class AnalysisPipeline {
  private readonly store: ArtifactStore;
  private readonly workspace: SQLiteWorkspace;
  private readonly options: Required<Pick<PipelineOptions, 'storeArtifacts'>> & PipelineOptions;

  constructor(options: PipelineOptions = {}) {
    this.options = { storeArtifacts: true, ...options };
    this.store = new ArtifactStore({
      artifactsDir: this.options.artifactsDir,
      disableDisk: !this.options.storeArtifacts
    });
    this.workspace = new SQLiteWorkspace(this.options.workspaceDbPath ?? ':memory:');
  }

  public async run(filePath: string): Promise<PipelineResult> {
    const { readFile, stat } = await import('node:fs/promises');
    const { basename } = await import('node:path');
    const { createHash } = await import('node:crypto');

    const start = Date.now();

    let data: Buffer;
    try {
      const st = await stat(filePath);
      if (!st.isFile()) {
        throw new OpenRevError({
          code: OpenRevErrorCode.FILE_NOT_FOUND,
          message: `Not a file: ${filePath}`
        });
      }
      data = await readFile(filePath);
    } catch (err) {
      if (err instanceof OpenRevError) throw err;
      throw new OpenRevError({
        code: OpenRevErrorCode.FILE_NOT_FOUND,
        message: `Cannot read target file: ${filePath}`,
        cause: (err as Error).message
      });
    }

    const fileName = basename(filePath);
    const hash = createHash('sha256').update(data).digest('hex');

    // 1. Content-addressed store
    let storedArtifact;
    if (this.options.storeArtifacts) {
      storedArtifact = await this.store.store('APK', fileName, data, {
        sha256: hash,
        targetPath: filePath
      });
    }

    // 2. Real decode + extract
    const analysis = await AndroidProvider.analyze(data, fileName);

    // 3. Knowledge graph
    const graph = new ArtifactKnowledgeGraph();
    const provider = new AndroidProvider();
    const normalized = provider.toNormalizedOutput(analysis, { targetPath: filePath, outputDir: '.' });
    for (const n of normalized.graphNodes) {
      graph.addNode({ id: n.id, type: n.type as GraphNode['type'], label: n.label, properties: n.properties });
    }
    for (const e of normalized.graphEdges) {
      graph.addEdge({ id: e.id, source: e.source, target: e.target, relationship: e.relationship as GraphEdge['relationship'] });
    }

    // 4. Search index (real content derived from the parsed manifest)
    const indexer = new SearchIndexer();
    indexer.addDocument({
      id: `manifest_${hash.slice(0, 8)}`,
      category: 'manifest',
      title: 'AndroidManifest.xml',
      content: [
        `package=${analysis.packageName}`,
        `versionCode=${analysis.versionCode}`,
        ...analysis.usesPermissions.map((p) => `permission=${p}`),
        ...analysis.activities.map((a) => `activity=${a}`),
        ...analysis.services.map((s) => `service=${s}`),
        ...analysis.receivers.map((r) => `receiver=${r}`),
        ...analysis.providers.map((p) => `provider=${p}`)
      ].join('\n'),
      filePath: 'AndroidManifest.xml',
      metadata: { package: analysis.packageName, hash }
    });
    analysis.activities.forEach((act, i) => {
      indexer.addDocument({
        id: `activity_${hash.slice(0, 8)}_${i}`,
        category: 'class',
        title: shortName(act),
        content: `activity ${act} exported=${analysis.exportedComponents.includes(act)}`,
        filePath: `smali/classes/${act}.smali`
      });
    });
    analysis.layoutFiles.forEach((layout, i) => {
      indexer.addDocument({
        id: `layout_${hash.slice(0, 8)}_${i}`,
        category: 'resource',
        title: basenamePath(layout),
        content: layout,
        filePath: layout
      });
    });

    // 5. Persist workspace + graph + search documents to SQLite
    await this.workspace.init();
    const recordId = `ws_${hash.slice(0, 12)}`;
    await this.workspace.saveRecord('workspaces', recordId, {
      name: fileName,
      projectId: analysis.packageName,
      apkPath: filePath,
      hash,
      analysis: {
        packageName: analysis.packageName,
        versionCode: analysis.versionCode,
        targetSdkVersion: analysis.targetSdkVersion,
        exportedComponents: analysis.exportedComponents.length,
        permissions: analysis.usesPermissions.length
      }
    });
    if (storedArtifact) {
      await this.workspace.saveArtifact({
        hash: storedArtifact.hash,
        type: 'APK',
        name: storedArtifact.name,
        sizeBytes: storedArtifact.sizeBytes,
        createdAt: storedArtifact.createdAt,
        metadata: storedArtifact.metadata,
        pathOnDisk: storedArtifact.pathOnDisk
      });
    }
    await this.workspace.saveGraphState(recordId, graph.getAllNodes(), graph.getAllEdges());
    const docs = indexer.getAllDocuments();
    for (const doc of docs) {
      await this.workspace.saveSearchDocument({
        id: doc.id,
        category: doc.category,
        title: doc.title,
        content: doc.content,
        filePath: doc.filePath,
        metadata: doc.metadata
      });
    }

    // 6. Report from real graph data
    const report = new ReportGenerator(graph);
    const reportMarkdown = report.generateMarkdownReport(`OpenRev Analysis Report: ${fileName}`);

    await this.workspace.close();

    return {
      hash,
      fileName,
      analysis,
      artifactCount: this.options.storeArtifacts ? this.store.listAll().length : 0,
      graph: graph.exportGraphJSON(),
      searchResultCount: docs.length,
      reportMarkdown,
      workspace: { dbPath: this.workspace.dbPathDisplay(), recordId },
      elapsedMs: Date.now() - start
    };
  }
}

function shortName(fqcn: string): string {
  return fqcn.split('.').pop() || fqcn;
}

function basenamePath(p: string): string {
  return p.split('/').pop() || p;
}
