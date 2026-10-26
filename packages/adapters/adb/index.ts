/**
 * ADB Device Adapter
 *
 * Real Android Debug Bridge wrapper. Talks to real devices via the `adb`
 * binary: lists devices, streams logcat, installs APKs, dumps packages.
 * Never fabricates device lists or logs.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';
import {
  probeTool,
  runCommand,
  runChecked,
  type AdapterResponse,
  type ToolProbeResult
} from '../runtime.ts';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';

export interface AdbDeviceInfo {
  serial: string;
  state: 'device' | 'offline' | 'unauthorized' | 'unknown';
  model?: string;
  androidVersion?: string;
}

export class AdbAdapter {
  public static readonly toolId = 'adb';
  public static readonly minVersion = '1.0.41';

  private cachedProbe: ToolProbeResult | null = null;
  private readonly customPath: string | undefined;

  constructor(customPath?: string) {
    this.customPath = customPath ?? process.env.OPENREV_ADB;
  }

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('adb', ['--version'], undefined, AdbAdapter.minVersion, this.customPath);
    }
    return this.cachedProbe;
  }

  public get executablePath(): string | undefined {
    return this.customPath ?? 'adb';
  }

  private adbCommand(): string {
    return this.customPath ?? 'adb';
  }

  public async listDevices(): Promise<AdapterResponse<AdbDeviceInfo[]>> {
    const probe = await this.isAvailable();
    if (!probe.found) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'adb is not installed.',
          cause: 'adb binary not found on PATH.',
          remediation: 'Install Android SDK platform-tools and add adb to PATH.'
        })
      };
    }
    if (probe.version && probe.versionOk === false) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `adb version ${probe.version} is older than required minimum ${AdbAdapter.minVersion}.`,
          remediation: 'Upgrade Android SDK platform-tools.'
        })
      };
    }

    const start = Date.now();
    try {
      const out = await runChecked(this.adbCommand(), { args: ['devices', '-l'] });
      const lines = out
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('List of devices') && !l.startsWith('* daemon'));
      
      const devices: AdbDeviceInfo[] = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const serial = parts[0] ?? '';
        // Skip daemon restart log lines that adb outputs
        if (serial === '*' || !serial) continue;

        const rawState = parts[1] ?? 'unknown';
        const validStates = ['device', 'offline', 'unauthorized', 'unknown'];
        const state = (validStates.includes(rawState) ? rawState : 'unknown') as AdbDeviceInfo['state'];

        const modelMatch = line.match(/model:([^\s]+)/);
        const versionMatch = line.match(/android_version:([^\s]+)/);
        devices.push({
          serial,
          state,
          model: modelMatch?.[1],
          androidVersion: versionMatch?.[1]
        });
      }

      return {
        ok: true,
        value: devices,
        source: 'native',
        elapsedMs: Date.now() - start
      };
    } catch (err) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `adb devices failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }

  public async install(apkPath: string, serial?: string): Promise<AdapterResponse<string>> {
    const probe = await this.isAvailable();
    if (!probe.found) {
      return {
        ok: false,
        error: new OpenRevError({
          code: OpenRevErrorCode.TOOL_NOT_FOUND,
          message: 'adb is not installed.'
        })
      };
    }
    const args = serial ? ['-s', serial, 'install', '-r', apkPath] : ['install', '-r', apkPath];
    const start = Date.now();
    try {
      const out = await runChecked(this.adbCommand(), { args });
      return { ok: true, value: out, source: 'native', elapsedMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `adb install failed: ${(err as Error).message}`
        })
      };
    }
  }

  public spawnLogcat(serial?: string): ChildProcessWithoutNullStreams {
    const args = serial ? ['-s', serial, 'logcat', '-v', 'time'] : ['logcat', '-v', 'time'];
    return spawn(this.adbCommand(), args);
  }
}
