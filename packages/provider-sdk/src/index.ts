/**
 * OpenRev Provider SDK Specification
 * 
 * Public interface for creating tool and software artifact providers.
 */

export interface ProviderManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  capabilities: string[];
  supportedArtifacts: string[];
  platforms: Array<'windows' | 'macos' | 'linux'>;
  permissions: string[];
}

export interface ProviderExecutionContext {
  targetPath: string;
  outputDir: string;
  options?: Record<string, any>;
}

export interface NormalizedProviderOutput {
  providerId: string;
  success: boolean;
  artifactsProduced: Array<{
    type: string;
    name: string;
    payload: any;
    metadata?: Record<string, any>;
  }>;
  graphNodes: Array<{
    id: string;
    type: string;
    label: string;
    properties: Record<string, any>;
  }>;
  graphEdges: Array<{
    id: string;
    source: string;
    target: string;
    relationship: string;
  }>;
}

export abstract class BaseProvider {
  public abstract readonly manifest: ProviderManifest;

  public abstract healthCheck(): Promise<boolean>;

  public abstract execute(context: ProviderExecutionContext): Promise<NormalizedProviderOutput>;
}
