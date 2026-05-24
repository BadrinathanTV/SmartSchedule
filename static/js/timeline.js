class Timeline {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.schedule = []; 
        this.assetsMap = {}; 
        this.predictions = [];
    }
    
    setLibrary(assets) {
        assets.forEach(a => this.assetsMap[a.id] = a);
    }
    
    addAsset(assetId) {
        this.schedule.push(assetId);
        this.updatePredictions();
    }
    
    removeAsset(index) {
        this.schedule.splice(index, 1);
        this.updatePredictions();
    }
    
    setSchedule(newSchedule) {
        this.schedule = newSchedule;
        this.updatePredictions();
    }

    async updatePredictions() {
        if (this.schedule.length === 0) {
            this.predictions = [];
            this.render();
            return;
        }
        try {
            const data = await api.predictTransitions(this.schedule);
            this.predictions = data.predictions;
            this.render();
        } catch (e) {
            console.error("Predict error", e);
        }
    }
    
    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        if (this.schedule.length === 0) {
            this.container.innerHTML = '<span style="color: var(--text-muted)">Timeline is empty. Double-click library items to add.</span>';
            return;
        }
        
        const track = document.createElement('div');
        track.className = 'timeline-track';
        track.style.display = 'flex';
        track.style.overflowX = 'auto';
        track.style.padding = '10px 0';
        track.style.gap = '15px';
        track.style.alignItems = 'center';
        
        this.schedule.forEach((assetId, i) => {
            const asset = this.assetsMap[assetId];
            if (!asset) return;
            
            const block = document.createElement('div');
            block.className = 'timeline-block';
            block.style.background = 'var(--bg-card)';
            block.style.border = '1px solid var(--border-glow)';
            block.style.padding = '10px 15px';
            block.style.borderRadius = '5px';
            block.style.minWidth = '120px';
            block.style.textAlign = 'center';
            block.style.cursor = 'pointer';
            
            block.innerHTML = `<strong>${asset.title}</strong><br><small style="color: var(--text-muted)">${asset.genre}</small>`;
            block.ondblclick = () => this.removeAsset(i);
            
            track.appendChild(block);
            
            if (i < this.schedule.length - 1 && this.predictions) {
                const pred = this.predictions[i+1];
                if (pred) {
                    const node = document.createElement('div');
                    node.className = 'risk-node';
                    node.style.minWidth = '40px';
                    node.style.height = '40px';
                    node.style.borderRadius = '50%';
                    node.style.display = 'flex';
                    node.style.alignItems = 'center';
                    node.style.justifyContent = 'center';
                    node.style.fontSize = '0.8rem';
                    node.style.fontWeight = 'bold';
                    node.style.cursor = 'pointer';
                    node.title = `Sim: ${pred.features.embedding_similarity} | Fatigue: ${pred.features.genre_fatigue}`;
                    
                    const drop = pred.drop_off_probability * 100;
                    node.textContent = Math.round(drop) + '%';
                    
                    if (drop < 20) {
                        node.style.background = 'rgba(57, 255, 20, 0.2)';
                        node.style.border = '2px solid var(--accent-green)';
                        node.style.color = 'var(--accent-green)';
                    } else if (drop < 40) {
                        node.style.background = 'rgba(255, 140, 0, 0.2)';
                        node.style.border = '2px solid var(--accent-orange)';
                        node.style.color = 'var(--accent-orange)';
                    } else {
                        node.style.background = 'rgba(255, 0, 60, 0.2)';
                        node.style.border = '2px solid var(--accent-red)';
                        node.style.color = 'var(--accent-red)';
                    }
                    
                    track.appendChild(node);
                }
            }
        });
        
        this.container.appendChild(track);
    }
}
