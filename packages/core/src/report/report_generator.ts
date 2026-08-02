/**
 * OpenRev Report Generator
 *
 * Compiles real Artifact Knowledge Graph data (components, permissions,
 * exported surfaces) into a Markdown report. Every number comes from the
 * graph actually produced by the analysis pipeline — no fabricated endpoints,
 * hosts, or counts.
 */

import { ArtifactKnowledgeGraph } from '../graph/knowledge_graph';

export class ReportGenerator {
  private graph: ArtifactKnowledgeGraph;

  constructor(graph: ArtifactKnowledgeGraph) {
    this.graph = graph;
  }

  public generateMarkdownReport(title: string = 'OpenRev Application Analysis Report'): string {
    const nodes = this.graph.getAllNodes();
    const edges = this.graph.getAllEdges();

    const apkNode = nodes.find((n) => n.type === 'APK');
    const manifestNode = nodes.find((n) => n.type === 'Manifest');
    const activities = nodes.filter((n) => n.type === 'Activity');
    const services = nodes.filter((n) => n.type === 'Service');
    const receivers = nodes.filter((n) => n.type === 'Receiver');
    const permissions = nodes.filter((n) => n.type === 'Permission');

    const exported = [...activities, ...services, ...receivers].filter(
      (n) => n.properties?.exported === true
    );

    return `# ${title}

**Generated At**: ${new Date().toISOString()}  
**Target Application**: ${apkNode?.label || '(unknown)'}  
**Package Name**: ${manifestNode?.properties?.package || '(unknown)'}  
**SHA-256**: ${apkNode?.properties?.sha256 || '(unknown)'}  

---

## Executive Summary

OpenRev parsed the binary AndroidManifest.xml and extracted declared components, permissions, and requested platform features directly from the artifact.

- **Total Graph Nodes**: ${nodes.length}
- **Total Relationships**: ${edges.length}
- **Activities Declared**: ${activities.length}
- **Services Declared**: ${services.length}
- **Receivers Declared**: ${receivers.length}
- **Permissions Requested**: ${permissions.length}
- **Exported Components (attack surface)**: ${exported.length}

---

## Discovered Components

### Activities
${activities.length ? activities.map((a) => `- **${a.label}**${a.properties?.exported === true ? ' *(exported)*' : ''}`).join('\n') : '_None declared._'}

### Services
${services.length ? services.map((s) => `- **${s.label}**${s.properties?.exported === true ? ' *(exported)*' : ''}`).join('\n') : '_None declared._'}

### Receivers
${receivers.length ? receivers.map((r) => `- **${r.label}**${r.properties?.exported === true ? ' *(exported)*' : ''}`).join('\n') : '_None declared._'}

### Exported Attack Surface
${exported.length ? exported.map((e) => `- \`${e.properties?.name || e.label}\` (${e.type})`).join('\n') : '_No exported components detected._'}

### Permissions Requested
${permissions.length ? permissions.map((p) => `- \`${p.properties?.name || p.label}\``).join('\n') : '_None requested._'}

---

## Artifact Knowledge Graph (Mermaid)

\`\`\`mermaid
graph TD
${edges.map((e) => `    ${e.source}["${this.escapeLabel(this.graph.getNode(e.source)?.label)}"] -->|${e.relationship}| ${e.target}["${this.escapeLabel(this.graph.getNode(e.target)?.label)}"]`).join('\n')}
\`\`\`

---

*Report generated automatically by OpenRev from real artifact analysis.*
`;
  }

  private escapeLabel(label?: string): string {
    return (label ?? '?').replace(/"/g, '');
  }
}
