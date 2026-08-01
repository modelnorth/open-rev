export interface SearchDocument {
  id: string;
  category: 'class' | 'method' | 'string' | 'resource' | 'manifest' | 'log' | 'report';
  title: string;
  content: string;
  filePath?: string;
  metadata?: Record<string, any>;
}

export class SearchIndexer {
  private index: Map<string, SearchDocument> = new Map();

  public addDocument(doc: SearchDocument): void {
    this.index.set(doc.id, doc);
  }

  public search(query: string, categoryFilter?: string): SearchDocument[] {
    const q = query.toLowerCase();
    const results: SearchDocument[] = [];

    for (const doc of this.index.values()) {
      if (categoryFilter && doc.category !== categoryFilter) {
        continue;
      }
      if (
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        (doc.filePath && doc.filePath.toLowerCase().includes(q))
      ) {
        results.push(doc);
      }
    }

    return results;
  }
}
