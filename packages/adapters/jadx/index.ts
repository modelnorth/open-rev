/**
 * JADX Tool Adapter
 *
 * Real jadx wrapper. Resolves jadx from a custom path (OPENREV_JADX or
 * `executablePath` option) or PATH, validates the version against a minimum,
 * optionally verifies the binary SHA-256, and decompiles an APK to real Java
 * sources on disk. Windows .bat/.cmd is resolved through cmd.exe. Never
 * fabricates output: if the tool is missing, returns an honest TOOL_NOT_FOUND
 * error.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runViaDocker,
  runChecked,
  runCommand,
  verifyChecksum,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface JadxOptions {
  decompileCode: boolean;
  exportResources: boolean;
  outputDir: string;
  /** Custom jadx executable path (overrides OPENREV_JADX and PATH). */
  executablePath?: string;
  /** Expected SHA-256 of the jadx binary; validated when provided. */
  expectedSha256?: string;
  timeoutMs?: number;
  cancelSignal?: AbortSignal;
}

export interface JadxDecompileResult {
  success: true;
  outputDir: string;
  source: 'native' | 'docker';
  version?: string;
  javaSourcesCount?: number;
  stderr: string;
  elapsedMs: number;
}

export class JadxAdapter {
  public static readonly toolId = 'jadx';
  public static readonly minVersion = '1.4.7';
  public static readonly dockerImage = process.env.DOCKER_JADX_IMAGE || 'ewoutp/jadx:latest';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(
    executablePath?: string
  ): Promise<ToolProbeResult> {
    const custom = executablePath ?? process.env.OPENREV_JADX;
    if (!this.cachedProbe || custom !== this.cachedProbe.executablePath) {
      this.cachedProbe = await probeTool(
        'jadx',
        ['--version'],
        JadxAdapter.dockerImage,
        JadxAdapter.minVersion,
        custom
      );
    }
    return this.cachedProbe;
  }

  public async decompile(
    apkPath: string,
    options: JadxOptions
  ): Promise<AdapterResponse<JadxDecompileResult>> {
    const probe = await this.isAvailable(options.executablePath);

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

    if (probe.found && JadxAdapter.minVersion && probe.version && probe.versionOk === false) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `jadx version ${probe.version} is older than required minimum ${JadxAdapter.minVersion}.`,
          remediation: 'Upgrade jadx to at least ' + JadxAdapter.minVersion + '.',
          context: { version: probe.version, minVersion: JadxAdapter.minVersion }
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
            message: `jadx binary checksum mismatch at ${probe.executablePath}.`,
            cause: 'The binary does not match the expected SHA-256.',
            remediation: 'Reinstall jadx or update the expected checksum.'
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

    const outputDir = join(options.outputDir, 'jadx');
    const start = Date.now();

    try {
      let stderr = '';
      if (probe.found) {
        const args = [
          '-d',
          outputDir,
          ...(options.decompileCode ? [] : ['--no-src']),
          ...(options.exportResources ? ['-r'] : ['--no-res']),
          apkPath
        ];
        const res = await runChecked(probe.executablePath ?? 'jadx', {
          args,
          requireExitZero: false,
          timeoutMs: options.timeoutMs,
          cancelSignal: options.cancelSignal
        }).catch((e: OpenRevError) => {
          if (e.code === 'TOOL_NOT_FOUND') {
            return '';
          }
          throw e;
        });
        stderr = res;
      } else {
        const args = ['-d', outputDir, ...(options.exportResources ? ['-r'] : ['--no-res']), apkPath];
        const res = await runViaDocker(JadxAdapter.dockerImage, args, {
          timeoutMs: options.timeoutMs,
          cancelSignal: options.cancelSignal
        });
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
        stderr = res.stderr;
      }

      const javaSourcesCount = countJavaSources(outputDir);

      return {
        ok: true,
        value: {
          success: true,
          outputDir,
          source: probe.found ? 'native' : 'docker',
          version: probe.version,
          javaSourcesCount,
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
          message: `jadx execution failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }
}

export { runCommand };

function countJavaSources(dir: string): number {
  let count = 0;
  const walk = (d: string): void => {
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.java')) count++;
    }
  };
  walk(dir);
  return count;
}
