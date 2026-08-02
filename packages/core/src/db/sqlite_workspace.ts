/**
 * OpenRev SQLite Workspace Database
 *
 * Real persistent workspace backed by node:sqlite (built-in synchronous
 * SQLite driver available since Node 22.5). Creates schema on disk, persists
 * workspace metadata, artifact indexes, graph snapshots, and search entries.
 *
 * Node-only: uses node:sqlite via dynamic import so the module remains
 * importable in browser bundles.
 */

import { OpenRevError, OpenRevErrorCode } from '../errors/openrev_error.ts';

export interface WorkspaceRecord {
  id: string;
  projectId: string;
  name: string;
  apkPath?: string;
  createdAt: string;
  updatedAt: string;
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  };
  close(): void;
}

export class SQLiteWorkspace {
  private dbPath: string;
  private db: SqliteDatabase | null = null;
  private memory = false;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
    this.memory = dbPath === ':memory:' || dbPath === '';
  }

  public async init(): Promise<void> {
    const { DatabaseSync } = await import('node:sqlite');
    const { mkdirSync } = await import('node:fs');
    const { dirname } = await import('node:path');

    if (!this.memory) {
      mkdirSync(dirname(this.dbPath), { recursive: true });
    }
    this.db = new DatabaseSync(this.dbPath) as SqliteDatabase;
    this.db.exec(`PRAGMA journal_mode=DELETE;`);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspace_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        apk_path TEXT,
        data TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workspace_project ON workspace_records(project_id);
      CREATE TABLE IF NOT EXISTS artifact_index (
        hash TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        metadata TEXT,
        path_on_disk TEXT
      );
      CREATE TABLE IF NOT EXISTS graph_state (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS search_documents (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT,
        metadata TEXT
      );
    `);
  }

  public isOpen(): boolean {
    return this.db !== null;
  }

  public dbPathDisplay(): string {
    return this.memory ? ':memory:' : this.dbPath;
  }

  public async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

  public async saveRecord(table: string, id: string, data: any): Promise<void> {
    const d = this.requireDb();
    const now = new Date().toISOString();
    const record: WorkspaceRecord = {
      id,
      projectId: data.projectId ?? 'default',
      name: data.name ?? id,
      apkPath: data.apkPath,
      createdAt: data.createdAt ?? now,
      updatedAt: now
    };
    try {
      d.prepare(
        `INSERT INTO workspace_records (id, project_id, name, apk_path, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, apk_path=excluded.apk_path,
           data=excluded.data, updated_at=excluded.updated_at`
      ).run(record.id, record.projectId, record.name, record.apkPath ?? null, JSON.stringify(data), record.createdAt, record.updatedAt);
    } catch (err) {
      throw new OpenRevError({
        code: 'WORKSPACE_SAVE_FAILED',
        message: `Failed to save workspace record ${table}:${id}`,
        cause: (err as Error).message,
      });
    }
  }

  public async getRecord(table: string, id: string): Promise<any | undefined> {
    const d = this.requireDb();
    const row = d.prepare('SELECT data FROM workspace_records WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row || row.data === undefined || row.data === null) return undefined;
    try {
      return JSON.parse(row.data as string);
    } catch {
      return row.data;
    }
  }

  public async queryTable(table: string): Promise<any[]> {
    const d = this.requireDb();
    const rows = d.prepare('SELECT data FROM workspace_records ORDER BY updated_at DESC').all();
    return rows
      .map((r) => {
        try {
          return JSON.parse(r.data as string);
        } catch {
          return r.data;
        }
      })
      .filter((r) => r !== undefined && r !== null);
  }

  public async saveArtifact(artifact: {
    hash: string;
    type: string;
    name: string;
    sizeBytes: number;
    createdAt: string;
    metadata: Record<string, any>;
    pathOnDisk: string;
  }): Promise<void> {
    const d = this.requireDb();
    d.prepare(
      `INSERT INTO artifact_index (hash, type, name, size_bytes, created_at, metadata, path_on_disk)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(hash) DO NOTHING`
    ).run(artifact.hash, artifact.type, artifact.name, artifact.sizeBytes, artifact.createdAt, JSON.stringify(artifact.metadata), artifact.pathOnDisk);
  }

  public async listArtifacts(): Promise<any[]> {
    const d = this.requireDb();
    return d.prepare('SELECT * FROM artifact_index ORDER BY created_at DESC').all();
  }

  public async saveGraphState(workspaceId: string, nodes: unknown[], edges: unknown[]): Promise<string> {
    const d = this.requireDb();
    const id = `graph_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const createdAt = new Date().toISOString();
    d.prepare(
      `INSERT INTO graph_state (id, workspace_id, nodes, edges, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id, workspaceId, JSON.stringify(nodes), JSON.stringify(edges), createdAt);
    return id;
  }

  public async loadLatestGraphState(workspaceId: string): Promise<{ nodes: unknown[]; edges: unknown[] } | undefined> {
    const d = this.requireDb();
    const row = d
      .prepare('SELECT nodes, edges FROM graph_state WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(workspaceId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    try {
      return { nodes: JSON.parse(row.nodes as string), edges: JSON.parse(row.edges as string) };
    } catch {
      return undefined;
    }
  }

  public async saveSearchDocument(doc: {
    id: string;
    category: string;
    title: string;
    content: string;
    filePath?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const d = this.requireDb();
    d.prepare(
      `INSERT INTO search_documents (id, category, title, content, file_path, metadata)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET category=excluded.category, title=excluded.title,
         content=excluded.content, file_path=excluded.file_path, metadata=excluded.metadata`
    ).run(doc.id, doc.category, doc.title, doc.content, doc.filePath ?? null, JSON.stringify(doc.metadata ?? {}));
  }

  public async loadSearchDocuments(): Promise<any[]> {
    const d = this.requireDb();
    return d.prepare('SELECT * FROM search_documents').all();
  }

  private requireDb(): SqliteDatabase {
    if (!this.db) {
      throw new OpenRevError({
        code: 'WORKSPACE_RESTORE_FAILED',
        message: 'Workspace database is not initialized. Call init() first.',
      });
    }
    return this.db;
  }
}
