/**
 * OpenRev Managed Dependency Registry
 * 
 * Manages external open-source reverse engineering dependencies.
 * Each tool entry defines auto-discovery rules, version verification,
 * health checks, installation adapters, and runner wrappers.
 * 
 * Health checks are REAL: they locate the binary on PATH and run a
 * version probe. A tool is only reported "installed" when the binary
 * is actually present and executes.
 *
 * Node-only: uses `node:` builtins via dynamic import so this module
 * remains importable in browser bundles (the UI never calls health checks).
 */

export type ToolStatus = 'installed' | 'missing' | 'outdated' | 'error';

export interface ToolDependency {
  id: string;
  name: string;
  category: 'static' | 'runtime' | 'native' | 'network' | 'device';
  description: string;
  executableName: string;
  minVersion: string;
  installedVersion?: string;
  status: ToolStatus;
  versionFlags: string[];
  healthCheck: () => Promise<boolean>;
  getRunCommand: (args: string[]) => { command: string; args: string[] };
}

const SEMVER_PATTERN = /(\d+\.\d+(?:\.\d+)?)/;

function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [pa, pb] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export class DependencyRegistry {
  private dependencies: Map<string, ToolDependency> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register({
      id: 'jadx',
      name: 'JADX',
      category: 'static',
      description: 'Dex to Java decompiler',
      executableName: 'jadx',
      minVersion: '1.4.7',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('jadx', ['--version'], 'jadx'),
      getRunCommand: (args) => ({ command: 'jadx', args })
    });

    this.register({
      id: 'apktool',
      name: 'Apktool',
      category: 'static',
      description: 'A tool for reverse engineering Android APK files',
      executableName: 'apktool',
      minVersion: '2.9.0',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('apktool', ['--version'], 'apktool'),
      getRunCommand: (args) => ({ command: 'apktool', args })
    });

    this.register({
      id: 'mobsf',
      name: 'Mobile Security Framework (MobSF)',
      category: 'static',
      description: 'Automated mobile application security testing framework',
      executableName: 'mobsfscan',
      minVersion: '0.3.0',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('mobsfscan', ['--version'], 'mobsf'),
      getRunCommand: (args) => ({ command: 'mobsfscan', args })
    });

    this.register({
      id: 'adb',
      name: 'Android Debug Bridge (ADB)',
      category: 'device',
      description: 'Android SDK platform tool for device communication',
      executableName: 'adb',
      minVersion: '1.0.41',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('adb', ['--version'], 'adb'),
      getRunCommand: (args) => ({ command: 'adb', args })
    });

    this.register({
      id: 'frida',
      name: 'Frida CLI',
      category: 'runtime',
      description: 'Dynamic instrumentation toolkit for developers, reverse-engineers, and security researchers',
      executableName: 'frida',
      minVersion: '16.0.0',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('frida', ['--version'], 'frida'),
      getRunCommand: (args) => ({ command: 'frida', args })
    });

    this.register({
      id: 'ghidra',
      name: 'Ghidra Headless',
      category: 'native',
      description: 'Software reverse engineering framework developed by NSA',
      executableName: 'analyzeHeadless',
      minVersion: '10.3.0',
      versionFlags: ['-help'],
      status: 'missing',
      healthCheck: () => this.probe('analyzeHeadless', ['-help'], 'ghidra'),
      getRunCommand: (args) => ({ command: 'analyzeHeadless', args })
    });

    this.register({
      id: 'radare2',
      name: 'radare2 / Rizin',
      category: 'native',
      description: 'UNIX-like reverse engineering framework and commandline toolset',
      executableName: 'r2',
      minVersion: '5.8.0',
      versionFlags: ['-v'],
      status: 'missing',
      healthCheck: () => this.probe('r2', ['-v'], 'radare2'),
      getRunCommand: (args) => ({ command: 'r2', args })
    });

    this.register({
      id: 'mitmproxy',
      name: 'mitmproxy',
      category: 'network',
      description: 'An interactive HTTPS proxy for inspection and interception',
      executableName: 'mitmdump',
      minVersion: '9.0.0',
      versionFlags: ['--version'],
      status: 'missing',
      healthCheck: () => this.probe('mitmdump', ['--version'], 'mitmproxy'),
      getRunCommand: (args) => ({ command: 'mitmdump', args })
    });
  }

  public register(dep: ToolDependency): void {
    this.dependencies.set(dep.id, dep);
  }

  public get(id: string): ToolDependency | undefined {
    return this.dependencies.get(id);
  }

  public listAll(): ToolDependency[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Probes a binary on PATH by spawning it with the given version flags.
   * Returns true when the binary executes successfully, false otherwise.
   * Also updates the dependency status/version when found.
   */
  public async probe(executableName: string, args: string[], depId?: string): Promise<boolean> {
    return this.runProbe(executableName, args, depId);
  }

  private async runProbe(executableName: string, args: string[], depId?: string): Promise<boolean> {
    let result: string;
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execFileAsync = promisify(execFile);
      const { stdout, stderr } = await execFileAsync(executableName, args, {
        timeout: 8000,
        windowsHide: true
      });
      result = `${stdout}\n${stderr}`;
    } catch {
      // Binary not found or failed to run — mark missing.
      this.updateStatus(depId, 'missing');
      return false;
    }

    if (depId) {
      const version = this.extractVersion(result);
      const dep = this.dependencies.get(depId);
      if (dep && version) {
        dep.installedVersion = version;
        const outdated = compareVersions(version, dep.minVersion) < 0;
        this.updateStatus(depId, outdated ? 'outdated' : 'installed');
      } else if (dep) {
        // Ran successfully but no version string parsed — treat as installed.
        this.updateStatus(depId, 'installed');
      }
    }

    return true;
  }

  private extractVersion(output: string): string | undefined {
    const match = output.match(SEMVER_PATTERN);
    return match?.[1];
  }

  private updateStatus(depId: string | undefined, status: ToolStatus): void {
    if (!depId) return;
    const dep = this.dependencies.get(depId);
    if (dep) dep.status = status;
  }

  public async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [id, dep] of this.dependencies.entries()) {
      results[id] = await dep.healthCheck();
    }
    return results;
  }
}
