/**
 * Apktool Tool Adapter
 *
 * Real apktool wrapper. Resolves apktool from a custom path (OPENREV_APKTOOL
 * or `executablePath` option) or PATH, validates the version against a minimum,
 * optionally verifies the binary SHA-256, and decodes an APK's resources to
 * disk. Windows .bat/.cmd is resolved through cmd.exe. Never fabricates output.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runViaDocker,
  runChecked,
  verifyChecksum,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ApktoolDecodeOptions {
  /** Custom apktool executable path (overrides OPENREV_APKTOOL and PATH). */
  executablePath?: string;
  /** Expected SHA-256 of the apktool binary/wrapper; validated when provided. */
  expectedSha256?: string;
  timeoutMs?: number;
  cancelSignal?: AbortSignal;
}

export interface ApktoolDecodeResult {
  success: true;
  outputDir: string;
  source: 'native' | 'docker';
  version?: string;
  stderr: string;
  elapsedMs: number;
}

export class ApktoolAdapter {
  public static readonly toolId = 'apktool';
  public static readonly minVersion = '2.9.0';
  public static readonly dockerImage = process.env.DOCKER_APKTOOL_IMAGE || 'borgmatic/apktool:latest';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(
    executablePath?: string
  ): Promise<ToolProbeResult> {
    const custom = executablePath ?? process.env.OPENREV_APKTOOL;
    if (!this.cachedProbe || custom !== this.cachedProbe.executablePath) {
      this.cachedProbe = await probeTool(
        'apktool',
        ['--version'],
        ApktoolAdapter.dockerImage,
        ApktoolAdapter.minVersion,
        custom
      );
    }
    return this.cachedProbe;
  }

  public async decode(
    apkPath: string,
    outputDir: string,
    options: ApktoolDecodeOptions = {}
  ): Promise<AdapterResponse<ApktoolDecodeResult>> {
    const probe = await this.isAvailable(options.executablePath);

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

    if (probe.found && ApktoolAdapter.minVersion && probe.version && probe.versionOk === false) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `apktool version ${probe.version} is older than required minimum ${ApktoolAdapter.minVersion}.`,
          remediation: 'Upgrade apktool to at least ' + ApktoolAdapter.minVersion + '.',
          context: { version: probe.version, minVersion: ApktoolAdapter.minVersion }
        })
      };
    }

    if (probe.found && probe.executablePath && options.expectedSha256) {
      const match = await verifyChecksum(probe.executablePath, options.expectedSha256);
      if (!match) {
        return {
          ok: false,
          error: new OpenRevError({
            code: 'TOOL_EXECUTION_FAILED',
            message: `apktool binary checksum mismatch at ${probe.executablePath}.`,
            cause: 'The binary does not match the expected SHA-256.',
            remediation: 'Reinstall apktool or update the expected checksum.'
          })
        };
      }
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
      let stderr = '';
      if (probe.found) {
        const args = ['d', apkPath, '-o', target, '-f'];
        stderr = await runChecked(probe.executablePath ?? 'apktool', {
          args,
          requireExitZero: false,
          timeoutMs: options.timeoutMs,
          cancelSignal: options.cancelSignal
        }).catch((e: OpenRevError) => {
          if (e.code === 'TOOL_NOT_FOUND') return '';
          throw e;
        });
      } else {
        const res = await runViaDocker(ApktoolAdapter.dockerImage, ['d', apkPath, '-o', target, '-f'], {
          timeoutMs: options.timeoutMs,
          cancelSignal: options.cancelSignal
        });
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
        stderr = res.stderr;
      }

      return {
        ok: true,
        value: {
          success: true,
          outputDir: target,
          source: probe.found ? 'native' : 'docker',
          version: probe.version,
          stderr: stderr.slice(0, 4000),
          elapsedMs: Date.now() - start
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
