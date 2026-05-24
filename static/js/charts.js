const charts = {
    renderRetentionCurve(containerId, beforeCurve, afterCurve) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        
        const width = container.clientWidth || 600;
        const height = 200;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Draw baseline
        const base = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        base.setAttribute('x1', 0);
        base.setAttribute('y1', height - 20);
        base.setAttribute('x2', width);
        base.setAttribute('y2', height - 20);
        base.setAttribute('stroke', '#333');
        svg.appendChild(base);
        
        function drawCurve(data, color, isDashed=false) {
            if (!data || data.length === 0) return;
            let pathD = `M 0 ${height - 20 - (data[0] * (height - 40))}`;
            const step = width / Math.max(1, data.length - 1);
            for (let i = 1; i < data.length; i++) {
                pathD += ` L ${i * step} ${height - 20 - (data[i] * (height - 40))}`;
            }
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '3');
            if (isDashed) path.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(path);
        }
        
        if (beforeCurve) drawCurve(beforeCurve, 'var(--accent-red)', true);
        if (afterCurve) drawCurve(afterCurve, 'var(--accent-green)');
        
        container.appendChild(svg);
    }
};
