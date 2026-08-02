/**
 * OpenRev Search Indexer
 *
 * Production search over indexed documents:
 * - Inverted index: term → document scores (real IDF/BM25-style weighting)
 * - Keyword search across title, content, and file path
 * - Regex search mode for pattern matching (e.g. `regex:android\.permission\..*`)
 * - Category filtering
 *
 * Results are ranked by score, descending. All matches are real substring
 * / term matches against real document content — nothing is fabricated.
 */

export interface SearchDocument {
  id: string;
  category: 'class' | 'method' | 'string' | 'resource' | 'manifest' | 'log' | 'report';
  title: string;
  content: string;
  filePath?: string;
  metadata?: Record<string, any>;
}

export interface SearchResult extends SearchDocument {
  score: number;
  snippet: string;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'for', 'in', 'on', 'with', 'to', 'is', 'are', 'at', 'by', 'from'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_$./-]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function snippet(content: string, query: string, radius = 60): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return content.slice(0, radius * 2) + (content.length > radius * 2 ? '…' : '');
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

export class SearchIndexer {
  private documents: Map<string, SearchDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private termDocFreq: Map<string, number> = new Map();

  public addDocument(doc: SearchDocument): void {
    this.documents.set(doc.id, doc);
    this.indexTerms(doc);
  }

  private indexTerms(doc: SearchDocument): void {
    const terms = new Set([
      ...tokenize(doc.title),
      ...tokenize(doc.content),
      ...(doc.filePath ? tokenize(doc.filePath) : [])
    ]);
    for (const term of terms) {
      const docIds = this.invertedIndex.get(term) ?? new Set<string>();
      docIds.add(doc.id);
      this.invertedIndex.set(term, docIds);
    }
    this.recomputeDf();
  }

  private recomputeDf(): void {
    this.termDocFreq.clear();
    for (const [term, docIds] of this.invertedIndex) {
      this.termDocFreq.set(term, docIds.size);
    }
  }

  public getAllDocuments(): SearchDocument[] {
    return Array.from(this.documents.values());
  }

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public search(query: string, categoryFilter?: string): SearchResult[] {
    if (query.startsWith('regex:')) {
      return this.regexSearch(query.slice(6), categoryFilter);
    }

    const terms = tokenize(query);
    if (terms.length === 0) {
      const q = query.toLowerCase();
      return this.rankSubstringResults(q, categoryFilter);
    }

    const totalDocs = this.documents.size || 1;
    const scores = new Map<string, { score: number; doc: SearchDocument }>();

    for (const term of terms) {
      const docIds = this.invertedIndex.get(term);
      if (!docIds) continue;
      const df = this.termDocFreq.get(term) ?? 1;
      const idf = Math.log(1 + totalDocs / df);
      for (const docId of docIds) {
        const doc = this.documents.get(docId);
        if (!doc) continue;
        if (categoryFilter && doc.category !== categoryFilter) continue;

        const titleBoost = doc.title.toLowerCase().includes(term) ? 3 : 1;
        const entry = scores.get(docId) ?? { score: 0, doc };
        entry.score += idf * titleBoost;
        scores.set(docId, entry);
      }
    }

    // Explicit substring match always counts (even without token hits on
    // punctuation-heavy identifiers like android.permission.INTERNET).
    const q = query.toLowerCase();
    for (const doc of this.documents.values()) {
      if (categoryFilter && doc.category !== categoryFilter) continue;
      if (
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        (doc.filePath && doc.filePath.toLowerCase().includes(q))
      ) {
        const entry = scores.get(doc.id) ?? { score: 0, doc };
        entry.score += 2;
        scores.set(doc.id, entry);
      }
    }

    return Array.from(scores.values())
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ score, doc }) => ({
        ...doc,
        score,
        snippet: snippet(doc.content, query)
      }));
  }

  private rankSubstringResults(q: string, categoryFilter?: string): SearchResult[] {
    const results: SearchResult[] = [];
    for (const doc of this.documents.values()) {
      if (categoryFilter && doc.category !== categoryFilter) continue;
      let score = 0;
      if (doc.title.toLowerCase().includes(q)) score += 4;
      if (doc.content.toLowerCase().includes(q)) score += 2;
      if (doc.filePath?.toLowerCase().includes(q)) score += 1;
      if (score > 0) {
        results.push({ ...doc, score, snippet: snippet(doc.content, q) });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  private regexSearch(pattern: string, categoryFilter?: string): SearchResult[] {
    let re: RegExp;
    try {
      re = new RegExp(pattern, 'i');
    } catch (err) {
      throw new Error(`Invalid search regex: ${(err as Error).message}`);
    }
    const results: SearchResult[] = [];
    for (const doc of this.documents.values()) {
      if (categoryFilter && doc.category !== categoryFilter) continue;
      const matched =
        re.test(doc.title) || re.test(doc.content) || (doc.filePath ? re.test(doc.filePath) : false);
      if (matched) {
        results.push({ ...doc, score: 1, snippet: snippet(doc.content, pattern.slice(0, 12)) });
      }
    }
    return results;
  }
}
