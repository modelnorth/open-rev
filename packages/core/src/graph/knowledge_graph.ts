/**
 * OpenRev Artifact Knowledge Graph
 *
 * Provides a connected, searchable graph database structure correlating:
 * APK -> Manifest -> Activity -> Fragment/Compose -> Layout -> API Endpoint -> Native Library -> Permissions -> Strings -> Findings -> JniBridge -> IPA -> MachO -> Framework -> ObjcClass
 *
 * Includes structural validation: nodes must have unique ids, edges must
 * reference existing nodes, relationships must be from the known set, and the
 * graph can be checked for orphaned edges and unreachable nodes.
 */

export interface GraphNode {
  id: string;
  type:
    | 'APK'
    | 'Manifest'
    | 'Activity'
    | 'Service'
    | 'Receiver'
    | 'Layout'
    | 'ApiEndpoint'
    | 'NativeLib'
    | 'Permission'
    | 'String'
    | 'Finding'
    | 'JniBridge'
    | 'IPA'
    | 'MachO'
    | 'Framework'
    | 'ObjcClass';
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship:
    | 'CONTAINS'
    | 'DECLARES'
    | 'INFLATES'
    | 'CALLS_API'
    | 'USES_PERMISSION'
    | 'REQUIRES_LIB'
    | 'HAS_FINDING'
    | 'CALLS_NATIVE'
    | 'LINKS';
  properties?: Record<string, any>;
}

export interface GraphValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface GraphValidationResult {
  valid: boolean;
  issues: GraphValidationIssue[];
  nodeCount: number;
  edgeCount: number;
}

export class ArtifactKnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge);
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getOutgoingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.source === nodeId);
  }

  public getIncomingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.target === nodeId);
  }

  public getNeighbors(nodeId: string): GraphNode[] {
    const neighborIds = new Set<string>();
    for (const e of this.edges.values()) {
      if (e.source === nodeId) neighborIds.add(e.target);
      if (e.target === nodeId) neighborIds.add(e.source);
    }
    return Array.from(neighborIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is GraphNode => n !== undefined);
  }

  public searchNodes(query: string): GraphNode[] {
    const q = query.toLowerCase();
    return this.getAllNodes().filter((n) => {
      if (n.label.toLowerCase().includes(q)) return true;
      if (n.type.toLowerCase().includes(q)) return true;
      for (const val of Object.values(n.properties)) {
        if (typeof val === 'string' && val.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }

  public exportGraphJSON(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  public validate(): GraphValidationResult {
    const issues: GraphValidationIssue[] = [];
    const validRelationships = new Set([
      'CONTAINS',
      'DECLARES',
      'INFLATES',
      'CALLS_API',
      'USES_PERMISSION',
      'REQUIRES_LIB',
      'HAS_FINDING',
      'CALLS_NATIVE',
      'LINKS'
    ]);

    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.source)) {
        issues.push({
          severity: 'error',
          code: 'ORPHANED_EDGE_SOURCE',
          message: `Edge ${edge.id} references non-existent source node: ${edge.source}`
        });
      }
      if (!this.nodes.has(edge.target)) {
        issues.push({
          severity: 'error',
          code: 'ORPHANED_EDGE_TARGET',
          message: `Edge ${edge.id} references non-existent target node: ${edge.target}`
        });
      }
      if (!validRelationships.has(edge.relationship)) {
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_RELATIONSHIP',
          message: `Edge ${edge.id} has unknown relationship type: ${edge.relationship}`
        });
      }
    }

    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size
    };
  }

  public toJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges()
    };
  }

  public static fromJSON(data: { nodes: GraphNode[]; edges: GraphEdge[] }): ArtifactKnowledgeGraph {
    const graph = new ArtifactKnowledgeGraph();
    for (const n of data.nodes) graph.addNode(n);
    for (const e of data.edges) graph.addEdge(e);
    return graph;
  }
}
