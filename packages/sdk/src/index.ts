/**
 * High-Level Public SDK for OpenRev Platform (@openrev/sdk)
 *
 * `analyzeTarget` runs the real analysis pipeline (hash → store → decode →
 * extract → graph → index → workspace → report) against a real APK/AAB file.
 */

import { PlatformGateway } from '../../core/src/api/platform_gateway.ts';
import { CapabilityRegistry } from '../../core/src/capabilities/capability_registry.ts';
import { ArtifactStore } from '../../core/src/artifacts/artifact_store.ts';
import { ArtifactKnowledgeGraph } from '../../core/src/graph/knowledge_graph.ts';
import { AnalysisPipeline } from '../../core/src/pipeline/analysis_pipeline.ts';

export interface AnalyzeTargetResult {
  artifactsCount: number;
  graphNodesCount: number;
  graphEdgesCount: number;
  hash: string;
  packageName: string;
  report: string;
  workspaceDbPath: string;
  elapsedMs: number;
}

export class OpenRevSDK {
  public readonly gateway: PlatformGateway;
  public readonly capabilities: CapabilityRegistry;
  public readonly artifactStore: ArtifactStore;
  public readonly graph: ArtifactKnowledgeGraph;

  constructor() {
    this.gateway = new PlatformGateway();
    this.capabilities = new CapabilityRegistry();
    this.artifactStore = new ArtifactStore();
    this.graph = new ArtifactKnowledgeGraph();
  }

  public async analyzeTarget(apkPath: string, options?: { workspaceDbPath?: string }): Promise<AnalyzeTargetResult> {
    console.error(`[@openrev/sdk] Running analysis on target: ${apkPath}`);
    const pipeline = new AnalysisPipeline({
      workspaceDbPath: options?.workspaceDbPath,
      storeArtifacts: true
    });
    const result = await pipeline.run(apkPath);

    // Load pipeline results into the SDK's shared graph for downstream queries.
    for (const n of result.graph.nodes) {
      this.graph.addNode(n as any);
    }
    for (const e of result.graph.edges) {
      this.graph.addEdge(e as any);
    }

    return {
      artifactsCount: result.artifactCount,
      graphNodesCount: result.graph.nodes.length,
      graphEdgesCount: result.graph.edges.length,
      hash: result.hash,
      packageName: result.analysis.packageName,
      report: result.reportMarkdown,
      workspaceDbPath: result.workspace.dbPath,
      elapsedMs: result.elapsedMs
    };
  }
}
