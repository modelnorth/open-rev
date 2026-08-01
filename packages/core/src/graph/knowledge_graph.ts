/**
 * OpenRev Artifact Knowledge Graph
 * 
 * Provides a connected, searchable graph database structure correlating:
 * APK -> Manifest -> Activity -> Fragment/Compose -> Layout -> API Endpoint -> Native Library -> Permissions -> Strings -> Findings
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

  public exportGraphJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
    };
  }
}
