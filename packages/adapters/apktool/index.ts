/**
 * Apktool Tool Adapter
 *
 * Real apktool wrapper. Detects apktool on PATH (or via DOCKER_APKTOOL_IMAGE),
 * decodes an APK's resources to disk. Never fabricates output.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runViaDocker,
  runChecked,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ApktoolDecodeResult {
  success: true;
  outputDir: string;
  source: 'native' | 'docker';
  version?: string;
}

export class ApktoolAdapter {
  public static readonly toolId = 'apktool';
  public static readonly minVersion = '2.9.0';
  public static readonly dockerImage = process.env.DOCKER_APKTOOL_IMAGE || 'borgmatic/apktool:latest';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('apktool', ['--version'], ApktoolAdapter.dockerImage);
    }
    return this.cachedProbe;
  }

  public async decode(apkPath: string, outputDir: string): Promise<AdapterResponse<ApktoolDecodeResult>> {
    const probe = await this.isAvailable();

    if (!probe.found && !probe.dockerAvailable) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'apktool is not installed and no Docker fallback is available.',
          cause: 'apktool binary not found on PATH; docker not available.',
          remediation: 'Install apktool (https://apktool.org) or install Docker and set DOCKER_APKTOOL_IMAGE.',
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

    const target = join(outputDir, 'apktool');
    const start = Date.now();

    try {
      if (probe.found) {
        await runChecked('apktool', { args: ['d', apkPath, '-o', target, '-f'], requireExitZero: false });
      } else {
        const res = await runViaDocker(ApktoolAdapter.dockerImage, ['d', apkPath, '-o', target, '-f'], {});
        if (res.code !== 0) {
          return {
            ok: false,
            error: new OpenRevError({
              code: 'TOOL_EXECUTION_FAILED',
              message: `apktool (docker) exited with code ${res.code}`,
              context: { stderr: res.stderr.slice(0, 2000) }
            })
          };
        }
      }

      return {
        ok: true,
        value: {
          success: true,
          outputDir: target,
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
          message: `apktool execution failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }
}
