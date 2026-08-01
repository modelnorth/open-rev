import React, { useState } from 'react';

export const NetworkInspector: React.FC = () => {
  const [requests] = useState([
    { id: 1, method: 'POST', url: 'https://api.example.com/api/v1/auth/login', status: 200, time: '180 ms', type: 'REST' },
    { id: 2, method: 'GET', url: 'https://api.example.com/api/v1/user/profile', status: 200, time: '45 ms', type: 'REST' },
    { id: 3, method: 'POST', url: 'https://api.example.com/graphql', status: 200, time: '95 ms', type: 'GraphQL' },
    { id: 4, method: 'GET', url: 'wss://realtime.example.com/ws', status: 101, time: 'Live', type: 'WebSocket' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Network Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-purple">mitmproxy</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Proxy listening on 127.0.0.1:8080</span>
        </div>
        <div>
          <button className="btn">💾 Export HAR</button>
        </div>
      </div>

      {/* Requests Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px' }}>Method</th>
              <th style={{ padding: '8px' }}>URL / Endpoint</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Latency</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px' }}>
                  <span className={`badge ${req.method === 'POST' ? 'badge-blue' : 'badge-green'}`}>{req.method}</span>
                </td>
                <td className="mono" style={{ padding: '8px', color: 'var(--accent-blue)' }}>{req.url}</td>
                <td style={{ padding: '8px' }}>
                  <span className="badge badge-purple">{req.type}</span>
                </td>
                <td style={{ padding: '8px', color: 'var(--accent-green)', fontWeight: 600 }}>{req.status}</td>
                <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{req.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
