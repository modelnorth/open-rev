import React from 'react';
import type { AnalysisProgress } from '../types';

interface Props {
  progress: AnalysisProgress;
  onCancel?: () => void;
}

export const LoadingScreen: React.FC<Props> = ({ progress, onCancel }) => {
  const indeterminate = progress.percent === undefined;
  const percent = progress.percent ?? 0;
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
      <div style={{ width: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '34px', marginBottom: '8px' }}>⚡</div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent-blue)' }}>OpenRev</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Analyzing APK — real pipeline (decode → graph → decompile)
          </div>
        </div>

        <div
          className={indeterminate ? 'progress-indeterminate' : ''}
          style={{
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'var(--bg-tertiary)',
            overflow: 'hidden',
            marginBottom: '12px'
          }}
        >
          {!indeterminate && (
            <div
              style={{
                height: '100%',
                width: `${percent}%`,
                backgroundColor: 'var(--accent-blue)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {progress.stage ?? 'working…'}
          </span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {indeterminate ? '…' : `${percent}%`}
          </span>
        </div>

        {onCancel && (
          <button className="btn" onClick={onCancel} style={{ width: '100%', marginTop: '16px' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
