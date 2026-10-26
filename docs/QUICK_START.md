# OpenRev Quick Start Guide

OpenRev is a high-speed, 100% offline software intelligence platform for analyzing Android APKs/AABs, Dalvik DEX, and iOS 18 Mach-O binaries.

---

## 1. Installation

Clone and install dependencies (requires Node >= 22.5.0):

```bash
git clone https://github.com/modelnorth/open-rev.git
cd open-rev
npm install
npm run typecheck
```

---

## 2. Basic Static Analysis

Analyze any Android APK in under 50 milliseconds:

```bash
node --import tsx bin/openrev.js analyze tests/fixtures/FixtureApp.apk --json
```

Outputs structured JSON including:
- Decoded `AndroidManifest.xml` (Permissions, Exported Activities, Services, Receivers)
- Detected Framework (Flutter, React Native, Unity, or Native ART)
- Reconstructed JNI method cross-links (`JniBridge`)
- Generated Mermaid architecture diagrams

---

## 3. Querying the Knowledge Graph

Filter components by type and export status:

```bash
# List all exported entrypoints:
node --import tsx bin/openrev.js graph tests/fixtures/FixtureApp.apk

# Search artifacts by regex or keyword:
node --import tsx bin/openrev.js search tests/fixtures/FixtureApp.apk "INTERNET"
```

---

## 4. Multi-Version Android Audits

Audit target APK against Android API 14 (Android 4.0) through API 36 (Android 16):

```bash
node --import tsx bin/openrev.js workflow tests/fixtures/FixtureApp.apk --json
```

---

## 5. Offline Autonomous Tool Routing via Sovereign Router

Run natural language intent routing locally without cloud dependencies:

```bash
node --import tsx bin/openrev.js ask "Find all exported activities in tests/fixtures/FixtureApp.apk"
```

---

## 6. iOS 18 Mach-O & IPA Extraction

Inspect native 64-bit ARM64/ARM64e binaries directly:

```typescript
import { IosProvider } from '@openrev/provider-ios';

const provider = new IosProvider();
const result = await provider.analyze('target.ipa');
console.log(result.machoSummary);
```

---

## 7. Distributed Observability & Knowledge Wiki

OpenRev natively emits OpenTelemetry traces and maintains auto-compiling binary wikis:

```typescript
import { AgentOtelTracer, BinaryWikiEngine } from '@openrev/core';

// Start OpenTelemetry span
const tracer = new AgentOtelTracer('openrev-agent');
const span = tracer.startSpan('binary_analysis', { target: 'app.apk' });

// Ingest discovered entities into the Binary Wiki
const wiki = new BinaryWikiEngine();
wiki.ingestEntity({
  id: 'com.example.MainActivity',
  name: 'MainActivity',
  type: 'Activity',
  tags: ['exported', 'entrypoint'],
  facts: [{ key: 'action', value: 'android.intent.action.MAIN', source: 'ManifestExtractor', confidence: 1.0 }]
});

console.log(wiki.compileToMarkdown());
span.end();
```
