import React, { useState, useEffect } from 'react';

export default function LiveTrafficDashboard({ targetDate }) {
  const [audience, setAudience] = useState(null);
  const [history, setHistory] = useState([]);

  // Poll live audience every 3 seconds
  useEffect(() => {
    const fetchLive = () => {
      const dtParam = targetDate ? `?datetime=${encodeURIComponent(targetDate)}` : '';
      fetch(`/api/audience/live${dtParam}`)
        .then(r => r.json())
        .then(data => setAudience(data))
        .catch(() => {});
    };
    
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Fetch 24h history on mount
  useEffect(() => {
    const dtParam = targetDate ? `?datetime=${encodeURIComponent(targetDate)}&hours=24` : '?hours=24';
    fetch(`/api/audience/history${dtParam}`)
      .then(r => r.json())
      .then(data => setHistory(data))
      .catch(() => {});
  }, [targetDate]);

  if (!audience) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Connecting to Live Audience Simulator...
      </div>
    );
  }

  const ctx = audience.context;
  const maxDemand = Math.max(...Object.values(audience.genre_demand));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Context & Live Viewers Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        
        {/* Live Viewers */}
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>LIVE VIEWERS</div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-cyan)', letterSpacing: '2px' }}>
            {audience.live_viewers_formatted}
          </div>
          <div style={{ 
            marginTop: '10px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', width: `${audience.engagement_score}%`, 
              background: `linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))`,
              borderRadius: '3px', transition: 'width 1s ease'
            }}/>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
            Engagement: {audience.engagement_score}%
          </div>
        </div>

        {/* Current Context */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>CURRENT CONTEXT</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            {ctx.day} • {ctx.time_slot}
          </div>
          {ctx.is_festival && (
            <div style={{ 
              display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
              background: 'rgba(255, 0, 102, 0.15)', border: '1px solid var(--accent-magenta)',
              color: 'var(--accent-magenta)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px'
            }}>
              🎉 {ctx.festivals.join(', ')}
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>
            {ctx.programming_hint}
          </div>
        </div>

        {/* Viewership Multiplier */}
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>VIEWERSHIP MULTIPLIER</div>
          <div style={{ 
            fontSize: '3rem', fontWeight: 'bold',
            color: ctx.viewership_multiplier > 1.3 ? 'var(--accent-emerald)' : ctx.viewership_multiplier > 1.0 ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}>
            {ctx.viewership_multiplier}x
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            {ctx.is_weekend && <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(0,240,255,0.1)', color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>Weekend</span>}
            {ctx.is_festival && <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,0,102,0.1)', color: 'var(--accent-magenta)', fontSize: '0.75rem' }}>Festival</span>}
          </div>
        </div>
      </div>

      {/* Genre Demand Heatmap + Trending */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', flex: 1, minHeight: 0 }}>
        
        {/* Genre Demand Heatmap */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h4 style={{ marginBottom: '15px' }}>Genre Demand Heatmap (Live)</h4>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {Object.entries(audience.genre_demand).map(([genre, pct]) => (
              <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ width: '90px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>{genre}</span>
                <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%',
                    width: `${(pct / maxDemand) * 100}%`,
                    background: pct > 15 ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))' :
                                pct > 8 ? 'linear-gradient(90deg, rgba(0,240,255,0.4), rgba(0,240,255,0.7))' :
                                'rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    transition: 'width 1.5s ease'
                  }}/>
                  <span style={{ 
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.75rem', fontWeight: 'bold', color: 'white'
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending + 24h Sparkline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '12px' }}>🔥 Trending Now</h4>
            {audience.trending_genres.map((genre, i) => (
              <div key={genre} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                background: i === 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                borderRadius: '6px', marginBottom: '6px',
                border: i === 0 ? '1px solid rgba(0,240,255,0.3)' : '1px solid transparent'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-cyan)', width: '24px' }}>#{i + 1}</span>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{genre}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
                  {audience.genre_demand[genre]}%
                </span>
              </div>
            ))}
          </div>

          {/* 24h Mini Chart */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
            <h4 style={{ marginBottom: '12px' }}>24h Viewer Trend</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
              {history.map((h, i) => {
                const maxV = Math.max(...history.map(x => x.viewers), 1);
                const heightPct = (h.viewers / maxV) * 100;
                return (
                  <div key={i} title={`${h.hour}: ${h.viewers.toLocaleString()} viewers`} style={{
                    flex: 1, height: `${heightPct}%`, minHeight: '2px',
                    background: heightPct > 70 ? 'var(--accent-cyan)' : heightPct > 40 ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.2)',
                    borderRadius: '2px 2px 0 0', transition: 'height 0.5s ease'
                  }}/>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px' }}>
              <span>{history[0]?.hour || '00:00'}</span>
              <span>{history[history.length - 1]?.hour || '23:00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
