/**
 * OpenRev Desktop analysis sidecar.
 *
 * Spawned by the Tauri Rust shell (`analyze_apk` command) as a backend service:
 *   node --import tsx analyze.mjs <apkPath> [workDir]
 *
 * Runs the REAL analysis pipeline (manifest decode -> graph -> search -> SQLite
 * -> report, plus opt-in jadx/apktool decompile) and prints a single JSON object
 * on stdout. The Rust shell parses it and returns it to the frontend. No output
 * is fabricated.
 */

import { AnalysisPipeline } from '../../core/src/pipeline/analysis_pipeline.ts';
import { mkdtemp } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const apkPath = process.argv[2];
if (!apkPath) {
  console.error('usage: node --import tsx analyze.mjs <apkPath> [workDir]');
  process.exit(2);
}

const workDir = process.argv[3] ?? (await mkdtemp(join(tmpdir(), 'openrev-sidecar-')));

// Auto-detect jadx + apktool (env override -> PATH -> local openrev-tools dir).
function detectTool(name) {
  const env = process.env[name === 'jadx' ? 'OPENREV_JADX' : 'OPENREV_APKTOOL'];
  if (env) return env;
  const tmp = join(tmpdir(), 'openrev-tools');
  const path =
    name === 'jadx'
      ? process.platform === 'win32'
        ? join(tmp, 'jadx', 'bin', 'jadx.bat')
        : join(tmp, 'jadx', 'bin', 'jadx')
      : process.platform === 'win32'
        ? join(tmp, 'apktool.bat')
        : join(tmp, 'apktool');
  return existsSync(path) ? path : undefined;
}

const pipe = new AnalysisPipeline({
  storeArtifacts: false,
  decompile: {
    enabled: true,
    outputDir: workDir,
    jadxExecutable: detectTool('jadx'),
    apktoolExecutable: detectTool('apktool')
  }
});

const result = await pipe.run(apkPath);

const sources = await collectSources(join(workDir, 'jadx', 'sources'), 12);

const out = {
  filePath: apkPath,
  sha256: result.hash,
  analyzedAt: new Date().toISOString(),
  packageName: result.analysis.packageName,
  versionCode: result.analysis.versionCode,
  versionName: result.analysis.versionName ?? undefined,
  minSdkVersion: result.analysis.minSdkVersion ?? undefined,
  targetSdkVersion: result.analysis.targetSdkVersion ?? undefined,
  compileSdkVersion: result.analysis.compileSdkVersion ?? undefined,
  permissions: result.analysis.usesPermissions,
  activities: result.analysis.activities,
  services: result.analysis.services,
  receivers: result.analysis.receivers,
  providers: result.analysis.providers,
  exportedComponents: result.analysis.exportedComponents,
  launchActivity: result.analysis.launchActivity ?? undefined,
  layoutFiles: result.analysis.layoutFiles,
  decodedLayouts: result.decodedLayoutFiles ?? [],
  graph: result.graph,
  decompiledJavaCount: result.decompiledJavaCount ?? 0,
  decompileSource: result.decompileSource ?? undefined,
  decompileNote: result.decompileNote ?? undefined,
  sources,
  reportMarkdown: result.reportMarkdown
};

process.stdout.write(JSON.stringify(out));

async function collectSources(dir, max) {
  const found = [];
  const walk = async (d) => {
    if (found.length >= max) return;
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (found.length >= max) return;
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.java')) {
        try {
          const code = await readFile(p, 'utf8');
          found.push({ path: p, code });
        } catch {
          /* skip unreadable */
        }
      }
    }
  };
  await walk(dir);
  return found;
}
