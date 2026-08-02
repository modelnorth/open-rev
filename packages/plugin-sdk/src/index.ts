/**
 * OpenRev Plugin SDK
 * 
 * Provides typed registration interfaces for extending the platform:
 * Capabilities, Tools, Workflows, Graph Nodes, UI Panels, Search Providers,
 * Report Generators, and AI Providers.
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  permissions?: string[];
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  category: 'static' | 'runtime' | 'native' | 'network' | 'ai' | 'report';
  description: string;
  inputTypes: string[];
  outputTypes: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  executable: string;
  argsTemplate: string[];
  healthCheck: () => Promise<boolean>;
}

export interface GraphNodeDefinition {
  type: string;
  label: string;
  color: string;
  icon: string;
  attributes: Record<string, string>;
}

export interface UiPanelDefinition {
  id: string;
  title: string;
  icon: string;
  location: 'main' | 'sidebar' | 'bottom';
  componentName: string;
}

export interface WorkflowStep {
  id: string;
  capabilityId: string;
  toolId?: string;
  params?: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export class PluginContext {
  private manifest: PluginManifest;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  public getManifest(): PluginManifest {
    return this.manifest;
  }

  public registerCapability(capability: CapabilityDefinition): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Capability: ${capability.id}`);
  }

  public registerTool(tool: ToolDefinition): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Tool: ${tool.id}`);
  }

  public registerWorkflow(workflow: WorkflowDefinition): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Workflow: ${workflow.id}`);
  }

  public registerGraphNode(nodeDef: GraphNodeDefinition): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Graph Node Type: ${nodeDef.type}`);
  }

  public registerPanel(panel: UiPanelDefinition): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered UI Panel: ${panel.id}`);
  }

  public registerSearchProvider(providerId: string, searchFn: (query: string) => Promise<any[]>): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Search Provider: ${providerId}`);
  }

  public registerReportExporter(format: string, exportFn: (data: any) => Promise<string>): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered Report Exporter for format: ${format}`);
  }

  public registerAIProvider(providerId: string, handler: any): void {
    console.error(`[PluginSDK:${this.manifest.id}] Registered AI Provider: ${providerId}`);
  }
}

export * from './scaffolder';
