/**
 * OpenRev Software Intelligence Platform - Core Architecture Interfaces
 * 
 * Implements 3-Service Architecture Separation:
 * 1. Execution Engine (Providers, Workflows, Scheduling, Sandboxing)
 * 2. Knowledge Engine (Artifact Store, Artifact Schemas, Knowledge Graph, Domain Query API, Search, Indexing)
 * 3. Intelligence Engine (RAG, AI Planning, Tool-Calling, Report Generation)
 */

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
  public async findActivitiesUsingPermission(permissionName: string): Promise<any[]> {
    console.log(`[GraphQueryAPI] Querying activities using permission: ${permissionName}`);
    return [{ activity: 'MainActivity', permission: permissionName }];
  }

  public async findEndpointsRequiringAuth(): Promise<any[]> {
    console.log(`[GraphQueryAPI] Querying endpoints requiring authentication`);
    return [{ endpoint: '/api/v1/auth/login', authRequired: true }];
  }

  public async findExportedComponents(): Promise<any[]> {
    console.log(`[GraphQueryAPI] Querying exported components`);
    return [{ name: 'com.example.sampleapp.MainActivity', type: 'Activity', exported: true }];
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
    console.log(`[SnapshotEngine] Created snapshot ${snap.id}: "${description}"`);
    return snap;
  }

  public restoreSnapshot(id: string): Snapshot | undefined {
    console.log(`[SnapshotEngine] Restoring snapshot ${id}`);
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
