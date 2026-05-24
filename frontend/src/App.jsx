import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarClock, LineChart, ShieldAlert, Activity } from 'lucide-react';
import SmartPlanner from './components/SmartPlanner';
import MLAnalytics from './components/MLAnalytics';
import SelfHeal from './components/SelfHeal';
import LivePlayoutCanvas from './components/LivePlayoutCanvas';
import TerminalLogs from './components/TerminalLogs';
import LiveTrafficDashboard from './components/LiveTrafficDashboard';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('planner');
  const [catalog, setCatalog] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [targetDate, setTargetDate] = useState('2025-05-15T12:00:00Z');
  const [logs, setLogs] = useState(['[SYSTEM] Amagi Smart Scheduler React v2.0 Initialized']);
  const [simData, setSimData] = useState(null);
  
  const addLog = (msg) => {
    const time = new Date().toISOString().substring(11, 19);
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => addLog(`[ERROR] Failed to fetch catalog: ${err.message}`));
  }, []);

  const handleOptimize = async () => {
    if (schedule.length < 2) return alert("Add at least 2 items.");
    addLog("INITIATING AI OPTIMIZATION (Seasonality Aware)...");
    
    try {
      const originalSchedule = [...schedule];
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, target_date_iso: targetDate })
      });
      const data = await res.json();
      
      const uBefore = data.utility_before ?? 0;
      const uAfter = data.utility_after ?? 0;
      
      addLog(`Optimization complete! Utility improved from ${uBefore.toFixed(2)} to ${uAfter.toFixed(2)}`);
      data.reasoning_log?.forEach(l => addLog("> " + l));
      setSchedule(data.optimized_schedule || []);
      
      // Simulate for analytics
      const simRes = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schedule_before: originalSchedule, 
          schedule_after: data.optimized_schedule,
          target_date_iso: targetDate
        })
      });
      const simulation = await simRes.json();
      // Attach schedule IDs to simData so other components can resolve names
      simulation._optimized_schedule = data.optimized_schedule;
      simulation._original_schedule = originalSchedule;
      setSimData(simulation);
    } catch (e) {
      addLog(`[ERROR] Optimization failed: ${e.message}`);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'planner', label: 'Smart Planner', icon: <CalendarClock size={18} /> },
    { id: 'traffic', label: 'Live Traffic', icon: <Activity size={18} /> },
    { id: 'analytics', label: 'ML Analytics', icon: <LineChart size={18} /> },
    { id: 'selfheal', label: 'Self-Heal', icon: <ShieldAlert size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)', borderRadius: 0 }}>
        <h1 style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem', marginBottom: '40px', letterSpacing: '1px' }}>AMAGI MCR</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 15px', borderRadius: '8px', border: 'none',
                background: activeTab === item.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                color: activeTab === item.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: '0.3s'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div className="glass-panel" style={{ padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Control Room Dashboard</h2>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
            <span>● LIVE PLAYOUT ONLINE</span>
            <span>● AI OPTIMIZER READY</span>
          </div>
        </div>

        {/* Dynamic View */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '100%' }}>
               <LivePlayoutCanvas schedule={schedule} catalog={catalog} />
               <TerminalLogs logs={logs} />
            </div>
          )}
          {activeTab === 'planner' && (
            <SmartPlanner 
              catalog={catalog} 
              schedule={schedule} 
              setSchedule={setSchedule} 
              targetDate={targetDate} 
              setTargetDate={setTargetDate}
              onOptimize={handleOptimize}
              simData={simData}
            />
          )}
          {activeTab === 'traffic' && (
            <LiveTrafficDashboard targetDate={targetDate} />
          )}
          {activeTab === 'analytics' && (
            <MLAnalytics simData={simData} catalog={catalog} />
          )}
          {activeTab === 'selfheal' && (
            <SelfHeal schedule={schedule} setSchedule={setSchedule} addLog={addLog} targetDate={targetDate} catalog={catalog} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
