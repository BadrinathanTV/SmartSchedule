class Terminal {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.logs = [];
    }
    
    log(msg) {
        if (!this.container) return;
        
        const now = new Date();
        const timeStr = now.toISOString().substr(11, 8);
        const logLine = `[${timeStr}] ${msg}`;
        
        this.logs.push(logLine);
        if (this.logs.length > 100) this.logs.shift();
        
        const div = document.createElement('div');
        div.textContent = logLine;
        this.container.appendChild(div);
        
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    clear() {
        this.logs = [];
        if (this.container) this.container.innerHTML = '';
    }
}
