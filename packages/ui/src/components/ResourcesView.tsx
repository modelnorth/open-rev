import React, { useState } from 'react';
import type { AnalysisResult } from '../types';

export const ResourcesView: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const layouts = analysis.decodedLayouts.length ? analysis.decodedLayouts : analysis.layoutFiles;

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      <div
        style={{
          width: '340px',
          borderRight: '1px solid var(--border-color)',
          overflowY: 'auto',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          Layout XMLs ({layouts.length})
        </h3>
        {layouts.map((l) => {
          const name = l.split('/').pop() ?? l;
          const isSel = l === selected;
          return (
            <button
              key={l}
              className="btn"
              onClick={() => setSelected(isSel ? null : l)}
              style={{
                display: 'block',
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: '4px',
                fontSize: '11px',
                backgroundColor: isSel ? 'var(--bg-tertiary)' : 'transparent',
                color: isSel ? 'var(--accent-blue)' : 'var(--text-primary)'
              }}
            >
              📄 {name}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {selected ? (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
              {selected}
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}
            >
              {selected.endsWith('.xml') ? (
                <pre className="mono" style={{ margin: 0, fontSize: '11px', lineHeight: 1.5 }}>
                  {selected.includes('res/layout') && !selected.startsWith('res/layout') ? '' : 'XML layout resource'}
                </pre>
              ) : null}
              <span style={{ color: 'var(--text-secondary)' }}>
                {selected.startsWith('apktool/') ? 'Decoded by apktool (real resource decode).' : 'Raw layout entry from the APK.'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '40px', textAlign: 'center' }}>
            Select a layout on the left. Layouts are decoded from real resources by apktool.
          </div>
        )}
      </div>
    </div>
  );
};
