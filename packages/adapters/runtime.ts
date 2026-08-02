/**
 * OpenRev Tool Adapter Runtime
 *
 * Shared process execution layer for external tool adapters (jadx, apktool,
 * adb, frida, ghidra). Handles binary detection, version probing, spawning,
 * timeouts, cancellation, Docker fallback, and typed OpenRev errors.
 *
 * All execution is REAL: adapters never fabricate output. When a tool is not
 * present on PATH, adapters attempt a Docker fallback and otherwise raise
 * TOOL_NOT_FOUND.
 */

import { execFile as execFileCb, spawn } from 'node:child_process';
import { promisify } from 'node:util';
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

  return new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(command, args, {
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
  version?: string;
  dockerAvailable: boolean;
  dockerImage?: string;
}

const VERSION_PATTERN = /(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/;

/**
 * Probe whether a tool exists on PATH and whether Docker is available.
 * Never blocks longer than timeoutMs on either.
 */
export async function probeTool(
  command: string,
  versionFlags: string[],
  dockerImage?: string,
  timeoutMs = 8000
): Promise<ToolProbeResult> {
  const result: ToolProbeResult = {
    found: false,
    dockerAvailable: false,
    dockerImage
  };

  try {
    const { stdout, stderr } = await execFileAsync(command, versionFlags, {
      timeout: timeoutMs,
      windowsHide: true
    });
    result.found = true;
    const combined = `${stdout}\n${stderr}`;
    const match = combined.match(VERSION_PATTERN);
    if (match) result.version = match[1];
    return result;
  } catch {
    // fall through to docker probe
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
