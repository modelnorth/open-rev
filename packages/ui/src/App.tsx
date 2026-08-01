import React, { useState } from 'react';
import { ArtifactKnowledgeGraph, CapabilityEngine, DependencyRegistry } from '@openrev/core';
import { GraphExplorer } from './components/GraphExplorer';
import { CodeEditor } from './components/CodeEditor';
import { DeviceManager } from './components/DeviceManager';
import { NetworkInspector } from './components/NetworkInspector';
import { AiCopilot } from './components/AiCopilot';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { DependencyManagerView } from './components/DependencyManagerView';
import { ReportViewer } from './components/ReportViewer';
import './index.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'graph' | 'editor' | 'device' | 'network' | 'ai' | 'workflows' | 'deps' | 'report'
  >('graph');

  // Initialize Core Knowledge Graph & Capabilities
  const [graph] = useState<ArtifactKnowledgeGraph>(() => {
    const g = new ArtifactKnowledgeGraph();
    const registry = new DependencyRegistry();
    const cap = new CapabilityEngine(registry, g);
    // Populate demo graph data
    cap.executeCapability('static.analyze_apk', { targetPath: 'SampleApp.apk' });
    return g;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Application Bar */}
      <header
        style={{
          height: '42px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡ OpenRev</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400 }}>v1.0.0</span>
          </div>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Workspace: <strong style={{ color: 'var(--text-primary)' }}>SampleApp.apk</strong>
          </span>
        </div>

        {/* Global Command Search Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            🔍 Search graph, code, endpoints... <span className="mono" style={{ fontSize: '10px', marginLeft: '6px' }}>Ctrl+K</span>
          </div>
          <span className="badge badge-green">Local-First</span>
        </div>
      </header>

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Vertical Dock Bar */}
        <nav
          style={{
            width: '180px',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px'
          }}
        >
          <button
            className="btn"
            onClick={() => setActiveTab('graph')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'graph' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'graph' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'graph' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            🕸️ Graph Explorer
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('editor')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'editor' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'editor' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'editor' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            💻 Decompiler / Code
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('device')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'device' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'device' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'device' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            📱 Device Manager
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('network')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'network' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'network' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'network' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            🌐 Network Intercept
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('ai')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'ai' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'ai' ? 'var(--accent-purple)' : 'var(--text-primary)',
              borderColor: activeTab === 'ai' ? 'var(--accent-purple)' : 'transparent'
            }}
          >
            🤖 AI Copilot & RAG
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('workflows')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'workflows' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'workflows' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'workflows' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            🔄 Workflow DAG
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('deps')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'deps' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'deps' ? 'var(--accent-blue)' : 'var(--text-primary)',
              borderColor: activeTab === 'deps' ? 'var(--accent-blue)' : 'transparent'
            }}
          >
            📦 Dependencies
          </button>

          <button
            className="btn"
            onClick={() => setActiveTab('report')}
            style={{
              justifyContent: 'flex-start',
              backgroundColor: activeTab === 'report' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'report' ? 'var(--accent-green)' : 'var(--text-primary)',
              borderColor: activeTab === 'report' ? 'var(--accent-green)' : 'transparent'
            }}
          >
            📊 Report Exporter
          </button>
        </nav>

        {/* Workspace Dock Area */}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'graph' && <GraphExplorer graph={graph} />}
          {activeTab === 'editor' && <CodeEditor />}
          {activeTab === 'device' && <DeviceManager />}
          {activeTab === 'network' && <NetworkInspector />}
          {activeTab === 'ai' && <AiCopilot graph={graph} />}
          {activeTab === 'workflows' && <WorkflowBuilder graph={graph} />}
          {activeTab === 'deps' && <DependencyManagerView />}
          {activeTab === 'report' && <ReportViewer graph={graph} />}
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer
        style={{
          height: '24px',
          backgroundColor: '#090d13',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Ready</span>
          <span>SQLite Workspace: Active</span>
          <span>Knowledge Graph: 4 Nodes, 3 Edges</span>
        </div>
        <div>
          <span>OpenRev Platform • Apache-2.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
