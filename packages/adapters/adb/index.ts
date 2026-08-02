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

  public async isAvailable(): Promise<ToolProbeResult> {
    if (!this.cachedProbe) {
      this.cachedProbe = await probeTool('adb', ['--version']);
    }
    return this.cachedProbe;
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

    const start = Date.now();
    try {
      const out = await runChecked('adb', { args: ['devices', '-l'] });
      const lines = out.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith('List of devices'));
      const devices: AdbDeviceInfo[] = lines.map((line) => {
        const parts = line.split(/\s+/);
        const serial = parts[0] ?? '';
        const state = (parts[1] ?? 'unknown') as AdbDeviceInfo['state'];
        const modelMatch = line.match(/model:([^\s]+)/);
        const versionMatch = line.match(/android_version:([^\s]+)/);
        return {
          serial,
          state,
          model: modelMatch?.[1],
          androidVersion: versionMatch?.[1]
        };
      });
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

  public async installApk(
    apkPath: string,
    serial?: string
  ): Promise<AdapterResponse<{ success: true; serial: string }>> {
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

    let targetSerial = serial;
    if (!targetSerial) {
      const devices = await this.listDevices();
      if (!devices.ok || devices.value.length === 0) {
        return {
          ok: false,
          error: new OpenRevError({
            code: 'NO_DEVICE_CONNECTED',
            message: 'No connected Android device found.',
            remediation: 'Connect a device with USB debugging enabled, or pass an explicit serial.'
          })
        };
      }
      const device = devices.value.find((d) => d.state === 'device') ?? devices.value[0];
      targetSerial = device.serial;
    }

    try {
      const args = ['-s', targetSerial, 'install', '-r', apkPath];
      const out = await runChecked('adb', { args, timeoutMs: 300_000 });
      return {
        ok: true,
        value: { success: true, serial: targetSerial },
        source: 'native',
        elapsedMs: 0
      };
    } catch (err) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `adb install failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }

  public async dumpPackage(packageName: string, serial?: string): Promise<AdapterResponse<string>> {
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
    const args = serial
      ? ['-s', serial, 'shell', 'dumpsys', 'package', packageName]
      : ['shell', 'dumpsys', 'package', packageName];
    try {
      const out = await runChecked('adb', { args, timeoutMs: 60_000 });
      return { ok: true, value: out, source: 'native', elapsedMs: 0 };
    } catch (err) {
      return {
        ok: false,
        error: new OpenRevError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `adb dumpsys failed: ${(err as Error).message}`,
          cause: (err as Error).message
        })
      };
    }
  }

  public streamLogcat(
    onLog: (line: string) => void,
    serial?: string,
    abortSignal?: AbortSignal
  ): { stop: () => void } | undefined {
    const args = serial
      ? ['-s', serial, 'logcat', '-v', 'threadtime']
      : ['logcat', '-v', 'threadtime'];
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn('adb', args, { windowsHide: true });
    } catch {
      return undefined;
    }

    const onAbort = () => child.kill();
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (chunk: Buffer) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        if (line.trim().length) onLog(line);
      }
    });

    return {
      stop: () => {
        abortSignal?.removeEventListener('abort', onAbort);
        child.kill();
      }
    };
  }
}
