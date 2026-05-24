import React, { useRef, useEffect, useState } from 'react';

export default function LivePlayoutCanvas({ schedule, catalog }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);

  // Simulate Audience Telemetry Heartbeat
  useEffect(() => {
    if (schedule.length === 0) return;
    const interval = setInterval(() => {
      const currentAssetId = schedule[0];
      // Random retention between 60% and 95%
      const retention = (60 + Math.random() * 35) / 100;
      fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: currentAssetId, watched_percentage: retention })
      }).catch(err => console.error(err));
    }, 5000); // every 5 seconds
    
    return () => clearInterval(interval);
  }, [schedule]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background noise/gradient
      const time = Date.now() / 1000;
      const x = Math.sin(time) * 20;
      const y = Math.cos(time * 0.8) * 20;
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#1a1c2c');
      grad.addColorStop(1, '#0b0c16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Simulated visual element
      ctx.beginPath();
      ctx.arc(canvas.width/2 + x, canvas.height/2 + y, 50, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      
      // Title
      const currentAssetId = schedule.length > 0 ? schedule[0] : null;
      const asset = currentAssetId ? catalog.find(a => a.id === currentAssetId) : null;
      const title = asset ? asset.title : 'Awaiting Schedule...';
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.fillText(title, 40, canvas.height - 80);
      
      // Bug/Logo
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillText("AMAGI-1", 40, 50);

      // Ticker
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      ctx.fillStyle = 'var(--accent-magenta)';
      ctx.font = '16px monospace';
      const tickerText = ">> UPCOMING: NEWS AT 11 >> MARKET CLOSES HIGHER >> WEATHER UPDATE NEXT >>";
      const scrollPos = -(frame % (ctx.measureText(tickerText).width + 100));
      ctx.fillText(tickerText + " " + tickerText, scrollPos + canvas.width, canvas.height - 15);

      setFrame(f => f + 1);
      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationId);
  }, [schedule, catalog, frame]);

  return (
    <div className="glass-panel" style={{ height: '100%', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={450} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
