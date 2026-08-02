/**
 * OpenRev Central Capability Registry
 * 
 * Plugins interact ONLY with the Capability Registry, requesting abstract capabilities
 * rather than coupling directly to specific tools or providers.
 */

import { AndroidProvider } from '../../../providers/android/src/index.ts';

export type CapabilityName =
  | 'AnalyzeAPK'
  | 'DecompileJava'
  | 'ExtractResources'
  | 'AnalyzeNative'
  | 'CaptureTraffic'
  | 'GenerateReport'
  | 'BuildKnowledgeGraph'
  | 'RunWorkflow'
  | 'SearchArtifacts'
  | 'ExplainCode';

export interface CapabilityHandler {
  name: CapabilityName;
  description: string;
  providerId: string;
  execute: (params: any) => Promise<any>;
}

export class CapabilityRegistry {
  private handlers: Map<CapabilityName, CapabilityHandler> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register({
      name: 'AnalyzeAPK',
      description: 'Static analysis and component extraction of APK binaries',
      providerId: 'provider.android',
      execute: async (params) => {
        const provider = new AndroidProvider();
        const result = await provider.execute({
          targetPath: params.targetPath,
          outputDir: params.outputDir ?? '.'
        });
        return { status: result.success ? 'success' : 'failed', result };
      }
    });

    this.register({
      name: 'DecompileJava',
      description: 'Decompiles DEX/JAR bytecode into Java source code',
      providerId: 'provider.jadx',
      execute: async (params) => {
        const { JadxAdapter } = await import('../../../adapters/jadx/index.ts');
        const adapter = new JadxAdapter();
        const res = await adapter.decompile(params.targetPath, {
          decompileCode: params.decompileCode ?? true,
          exportResources: params.exportResources ?? true,
          outputDir: params.outputDir ?? '.'
        });
        if (!res.ok) throw res.error;
        return { status: 'success', sourcePath: res.value.outputDir, source: res.value.source };
      }
    });

    this.register({
      name: 'AnalyzeNative',
      description: 'Disassembles and decompiles ELF, PE, or Mach-O native binaries',
      providerId: 'provider.ghidra',
      execute: async (params) => {
        const { GhidraAdapter } = await import('../../../adapters/ghidra/index.ts');
        const adapter = new GhidraAdapter();
        const res = await adapter.analyzeElf(params.targetPath);
        if (!res.ok) throw res.error;
        return { status: 'success', symbolsCount: res.value.symbols.length };
      }
    });

    this.register({
      name: 'ExplainCode',
      description: 'RAG-backed AI explanation of source code snippets',
      providerId: 'provider.ai',
      execute: async (params) => {
        return {
          status: 'unavailable',
          explanation:
            'AI copilot is experimental and requires an LLM provider key. Set OPENREV_LLM_API_KEY to enable.'
        };
      }
    });
  }

  public register(handler: CapabilityHandler): void {
    this.handlers.set(handler.name, handler);
    console.error(`[CapabilityRegistry] Registered capability: ${handler.name} (Provider: ${handler.providerId})`);
  }

  public async invoke(capabilityName: CapabilityName, params: any): Promise<any> {
    const handler = this.handlers.get(capabilityName);
    if (!handler) {
      throw new Error(`Capability "${capabilityName}" is not registered in the platform.`);
    }

    console.error(`[CapabilityRegistry] Invoking capability "${capabilityName}" via provider "${handler.providerId}"`);
    return await handler.execute(params);
  }

  public listCapabilities(): CapabilityHandler[] {
    return Array.from(this.handlers.values());
  }
}
