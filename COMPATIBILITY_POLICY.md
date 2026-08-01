# OpenRev Platform North Star Metric, Compatibility Policy & Manifest Specification

---

## ⭐ North Star Metric

> **"From a single target APK, generate a fully normalized, searchable Artifact Knowledge Graph in under 60 seconds on a standard developer machine."**

Every performance optimization, capability selection, graph indexing strategy, and background worker queue tuning is evaluated against this metric.

---

## 📜 Extension Manifest Specification (`extension.json`)

Every provider and plugin must supply an `extension.json` manifest:

```json
{
  "id": "provider.android",
  "version": "1.0.0",
  "name": "Android Provider",
  "description": "Parses APK/AAB binaries, decodes binary XML manifests, and extracts layout resources",
  "capabilities": [
    "AnalyzeAPK",
    "ExtractResources"
  ],
  "supportedArtifacts": [
    "APK",
    "AAB",
    "DEX"
  ],
  "platforms": [
    "windows",
    "macos",
    "linux"
  ],
  "permissions": [
    "process.execute",
    "fs.read",
    "fs.write"
  ]
}
```

---

## 🔄 Provider & Ecosystem Compatibility Matrix

| Target System / Framework | Provider Status | Included Milestone |
| :--- | :--- | :--- |
| **Android (APK / AAB)** | **Stable** | **v0.1 Alpha** |
| **Java / DEX Bytecode** | **Stable** | **v0.1 Alpha** |
| **Flutter / Dart** | Experimental | v0.4 Beta |
| **React Native** | Planned | v0.4 Beta |
| **Jetpack Compose** | Planned | v0.4 Beta |
| **Unity Binary** | Planned | v2.0 |
| **iOS (IPA)** | Planned | v2.0 |
| **ELF / PE Native SO** | Planned | v2.0 |

---

## 🔒 Versioning & Compatibility Policy

1. **SemVer Compliance**: Public SDKs (`@openrev/sdk`, `@openrev/provider-sdk`, `@openrev/plugin-sdk`) strictly follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
2. **Capability Contracts**: Capability inputs and outputs are versioned with backwards compatibility guarantees across minor releases.
3. **Artifact Schemas**: Artifact schema definitions include version tags. The Knowledge Engine includes schema migration adapters for older workspace snapshots.
4. **Marketplace Deferral**: The online marketplace is moved to **v1.1**. For v1.0, plugins and providers are loaded directly from local filesystem paths (`~/.openrev/plugins/` and `~/.openrev/providers/`).
5. **AI Optionality**: AI processing is strictly optional. The core platform operates fully offline with 100% functionality (Knowledge Graph, Search, UI Inspectors, Artifact Store) without any LLM configured.
