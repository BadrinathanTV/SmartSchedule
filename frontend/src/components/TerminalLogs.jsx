import React, { useRef, useEffect } from 'react';

export default function TerminalLogs({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 'bold' }}>
        Playout Server Logs
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-emerald)', whiteSpace: 'pre-wrap' }}>
        {logs.map((log, idx) => (
          <div key={idx} style={{ marginBottom: '4px' }}>{log}</div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
