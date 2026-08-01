/**
 * OpenRev Core API & Platform Gateway
 * 
 * Renamed from OpenRevPlatformAPI to OpenRev Core API (PlatformGateway)
 * to provide a clean, unambiguous entrypoint for UI, CLI, and SDK clients.
 */

import { KnowledgeGraphQueryAPI, WorkspaceSnapshotEngine } from './platform_api.ts';

export class PlatformGateway {
  private queryApi: KnowledgeGraphQueryAPI;
  private snapshotEngine: WorkspaceSnapshotEngine;

  constructor() {
    this.queryApi = new KnowledgeGraphQueryAPI();
    this.snapshotEngine = new WorkspaceSnapshotEngine();
  }

  public getQueryAPI(): KnowledgeGraphQueryAPI {
    return this.queryApi;
  }

  public getSnapshotEngine(): WorkspaceSnapshotEngine {
    return this.snapshotEngine;
  }
}

export { PlatformGateway as OpenRevCoreAPI };
