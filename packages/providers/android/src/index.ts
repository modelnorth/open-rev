/**
 * OpenRev Android Provider
 *
 * Parses real APK/AAB binary files: verifies ZIP integrity, computes the real
 * SHA-256, decodes the binary AndroidManifest.xml, and extracts permissions,
 * components (activities/services/receivers/providers), intent filters, layout
 * references, and resource inventory. Emits normalized artifacts and knowledge
 * graph nodes backed entirely by real file contents — no fabricated data.
 */

import {
  BaseProvider,
  type ProviderManifest,
  type ProviderExecutionContext,
  type NormalizedProviderOutput
} from '../../../provider-sdk/src/index.ts';
import { ZipReader } from '../../../core/src/format/zip_reader.ts';
import { ManifestExtractor, type DecodedManifest } from '../../../core/src/format/manifest_extractor.ts';
import { OpenRevError, OpenRevErrorCode } from '../../../core/src/errors/openrev_error.ts';

export interface AndroidAnalysisResult {
  packageName: string;
  versionCode: number;
  versionName?: string;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  compileSdkVersion?: number;
  sha256: string;
  entryCount: number;
  totalUncompressedBytes: number;
  usesPermissions: string[];
  requestedFeatures: string[];
  usesLibraries: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  exportedComponents: string[];
  launchActivity?: string;
  layoutFiles: string[];
  nativeLibs: string[];
  resources: {
    counts: Record<string, number>;
  };
  allowBackup?: boolean;
  usesCleartextTraffic?: boolean;
}

export class AndroidProvider extends BaseProvider {
  public readonly manifest: ProviderManifest = {
    id: 'provider.android',
    version: '1.0.0',
    name: 'OpenRev Android Provider',
    description: 'Parses real APK/AAB binaries: manifest decoding, component and permission extraction, resource inventory',
    capabilities: ['AnalyzeAPK', 'ExtractManifest', 'ExtractComponents', 'ExtractResources'],
    supportedArtifacts: ['APK', 'AAB', 'DEX', 'Manifest', 'Layout'],
    platforms: ['windows', 'macos', 'linux'],
    permissions: ['fs.read']
  };

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async execute(context: ProviderExecutionContext): Promise<NormalizedProviderOutput> {
    const { readFile } = await import('node:fs/promises');
    const { stat } = await import('node:fs/promises');
    const { basename } = await import('node:path');

    let data: Buffer;
    try {
      const st = await stat(context.targetPath);
      if (!st.isFile()) throw new Error('target is not a file');
      data = await readFile(context.targetPath);
    } catch (err) {
      throw new OpenRevError({
        code: 'FILE_NOT_FOUND',
        message: `Cannot read target file: ${context.targetPath}`,
        cause: (err as Error).message,
        context: { targetPath: context.targetPath },
      });
    }

    const name = basename(context.targetPath);
    const result = await AndroidProvider.analyze(data, name);
    return this.toNormalizedOutput(result, context);
  }

