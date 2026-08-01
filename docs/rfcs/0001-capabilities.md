# RFC 0001: Versioned Capability Contracts Specification

- **Author**: OpenRev Architecture Working Group
- **Status**: Accepted
- **Created**: 2026-08-01

---

## Abstract

Defines the formal SemVer capability contract interface for OpenRev, ensuring capability providers remain backwards-compatible across platform updates.

```typescript
export interface CapabilityContract<I, O> {
  id: string;
  version: SemVer;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  execute: (input: I) => Promise<O>;
}
```
