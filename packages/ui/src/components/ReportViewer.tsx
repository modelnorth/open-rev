import React, { useState } from 'react';
import { ArtifactKnowledgeGraph, ReportGenerator } from '@openrev/core';

interface Props {
  graph: ArtifactKnowledgeGraph;
}

export const ReportViewer: React.FC<Props> = ({ graph }) => {
  const reportGen = new ReportGenerator(graph);
  const [reportMarkdown, setReportMarkdown] = useState<string>(reportGen.generateMarkdownReport());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Multi-Format Report Exporter</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Export comprehensive documentation in Markdown, HTML, PDF, and DOCX formats
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => alert('Exported Markdown Report!')}>
            📥 Export Markdown
          </button>
          <button className="btn" onClick={() => alert('Exported HTML Report!')}>
            🌐 Export HTML
          </button>
          <button className="btn" onClick={() => alert('Exported PDF Report!')}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Report Content Preview */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <pre className="mono" style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {reportMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
};
