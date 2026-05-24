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
            const data = await api.optimizeSchedule(timeline.schedule, {retention: 1, watch_time: 1, ad_revenue: 1});
            terminal.log(`Optimization complete! Utility improved from ${data.utility_before.toFixed(2)} to ${data.utility_after.toFixed(2)}`);
            if (data.reasoning_log) {
                data.reasoning_log.forEach(l => terminal.log("> " + l));
            }
            timeline.setSchedule(data.optimized_schedule);
            
            // update canvas title
            const firstAssetId = data.optimized_schedule[0];
            canvas.setTitle(timeline.assetsMap[firstAssetId].title);
            
        } catch (e) {
            console.error(e);
            terminal.log("ERROR: Optimization failed.");
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
