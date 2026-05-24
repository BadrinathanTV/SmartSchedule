let timeline, canvas, terminal;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupTabs();
    startClock();
    
    timeline = new Timeline('timeline-container');
    canvas = new PlayoutCanvas('playout-canvas');
    terminal = new Terminal('terminal-log');
    
    canvas.start();
    terminal.log("SYSTEM BOOT: Amagi Smart Scheduler v1.0");
    terminal.log("Connecting to ad insertion servers... OK");
    
    // Simulate some logs
    setInterval(() => {
        if (Math.random() > 0.7 && timeline.schedule.length > 0) {
            terminal.log("SCTE-35: Out-of-network ad splice point detected.");
        }
    }, 5000);
    
    // Test API and load initial assets
    try {
        const assets = await api.fetchAssets();
        console.log("Loaded assets:", assets);
        timeline.setLibrary(assets);
        renderAssetLibrary(assets);
    } catch (e) {
        console.error("Failed to load assets:", e);
    }
    
    document.getElementById('btn-optimize').addEventListener('click', async () => {
        if (timeline.schedule.length < 2) {
            alert("Need at least 2 items to optimize.");
            return;
        }
        terminal.log("INITIATING AI OPTIMIZATION...");
        try {
            const originalSchedule = [...timeline.schedule];
            const data = await api.optimizeSchedule(timeline.schedule, {retention: 1, watch_time: 1, ad_revenue: 1});
            terminal.log(`Optimization complete! Utility improved from ${data.utility_before.toFixed(2)} to ${data.utility_after.toFixed(2)}`);
            if (data.reasoning_log) {
                data.reasoning_log.forEach(l => terminal.log("> " + l));
            }
            timeline.setSchedule(data.optimized_schedule);
            
            // Run Digital Twin Simulator Comparison
            const simData = await api.simulate(originalSchedule, data.optimized_schedule);
            
            // Render Retention SVG chart
            charts.renderRetentionCurve('analytics-chart-container', simData.retention_curve_before, simData.retention_curve_after);
            
            // Update UI Metric Cards
            document.getElementById('metric-watch-change').textContent = simData.delta_summary.watch_time_change;
            document.getElementById('metric-rev-change').textContent = simData.delta_summary.revenue_change;
            
            const avgRet = simData.retention_curve_after.reduce((a,b)=>a+b, 0) / simData.retention_curve_after.length;
            document.getElementById('metric-ret-rate').textContent = (avgRet * 100).toFixed(1) + "%";
            
            // update canvas title
            const firstAssetId = data.optimized_schedule[0];
            canvas.setTitle(timeline.assetsMap[firstAssetId].title);
            
        } catch (e) {
            console.error(e);
            terminal.log("ERROR: Optimization failed.");
        }
    });

    // Self-Healing & QC Compliance Event Listener
    document.getElementById('btn-run-heal').addEventListener('click', async () => {
        if (timeline.schedule.length === 0) {
            alert("Add assets to the timeline first.");
            return;
        }
        
        const region = document.getElementById('heal-region').value;
        const datetimeVal = document.getElementById('heal-datetime').value + ":00Z";
        
        terminal.log(`INITIATING COMPLIANCE QC & SELF-HEAL [Region: ${region} | Date: ${datetimeVal}]...`);
        
        try {
            // 1. Run QC compliance check
            const qcData = await fetch('/api/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: timeline.schedule })
            }).then(r => r.json());
            
            const qcContainer = document.getElementById('qc-alerts-container');
            qcContainer.innerHTML = '';
            
            if (qcData.status === "PASS") {
                qcContainer.innerHTML = '<span style="color: var(--accent-green);">✓ All compliance checks passed. Schedule is clean.</span>';
            } else {
                if (qcData.errors.length > 0) {
                    qcData.errors.forEach(err => {
                        qcContainer.innerHTML += `<div style="color: var(--accent-red); margin-bottom: 5px;">⚠ [CRITICAL ERROR] ${err}</div>`;
                    });
                }
                if (qcData.warnings.length > 0) {
                    qcData.warnings.forEach(warn => {
                        qcContainer.innerHTML += `<div style="color: var(--accent-orange); margin-bottom: 5px;">⚡ [WARNING] ${warn}</div>`;
                    });
                }
            }
            
            // 2. Run Self Healing
            const healData = await api.selfHeal(timeline.schedule, datetimeVal, region);
            const logsContainer = document.getElementById('heal-logs-container');
            logsContainer.innerHTML = '';
            
            if (healData.changes_log.length === 0) {
                logsContainer.innerHTML = '✓ No self-healing actions required. Schedule is 100% compliant.';
            } else {
                healData.changes_log.forEach(log => {
                    const logLine = `[REPLACE] Failed Asset: ${log.original_title} (${log.original_id}) -> Replaced by: ${log.replacement_title} (${log.replacement_id}) | Reason: ${log.reason} | Sim Score: ${log.similarity_score}\n`;
                    logsContainer.innerHTML += `<div>${logLine}</div>`;
                    terminal.log(`[SELF-HEAL] ${logLine}`);
                });
                
                // Update EPG with the self-healed schedule
                timeline.setSchedule(healData.healed_schedule);
            }
            
        } catch (e) {
            console.error(e);
            terminal.log("ERROR: Compliance & Self-heal check failed.");
        }
    });
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function startClock() {
    const clockEl = document.getElementById('system-clock');
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toISOString().substr(11, 8) + ' UTC';
    }, 1000);
}

function renderAssetLibrary(assets) {
    const list = document.getElementById('asset-library-list');
    if (!list) return;
    
    list.innerHTML = '';
    assets.forEach(asset => {
        const li = document.createElement('li');
        li.textContent = `${asset.title} [${asset.type}] - ${asset.genre} (${Math.floor(asset.duration_seconds / 60)}m)`;
        li.style.cursor = 'pointer';
        li.ondblclick = () => {
            timeline.addAsset(asset.id);
            terminal.log(`ADDED ASSET: ${asset.title}`);
            canvas.setTitle(asset.title);
        };
        list.appendChild(li);
    });
}
