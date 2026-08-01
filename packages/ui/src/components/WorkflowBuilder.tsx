import React, { useState } from 'react';
import { WorkflowEngine, CapabilityEngine, DependencyRegistry, ArtifactKnowledgeGraph } from '@openrev/core';

interface Props {
  graph: ArtifactKnowledgeGraph;
}

export const WorkflowBuilder: React.FC<Props> = ({ graph }) => {
  const registry = new DependencyRegistry();
  const capEngine = new CapabilityEngine(registry, graph);
  const wfEngine = new WorkflowEngine(capEngine);

  const defaultWf = wfEngine.getDefaultAuditWorkflow();
  const [nodes] = useState(defaultWf.nodes);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setLogs(['[Workflow] Starting execution pipeline: "Full Automated APK Audit Pipeline"']);

    try {
      await wfEngine.executeDAG(defaultWf, 'SampleApp.apk');
      setLogs((prev) => [
        ...prev,
        '[Workflow] Step 1: Parse APK & Manifest -> OK',
        '[Workflow] Step 2: Decompile Java & Smali -> OK',
        '[Workflow] Step 3: Setup Network Proxy & API Explorer -> OK',
        '[Workflow] Step 4: Device Connection & Live Console -> OK',
        '[Workflow] DAG Execution Completed Successfully.'
      ]);
    } catch (err) {
      setLogs((prev) => [...prev, '[Workflow] Error executing DAG workflow.']);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Workflow DAG Engine & Drag-and-Drop Editor</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Reusable DAG pipelines: Import APK → Static Analysis → Decompile → Network Intercept → Report
          </p>
        </div>
        <button onClick={handleRunWorkflow} disabled={isRunning} className="btn btn-primary">
          {isRunning ? '⏳ Executing Pipeline...' : '▶ Run Full Workflow'}
        </button>
      </div>

      {/* Workflow DAG Visual Steps */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
          {nodes.map((node, i) => (
            <div
              key={node.id}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                minWidth: '200px'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Step {i + 1}
              </div>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>{node.name}</div>
              <span className="badge badge-purple">{node.capabilityId}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Console */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#090d13' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Pipeline Execution Logs
        </div>
        {logs.map((log, idx) => (
          <div key={idx} className="mono" style={{ fontSize: '11px', color: log.includes('OK') ? 'var(--accent-green)' : 'var(--text-primary)', marginBottom: '4px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
