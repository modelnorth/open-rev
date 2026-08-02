/**
 * OpenRev RAG Search & FTS Indexer
 * 
 * Indexes decompiled Java code, Smali source, Manifest XML, resources, and Knowledge Graph nodes
 * to allow instant AI retrieval without repeatedly parsing raw files.
 *
 * STATUS: EXPERIMENTAL — intended to complement the production SearchIndexer
 * (packages/core/src/search/indexer.ts). Not part of the release gate.
 */

import { ArtifactKnowledgeGraph } from '../graph/knowledge_graph';

export interface DocumentChunk {
  id: string;
  sourceFile: string;
  content: string;
  metadata: Record<string, any>;
}

export class RAGIndexer {
  private chunks: DocumentChunk[] = [];
  private graph: ArtifactKnowledgeGraph;

  constructor(graph: ArtifactKnowledgeGraph) {
    this.graph = graph;
  }

  public async indexDocument(sourceFile: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    const chunk: DocumentChunk = {
      id: `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceFile,
      content,
      metadata
    };
    this.chunks.push(chunk);
  }

  public queryRAG(query: string, topK: number = 5): DocumentChunk[] {
    const q = query.toLowerCase();
    const matches = this.chunks.filter(
      (chunk) =>
        chunk.content.toLowerCase().includes(q) ||
        chunk.sourceFile.toLowerCase().includes(q)
    );

    return matches.slice(0, topK);
  }

  public getContextForQuery(query: string): string {
    const graphNodes = this.graph.searchNodes(query);
    const ragChunks = this.queryRAG(query);

    let contextStr = `=== Artifact Knowledge Graph Entries ===\n`;
    graphNodes.forEach((node) => {
      contextStr += `[${node.type}] ${node.label} (${JSON.stringify(node.properties)})\n`;
    });

    contextStr += `\n=== Relevant Source Chunks ===\n`;
    ragChunks.forEach((chunk) => {
      contextStr += `File: ${chunk.sourceFile}\nContent Snippet: ${chunk.content.substring(0, 300)}...\n---\n`;
    });

    return contextStr;
  }
}
