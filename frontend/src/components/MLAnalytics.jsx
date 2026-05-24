import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MLAnalytics({ simData, catalog }) {
  const [isRetraining, setIsRetraining] = useState(false);

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await fetch('/api/retrain', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert("Failed to retrain model.");
    }
    setIsRetraining(false);
  };

  if (!simData) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Run the AI Optimizer to generate Digital Twin ML Analytics.</p>
      </div>
    );
  }

  // Format data for Recharts safely
  const beforeCurve = simData.retention_curve_before || [];
  const afterCurve = simData.retention_curve_after || [];

  const chartData = beforeCurve.map((val, idx) => {
    const afterVal = afterCurve[idx];
    // Resolve actual show name from the optimized schedule
    const scheduleIds = simData._optimized_schedule || [];
    const assetId = scheduleIds[idx];
    const asset = assetId && catalog ? catalog.find(a => a.id === assetId) : null;
    const label = asset ? asset.title : `Slot ${idx + 1}`;
    // Truncate long names for the chart axis
    const shortLabel = label.length > 18 ? label.substring(0, 16) + '…' : label;
    return {
      step: shortLabel,
      Baseline: val * 100,
      Optimized: afterVal !== undefined ? afterVal * 100 : null
    };
  });

  const avgRet = afterCurve.length > 0 
    ? (afterCurve.reduce((a, b) => a + b, 0) / afterCurve.length) * 100 
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '100%' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '20px' }}>Audience Retention Curve</h3>
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="step" stroke="var(--text-muted)" />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" unit="%" />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Baseline" stroke="var(--accent-magenta)" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Optimized" stroke="var(--accent-emerald)" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4>Digital Twin Delta Performance</h4>
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Watch Time</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                {simData.delta_summary?.watch_time_change || "N/A"}
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ad Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                {simData.delta_summary?.revenue_change || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4>Expected Average Retention</h4>
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '10px' }}>
            {avgRet.toFixed(1)}%
          </div>
          
          <div style={{ marginTop: '30px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <h5 style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Autonomous Real-World Learning</h5>
            <button 
              onClick={handleRetrain} 
              disabled={isRetraining}
              style={{
                background: isRetraining ? 'grey' : 'var(--accent-magenta)',
                color: 'white', fontWeight: 'bold', padding: '12px 20px', 
                border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%'
              }}
            >
              {isRetraining ? "Training..." : "Retrain AI on Live SQLite Telemetry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
