import React from 'react';
import type { AnalysisResult } from '../types';

export const ReportViewer: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Analysis Report</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Generated from real analysis data (graph, manifest, decompile)
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigator.clipboard?.writeText(analysis.reportMarkdown)}
        >
          📋 Copy Markdown
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}
        >
          <pre className="mono" style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {analysis.reportMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
};
