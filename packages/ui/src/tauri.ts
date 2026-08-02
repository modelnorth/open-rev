/**
 * OpenRev Tauri IPC client.
 *
 * The frontend NEVER imports Node core modules and NEVER touches the filesystem
 * or processes directly. Every filesystem/process operation is delegated to a
 * Tauri command (analyze_apk / pick_apk / report_error / get_version) exposed
 * by the Rust shell (packages/desktop/src-tauri).
 *
 * When running inside the Tauri webview, `@tauri-apps/api` is imported lazily.
 * In a plain browser (vite preview / tests) a bundled sample analysis is used
 * so the UI is fully exercisable without the desktop shell.
 */

import type { AnalysisResult } from './types';
import { SAMPLE_ANALYSIS } from './sample/sampleAnalysis';

export const APP_VERSION = '0.1.0-alpha.2';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/tauri');
  return tauriInvoke<T>(cmd, args);
}

/** Show a native file dialog. Returns the selected APK/AAB path or null. */
export async function pickApk(): Promise<string | null> {
  if (!isTauri()) {
    throw new Error('Opening an APK is only available in the desktop app.');
  }
  return invoke<string | null>('pick_apk');
}

/** Analyze an APK through the Rust shell (which spawns the Node sidecar). */
export async function analyzeApk(apkPath: string): Promise<AnalysisResult> {
  if (!isTauri()) {
    throw new Error('Analysis requires the desktop shell.');
  }
  return invoke<AnalysisResult>('analyze_apk', { apkPath });
}

/** Report a frontend error to the desktop host (best-effort). */
export async function reportError(message: string, detail?: string): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('report_error', { message, detail: detail ?? null });
  } catch {
    // best-effort; never throw from error reporting
  }
}

export async function getVersion(): Promise<string> {
  if (!isTauri()) return `${APP_VERSION} (web preview)`;
  return invoke<string>('get_version');
}

/** Load the bundled real analysis (browser preview / smoke tests). */
export async function loadBundledSample(): Promise<AnalysisResult> {
  return SAMPLE_ANALYSIS;
}
