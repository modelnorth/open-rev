/**
 * Frida Instrumentation Adapter
 *
 * Real Frida wrapper. When `frida` is installed, spawns it against a real
 * target process with the supplied script. When absent, returns an honest
 * TOOL_NOT_FOUND error. No session is ever claimed without a real attach.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runChecked,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export interface FridaAttachResult {
  sessionActive: boolean;
  output?: string;
}

export class FridaAdapter {
  public static readonly toolId = 'frida';
  public static readonly minVersion = '16.0.0';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('frida', ['--version']);
    }
    return this.cachedProbe;
  }

  public async attach(
    targetProcess: string,
    scriptSource: string
  ): Promise<AdapterResponse<FridaAttachResult>> {
    const probe = await this.isAvailable();
    if (!probe.found) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'frida is not installed.',
          cause: 'frida binary not found on PATH.',
          remediation: 'Install frida-tools (pip install frida-tools) and ensure a target device/emulator is running.'
        })
      };
    }

    const scriptPath = join(tmpdir(), `openrev-frida-${randomUUID()}.js`);
    await writeFile(scriptPath, scriptSource, 'utf8');

    try {
      const out = await runChecked('frida', {
        args: ['-U', '-n', targetProcess, '-l', scriptPath, '--no-pause'],
        timeoutMs: 30_000,
        requireExitZero: false
      });
      return {
        ok: true,
        value: { sessionActive: true, output: out.slice(0, 10_000) },
        source: 'native',
        elapsedMs: 0
      };
    } catch (err) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `frida attach failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    } finally {
      await rm(scriptPath, { force: true });
    }
  }
}
