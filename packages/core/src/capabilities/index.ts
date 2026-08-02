/**
 * OpenRev Capability API & Tool Runtime Selection Layer
 *
 * Decouples user intent ("Analyze APK", "Decompile Source", "Extract Resources")
 * from specific tooling. `static.analyze_apk` runs the REAL analysis pipeline
 * (hash → store → decode → extract → graph → index → workspace → report).
 * Capabilities that require uninstalled tools (decompile/intercept/device)
 * return honest errors describing the missing prerequisite.
 */

import { DependencyRegistry } from '../deps/dependency_registry';
import { ArtifactKnowledgeGraph } from '../graph/knowledge_graph';
import { AnalysisPipeline } from '../pipeline/analysis_pipeline.ts';

export interface CapabilityInput {
  targetPath: string;
  options?: Record<string, any>;
}

export interface CapabilityResult {
  success: boolean;
  capabilityId: string;
  toolUsed: string;
  outputSummary: string;
  artifactsProduced: string[];
  graphNodes?: any[];
  graphEdges?: any[];
  report?: string;
  error?: string;
}

export class CapabilityEngine {
  private registry: DependencyRegistry;
  private graph: ArtifactKnowledgeGraph;

  constructor(registry: DependencyRegistry, graph: ArtifactKnowledgeGraph) {
    this.registry = registry;
    this.graph = graph;
  }

  public async executeCapability(
    capabilityId: string,
    input: CapabilityInput
  ): Promise<CapabilityResult> {
    console.error(`[CapabilityEngine] Executing capability: ${capabilityId} on target ${input.targetPath}`);

    switch (capabilityId) {
      case 'static.analyze_apk':
        return this.runStaticAnalysis(input);
      case 'static.decompile':
        return this.runDecompile(input);
      case 'network.intercept':
        return this.runNetworkIntercept(input);
      case 'device.inspect':
        return this.runDeviceInspect(input);
      default:
        throw new Error(`Unknown capability ID: ${capabilityId}`);
    }
  }

  private async runStaticAnalysis(input: CapabilityInput): Promise<CapabilityResult> {
    const pipeline = new AnalysisPipeline({ storeArtifacts: false });
    const result = await pipeline.run(input.targetPath);

    for (const n of result.graph.nodes) {
      this.graph.addNode({ ...n });
    }
    for (const e of result.graph.edges) {
      this.graph.addEdge({ ...e });
    }

    return {
      success: true,
      capabilityId: 'static.analyze_apk',
      toolUsed: 'OpenRev Android Provider',
      outputSummary:
        `Parsed binary AndroidManifest.xml for ${result.analysis.packageName}: ` +
        `${result.analysis.activities.length} activities, ${result.analysis.services.length} services, ` +
        `${result.analysis.receivers.length} receivers, ${result.analysis.exportedComponents.length} exported components.`,
      artifactsProduced: ['AndroidManifest.xml', 'knowledge_graph.json', 'report.md'],
      graphNodes: this.graph.getAllNodes(),
      graphEdges: this.graph.getAllEdges(),
      report: result.reportMarkdown
    };
  }

  private async runDecompile(input: CapabilityInput): Promise<CapabilityResult> {
    const { JadxAdapter } = await import('../../../adapters/jadx/index.ts');
    const adapter = new JadxAdapter();
    const probe = await adapter.isAvailable();
    if (!probe.found && !probe.dockerAvailable) {
      return {
        success: false,
        capabilityId: 'static.decompile',
        toolUsed: 'JADX',
        outputSummary: 'JADX is not installed on this machine.',
        artifactsProduced: [],
        error: 'JADX is not installed. Install jadx or Docker to enable decompilation.'
      };
    }
    const res = await adapter.decompile(input.targetPath, {
      decompileCode: true,
      exportResources: true,
      outputDir: input.options?.outputDir ?? '.'
    });
    if (!res.ok) {
      throw res.error;
    }
    return {
      success: true,
      capabilityId: 'static.decompile',
      toolUsed: 'JADX',
      outputSummary: `Decompiled to ${res.value.outputDir} (${res.value.source}).`,
      artifactsProduced: [res.value.outputDir]
    };
  }

  private async runNetworkIntercept(input: CapabilityInput): Promise<CapabilityResult> {
    return {
      success: false,
      capabilityId: 'network.intercept',
      toolUsed: 'mitmproxy',
      outputSummary: 'Network interception requires mitmproxy and an interactive session.',
      artifactsProduced: [],
      error: 'network.intercept is not available in the CLI. Use an interactive mitmproxy session instead.'
    };
  }

  private async runDeviceInspect(input: CapabilityInput): Promise<CapabilityResult> {
    const { AdbAdapter } = await import('../../../adapters/adb/index.ts');
    const adapter = new AdbAdapter();
    const probe = await adapter.isAvailable();
    if (!probe.found) {
      return {
        success: false,
        capabilityId: 'device.inspect',
        toolUsed: 'ADB',
        outputSummary: 'ADB is not installed on this machine.',
        artifactsProduced: [],
        error: 'ADB is not installed. Install Android SDK platform-tools to inspect devices.'
      };
    }
    const devices = await adapter.listDevices();
    if (!devices.ok) throw devices.error;
    return {
      success: true,
      capabilityId: 'device.inspect',
      toolUsed: 'ADB',
      outputSummary: `Found ${devices.value.length} device(s): ${devices.value.map((d) => d.serial).join(', ')}.`,
      artifactsProduced: ['devices']
    };
  }
}
