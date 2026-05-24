import React, { useState } from 'react';

export default function SmartPlanner({ catalog, schedule, setSchedule, targetDate, setTargetDate, onOptimize, simData }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const getAsset = (id) => catalog.find(a => a.id === id);

  // Get retention % for each item in the optimized schedule
  const getRetention = (index) => {
    if (!simData || !simData.retention_curve_after) return null;
    const val = simData.retention_curve_after[index];
    return val !== undefined ? val : null;
  };

  const retentionColor = (val) => {
    if (val >= 0.7) return 'var(--accent-emerald)';
    if (val >= 0.4) return 'var(--accent-cyan)';
    return 'var(--accent-magenta)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginBottom: '10px' }}>Timeline EPG</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Double-click library items to add, double-click timeline items to remove.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Playout Date (Seasonality)</label>
              <input 
                type="datetime-local" 
                value={targetDate.substring(0,16)} 
                onChange={(e) => setTargetDate(e.target.value + ':00Z')}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', 
                  color: 'white', padding: '8px', borderRadius: '4px', outline: 'none'
                }}
              />
            </div>
            <button onClick={onOptimize} style={{
              background: 'var(--accent-cyan)', color: 'black', fontWeight: 'bold', 
              padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}>
              Run AI Optimizer
            </button>
            <button 
              onClick={async () => {
                setIsLoadingRecs(true);
                try {
                  const res = await fetch('/api/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ schedule, target_date_iso: targetDate, region: 'US', top_n: 5 })
                  });
                  const data = await res.json();
                  setRecommendations(data);
                } catch (e) { console.error(e); }
                setIsLoadingRecs(false);
              }}
              disabled={isLoadingRecs}
              style={{
                background: 'var(--accent-magenta)', color: 'white', fontWeight: 'bold', 
                padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              {isLoadingRecs ? 'Thinking...' : 'AI Suggest Next'}
            </button>
          </div>
        </div>

        {/* Timeline Visualizer with Retention % */}
        <div style={{
          display: 'flex', gap: '10px', marginTop: '20px', padding: '15px', 
          background: 'rgba(0,0,0,0.4)', borderRadius: '8px', overflowX: 'auto', minHeight: '140px', alignItems: 'center'
        }}>
          {schedule.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', margin: 'auto' }}>Timeline is empty — double-click assets below to add</span>
          ) : (
            schedule.map((id, index) => {
              const asset = getAsset(id);
              if (!asset) return null;
              const retention = getRetention(index);
              return (
                <React.Fragment key={index}>
                  <div 
                    onDoubleClick={() => {
                      setSchedule(schedule.filter((_, i) => i !== index));
                    }}
                    style={{
                      minWidth: '170px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                      padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      position: 'relative', transition: '0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{asset.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.genre} • {Math.round(asset.duration_seconds/60)}m</div>
                    
                    {/* Retention Badge */}
                    {retention !== null && (
                      <div style={{
                        marginTop: '8px', padding: '4px 10px', borderRadius: '12px',
                        background: 'rgba(0,0,0,0.5)', display: 'inline-block',
                        fontSize: '0.85rem', fontWeight: 'bold',
                        color: retentionColor(retention),
                        border: `1px solid ${retentionColor(retention)}`
                      }}>
                        {(retention * 100).toFixed(1)}% ret.
                      </div>
                    )}
                  </div>
                  {index < schedule.length - 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '30px', height: '2px', background: 'var(--glass-border)' }}></div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>→</div>
                    </div>
                  )}
                </React.Fragment>
              )
            })
          )}
        </div>

        {/* Summary bar after optimization */}
        {simData && simData.delta_summary && (
          <div style={{
            display: 'flex', gap: '20px', marginTop: '15px', padding: '12px 20px',
            background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px',
            border: '1px solid rgba(0, 240, 255, 0.15)', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Optimization Result:</span>
            <div style={{ display: 'flex', gap: '25px' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                Watch Time {simData.delta_summary.watch_time_change}
              </span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                Revenue {simData.delta_summary.revenue_change}
              </span>
              <span style={{ color: 'var(--accent-magenta)', fontWeight: 'bold' }}>
                Retention {simData.delta_summary.retention_change}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendations Panel */}
      {recommendations && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h4 style={{ color: 'var(--accent-magenta)' }}>🤖 AI Recommendations</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{recommendations.context_summary} • {recommendations.total_candidates_scored} assets scored</span>
            </div>
            <button onClick={() => setRecommendations(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {recommendations.recommendations.map((rec, i) => (
              <div key={rec.asset_id} 
                onDoubleClick={() => { setSchedule([...schedule, rec.asset_id]); setRecommendations(null); }}
                style={{
                  minWidth: '220px', padding: '15px', borderRadius: '8px', cursor: 'pointer',
                  background: i === 0 ? 'rgba(255, 0, 102, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: i === 0 ? '1px solid var(--accent-magenta)' : '1px solid var(--glass-border)',
                  transition: '0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: i === 0 ? 'var(--accent-magenta)' : 'white' }}>#{i + 1}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{(rec.final_score * 100).toFixed(0)}%</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{rec.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{rec.genre} • {rec.rating} • {rec.duration_minutes}m</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', lineHeight: '1.3' }}>{rec.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <h3>Asset Library</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {catalog.map(asset => (
            <div 
              key={asset.id} 
              onDoubleClick={() => setSchedule([...schedule, asset.id])}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                padding: '12px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{asset.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                {asset.type} • {asset.genre}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '5px' }}>
                {Math.round(asset.duration_seconds / 60)}m | {asset.target_demo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
