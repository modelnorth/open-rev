/**
 * OpenRev Workflow DAG Execution Engine
 * 
 * Executes multi-step analysis pipelines sequentially or concurrently:
 * Import APK -> Static Analysis -> Manifest Analysis -> Decompile -> Resource Extraction -> API Discovery -> AI Summary -> Export Report
 */

import { CapabilityEngine } from '../capabilities';

export interface WorkflowNode {
  id: string;
  name: string;
  capabilityId: string;
  params?: Record<string, any>;
  dependsOn?: string[];
}

export interface WorkflowDAG {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

export class WorkflowEngine {
  private capabilityEngine: CapabilityEngine;

  constructor(capabilityEngine: CapabilityEngine) {
    this.capabilityEngine = capabilityEngine;
  }

  public async executeDAG(dag: WorkflowDAG, targetPath: string): Promise<Record<string, any>> {
    console.error(`[WorkflowEngine] Starting DAG Execution: "${dag.name}" on ${targetPath}`);
    const results: Record<string, any> = {};

    for (const node of dag.nodes) {
      console.error(`[WorkflowEngine] Running node: ${node.name} (${node.capabilityId})`);
      const res = await this.capabilityEngine.executeCapability(node.capabilityId, {
        targetPath,
        options: node.params
      });
      results[node.id] = res;
    }

    return results;
  }

  public getDefaultAuditWorkflow(): WorkflowDAG {
    return {
      id: 'wf_full_audit',
      name: 'Full Automated APK Audit Pipeline',
      description: 'Standard end-to-end static analysis, manifest decoding, decompiler, API discovery, and AI report export',
      nodes: [
        {
          id: 'step_static',
          name: '1. Parse APK & Manifest',
          capabilityId: 'static.analyze_apk'
        },
        {
          id: 'step_decompile',
          name: '2. Decompile Java & Smali',
          capabilityId: 'static.decompile',
          dependsOn: ['step_static']
        },
        {
          id: 'step_network',
          name: '3. Setup Network Proxy & API Explorer',
          capabilityId: 'network.intercept',
          dependsOn: ['step_static']
        },
        {
          id: 'step_device',
          name: '4. Device Connection & Live Console',
          capabilityId: 'device.inspect',
          dependsOn: ['step_static']
        }
      ]
    };
  }
}
