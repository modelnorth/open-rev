import React, { useState } from 'react';

export const DeviceManager: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([
    '[ADB] Connected to device: emulator-5554 (Android 14 API 34)',
    '[Logcat] I/ActivityTaskManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] cmp=com.example.sampleapp/.MainActivity}',
    '[Logcat] D/OkHttp: --> POST https://api.example.com/api/v1/auth/login http/1.1',
    '[Logcat] D/OkHttp: Content-Type: application/json; charset=utf-8',
    '[Logcat] D/OkHttp: --> END POST (54-byte body)',
    '[Logcat] D/OkHttp: <-- 200 OK https://api.example.com/api/v1/auth/login (180ms)'
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Device Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-green">● Connected</span>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>emulator-5554 (x86_64)</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Android 14 (API 34)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn">📸 Screenshot</button>
          <button className="btn">🎥 Record Screen</button>
          <button className="btn">📦 Install APK</button>
          <button className="btn btn-primary">⚡ Shell Terminal</button>
        </div>
      </div>

      {/* Logcat Stream Console */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#090d13' }}>
        <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Live Logcat Stream
        </div>
        {logs.map((log, index) => (
          <div key={index} className="mono" style={{ fontSize: '11px', color: log.includes('OkHttp') ? 'var(--accent-blue)' : 'var(--text-primary)', marginBottom: '4px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
