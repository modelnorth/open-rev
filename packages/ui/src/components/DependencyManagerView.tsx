import React from 'react';
import { DependencyRegistry } from '@openrev/core';

export const DependencyManagerView: React.FC = () => {
  const registry = new DependencyRegistry();
  const dependencies = registry.listAll();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Managed Open-Source Dependency Registry</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Auto-discovers, verifies, installs, and manages external CLI tools isolated behind versioned adapters
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Running Health Checks across all tools...')}>
          ⚡ Run Health Checks
        </button>
      </div>

      {/* Dependencies Grid */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {dependencies.map((dep) => (
            <div
              key={dep.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{dep.name}</h4>
                  <span className="badge badge-green">v{dep.installedVersion}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {dep.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--accent-blue)' }}>
                  cmd: {dep.executableName}
                </span>
                <span className="badge badge-blue">{dep.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
