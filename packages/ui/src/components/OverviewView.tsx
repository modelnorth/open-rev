import React from 'react';
import type { AnalysisResult } from '../types';

export const OverviewView: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  const exported = new Set(analysis.exportedComponents);
  const badge = (name: string) =>
    exported.has(name) ? (
      <span className="badge badge-orange">exported</span>
    ) : (
      <span className="badge badge-gray">internal</span>
    );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {[
          ['Package', analysis.packageName],
          ['Version', analysis.versionName ?? String(analysis.versionCode)],
          ['Min SDK', analysis.minSdkVersion ?? '—'],
          ['Target SDK', analysis.targetSdkVersion ?? '—'],
          ['Activities', String(analysis.activities.length)],
          ['Services', String(analysis.services.length)],
          ['Permissions', String(analysis.permissions.length)],
          ['Exported', String(analysis.exportedComponents.length)]
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px'
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{k}</div>
            <div className="mono" style={{ fontSize: '13px', marginTop: '4px', wordBreak: 'break-all' }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Manifest — AndroidManifest.xml</h3>
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}
      >
        <pre className="mono" style={{ fontSize: '11px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {'<manifest package="' +
            analysis.packageName +
            '" versionCode="' +
            analysis.versionCode +
            '" />\n'}
          {'  <!-- permissions -->'}
        </pre>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Permissions ({analysis.permissions.length})</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        {analysis.permissions.map((p) => (
          <span key={p} className="badge badge-blue" style={{ padding: '6px 10px', fontSize: '11px' }}>
            {p}
          </span>
        ))}
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Activities ({analysis.activities.length})</h3>
      <div style={{ marginBottom: '20px' }}>
        {analysis.activities.map((a) => (
          <div
            key={a}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '12px'
            }}
          >
            <span>{a}</span>
            {badge(a)}
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Services / Receivers / Providers</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {[
          ['Services', analysis.services],
          ['Receivers', analysis.receivers],
          ['Providers', analysis.providers]
        ].map(([title, items]) => (
          <div key={title as string}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {title as string}
            </div>
            {((items as string[]) ?? []).map((n) => (
              <div key={n} style={{ fontSize: '11px', padding: '3px 0', borderBottom: '1px solid var(--border-color)' }}>
                {n}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
