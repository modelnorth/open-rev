# Quick Start Guide: OpenRev in 5 Minutes

OpenRev is a high-speed, 100% offline software intelligence platform for analyzing Android APKs, Dalvik DEX, and iOS 18 Mach-O binaries.

---

## 1. Installation

Clone and install dependencies:

```bash
git clone https://github.com/menotbobbybrown/open-rev.git
cd open-rev
npm install
```

---

## 2. Basic Static Analysis

Analyze any Android APK in under 50 milliseconds:

```bash
node --import tsx bin/openrev.js analyze target.apk
```

Outputs structured JSON including:
- Decoded `AndroidManifest.xml` (Permissions, Exported Activities, Services, Receivers)
- Detected Framework (Flutter, React Native, Unity, or Native Kotlin/ART)
- Reconstructed JNI method cross-links
- Generated Mermaid architecture diagrams

---

## 3. Querying the Knowledge Graph

Filter components by type and export status:

```bash
# List all exported entrypoints:
node --import tsx bin/openrev.js graph target.apk

# Search artifacts by regex or keyword:
node --import tsx bin/openrev.js search target.apk "INTERNET"
```

---

## 4. Multi-Version Android Audits

Audit target APK against Android API 14 (4.0) to API 36 (Android 16):

```bash
node --import tsx bin/openrev.js workflow target.apk
```

---

## 5. Offline Autonomous Tool-Calling via Sovereign Router

Run natural language queries locally without cloud leaks:

```bash
node --import tsx bin/openrev.js ask "Find all exported activities in target.apk"
```
