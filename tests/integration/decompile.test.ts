import test from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AnalysisPipeline } from '../../packages/core/src/pipeline/analysis_pipeline.ts';
import { JadxAdapter } from '../../packages/adapters/jadx/index.ts';
import { ApktoolAdapter } from '../../packages/adapters/apktool/index.ts';

/**
 * Real decompile/decode integration tests.
 *
 * These exercise the REAL jadx + apktool success paths against the committed
 * SampleApp.apk (which contains a real dex, manifest, resources.arsc, and 11
 * real res/layout XMLs). They require the tools to be installed:
 *
 *   OPENREV_JADX=/path/to/jadx[.bat]  (or jadx on PATH)
 *   OPENREV_APKTOOL=/path/to/apktool[.bat] (or apktool on PATH)
 *
 * When neither a custom path nor a PATH-installed tool is found, the tests
 * SKIP (honest — they never fake success). Install jadx (https://github.com/skylot/jadx)
 * and apktool (https://apktool.org), or use Docker, to run them.
 */

const SAMPLE = 'tests/fixtures/SampleApp.apk';

function detectTools(): { jadx?: string; apktool?: string } {
  const envJadx = process.env.OPENREV_JADX;
  const envApktool = process.env.OPENREV_APKTOOL;
  const tmp = join(tmpdir(), 'openrev-tools');
  const winBat = (dir: string, name: string) =>
    join(dir, name) + (process.platform === 'win32' ? '.bat' : '');
  const autoJadx =
    process.platform === 'win32' ? join(tmp, 'jadx', 'bin', 'jadx.bat') : join(tmp, 'jadx', 'bin', 'jadx');
  const autoApktool = process.platform === 'win32' ? join(tmp, 'apktool.bat') : join(tmp, 'apktool');
  const jadx = envJadx ?? (existsSync(autoJadx) ? autoJadx : undefined);
  const apktool = envApktool ?? (existsSync(autoApktool) ? autoApktool : undefined);
  return { jadx, apktool };
}

async function toolsStatus() {
  const { jadx, apktool } = detectTools();
  const jp = await new JadxAdapter().isAvailable(jadx);
  const ap = await new ApktoolAdapter().isAvailable(apktool);
  return { jadxFound: jp.found, apktoolFound: ap.found, jadxVersion: jp.version, apktoolVersion: ap.version };
}

const status = await toolsStatus();
const skipReason =
  !status.jadxFound || !status.apktoolFound
    ? `Real tools not available (jadx:${status.jadxFound}, apktool:${status.apktoolFound}). Install jadx+apktool or set OPENREV_JADX/OPENREV_APKTOOL.`
    : false;

async function cleanupDir(dir: string) {
  for (let i = 0; i < 20; i++) {
    try {
      (globalThis as any).gc?.();
      await rm(dir, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  await rm(dir, { recursive: true, force: true });
}

test('decompile: jadx produces real decompiled Java from SampleApp.apk', { skip: skipReason }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'openrev-decomp-'));
  try {
    const { jadx } = detectTools();
    const res = await new JadxAdapter().decompile(SAMPLE, {
      decompileCode: true,
      exportResources: true,
      outputDir: dir,
      executablePath: jadx,
      timeoutMs: 120_000
    });
    assert.ok(res.ok, `jadx failed: ${res.ok ? '' : res.error.message}`);
    if (!res.ok) return;
    assert.ok(res.value.javaSourcesCount && res.value.javaSourcesCount > 0, 'expected decompiled Java files');
    assert.strictEqual(res.value.source, 'native');
    assert.ok(res.value.version, 'expected a jadx version');
    // The real MainActivity (declared in the manifest) must be decompiled.
    const mainFile = join(res.value.outputDir, 'sources', 'com', 'example', 'two_rings', 'MainActivity.java');
    assert.ok(existsSync(mainFile), `expected MainActivity.java at ${mainFile}`);
  } finally {
    await cleanupDir(dir);
  }
});

test('decompile: apktool decodes manifest, resources, and layouts from SampleApp.apk', { skip: skipReason }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'openrev-apt-'));
  try {
    const { apktool } = detectTools();
    const res = await new ApktoolAdapter().decode(SAMPLE, dir, {
      executablePath: apktool,
      timeoutMs: 120_000
    });
    assert.ok(res.ok, `apktool failed: ${res.ok ? '' : res.error.message}`);
    if (!res.ok) return;
    // Decoded manifest is real text with the package.
    const manifest = join(res.value.outputDir, 'AndroidManifest.xml');
    assert.ok(existsSync(manifest), 'expected decoded AndroidManifest.xml');
    // Real smali for MainActivity.
    const smali = join(res.value.outputDir, 'smali', 'com', 'example', 'two_rings', 'MainActivity.smali');
    assert.ok(existsSync(smali), 'expected decoded MainActivity.smali');
    // Real decoded layout XMLs.
    const layoutDirs = existsSync(join(res.value.outputDir, 'res', 'layout'))
      ? join(res.value.outputDir, 'res', 'layout')
      : null;
    assert.ok(layoutDirs, 'expected res/layout directory');
  } finally {
    await cleanupDir(dir);
  }
});

test('decompile: full pipeline on SampleApp.apk populates graph + real tool output', { skip: skipReason }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'openrev-pipe-sample-'));
  try {
    const { jadx, apktool } = detectTools();
    const pipe = new AnalysisPipeline({
      storeArtifacts: false,
      decompile: {
        enabled: true,
        jadxExecutable: jadx,
        apktoolExecutable: apktool,
        outputDir: dir
      }
    });
    const result = await pipe.run(SAMPLE);
    // Manifest decoded
    assert.strictEqual(result.analysis.packageName, 'com.example.two_rings');
    // Activities parsed from the real manifest
    assert.ok(result.analysis.activities.includes('com.example.two_rings.MainActivity'), 'MainActivity not parsed');
    // Real decompiled Java exists
    assert.ok(result.decompiledJavaCount && result.decompiledJavaCount > 0, 'expected real decompiled Java');
    // Real decoded layout XMLs exist
    assert.ok(result.decodedLayoutFiles && result.decodedLayoutFiles.length >= 1, 'expected decoded layouts');
    // Graph populated
    assert.ok(result.graph.nodes.length > 0, 'expected graph nodes');
    assert.ok(result.graph.edges.length > 0, 'expected graph edges');
    // Report is real
    assert.ok(result.reportMarkdown.includes('com.example.two_rings'));
    assert.ok(result.decompileSource === 'native', `expected native source, got ${result.decompileSource}`);
  } finally {
    await cleanupDir(dir);
  }
});

test('decompile: tools version meets minimums', { skip: skipReason }, async () => {
  const { jadx, apktool } = detectTools();
  const jp = await new JadxAdapter().isAvailable(jadx);
  const ap = await new ApktoolAdapter().isAvailable(apktool);
  assert.strictEqual(jp.versionOk, true, `jadx ${jp.version} below min ${JadxAdapter.minVersion}`);
  assert.strictEqual(ap.versionOk, true, `apktool ${ap.version} below min ${ApktoolAdapter.minVersion}`);
  assert.ok(jp.executablePath, 'expected a resolved jadx executable path');
  assert.ok(ap.executablePath, 'expected a resolved apktool executable path');
});
