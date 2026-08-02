import React, { useState } from 'react';
import type { AnalysisGraphEdge, AnalysisGraphNode } from '../types';

interface Props {
  nodes: AnalysisGraphNode[];
  edges: AnalysisGraphEdge[];
}

export const GraphExplorer: React.FC<Props> = ({ nodes, edges }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const connectedEdges = selectedId ? edges.filter((e) => e.source === selectedId || e.target === selectedId) : [];

  const badgeFor = (type: string) => {
    if (type === 'Activity') return 'badge-green';
    if (type === 'Permission') return 'badge-orange';
    if (type === 'Service') return 'badge-blue';
    if (type === 'Receiver') return 'badge-purple';
    if (type === 'Provider') return 'badge-purple';
    return 'badge-blue';
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Artifact Knowledge Graph</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Real nodes/edges from the analysis pipeline
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-blue">{nodes.length} Nodes</span>
            <span className="badge badge-purple">{edges.length} Edges</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {nodes.map((node) => {
            const isSelected = node.id === selectedId;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className={`badge ${badgeFor(node.type)}`}>{node.type}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {node.id}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {node.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {Object.entries(node.properties ?? {})
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(' • ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: '320px', backgroundColor: 'var(--bg-secondary)', padding: '16px', overflowY: 'auto' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
          Inspector Panel
        </h4>
        {selectedNode ? (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span className={`badge ${badgeFor(selectedNode.type)}`} style={{ marginBottom: '6px' }}>
                {selectedNode.type}
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{selectedNode.label}</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                ID: {selectedNode.id}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Properties
              </h5>
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <pre className="mono" style={{ fontSize: '11px', color: 'var(--accent-green)', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedNode.properties ?? {}, null, 2)}
                </pre>
              </div>
            </div>
            <div>
              <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Relationships ({connectedEdges.length})
              </h5>
              {connectedEdges.map((edge) => (
                <div
                  key={edge.id}
                  style={{
                    fontSize: '11px',
                    padding: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}
                >
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{edge.relationship}</span>:{' '}
                  {edge.source} → {edge.target}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
            Select a graph node to inspect its properties and edges.
          </div>
        )}
      </div>
    </div>
  );
};
