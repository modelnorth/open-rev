import React from 'react';

interface Props {
  error: string;
  onRetry: () => void;
}

export const CrashScreen: React.FC<Props> = ({ error, onRetry }) => {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div style={{ maxWidth: '520px', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '18px', color: 'var(--accent-red, #e06c6c)', marginBottom: '8px' }}>
          Analysis failed
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          The error has been reported. You can retry, or load the bundled sample for the web preview.
        </p>
        <pre
          className="mono"
          style={{
            fontSize: '11px',
            color: '#e8a3a3',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px',
            borderRadius: '6px',
            overflow: 'auto',
            maxHeight: '160px',
            textAlign: 'left',
            border: '1px solid var(--border-color)'
          }}
        >
          {error}
        </pre>
        <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    </div>
  );
};
