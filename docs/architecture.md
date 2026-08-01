# OpenRev Platform Architecture Documentation

**OpenRev** is a cross-platform desktop software intelligence and reverse-engineering platform designed around generic software artifacts and capability-based tool orchestration.

---

## 🏛️ Monorepo & System Layers

```mermaid
graph TD
    subgraph Desktop ["Desktop Host Layer"]
        Tauri["Tauri / Rust Core Host (openrev-desktop)"]
        UI["React + TypeScript UI Workspace (@openrev/ui)"]
    end

    subgraph Core ["Platform Core Engine (@openrev/core)"]
        CAP["Capability API & Runtime Selection"]
        AKG["Artifact Knowledge Graph Engine"]
        SDB["SQLite Workspace Database"]
        RAG["RAG Indexer & Search Engine"]
    end

    subgraph Extension ["Plugin & Adapter Extensions"]
        SDK["Plugin SDK (@openrev/plugin-sdk)"]
        MP["Marketplace Registry (@openrev/marketplace)"]
        AD["Modular Adapters (JADX, Ghidra, Frida, mitmproxy, ADB)"]
    end

    Desktop <-->|Tauri IPC| Core
    Core --> Extension
```

---

## Key Design Principles

1. **Local-First & Offline Capable**: All database storage, indexing, and analysis run locally on the user's desktop using SQLite and embedded indexes.
2. **Capability-Based Tool Runtime**: Users express intentions (`Analyze APK`, `Extract Endpoints`, `Decompile Native SO`), and the engine selects the appropriate underlying adapters.
3. **Artifact Knowledge Graph**: Connected graph schema holding nodes (`APK`, `Manifest`, `Activity`, `Compose Screen`, `Layout`, `ApiEndpoint`, `Native SO`, `Permissions`, `Strings`) and directed relationships.
4. **Graph-Driven & RAG AI Copilot**: AI models (OpenAI, Anthropic, Ollama, vLLM, LM Studio) query the Knowledge Graph and indexed source chunks instead of repeatedly reading raw binaries.
5. **Extensible Plugin Marketplace**: Supports first-party and third-party plugins with independent versioning and sandboxed execution.
