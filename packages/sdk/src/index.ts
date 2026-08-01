/**
 * High-Level Public SDK for OpenRev Platform (@openrev/sdk)
 */

import { PlatformGateway } from '../../core/src/api/platform_gateway.ts';
import { CapabilityRegistry } from '../../core/src/capabilities/capability_registry.ts';
import { ArtifactStore } from '../../core/src/artifacts/artifact_store.ts';
import { ArtifactKnowledgeGraph } from '../../core/src/graph/knowledge_graph.ts';

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

  public async analyzeTarget(apkPath: string): Promise<{ artifactsCount: number; graphNodesCount: number }> {
    console.log(`[@openrev/sdk] Running analysis on target: ${apkPath}`);
    const apkArtifact = await this.artifactStore.store('APK', apkPath.split('/').pop() || 'app.apk', 'apk_bytes');
    
    this.graph.addNode({
      id: 'node_sdk_apk',
      type: 'APK',
      label: apkArtifact.name,
      properties: { hash: apkArtifact.hash }
    });

    return {
      artifactsCount: this.artifactStore.listAll().length,
      graphNodesCount: this.graph.getAllNodes().length
    };
  }
}
