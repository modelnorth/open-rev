/**
 * OpenRev Tool Adapter Runtime
 *
 * Shared process execution layer for external tool adapters (jadx, apktool,
 * adb, frida, ghidra). Handles binary detection (custom path or PATH),
 * version probing + validation, optional checksum verification, spawning,
 * timeouts, cancellation, Windows batch (.bat/.cmd) resolution, Docker
 * fallback, and typed OpenRev errors.
 *
 * All execution is REAL: adapters never fabricate output. When a tool is not
 * present, adapters attempt a Docker fallback and otherwise raise
 * TOOL_NOT_FOUND.
 */

import { execFile as execFileCb, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { OpenRevError, OpenRevErrorCode } from '../core/src/errors/openrev_error.ts';

const execFileAsync = promisify(execFileCb);

export interface AdapterResult<T> {
  ok: true;
  value: T;
  source: 'native' | 'docker';
  elapsedMs: number;
}

export interface AdapterFailure {
  ok: false;
  error: OpenRevError;
}

export type AdapterResponse<T> = AdapterResult<T> | AdapterFailure;

export interface ProcessOptions {
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  cancelSignal?: AbortSignal;
  maxOutputBytes?: number;
  env?: Record<string, string>;
}

export interface ProcessResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

function quoteWinArg(a: string): string {
  if (a.length === 0) return '""';
  if (/[\s"]/.test(a) && !a.startsWith('"')) return `"${a.replace(/"/g, '\\"')}"`;
  return a;
}

/**
 * On Windows, .bat/.cmd files cannot be spawned directly (EINVAL). Resolve them
 * through cmd.exe. Returns null for non-batch commands.
 */
function winBatchResolve(command: string, args: string[]): { command: string; args: string[] } | null {
  if (process.platform !== 'win32') return null;
  const lower = command.toLowerCase();
  if (!lower.endsWith('.bat') && !lower.endsWith('.cmd')) return null;
  const cmdline = [quoteWinArg(command), ...args.map(quoteWinArg)].join(' ');
  return { command: 'cmd.exe', args: ['/d', '/s', '/c', cmdline] };
}

/**
 * Run an external command. Returns raw output; never fabricates.
 */
export async function runCommand(command: string, options: ProcessOptions): Promise<ProcessResult> {
  const {
    args,
    cwd,
    timeoutMs = 120_000,
    cancelSignal,
    maxOutputBytes = 10 * 1024 * 1024,
    env
  } = options;

  const resolved = winBatchResolve(command, args);
  const cmd = resolved?.command ?? command;
  const cmdArgs = resolved?.args ?? args;

  return new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd,
      windowsHide: true,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const onCancel = () => {
      child.kill();
      reject(
        new OpenRevError({
          code: OpenRevErrorCode.PROCESS_CANCELLED,
          message: `Command cancelled: ${command} ${args.join(' ')}`
        })
      );
    };

    cancelSignal?.addEventListener('abort', onCancel, { once: true });

    let stdout = '';
    let stderr = '';
    let killedForSize = false;

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length + chunk.length > maxOutputBytes) {
        killedForSize = true;
        child.kill();
        return;
      }
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length + chunk.length > maxOutputBytes) {
        killedForSize = true;
        child.kill();
        return;
      }
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(
        new OpenRevError({
          code: OpenRevErrorCode.PROCESS_TIMEOUT,
          message: `Command timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}`
        })
      );
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      cancelSignal?.removeEventListener('abort', onCancel);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new OpenRevError({
            code: OpenRevErrorCode.TOOL_NOT_FOUND,
            message: `Tool not found on PATH: ${command}`,
            context: { command }
          })
        );
      } else {
        reject(
          new OpenRevError({
            code: 'TOOL_EXECUTION_FAILED',
            message: `Failed to spawn ${command}: ${err.message}`,
            cause: err.message
          })
        );
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      cancelSignal?.removeEventListener('abort', onCancel);
      if (killedForSize) {
        reject(
          new OpenRevError({
            code: 'OUTPUT_TOO_LARGE',
            message: `Command output exceeded ${maxOutputBytes} bytes: ${command}`
          })
        );
        return;
      }
      resolve({ stdout, stderr, code });
    });
  });
}

/**
 * Run a command and return its combined output as a string.
 * Throws OpenRevError on non-zero exit.
 */
export async function runChecked(
  command: string,
  options: ProcessOptions & { requireExitZero?: boolean }
): Promise<string> {
  const { requireExitZero = true, ...rest } = options;
  const result = await runCommand(command, rest);
  if (requireExitZero && result.code !== 0) {
    throw new OpenRevError({
      code: 'TOOL_EXECUTION_FAILED',
      message: `${command} exited with code ${result.code}`,
      context: { stderr: result.stderr.slice(0, 2000) }
    });
  }
  return `${result.stdout}\n${result.stderr}`.trim();
}

export interface ToolProbeResult {
  found: boolean;
  executablePath?: string;
  version?: string;
  versionOk?: boolean;
  dockerAvailable: boolean;
  dockerImage?: string;
}

const VERSION_PATTERN = /(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/;

/**
 * Probe whether a tool exists at a custom path or on PATH, parse its version,
 * and validate it against a minimum. Never blocks longer than timeoutMs.
 */
export async function probeTool(
  command: string,
  versionFlags: string[],
  dockerImage?: string,
  minVersion?: string,
  customPath?: string,
  timeoutMs = 8000
): Promise<ToolProbeResult> {
  const result: ToolProbeResult = {
    found: false,
    dockerAvailable: false,
    dockerImage
  };

  const candidates = [customPath, command].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const resolved = winBatchResolve(candidate, versionFlags);
      const exec = resolved?.command ?? candidate;
      const execArgs = resolved?.args ?? versionFlags;
      const { stdout, stderr } = await execFileAsync(exec, execArgs, {
        timeout: timeoutMs,
        windowsHide: true,
        env: process.env
      });
      result.found = true;
      result.executablePath = candidate;
      const combined = `${stdout}\n${stderr}`;
      const match = combined.match(VERSION_PATTERN);
      if (match) {
        result.version = match[1];
        if (minVersion) {
          result.versionOk = compareVersions(result.version, minVersion) >= 0;
        }
      }
      return result;
    } catch {
      // try next candidate
    }
  }

  if (dockerImage) {
    try {
      const { stdout } = await execFileAsync('docker', ['version', '--format', '{{.Server.Version}}'], {
        timeout: timeoutMs,
        windowsHide: true
      });
      result.dockerAvailable = stdout.trim().length > 0;
    } catch {
      result.dockerAvailable = false;
    }
  }

  return result;
}

/**
 * Compare two dotted numeric version strings. Returns -1/0/1. Non-numeric
 * segments are compared lexically. Missing parts default to 0.
 */
export function compareVersions(a: string, b: string): number {
  const pa = (a || '').split(/[.+-]/).map((s) => (/^\d+$/.test(s) ? Number(s) : NaN));
  const pb = (b || '').split(/[.+-]/).map((s) => (/^\d+$/.test(s) ? Number(s) : NaN));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Verify the SHA-256 of a binary on disk. Returns true when it matches.
 */
export async function verifyChecksum(filePath: string, expectedSha256: string): Promise<boolean> {
  const data = await readFile(filePath);
  const actual = createHash('sha256').update(data).digest('hex');
  return actual.toLowerCase() === expectedSha256.toLowerCase();
}

/**
 * Run a tool via Docker (native absent). Returns docker marker.
 */
export async function runViaDocker(
  image: string,
  args: string[],
  options: Omit<ProcessOptions, 'args'> = {}
): Promise<ProcessResult> {
  return runCommand('docker', {
    ...options,
    args: ['run', '--rm', '-v', `${process.cwd()}:/work`, '-w', '/work', image, ...args]
  });
}
