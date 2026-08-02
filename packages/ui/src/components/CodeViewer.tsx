import React, { useState } from 'react';
import type { AnalysisResult } from '../types';

export const CodeViewer: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  const sources = analysis.sources;
  const [selectedPath, setSelectedPath] = useState<string | null>(sources[0]?.path ?? null);
  const selected = sources.find((s) => s.path === selectedPath) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Decompiled Sources</span>
          <span className="badge badge-green">{analysis.decompiledJavaCount ?? sources.length} Java files</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          decompiled by jadx ({analysis.decompileSource ?? 'n/a'})
        </span>
      </div>

      {sources.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
          No decompiled sources available{analysis.decompileNote ? ` — ${analysis.decompileNote}` : ''}.
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              width: '320px',
              borderRight: '1px solid var(--border-color)',
              overflowY: 'auto',
              padding: '8px',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {sources.map((s) => {
              const name = s.path.split('/').pop() ?? s.path;
              const isSel = s.path === selectedPath;
              return (
                <button
                  key={s.path}
                  className="btn"
                  onClick={() => setSelectedPath(s.path)}
                  style={{
                    display: 'block',
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontSize: '11px',
                    marginBottom: '4px',
                    backgroundColor: isSel ? 'var(--bg-tertiary)' : 'transparent',
                    color: isSel ? 'var(--accent-blue)' : 'var(--text-primary)'
                  }}
                >
                  ☕ {name}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {selected ? (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  {selected.path}
                </div>
                <pre
                  className="mono"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre',
                    overflow: 'auto'
                  }}
                >
                  {selected.code}
                </pre>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