  public static async analyze(data: Buffer, name: string): Promise<AndroidAnalysisResult> {
    const { createHash } = await import('node:crypto');

    const zip = await ZipReader.open(data);
    const entries = zip.getEntries();
    const sha256 = createHash('sha256').update(data).digest('hex');
    const totalUncompressedBytes = entries.reduce((sum, e) => sum + e.uncompressedSize, 0);

    let manifest: DecodedManifest | undefined;
    if (zip.hasEntry('AndroidManifest.xml')) {
      const mf = await zip.readEntry('AndroidManifest.xml');
      manifest = ManifestExtractor.fromBuffer(mf);
    }

    const layoutFiles = entries
      .map((e) => e.name)
      .filter((n) => n.startsWith('res/layout') && n.endsWith('.xml'));

    const nativeLibs = entries
      .map((e) => e.name)
      .filter((n) => n.startsWith('lib/') && /\.(so|dylib)$/.test(n));

    const resourceDirCounts: Record<string, number> = {};
    for (const n of entries.map((e) => e.name)) {
      const m = n.match(/^res\/([^/]+)\//);
      if (m) resourceDirCounts[m[1]] = (resourceDirCounts[m[1]] ?? 0) + 1;
    }

    const activities = manifest ? manifest.activities.map((c) => c.name) : [];
    const launchActivity = manifest
      ? manifest.activities.find((a) =>
          a.intentFilters.some((f) => f.actions.includes('android.intent.action.MAIN'))
        )?.name
      : undefined;

    return {
      packageName: manifest?.packageName ?? '',
      versionCode: manifest?.versionCode ?? 0,
      versionName: manifest?.versionName,
      minSdkVersion: manifest?.minSdkVersion,
      targetSdkVersion: manifest?.targetSdkVersion,
      compileSdkVersion: manifest?.compileSdkVersion,
      sha256,
      entryCount: entries.length,
      totalUncompressedBytes,
      usesPermissions: manifest?.usesPermissions ?? [],
      requestedFeatures: manifest?.requestedFeatures ?? [],
      usesLibraries: manifest?.usesLibraries ?? [],
      activities,
      services: manifest ? manifest.services.map((c) => c.name) : [],
      receivers: manifest ? manifest.receivers.map((c) => c.name) : [],
      providers: manifest ? manifest.providers.map((c) => c.name) : [],
      exportedComponents: manifest ? ManifestExtractor.exportedComponents(manifest).map((c) => c.name) : [],
      launchActivity,
      layoutFiles,
      nativeLibs,
      resources: { counts: resourceDirCounts },
      allowBackup: manifest?.application?.allowBackup,
      usesCleartextTraffic: manifest?.application?.usesCleartextTraffic
    };
  }

  public toNormalizedOutput(result: AndroidAnalysisResult, context: ProviderExecutionContext): NormalizedProviderOutput {
    const targetName = context.targetPath.split(/[\\/]/).pop() || 'apk';

    const artifacts: NormalizedProviderOutput['artifactsProduced'] = [
      {
        type: 'APK',
        name: targetName,
        payload: {
          package: result.packageName,
          versionCode: result.versionCode,
          versionName: result.versionName,
          sha256: result.sha256,
          entryCount: result.entryCount,
          sizeBytes: result.totalUncompressedBytes,
          minSdkVersion: result.minSdkVersion,
          targetSdkVersion: result.targetSdkVersion,
          compileSdkVersion: result.compileSdkVersion
        },
        metadata: { hash: result.sha256, targetPath: context.targetPath }
      },
      {
        type: 'Manifest',
        name: 'AndroidManifest.xml',
        payload: {
          package: result.packageName,
          versionCode: result.versionCode,
          versionName: result.versionName,
          permissions: result.usesPermissions,
          activities: result.activities,
          services: result.services,
          receivers: result.receivers,
          providers: result.providers,
          exportedComponents: result.exportedComponents,
          launchActivity: result.launchActivity,
          allowBackup: result.allowBackup,
          usesCleartextTraffic: result.usesCleartextTraffic
        },
        metadata: {}
      }
    ];

    const nodes: NormalizedProviderOutput['graphNodes'] = [
      {
        id: `apk_${result.sha256.slice(0, 12)}`,
        type: 'APK',
        label: targetName,
        properties: {
          package: result.packageName,
          sha256: result.sha256,
          sizeBytes: result.totalUncompressedBytes,
          entryCount: result.entryCount
        }
      },
      {
        id: `manifest_${result.sha256.slice(0, 12)}`,
        type: 'Manifest',
        label: 'AndroidManifest.xml',
        properties: {
          package: result.packageName,
          versionCode: result.versionCode,
          versionName: result.versionName
        }
      }
    ];

    const edges: NormalizedProviderOutput['graphEdges'] = [];
    const apkId = nodes[0].id;
    const manifestId = nodes[1].id;
    edges.push({ id: `e_${apkId}_manifest`, source: apkId, target: manifestId, relationship: 'CONTAINS' });

    const seen = new Set<string>();
    for (const act of result.activities) {
      const nodeId = `act_${hashId(act)}`;
      if (!seen.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: 'Activity',
          label: shortName(act),
          properties: { name: act, exported: result.exportedComponents.includes(act) }
        });
        seen.add(nodeId);
        edges.push({ id: `e_manifest_${nodeId}`, source: manifestId, target: nodeId, relationship: 'DECLARES' });
      }
    }
    for (const svc of result.services) {
      const nodeId = `svc_${hashId(svc)}`;
      nodes.push({
        id: nodeId,
        type: 'Service',
        label: shortName(svc),
        properties: { name: svc, exported: result.exportedComponents.includes(svc) }
      });
      edges.push({ id: `e_manifest_${nodeId}`, source: manifestId, target: nodeId, relationship: 'DECLARES' });
    }
    for (const rec of result.receivers) {
      const nodeId = `rec_${hashId(rec)}`;
      nodes.push({
        id: nodeId,
        type: 'Receiver',
        label: shortName(rec),
        properties: { name: rec, exported: result.exportedComponents.includes(rec) }
      });
      edges.push({ id: `e_manifest_${nodeId}`, source: manifestId, target: nodeId, relationship: 'DECLARES' });
    }
    for (const perm of result.usesPermissions) {
      const nodeId = `perm_${hashId(perm)}`;
      nodes.push({
        id: nodeId,
        type: 'Permission',
        label: shortName(perm),
        properties: { name: perm }
      });
      edges.push({ id: `e_manifest_${nodeId}`, source: manifestId, target: nodeId, relationship: 'USES_PERMISSION' });
    }

    return {
      providerId: this.manifest.id,
      success: true,
      artifactsProduced: artifacts,
      graphNodes: nodes,
      graphEdges: edges
    };
  }
}

export { AndroidProvider as ProductionAndroidProvider };

function shortName(fqcn: string): string {
  return fqcn.split('.').pop() || fqcn;
}

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}
