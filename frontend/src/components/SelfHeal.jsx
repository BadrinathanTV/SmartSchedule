import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export default function SelfHeal({ schedule, setSchedule, addLog, targetDate, catalog }) {
  const [region, setRegion] = useState('US');
  const [qcData, setQcData] = useState(null);
  const [healLogs, setHealLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  const getAsset = (id) => catalog.find(a => a.id === id);

  const runQC = async () => {
    if (schedule.length === 0) return alert("Schedule is empty.");
    setIsScanning(true);
    try {
      const res = await fetch('/api/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, datetime: targetDate, region })
      });
      const data = await res.json();
      setQcData(data);
    } catch (e) {
      console.error(e);
    }
    setIsScanning(false);
  };

  const runHeal = async () => {
    if (schedule.length === 0) return;
    setIsHealing(true);
    addLog("Initiating Auto-Heal sequence...");
    try {
      const res = await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, datetime: targetDate, region })
      });
      const data = await res.json();
      setSchedule(data.healed_schedule);
      setHealLogs(data.changes_log || []);
      data.changes_log?.forEach(l => addLog(`[HEAL] ${l}`));
      
      // Re-run QC to show it's clean now
      const qcRes = await fetch('/api/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: data.healed_schedule, datetime: targetDate, region })
      });
      const qcDataNew = await qcRes.json();
      setQcData(qcDataNew);
      
    } catch (e) {
      console.error(e);
    }
    setIsHealing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'PASS') return 'var(--accent-emerald)';
    if (status === 'WARN') return 'var(--accent-cyan)'; // Yellow would be better but using cyan for now
    return 'var(--accent-magenta)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Top Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginBottom: '10px' }}>Compliance & QC Dashboard</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan schedule against license windows, ratings, and geo-restrictions.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Broadcast Region</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', 
                color: 'white', padding: '8px', borderRadius: '4px', outline: 'none'
              }}
            >
              <option value="US">US (North America)</option>
              <option value="EU">EU (Europe)</option>
              <option value="IN">IN (India)</option>
            </select>
          </div>
          <button 
            onClick={runQC} 
            disabled={isScanning}
            style={{
              background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontWeight: 'bold', 
              padding: '10px 20px', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            {isScanning ? 'Scanning...' : 'Run Full QC Scan'}
          </button>
          <button 
            onClick={runHeal} 
            disabled={isHealing || !qcData || qcData.status === 'PASS'}
            style={{
              background: (!qcData || qcData.status === 'PASS') ? 'rgba(255,255,255,0.05)' : 'var(--accent-magenta)', 
              color: (!qcData || qcData.status === 'PASS') ? 'var(--text-muted)' : 'white', 
              fontWeight: 'bold', padding: '10px 20px', border: 'none', borderRadius: '4px', 
              cursor: (!qcData || qcData.status === 'PASS') ? 'not-allowed' : 'pointer'
            }}
          >
            {isHealing ? 'Healing...' : 'Auto-Heal Violations'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* QC Results Panel */}
        <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '15px' }}>QC Scan Results</h4>
          
          {!qcData ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
              Run a scan to see compliance results.
            </div>
          ) : (
            <>
              {/* Summary Badges */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `3px solid ${getStatusColor(qcData.status)}` }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OVERALL STATUS</div>
                  <div style={{ fontWeight: 'bold', color: getStatusColor(qcData.status) }}>{qcData.status}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid var(--accent-magenta)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ERRORS</div>
                  <div style={{ fontWeight: 'bold' }}>{qcData.errors?.length || 0}</div>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WARNINGS</div>
                  <div style={{ fontWeight: 'bold' }}>{qcData.warnings?.length || 0}</div>
                </div>
              </div>

              {/* Per-Asset Drilldown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {qcData.asset_results && Object.entries(qcData.asset_results).map(([id, result], idx) => {
                  const asset = getAsset(id);
                  return (
                    <div key={`${id}-${idx}`} style={{ 
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '8px', padding: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>{asset ? asset.title : id}</span>
                        <span style={{ color: getStatusColor(result.status), fontWeight: 'bold', fontSize: '0.9rem' }}>{result.status}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {result.checks && Object.entries(result.checks).map(([checkName, checkResult]) => (
                          <div key={checkName} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem' }}>
                            {checkResult.status === 'PASS' && <CheckCircle size={14} color="var(--accent-emerald)" style={{ marginTop: '2px' }} />}
                            {checkResult.status === 'FAIL' && <XCircle size={14} color="var(--accent-magenta)" style={{ marginTop: '2px' }} />}
                            {checkResult.status === 'WARN' && <AlertTriangle size={14} color="var(--accent-cyan)" style={{ marginTop: '2px' }} />}
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>{checkName}: </span>
                              <span style={{ color: checkResult.status === 'PASS' ? 'white' : getStatusColor(checkResult.status) }}>
                                {checkResult.message}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {(!qcData.asset_results || Object.keys(qcData.asset_results).length === 0) && (
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                     {qcData.errors?.map((err, i) => <div key={i} style={{ color: 'var(--accent-magenta)' }}>✕ {err}</div>)}
                   </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Heal Action History */}
        <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '15px' }}>Auto-Heal Activity Log</h4>
          
          {healLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
              No recent heal actions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {healLogs.map((log, i) => (
                <div key={i} style={{ 
                  padding: '12px', background: 'rgba(0, 240, 255, 0.05)', 
                  borderLeft: '3px solid var(--accent-cyan)', borderRadius: '4px',
                  fontSize: '0.9rem', lineHeight: '1.4'
                }}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
