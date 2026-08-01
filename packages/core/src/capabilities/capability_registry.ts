/**
 * OpenRev Central Capability Registry
 * 
 * Plugins interact ONLY with the Capability Registry, requesting abstract capabilities
 * rather than coupling directly to specific tools or providers.
 */

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
      execute: async (params) => ({ status: 'success', summary: 'Parsed APK manifest & components.' })
    });

    this.register({
      name: 'DecompileJava',
      description: 'Decompiles DEX/JAR bytecode into Java source code',
      providerId: 'provider.jadx',
      execute: async (params) => ({ status: 'success', sourcePath: 'decompiled/java' })
    });

    this.register({
      name: 'AnalyzeNative',
      description: 'Disassembles and decompiles ELF, PE, or Mach-O native binaries',
      providerId: 'provider.ghidra',
      execute: async (params) => ({ status: 'success', symbolsCount: 42 })
    });

    this.register({
      name: 'ExplainCode',
      description: 'RAG-backed AI explanation of source code snippets',
      providerId: 'provider.ai',
      execute: async (params) => ({ status: 'success', explanation: 'RAG AI explanation generated.' })
    });
  }

  public register(handler: CapabilityHandler): void {
    this.handlers.set(handler.name, handler);
    console.log(`[CapabilityRegistry] Registered capability: ${handler.name} (Provider: ${handler.providerId})`);
  }

  public async invoke(capabilityName: CapabilityName, params: any): Promise<any> {
    const handler = this.handlers.get(capabilityName);
    if (!handler) {
      throw new Error(`Capability "${capabilityName}" is not registered in the platform.`);
    }

    console.log(`[CapabilityRegistry] Invoking capability "${capabilityName}" via provider "${handler.providerId}"`);
    return await handler.execute(params);
  }

  public listCapabilities(): CapabilityHandler[] {
    return Array.from(this.handlers.values());
  }
}
