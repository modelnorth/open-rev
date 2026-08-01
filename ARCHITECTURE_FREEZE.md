# ARCHITECTURE_FREEZE.md — OpenRev Platform Architecture Specification v1.0

**Status**: FROZEN  
**Effective Date**: 2026-08-01  
**Policy**: Any changes to core principles, public APIs, capability contracts, or artifact schemas require a formal RFC process (`docs/rfcs/`).

---

## 1. Core Principles

1. **Local-First & Offline Capable**: All database storage, indexing, and analysis run locally using SQLite and content-addressed storage.
2. **Capability-Based Orchestration**: Plugins request abstract versioned capabilities rather than calling specific tools.
3. **Immutable Content-Addressed Artifact Store**: Raw tools emit normalized artifacts indexed by SHA-256 digests.
4. **Graph-Driven & RAG Knowledge Engine**: Reverse engineering, security auditing, and UI mapping operate on a connected Artifact Knowledge Graph.
5. **Out-of-Process Extension Isolation**: Plugins run in an isolated process to ensure UI stability, security, and crash isolation.

---

## 2. Public SDK Surface

```
@openrev/sdk             # High-level platform API & workspace gateway
@openrev/provider-sdk    # Provider interface definitions & normalizers
@openrev/plugin-sdk      # Extension hooks for panels, tools, & capabilities
@openrev/ui-sdk          # Reusable UI components (Graph visualizer, Code editor)
```

---

## 3. Formal Capability Contract

```typescript
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export interface Capability<I = any, O = any> {
  id: string;
  version: SemVer;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  execute: (input: I) => Promise<O>;
}
```

---

## 4. Formal Artifact Specification

```typescript
export interface ArtifactProvenance {
  providerId: string;
  toolVersion: string;
  executedAt: string;
  commandArgs?: string[];
}

export interface Artifact<T = any> {
  id: string;
  hash: string; // SHA-256 digest
  type: string;
  version: SemVer;
  schemaUri: string;
  metadata: Record<string, any>;
  relationships: Array<{ targetId: string; relation: string }>;
  timestamps: { createdAt: string; updatedAt: string };
  provenance: ArtifactProvenance;
  payload: T;
}
```

---

## 5. RFC Process Policy

To propose a breaking change or architectural addition:
1. Create a markdown proposal in `docs/rfcs/000N-feature-name.md`.
2. Detail motivation, technical design, breaking changes, and alternatives considered.
3. Obtain maintainer approval before submitting PRs modifying frozen contracts.
