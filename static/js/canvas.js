class PlayoutCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.currentTitle = "Awaiting Schedule...";
        this.currentTime = 0;
        this.animationId = null;
        this.colors = ['#1a2a6c', '#b21f1f', '#fdbb2d'];
    }
    
    setTitle(title) {
        this.currentTitle = title;
    }
    
    start() {
        if (!this.animationId) {
            this.renderLoop();
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    renderLoop() {
        this.currentTime += 0.02;
        this.draw();
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }
    
    draw() {
        // Background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        const shift = Math.sin(this.currentTime) * 0.5 + 0.5;
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, `rgba(20, ${Math.floor(shift*50)}, 50, 1)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Simulating some "video" motion
        this.ctx.beginPath();
        this.ctx.arc(this.width/2 + Math.cos(this.currentTime*2)*50, this.height/2 + Math.sin(this.currentTime*3)*30, 40, 0, Math.PI*2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
        this.ctx.fill();
        
        // Bug / Logo
        this.ctx.fillStyle = 'var(--accent-cyan)';
        this.ctx.font = '16px "JetBrains Mono"';
        this.ctx.fillText("AMAGI-1", 20, 30);
        
        // Title overlay
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Inter';
        this.ctx.fillText(this.currentTitle, 20, this.height - 40);
        
        // Ticker
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, this.height - 25, this.width, 25);
        this.ctx.fillStyle = 'var(--accent-green)';
        this.ctx.font = '14px "JetBrains Mono"';
        const tickerText = ">> UPCOMING: NEWS AT 11 >> MARKET CLOSES HIGHER >> WEATHER: STORMY";
        const xOffset = -(this.currentTime * 50) % (this.ctx.measureText(tickerText).width + 100);
        this.ctx.fillText(tickerText, this.width + xOffset, this.height - 8);
    }
}
