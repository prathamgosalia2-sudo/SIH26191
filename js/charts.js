/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Self-Contained High-Tech Vector Charting Engine (Pure SVG)
 */

window.DISASTER_CHARTS = (function() {
    /**
     * Render a Modern Multi-Factor Radar / Spider Chart
     */
    function renderRadarChart(containerId, factors, labels) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const w = container.clientWidth || 320;
        const h = container.clientHeight || 280;
        const cx = w / 2;
        const cy = h / 2 + 10;
        const radius = Math.min(cx, cy) - 45;

        const keys = Object.keys(factors);
        const numAxes = keys.length;
        const angleStep = (2 * Math.PI) / numAxes;

        let svgHtml = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

        // 1. Concentric reference polygons (20%, 40%, 60%, 80%, 100%)
        const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
        levels.forEach(lvl => {
            const points = [];
            for (let i = 0; i < numAxes; i++) {
                const angle = (i * angleStep) - (Math.PI / 2);
                const px = cx + (radius * lvl * Math.cos(angle));
                const py = cy + (radius * lvl * Math.sin(angle));
                points.push(`${px},${py}`);
            }
            svgHtml += `<polygon points="${points.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        });

        // 2. Axes lines and labels
        keys.forEach((k, i) => {
            const angle = (i * angleStep) - (Math.PI / 2);
            const ax = cx + (radius * Math.cos(angle));
            const ay = cy + (radius * Math.sin(angle));
            svgHtml += `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;

            // Axis Label
            const labelDist = radius + 22;
            const lx = cx + (labelDist * Math.cos(angle));
            const ly = cy + (labelDist * Math.sin(angle)) + 4;
            const labelText = labels[k] || k;
            const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');
            svgHtml += `<text x="${lx}" y="${ly}" fill="#94A3B8" font-size="9.5" font-family="sans-serif" text-anchor="${anchor}">${labelText}</text>`;
        });

        // 3. Data Polygon
        const dataPoints = [];
        keys.forEach((k, i) => {
            const val = Math.min(100, Math.max(0, factors[k] || 50)) / 100;
            const angle = (i * angleStep) - (Math.PI / 2);
            const px = cx + (radius * val * Math.cos(angle));
            const py = cy + (radius * val * Math.sin(angle));
            dataPoints.push(`${px},${py}`);
        });

        svgHtml += `<polygon points="${dataPoints.join(' ')}" fill="rgba(239, 68, 68, 0.35)" stroke="#EF4444" stroke-width="2.5"/>`;

        // 4. Data Points & Glow
        keys.forEach((k, i) => {
            const val = Math.min(100, Math.max(0, factors[k] || 50)) / 100;
            const angle = (i * angleStep) - (Math.PI / 2);
            const px = cx + (radius * val * Math.cos(angle));
            const py = cy + (radius * val * Math.sin(angle));
            svgHtml += `<circle cx="${px}" cy="${py}" r="4" fill="#FFFFFF" stroke="#EF4444" stroke-width="2"/>`;
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    /**
     * Render Comparative Bar Chart (Population at Risk vs Safe Carrying Capacity)
     */
    function renderCapacityComparisonBarChart(containerId, cellsList) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 260;
        const padding = { top: 25, right: 30, bottom: 45, left: 60 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;

        // Take top 7 vulnerable cells
        const data = (cellsList || []).slice(0, 7);
        if (data.length === 0) return;

        const maxVal = Math.max(...data.map(d => Math.max(d.population, d.carryingCapacity || 10000)), 45000);

        let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

        // Grid lines
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
            const yVal = (maxVal / ticks) * i;
            const yPos = padding.top + plotH - (plotH * (i / ticks));
            svg += `<line x1="${padding.left}" y1="${yPos}" x2="${w - padding.right}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
            svg += `<text x="${padding.left - 8}" y="${yPos + 4}" fill="#64748B" font-size="9" text-anchor="end">${(yVal / 1000).toFixed(0)}k</text>`;
        }

        const groupWidth = plotW / data.length;
        const barWidth = Math.min(22, groupWidth * 0.35);

        data.forEach((d, idx) => {
            const gx = padding.left + (idx * groupWidth) + (groupWidth / 2);

            // Pop at Risk Bar (Red / Amber)
            const popH = (d.population / maxVal) * plotH;
            const popY = padding.top + plotH - popH;
            svg += `<rect x="${gx - barWidth - 2}" y="${popY}" width="${barWidth}" height="${popH}" rx="3" fill="#EF4444" opacity="0.9">
                <title>${d.name}: Population ${d.population.toLocaleString()}</title>
            </rect>`;

            // Safe Capacity Bar (Emerald Green)
            const capH = (Math.max(0, d.carryingCapacity) / maxVal) * plotH;
            const capY = padding.top + plotH - capH;
            svg += `<rect x="${gx + 2}" y="${capY}" width="${barWidth}" height="${capH}" rx="3" fill="#10B981" opacity="0.9">
                <title>${d.name}: Safe Capacity ${d.carryingCapacity.toLocaleString()}</title>
            </rect>`;

            // Label
            const shortName = d.name.split(' ')[0];
            svg += `<text x="${gx}" y="${h - padding.bottom + 16}" fill="#94A3B8" font-size="10" text-anchor="middle">${shortName}</text>`;
        });

        // Legend
        svg += `
            <g transform="translate(${w - 240}, 10)">
                <rect x="0" y="0" width="10" height="10" rx="2" fill="#EF4444" />
                <text x="15" y="9" fill="#CBD5E1" font-size="10">Population at Risk</text>
                <rect x="120" y="0" width="10" height="10" rx="2" fill="#10B981" />
                <text x="135" y="9" fill="#CBD5E1" font-size="10">Safe Capacity</text>
            </g>
        `;

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    /**
     * Render Historical Disasters Timeline Trend Area Chart
     */
    function renderHistoricalTrendChart(containerId, disasterRecords) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const w = container.clientWidth || 550;
        const h = container.clientHeight || 240;
        const padding = { top: 25, right: 30, bottom: 40, left: 60 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;

        const data = [...disasterRecords].reverse(); // Ascending by year
        const maxPop = Math.max(...data.map(d => d.affectedPopulation), 350000);

        let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

        // Background Gradient
        svg += `
            <defs>
                <linearGradient id="hist-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
        `;

        // Grid lines
        for (let i = 0; i <= 4; i++) {
            const val = (maxPop / 4) * i;
            const y = padding.top + plotH - (plotH * (i / 4));
            svg += `<line x1="${padding.left}" y1="${y}" x2="${w - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
            svg += `<text x="${padding.left - 8}" y="${y + 3}" fill="#64748B" font-size="9" text-anchor="end">${(val / 1000).toFixed(0)}k</text>`;
        }

        // Generate Area & Line path points
        const points = data.map((d, i) => {
            const x = padding.left + (plotW / (data.length - 1)) * i;
            const y = padding.top + plotH - ((d.affectedPopulation / maxPop) * plotH);
            return { x, y, data: d };
        });

        // Area polygon
        const areaPoints = [`${padding.left},${padding.top + plotH}`, ...points.map(p => `${p.x},${p.y}`), `${points[points.length - 1].x},${padding.top + plotH}`];
        svg += `<polygon points="${areaPoints.join(' ')}" fill="url(#hist-grad)"/>`;

        // Line
        const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
        svg += `<polyline points="${linePoints}" fill="none" stroke="#38BDF8" stroke-width="2.5"/>`;

        // Data nodes and labels
        points.forEach(p => {
            svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5"/>`;
            svg += `<text x="${p.x}" y="${h - padding.bottom + 18}" fill="#94A3B8" font-size="10" text-anchor="middle">${p.data.year}</text>`;
            svg += `<text x="${p.x}" y="${p.y - 10}" fill="#E2E8F0" font-size="10" font-weight="600" text-anchor="middle">${(p.data.affectedPopulation / 1000).toFixed(0)}k</text>`;
        });

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    return {
        renderRadarChart,
        renderCapacityComparisonBarChart,
        renderHistoricalTrendChart
    };
})();
