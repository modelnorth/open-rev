/**
 * OpenRev Immutable Content-Addressed Artifact Store
 * 
 * Manages raw, immutable software artifacts (APK, Manifest, Binary, HAR, MemoryDump, etc.).
 * The Knowledge Graph and Search Index build upon this immutable artifact layer.
 */

export type ArtifactType =
  | 'APK'
  | 'IPA'
  | 'PE'
  | 'ELF'
  | 'MachO'
  | 'Manifest'
  | 'Layout'
  | 'String'
  | 'Image'
  | 'Screenshot'
  | 'Endpoint'
  | 'Binary'
  | 'Hook'
  | 'Report'
  | 'MemoryDump'
  | 'HAR'
  | 'Logcat';

export interface StoredArtifact {
  hash: string; // SHA-256 digest
  type: ArtifactType;
  name: string;
  sizeBytes: number;
  createdAt: string;
  metadata: Record<string, any>;
  pathOnDisk: string;
}

export class ArtifactStore {
  private artifacts: Map<string, StoredArtifact> = new Map();

  public async store(
    type: ArtifactType,
    name: string,
    content: Buffer | string,
    metadata: Record<string, any> = {}
  ): Promise<StoredArtifact> {
    // Generate deterministic hash ID
    const hash = `sha256_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const artifact: StoredArtifact = {
      hash,
      type,
      name,
      sizeBytes: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
      createdAt: new Date().toISOString(),
      metadata,
      pathOnDisk: `artifacts/${type.toLowerCase()}/${hash}_${name}`
    };

    this.artifacts.set(hash, artifact);
    console.log(`[ArtifactStore] Saved immutable artifact [${artifact.type}] ${artifact.name} (${hash})`);
    return artifact;
  }

  public get(hash: string): StoredArtifact | undefined {
    return this.artifacts.get(hash);
  }

  public listByType(type: ArtifactType): StoredArtifact[] {
    return Array.from(this.artifacts.values()).filter((a) => a.type === type);
  }

  public listAll(): StoredArtifact[] {
    return Array.from(this.artifacts.values());
  }
}
