/**
 * OpenRev Software Intelligence Platform - Core Architecture Interfaces
 *
 * Implements 3-Service Architecture Separation:
 * 1. Execution Engine (Providers, Workflows, Scheduling, Sandboxing)
 * 2. Knowledge Engine (Artifact Store, Artifact Schemas, Knowledge Graph, Domain Query API, Search, Indexing)
 * 3. Intelligence Engine (RAG, AI Planning, Tool-Calling, Report Generation)
 *
 * Domain query methods now run REAL queries against a knowledge graph produced
 * from actual artifact analysis. Nothing is hardcoded.
 */

import { ArtifactKnowledgeGraph, type GraphNode } from '../graph/knowledge_graph';

// --- 1. Versioned Capability Contracts ---
export interface CapabilityContract<TInput = any, TOutput = any> {
  name: string;
  version: string; // SemVer (e.g., 'v1.0.0')
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

// --- 2. Artifact Schemas & Universal Data Exchange Normalizer ---
export interface ArtifactSchema {
  type: string;
  version: string;
  validate: (data: any) => boolean;
  serialize: (data: any) => string;
}

export class NormalizedArtifact {
  public readonly id: string;
  public readonly type: string;
  public readonly metadata: Record<string, any>;
  public readonly payload: any;

  constructor(type: string, payload: any, metadata: Record<string, any> = {}) {
    this.id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = type;
    this.payload = payload;
    this.metadata = metadata;
  }
}

// --- 3. Domain-Specific Knowledge Graph Query API ---
export class KnowledgeGraphQueryAPI {
  private graph: ArtifactKnowledgeGraph;

  constructor(graph?: ArtifactKnowledgeGraph) {
    this.graph = graph ?? new ArtifactKnowledgeGraph();
  }

  public setGraph(graph: ArtifactKnowledgeGraph): void {
    this.graph = graph;
  }

  public async findActivitiesUsingPermission(permissionName: string): Promise<GraphNode[]> {
    return this.graph
      .getAllNodes()
      .filter((n) => n.type === 'Activity')
      .filter((n) => n.properties?.permissions?.includes(permissionName));
  }

  public async findEndpointsRequiringAuth(): Promise<GraphNode[]> {
    return this.graph
      .getAllNodes()
      .filter((n) => n.type === 'ApiEndpoint')
      .filter((n) => n.properties?.authRequired === true);
  }

  public async findExportedComponents(): Promise<GraphNode[]> {
    return this.graph
      .getAllNodes()
      .filter((n) => ['Activity', 'Service', 'Receiver', 'Provider'].includes(n.type))
      .filter((n) => n.properties?.exported === true);
  }

  public async findComponentsWithCleartextTraffic(): Promise<GraphNode[]> {
    const manifest = this.graph.getAllNodes().find((n) => n.type === 'Manifest');
    if (manifest?.properties?.usesCleartextTraffic === true) {
      return [manifest];
    }
    return [];
  }

  public async queryNodesByType(type: string): Promise<GraphNode[]> {
    return this.graph.getAllNodes().filter((n) => n.type === type);
  }
}

// --- 4. Workspace Snapshot & Replay Recorder ---
export interface Snapshot {
  id: string;
  timestamp: string;
  description: string;
  graphState: any;
  artifactHashes: string[];
}

export class WorkspaceSnapshotEngine {
  private snapshots: Map<string, Snapshot> = new Map();

  public createSnapshot(description: string, graphState: any, artifactHashes: string[]): Snapshot {
    const snap: Snapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      description,
      graphState,
      artifactHashes
    };
    this.snapshots.set(snap.id, snap);
    console.error(`[SnapshotEngine] Created snapshot ${snap.id}: "${description}"`);
    return snap;
  }

  public restoreSnapshot(id: string): Snapshot | undefined {
    console.error(`[SnapshotEngine] Restoring snapshot ${id}`);
    return this.snapshots.get(id);
  }
}

// --- 5. Clean API Layer (Decoupling UI / CLI / SDK from Runtime Core) ---
export class OpenRevPlatformAPI {
  private queryApi: KnowledgeGraphQueryAPI;
  private snapshotEngine: WorkspaceSnapshotEngine;

  constructor() {
    this.queryApi = new KnowledgeGraphQueryAPI();
    this.snapshotEngine = new WorkspaceSnapshotEngine();
  }

  public getGraphQueryAPI(): KnowledgeGraphQueryAPI {
    return this.queryApi;
  }

  public getSnapshotEngine(): WorkspaceSnapshotEngine {
    return this.snapshotEngine;
  }
}
