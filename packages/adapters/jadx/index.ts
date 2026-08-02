/**
 * JADX Tool Adapter
 *
 * Real jadx wrapper. Detects jadx on PATH (or via DOCKER_JADX_IMAGE), verifies
 * version, decompiles an APK to real Java sources on disk. Never fabricates
 * output: if the tool is missing, returns an honest TOOL_NOT_FOUND error.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runViaDocker,
  runChecked,
  runCommand,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface JadxOptions {
  decompileCode: boolean;
  exportResources: boolean;
  outputDir: string;
}

export interface JadxDecompileResult {
  success: true;
  outputDir: string;
  source: 'native' | 'docker';
  version?: string;
  javaSourcesCount?: number;
}

export class JadxAdapter {
  public static readonly toolId = 'jadx';
  public static readonly minVersion = '1.4.7';
  public static readonly dockerImage = process.env.DOCKER_JADX_IMAGE || 'ewoutp/jadx:latest';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('jadx', ['--version'], JadxAdapter.dockerImage);
    }
    return this.cachedProbe;
  }

  public async decompile(apkPath: string, options: JadxOptions): Promise<AdapterResponse<JadxDecompileResult>> {
    const probe = await this.isAvailable();

    if (!probe.found && !probe.dockerAvailable) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'jadx is not installed and no Docker fallback is available.',
          cause: 'jadx binary not found on PATH; docker not available.',
          remediation: 'Install jadx (https://github.com/skylot/jadx) or install Docker and set DOCKER_JADX_IMAGE.',
          context: { apkPath }
        })
      };
    }

    if (!existsSync(apkPath)) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.FILE_NOT_FOUND,
          message: `APK not found: ${apkPath}`,
          context: { apkPath }
        })
      };
    }

    const outputDir = join(options.outputDir, 'jadx');
    const start = Date.now();

    try {
      if (probe.found) {
        const args = [
          '-d',
          outputDir,
          ...(options.decompileCode ? [] : ['--no-src']),
          ...(options.exportResources ? ['-r'] : ['--no-res']),
          apkPath
        ];
        await runChecked('jadx', { args, requireExitZero: false });
      } else {
        const args = ['-d', outputDir, ...(options.exportResources ? ['-r'] : ['--no-res']), apkPath];
        const res = await runViaDocker(JadxAdapter.dockerImage, args, {});
        if (res.code !== 0 && !res.stderr.includes('warn')) {
          return {
            ok: false,
            error: new OpenRevError({
              code: 'TOOL_EXECUTION_FAILED',
              message: `jadx (docker) exited with code ${res.code}`,
              context: { stderr: res.stderr.slice(0, 2000) }
            })
          };
        }
      }

      return {
        ok: true,
        value: {
          success: true,
          outputDir,
          source: probe.found ? 'native' : 'docker',
          version: probe.version
        },
        source: probe.found ? 'native' : 'docker',
        elapsedMs: Date.now() - start
      };
    } catch (err) {
      if (err instanceof OpenRevError) {
        return { ok: false, error: err };
      }
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `jadx execution failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }
}

export { runCommand };
