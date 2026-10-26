/**
 * OpenRev Binary Knowledge Base Engine
 * 
 * Continuous Software Intelligence Compiler.
 * 
 * Auto-compiles reverse engineering findings into structured Markdown entities,
 * tracks de-obfuscation renames, cross-links callers/callees, and detects
 * contradictions between static file artifacts and dynamic memory traces.
 */

export interface WikiEntity {
  name: string;
  category: 'Class' | 'Method' | 'CryptoKey' | 'Endpoint' | 'Vulnerability';
  description: string;
  deobfuscatedName?: string;
  attributes: Record<string, any>;
  references: string[];
  lastUpdated: string;
  source: string;
}

export interface WikiContradiction {
  entityName: string;
  staticClaim: string;
  dynamicObserved: string;
  severity: 'low' | 'medium' | 'critical';
  timestamp: string;
}

export class BinaryWikiEngine {
  private entities: Map<string, WikiEntity> = new Map();
  private contradictions: WikiContradiction[] = [];

  /**
   * Ingests a discovered entity or updates an existing entity page.
   */
  public ingestEntity(entity: Omit<WikiEntity, 'lastUpdated'>): void {
    const existing = this.entities.get(entity.name);
    if (existing) {
      // Merge attributes & deduplicate references
      existing.description = entity.description || existing.description;
      existing.deobfuscatedName = entity.deobfuscatedName || existing.deobfuscatedName;
      existing.attributes = { ...existing.attributes, ...entity.attributes };
      existing.references = Array.from(new Set([...existing.references, ...entity.references]));
      existing.lastUpdated = new Date().toISOString();
      existing.source = entity.source;
    } else {
      this.entities.set(entity.name, {
        ...entity,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Logs a contradiction between static and dynamic analysis.
   */
  public recordContradiction(entityName: string, staticClaim: string, dynamicObserved: string, severity: 'low' | 'medium' | 'critical' = 'medium'): void {
    this.contradictions.push({
      entityName,
      staticClaim,
      dynamicObserved,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Compiles an entity into a publication-grade Obsidian/Markdown document.
   */
  public compileEntityMarkdown(entityName: string): string {
    const e = this.entities.get(entityName);
    if (!e) return `# Entity Not Found: ${entityName}\n`;

    const title = e.deobfuscatedName ? `${e.deobfuscatedName} (${e.name})` : e.name;
    let md = `# ${title}\n\n`;
    md += `> **Category**: \`${e.category}\` | **Source**: \`${e.source}\` | **Updated**: ${e.lastUpdated}\n\n`;
    md += `## Description\n${e.description}\n\n`;

    if (Object.keys(e.attributes).length > 0) {
      md += `## Key Attributes\n`;
      for (const [k, v] of Object.entries(e.attributes)) {
        md += `- **${k}**: \`${typeof v === 'object' ? JSON.stringify(v) : v}\`\n`;
      }
      md += `\n`;
    }

    if (e.references.length > 0) {
      md += `## Cross-References\n`;
      for (const ref of e.references) {
        md += `- [[${ref}]]\n`;
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * Generates the Master Knowledge Base Index (`index.md`).
   */
  public generateIndexMarkdown(): string {
    let md = `# Binary Knowledge Graph Wiki\n\n`;
    md += `Auto-compiled by OpenRev Knowledge Engine.\n\n`;
    md += `## Ingested Entities (${this.entities.size})\n\n`;
    md += `| Entity | Category | De-obfuscated Alias | Source |\n`;
    md += `| :--- | :---: | :--- | :--- |\n`;

    for (const e of this.entities.values()) {
      const alias = e.deobfuscatedName ? `\`${e.deobfuscatedName}\`` : '—';
      md += `| [[${e.name}]] | \`${e.category}\` | ${alias} | ${e.source} |\n`;
    }

    if (this.contradictions.length > 0) {
      md += `\n## ⚠️ Flagged Contradictions (${this.contradictions.length})\n\n`;
      for (const c of this.contradictions) {
        md += `- **${c.entityName}** [${c.severity.toUpperCase()}]: Static claimed \`${c.staticClaim}\` but Dynamic observed \`${c.dynamicObserved}\`\n`;
      }
    }

    return md;
  }

  public getAllEntities(): WikiEntity[] {
    return Array.from(this.entities.values());
  }

  public getContradictions(): WikiContradiction[] {
    return [...this.contradictions];
  }
}
