/**
 * OpenRev Artifact Knowledge Graph
 *
 * Provides a connected, searchable graph database structure correlating:
 * APK -> Manifest -> Activity -> Fragment/Compose -> Layout -> API Endpoint -> Native Library -> Permissions -> Strings -> Findings
 *
 * Includes structural validation: nodes must have unique ids, edges must
 * reference existing nodes, relationships must be from the known set, and the
 * graph can be checked for orphaned edges and unreachable nodes.
 */

export interface GraphNode {
  id: string;
  type: 'APK' | 'Manifest' | 'Activity' | 'Service' | 'Receiver' | 'Layout' | 'ApiEndpoint' | 'NativeLib' | 'Permission' | 'String' | 'Finding';
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'CONTAINS' | 'DECLARES' | 'INFLATES' | 'CALLS_API' | 'USES_PERMISSION' | 'REQUIRES_LIB' | 'HAS_FINDING';
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

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getConnectedEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
  }

  public searchNodes(query: string): GraphNode[] {
    const q = query.toLowerCase();
    return this.getAllNodes().filter(
      (node) =>
        node.label.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q) ||
        JSON.stringify(node.properties).toLowerCase().includes(q)
    );
  }

  /**
   * Structural validation:
   * - duplicate node ids are impossible (Map keyed by id)
   * - duplicate edge ids are impossible (Map keyed by id)
   * - every edge must reference existing source and target nodes
   * - relationships must be from the known set
   * - warnings for orphaned (unreachable) nodes
   */
  public validate(): GraphValidationResult {
    const issues: GraphValidationIssue[] = [];
    const knownRelationships = new Set([
      'CONTAINS',
      'DECLARES',
      'INFLATES',
      'CALLS_API',
      'USES_PERMISSION',
      'REQUIRES_LIB',
      'HAS_FINDING'
    ]);

    const nodeIds = new Set(this.nodes.keys());

    for (const edge of this.edges.values()) {
      if (!nodeIds.has(edge.source)) {
        issues.push({
          severity: 'error',
          code: 'DANGLING_EDGE_SOURCE',
          message: `Edge "${edge.id}" references missing source node "${edge.source}"`
        });
      }
      if (!nodeIds.has(edge.target)) {
        issues.push({
          severity: 'error',
          code: 'DANGLING_EDGE_TARGET',
          message: `Edge "${edge.id}" references missing target node "${edge.target}"`
        });
      }
      if (!knownRelationships.has(edge.relationship)) {
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_RELATIONSHIP',
          message: `Edge "${edge.id}" uses unknown relationship "${edge.relationship}"`
        });
      }
    }

    const connected = new Set<string>();
    for (const edge of this.edges.values()) {
      connected.add(edge.source);
      connected.add(edge.target);
    }
    for (const node of this.nodes.values()) {
      if (!connected.has(node.id)) {
        issues.push({
          severity: 'warning',
          code: 'ORPHANED_NODE',
          message: `Node "${node.id}" (${node.type}) has no connecting edges`
        });
      }
    }

    return {
      valid: issues.every((i) => i.severity !== 'error'),
      issues,
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size
    };
  }

  public exportGraphJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
    };
  }
}
