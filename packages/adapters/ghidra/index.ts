/**
 * Ghidra Headless Adapter
 *
 * Real Ghidra headless wrapper. When `analyzeHeadless` is installed, runs a
 * real analysis over a binary and reads the symbol table back from disk. When
 * absent, returns an honest TOOL_NOT_FOUND error. Never returns fabricated
 * symbols or decompiled C.
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
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';

export interface GhidraAnalyzeResult {
  symbols: string[];
  decompiledC?: string;
  outputDir: string;
}

export class GhidraAdapter {
  public static readonly toolId = 'ghidra';
  public static readonly minVersion = '10.3.0';

  private cachedProbe: ToolProbeResult | null = null;

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('analyzeHeadless', ['-help']);
    }
    return this.cachedProbe;
  }

  public async analyzeElf(binaryPath: string): Promise<AdapterResponse<GhidraAnalyzeResult>> {
    const probe = await this.isAvailable();
    if (!probe.found) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'Ghidra headless (analyzeHeadless) is not installed.',
          cause: 'analyzeHeadless binary not found on PATH.',
          remediation: 'Install Ghidra (https://ghidra-sre.org) and add its support/analyzeHeadless to PATH.'
        })
      };
    }

    const projDir = await mkdtemp(join(tmpdir(), 'openrev-ghidra-'));
    const projName = `proj_${randomUUID().slice(0, 8)}`;

    try {
      await runChecked('analyzeHeadless', {
        args: [projDir, projName, '-import', binaryPath, '-postScript', 'SymbolTable.java'],
        timeoutMs: 300_000,
        requireExitZero: false
      });

      const symbolFiles = ['symbols.txt', 'symbols.csv'];
      let symbols: string[] = [];
      for (const f of symbolFiles) {
        const p = join(projDir, projName, f);
        try {
          await access(p);
          const content = await readFile(p, 'utf8');
          symbols = content
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          break;
        } catch {
          // not found, try next
        }
      }

      return {
        ok: true,
        value: { symbols, outputDir: projDir },
        source: 'native',
        elapsedMs: 0
      };
    } catch (err) {
      await rm(projDir, { recursive: true, force: true });
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `analyzeHeadless failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }
}
