/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * High-Performance Tactical Vector GIS Map Engine with Uber H3 Hexagonal Grid
 */

window.GIS_MAP = (function() {
    let container = null;
    let svg = null;
    let width = 0;
    let height = 0;

    // Geographic viewport bounds (Brahmaputra Basin - Sector Alpha)
    // Approx lat: 26.07 to 26.28, lng: 91.52 to 91.98
    const geoBounds = {
        minLat: 26.07,
        maxLat: 26.28,
        minLng: 91.52,
        maxLng: 91.98
    };

    // Pan & Zoom state
    let zoomLevel = 1.0;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Active visual layers state
    const layers = {
        h3Grid: true,
        riverInundation: true,
        roadNetwork: true,
        evacuationRoutes: true,
        resources: true,
        relocationArcs: true
    };

    let basemapMode = 'tactical'; // 'tactical', 'satellite', 'elevation'
    let selectedCellId = null;
    let activePage = 'overview';
    let onCellSelectedCallback = null;

    /**
     * Convert Geo Coordinates (Lat, Lng) to Screen SVG Coordinates (X, Y)
     */
    function geoToScreen(lat, lng) {
        // Mercator-like planar projection for localized sector
        const xNorm = (lng - geoBounds.minLng) / (geoBounds.maxLng - geoBounds.minLng);
        // Invert Y because latitude increases northward while SVG Y increases downward
        const yNorm = 1 - ((lat - geoBounds.minLat) / (geoBounds.maxLat - geoBounds.minLat));

        const baseWidth = width || 1000;
        const baseHeight = height || 700;

        // Apply pan and zoom
        const x = (xNorm * baseWidth * zoomLevel) + panX;
        const y = (yNorm * baseHeight * zoomLevel) + panY;

        return { x, y };
    }

    /**
     * Convert Screen SVG coordinates back to Geo Coordinates (Lat, Lng)
     */
    function screenToGeo(screenX, screenY) {
        const baseWidth = width || 1000;
        const baseHeight = height || 700;

        const xNorm = (screenX - panX) / (baseWidth * zoomLevel);
        const yNorm = (screenY - panY) / (baseHeight * zoomLevel);

        const lng = geoBounds.minLng + xNorm * (geoBounds.maxLng - geoBounds.minLng);
        const lat = geoBounds.minLat + (1 - yNorm) * (geoBounds.maxLat - geoBounds.minLat);

        return { lat, lng };
    }

    /**
     * Initialize Map in container
     */
    function init(containerElement, onCellSelected) {
        container = containerElement;
        onCellSelectedCallback = onCellSelected;
        container.innerHTML = '';

        // Create main SVG canvas
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'tactical-gis-svg');
        svg.setAttribute('class', 'gis-canvas');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.userSelect = 'none';
        container.appendChild(svg);

        updateDimensions();
        setupInteractions();
        render();

        window.addEventListener('resize', () => {
            updateDimensions();
            render();
        });
    }

    function updateDimensions() {
        if (!container) return;
        width = container.clientWidth || 1000;
        height = container.clientHeight || 700;
        if (svg) {
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
    }

    /**
     * Setup Pan, Drag, and Zoom interactions
     */
    function setupInteractions() {
        if (!container) return;

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.map-control-btn') || e.target.closest('.map-hud-panel')) return;
            isDragging = true;
            dragStartX = e.clientX - panX;
            dragStartY = e.clientY - panY;
            container.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - dragStartX;
            panY = e.clientY - dragStartY;
            render();
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            if (container) container.style.cursor = 'default';
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.min(3.5, Math.max(0.7, zoomLevel * zoomDelta));

            // Zoom centered at mouse cursor
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            panX = mouseX - (mouseX - panX) * (newZoom / zoomLevel);
            panY = mouseY - (mouseY - panY) * (newZoom / zoomLevel);
            zoomLevel = newZoom;

            render();
        }, { passive: false });
    }

    /**
     * Zoom In Button Action
     */
    function zoomIn() {
        const newZoom = Math.min(3.5, zoomLevel * 1.25);
        panX = (width / 2) - ((width / 2) - panX) * (newZoom / zoomLevel);
        panY = (height / 2) - ((height / 2) - panY) * (newZoom / zoomLevel);
        zoomLevel = newZoom;
        render();
    }

    /**
     * Zoom Out Button Action
     */
    function zoomOut() {
        const newZoom = Math.max(0.7, zoomLevel * 0.8);
        panX = (width / 2) - ((width / 2) - panX) * (newZoom / zoomLevel);
        panY = (height / 2) - ((height / 2) - panY) * (newZoom / zoomLevel);
        zoomLevel = newZoom;
        render();
    }

    /**
     * Reset View to default center
     */
    function resetView() {
        zoomLevel = 1.05;
        panX = 0;
        panY = 0;
        render();
    }

    /**
     * Toggle individual map layers
     */
    function toggleLayer(layerKey, isVisible) {
        if (layers[layerKey] !== undefined) {
            layers[layerKey] = isVisible;
            render();
        }
    }

    /**
     * Switch Basemap Style
     */
    function setBasemap(mode) {
        basemapMode = mode;
        render();
    }

    /**
     * Set active page context
     */
    function setActivePage(page) {
        activePage = page;
        render();
    }

    /**
     * Select a cell programmatically
     */
    function selectCell(cellId) {
        selectedCellId = cellId;
        render();
        if (onCellSelectedCallback) {
            const cell = (window.DISASTER_DATA.h3Cells || []).find(c => c.id === cellId);
            if (cell) onCellSelectedCallback(cell);
        }
    }

    /**
     * Main Render Loop: Draws all tactical SVG layers
     */
    function render() {
        if (!svg) return;
        svg.innerHTML = '';

        // 1. Defs & Filters (Glow effects, gradients, patterns)
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <!-- Grid Pattern -->
            <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" stroke-width="1"/>
            </pattern>
            <!-- Water Wave Gradient -->
            <linearGradient id="river-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0284c7" stop-opacity="0.85"/>
                <stop offset="50%" stop-color="#0369a1" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#075985" stop-opacity="0.90"/>
            </linearGradient>
            <!-- Inundation Flood Glow -->
            <radialGradient id="flood-surge-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
            </radialGradient>
            <!-- Red Zone Pulsing Glow Filter -->
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <!-- Green Zone Glow Filter -->
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <!-- Marker Arrowhead for Evacuation Corridors -->
            <marker id="evac-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker id="reloc-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
        `;
        svg.appendChild(defs);

        // 2. Base Background Layer (Tactical Dark Canvas)
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        if (basemapMode === 'satellite') {
            bgRect.setAttribute('fill', '#050a12');
        } else if (basemapMode === 'elevation') {
            bgRect.setAttribute('fill', '#07111a');
        } else {
            bgRect.setAttribute('fill', '#0B0F19');
        }
        svg.appendChild(bgRect);

        // Background Grid Pattern
        const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        gridRect.setAttribute('width', '100%');
        gridRect.setAttribute('height', '100%');
        gridRect.setAttribute('fill', 'url(#tactical-grid)');
        svg.appendChild(gridRect);

        // 3. Render Topography & Elevation Contours
        renderElevationContours();

        // 4. Render River Brahmaputra & Inundation Water Layer
        if (layers.riverInundation) {
            renderRiverAndFlood();
        }

        // 5. Render Road Network & Bridges
        if (layers.roadNetwork) {
            renderRoadNetwork();
        }

        // 6. Render Uber H3 Hexagonal Grid Layer
        if (layers.h3Grid) {
            renderH3HexagonalGrid();
        }

        // 7. Render Evacuation Routes (if enabled or on evacuation view)
        if (layers.evacuationRoutes && (activePage === 'evacuation' || activePage === 'overview' || activePage === 'simulation')) {
            renderEvacuationRoutes();
        }

        // 8. Render Relocation Flow Vectors (if enabled or on relocation view)
        if (layers.relocationArcs && (activePage === 'relocation' || activePage === 'simulation')) {
            renderRelocationArcs();
        }

        // 9. Render Emergency Resources, Shelters & Hospitals
        if (layers.resources) {
            renderResourceMarkers();
        }

        // 10. Selected Cell Crosshair HUD
        if (selectedCellId) {
            renderSelectedCellTargetHUD();
        }
    }

    /**
     * Render Topography / Hill contours (Guwahati hills to the south and north)
     */
    function renderElevationContours() {
        const contourGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        contourGroup.setAttribute('id', 'layer-contours');
        contourGroup.setAttribute('opacity', basemapMode === 'elevation' ? '0.6' : '0.25');

        // Southern High Elevation Ridge (Khanapara - Narengi Foothills)
        const southRidgeCoords = [
            [26.10, 91.68], [26.105, 91.75], [26.115, 91.83], [26.130, 91.90], [26.110, 91.96],
            [26.07, 91.96], [26.07, 91.68]
        ];
        const southPoints = southRidgeCoords.map(c => {
            const p = geoToScreen(c[0], c[1]);
            return `${p.x},${p.y}`;
        }).join(' ');

        const southPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        southPolygon.setAttribute('points', southPoints);
        southPolygon.setAttribute('fill', 'rgba(16, 185, 129, 0.08)');
        southPolygon.setAttribute('stroke', 'rgba(16, 185, 129, 0.25)');
        southPolygon.setAttribute('stroke-dasharray', '4,4');
        contourGroup.appendChild(southPolygon);

        // Ridge Label
        const ridgeLabelPoint = geoToScreen(26.095, 91.82);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', ridgeLabelPoint.x);
        text.setAttribute('y', ridgeLabelPoint.y);
        text.setAttribute('fill', 'rgba(110, 231, 183, 0.45)');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-family', 'monospace');
        text.setAttribute('letter-spacing', '2px');
        text.textContent = '▲ SHILLONG FOOTHILL SAFE RIDGE (>120M MSL)';
        contourGroup.appendChild(text);

        svg.appendChild(contourGroup);
    }

    /**
     * Render the Brahmaputra River Basin & Active Flood Inundation Polygon
     */
    function renderRiverAndFlood() {
        const riverGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        riverGroup.setAttribute('id', 'layer-river');

        // Coordinates of Brahmaputra River through Guwahati
        const riverCoords = [
            [26.230, 91.530],
            [26.210, 91.620],
            [26.195, 91.690],
            [26.200, 91.750],
            [26.215, 91.820],
            [26.235, 91.910],
            [26.255, 91.980],
            // Northern bank return
            [26.280, 91.980],
            [26.260, 91.900],
            [26.230, 91.810],
            [26.220, 91.730],
            [26.225, 91.660],
            [26.245, 91.580],
            [26.260, 91.530]
        ];

        const riverPoints = riverCoords.map(c => {
            const p = geoToScreen(c[0], c[1]);
            return `${p.x},${p.y}`;
        }).join(' ');

        const riverPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        riverPoly.setAttribute('points', riverPoints);
        riverPoly.setAttribute('fill', 'url(#river-gradient)');
        riverPoly.setAttribute('stroke', 'rgba(56, 189, 248, 0.4)');
        riverPoly.setAttribute('stroke-width', '1.5');
        riverGroup.appendChild(riverPoly);

        // River text label
        const riverCenter = geoToScreen(26.215, 91.720);
        const riverText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        riverText.setAttribute('x', riverCenter.x);
        riverText.setAttribute('y', riverCenter.y);
        riverText.setAttribute('fill', 'rgba(186, 230, 253, 0.6)');
        riverText.setAttribute('font-size', '12');
        riverText.setAttribute('font-weight', '600');
        riverText.setAttribute('letter-spacing', '3px');
        riverText.setAttribute('text-anchor', 'middle');
        riverText.textContent = '≈ BRAHMAPUTRA RIVER (WATER LEVEL: +3.8M ABOVE DANGER MARK) ≈';
        riverGroup.appendChild(riverText);

        svg.appendChild(riverGroup);
    }

    /**
     * Render the arterial Road Network with real-time status (Open, Congested, Submerged)
     */
    function renderRoadNetwork() {
        const roadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        roadGroup.setAttribute('id', 'layer-roads');

        const roads = window.DISASTER_DATA.roadNetwork || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        roads.forEach(road => {
            const fromCell = cellMap[road.fromCell];
            const toCell = cellMap[road.toCell];
            if (!fromCell || !toCell) return;

            const p1 = geoToScreen(fromCell.lat, fromCell.lng);
            const p2 = geoToScreen(toCell.lat, toCell.lng);

            const roadPath = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            roadPath.setAttribute('x1', p1.x);
            roadPath.setAttribute('y1', p1.y);
            roadPath.setAttribute('x2', p2.x);
            roadPath.setAttribute('y2', p2.y);

            let strokeColor = '#06B6D4'; // Open
            let strokeWidth = road.lanes >= 4 ? 4 : 2.5;
            let dashArray = 'none';
            let opacity = '0.75';

            if (road.status === 'Submerged') {
                strokeColor = '#EF4444';
                dashArray = '6,4';
                strokeWidth = 3.5;
                opacity = '0.9';
            } else if (road.status === 'Congested') {
                strokeColor = '#F59E0B';
                dashArray = '8,3';
                strokeWidth = 3.5;
            } else if (road.status === 'Damaged') {
                strokeColor = '#DC2626';
                dashArray = '3,3';
            }

            roadPath.setAttribute('stroke', strokeColor);
            roadPath.setAttribute('stroke-width', strokeWidth);
            roadPath.setAttribute('stroke-dasharray', dashArray);
            roadPath.setAttribute('stroke-linecap', 'round');
            roadPath.setAttribute('opacity', opacity);

            // Road hover tooltip
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${road.name} | Status: ${road.status.toUpperCase()} | Capacity: ${road.maxFlowPph} persons/hr`;
            roadPath.appendChild(title);

            roadGroup.appendChild(roadPath);

            // Submerged road hazard icon badge
            if (road.status === 'Submerged') {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                const hazardCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hazardCircle.setAttribute('cx', midX);
                hazardCircle.setAttribute('cy', midY);
                hazardCircle.setAttribute('r', '7');
                hazardCircle.setAttribute('fill', '#EF4444');
                hazardCircle.setAttribute('stroke', '#FFFFFF');
                hazardCircle.setAttribute('stroke-width', '1.5');
                roadGroup.appendChild(hazardCircle);

                const hazardText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                hazardText.setAttribute('x', midX);
                hazardText.setAttribute('y', midY + 3.5);
                hazardText.setAttribute('fill', '#FFFFFF');
                hazardText.setAttribute('font-size', '8');
                hazardText.setAttribute('font-weight', 'bold');
                hazardText.setAttribute('text-anchor', 'middle');
                hazardText.textContent = '✕';
                roadGroup.appendChild(hazardText);
            }
        });

        svg.appendChild(roadGroup);
    }

    /**
     * Render Uber H3 Hexagonal Grid
     */
    function renderH3HexagonalGrid() {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('id', 'layer-h3-hexagons');

        const cells = window.DISASTER_DATA.h3Cells || [];

        cells.forEach(cell => {
            const risk = cell.currentRisk || cell.baselineRisk;
            const classification = window.H3_ENGINE.getRiskClassification(risk);
            const boundaryCoords = window.H3_ENGINE.getHexagonBoundary(cell.lat, cell.lng, 0.019);

            // Map boundary coordinates to screen points
            const screenPoints = boundaryCoords.map(coord => {
                const pt = geoToScreen(coord[0], coord[1]);
                return `${pt.x},${pt.y}`;
            }).join(' ');

            const center = geoToScreen(cell.lat, cell.lng);

            // Hexagon Polygon Element
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', screenPoints);
            polygon.setAttribute('data-cell-id', cell.id);
            polygon.setAttribute('class', 'h3-hex-polygon');
            polygon.style.cursor = 'pointer';
            polygon.style.transition = 'all 0.25s ease';

            // Distinct visual fill per risk category
            let fillOpacity = '0.38';
            let strokeWidth = '1.8';
            if (classification.level === 'critical') {
                fillOpacity = '0.62';
                strokeWidth = '2.5';
                polygon.setAttribute('filter', 'url(#glow-red)');
            } else if (classification.level === 'orange') {
                fillOpacity = '0.48';
                strokeWidth = '2.0';
            } else if (classification.level === 'safe') {
                fillOpacity = '0.32';
                strokeWidth = '1.6';
            }

            if (selectedCellId === cell.id) {
                fillOpacity = '0.75';
                strokeWidth = '3.5';
            }

            polygon.setAttribute('fill', classification.color);
            polygon.setAttribute('fill-opacity', fillOpacity);
            polygon.setAttribute('stroke', selectedCellId === cell.id ? '#FFFFFF' : classification.strokeColor);
            polygon.setAttribute('stroke-width', strokeWidth);

            // Interactivity: Hover & Click
            polygon.addEventListener('mouseenter', () => {
                polygon.setAttribute('fill-opacity', '0.85');
                polygon.setAttribute('stroke', '#FFFFFF');
                showHexTooltip(cell, classification, center);
            });

            polygon.addEventListener('mouseleave', () => {
                polygon.setAttribute('fill-opacity', selectedCellId === cell.id ? '0.75' : fillOpacity);
                polygon.setAttribute('stroke', selectedCellId === cell.id ? '#FFFFFF' : classification.strokeColor);
                hideHexTooltip();
            });

            polygon.addEventListener('click', (e) => {
                e.stopPropagation();
                selectCell(cell.id);
                if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep();
            });

            gridGroup.appendChild(polygon);

            // Hexagon Center Label (Risk Score & ID)
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            labelGroup.setAttribute('class', 'h3-label-group');
            labelGroup.style.pointerEvents = 'none';

            // Risk Score Badge
            const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            scoreText.setAttribute('x', center.x);
            scoreText.setAttribute('y', center.y - 4);
            scoreText.setAttribute('fill', '#FFFFFF');
            scoreText.setAttribute('font-size', '13');
            scoreText.setAttribute('font-weight', '700');
            scoreText.setAttribute('font-family', 'sans-serif');
            scoreText.setAttribute('text-anchor', 'middle');
            scoreText.textContent = `${risk}`;
            labelGroup.appendChild(scoreText);

            // Short Sector Name
            const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameText.setAttribute('x', center.x);
            nameText.setAttribute('y', center.y + 11);
            nameText.setAttribute('fill', classification.textColor);
            nameText.setAttribute('font-size', '9.5');
            nameText.setAttribute('font-weight', '500');
            nameText.setAttribute('font-family', 'sans-serif');
            nameText.setAttribute('text-anchor', 'middle');
            nameText.textContent = cell.name.split(' ')[0]; // First word of name
            labelGroup.appendChild(nameText);

            // Critical Zone Pulsing Indicator Ring
            if (classification.level === 'critical') {
                const pulseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                pulseCircle.setAttribute('cx', center.x);
                pulseCircle.setAttribute('cy', center.y - 5);
                pulseCircle.setAttribute('r', '14');
                pulseCircle.setAttribute('fill', 'none');
                pulseCircle.setAttribute('stroke', '#EF4444');
                pulseCircle.setAttribute('stroke-width', '1.5');
                pulseCircle.setAttribute('class', 'pulsing-alert-ring');
                gridGroup.appendChild(pulseCircle);
            }

            gridGroup.appendChild(labelGroup);
        });

        svg.appendChild(gridGroup);
    }

    /**
     * Render Evacuation Corridors on Map
     */
    function renderEvacuationRoutes() {
        const evacGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        evacGroup.setAttribute('id', 'layer-evac-routes');

        const allocations = window.DISASTER_DATA.relocationAllocations || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        allocations.forEach((alloc, idx) => {
            const src = cellMap[alloc.sourceCellId];
            const dest = cellMap[alloc.targetCellId];
            if (!src || !dest) return;

            const p1 = geoToScreen(src.lat, src.lng);
            const p2 = geoToScreen(dest.lat, dest.lng);

            // Smooth curved evacuation route avoiding water
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + (idx % 2 === 0 ? -25 : 25);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#10B981');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('stroke-dasharray', '8,5');
            path.setAttribute('class', 'animated-evac-path');
            path.setAttribute('marker-end', 'url(#evac-arrow)');
            path.setAttribute('opacity', '0.85');

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Evacuation Corridor: ${src.name} → ${dest.name} | Capacity: ${alloc.allocatedPopulation.toLocaleString()} evacuees`;
            path.appendChild(title);

            evacGroup.appendChild(path);
        });

        svg.appendChild(evacGroup);
    }

    /**
     * Render Relocation Flow Vectors & Allocation Arcs
     */
    function renderRelocationArcs() {
        const relocGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        relocGroup.setAttribute('id', 'layer-relocation-arcs');

        const allocations = window.DISASTER_DATA.relocationAllocations || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        allocations.forEach((alloc) => {
            const src = cellMap[alloc.sourceCellId];
            const dest = cellMap[alloc.targetCellId];
            if (!src || !dest) return;

            const p1 = geoToScreen(src.lat, src.lng);
            const p2 = geoToScreen(dest.lat, dest.lng);

            // High-arcing dynamic flow line
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const ctrlX = (p1.x + p2.x) / 2 - (dy * 0.2);
            const ctrlY = (p1.y + p2.y) / 2 + (dx * 0.2);

            const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arcPath.setAttribute('d', `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`);
            arcPath.setAttribute('fill', 'none');
            arcPath.setAttribute('stroke', '#38BDF8');
            arcPath.setAttribute('stroke-width', Math.min(6, Math.max(2.5, alloc.allocatedPopulation / 6000)));
            arcPath.setAttribute('stroke-dasharray', '6,4');
            arcPath.setAttribute('class', 'animated-relocation-flow');
            arcPath.setAttribute('marker-end', 'url(#reloc-arrow)');
            arcPath.setAttribute('opacity', '0.9');

            relocGroup.appendChild(arcPath);

            // Midpoint allocation badge
            const badgeX = (p1.x + 2 * ctrlX + p2.x) / 4;
            const badgeY = (p1.y + 2 * ctrlY + p2.y) / 4;

            const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            badgeBg.setAttribute('x', badgeX - 35);
            badgeBg.setAttribute('y', badgeY - 10);
            badgeBg.setAttribute('width', '70');
            badgeBg.setAttribute('height', '18');
            badgeBg.setAttribute('rx', '4');
            badgeBg.setAttribute('fill', '#0F172A');
            badgeBg.setAttribute('stroke', '#38BDF8');
            badgeBg.setAttribute('stroke-width', '1');
            relocGroup.appendChild(badgeBg);

            const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badgeText.setAttribute('x', badgeX);
            badgeText.setAttribute('y', badgeY + 3);
            badgeText.setAttribute('fill', '#38BDF8');
            badgeText.setAttribute('font-size', '9');
            badgeText.setAttribute('font-weight', 'bold');
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.textContent = `↷ ${(alloc.allocatedPopulation / 1000).toFixed(1)}k Pax`;
            relocGroup.appendChild(badgeText);
        });

        svg.appendChild(relocGroup);
    }

    /**
     * Render Dedicated Shelters and Hospital Resource Markers
     */
    function renderResourceMarkers() {
        const resGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        resGroup.setAttribute('id', 'layer-resources');

        const shelters = window.DISASTER_DATA.shelters || [];
        const hospitals = window.DISASTER_DATA.hospitals || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        // Render Shelters
        shelters.forEach(sh => {
            const cell = cellMap[sh.cellId];
            if (!cell) return;
            const pt = geoToScreen(cell.lat + 0.005, cell.lng - 0.006);

            const markerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            markerG.setAttribute('class', 'resource-marker shelter-marker');
            markerG.style.cursor = 'pointer';

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pt.x);
            circle.setAttribute('cy', pt.y);
            circle.setAttribute('r', '8');
            circle.setAttribute('fill', '#0284C7');
            circle.setAttribute('stroke', '#FFFFFF');
            circle.setAttribute('stroke-width', '1.5');
            markerG.appendChild(circle);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pt.x);
            label.setAttribute('y', pt.y + 3);
            label.setAttribute('fill', '#FFFFFF');
            label.setAttribute('font-size', '8');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = 'S';
            markerG.appendChild(label);

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Shelter: ${sh.name}\nCapacity: ${sh.capacity.toLocaleString()} | Avail: ${sh.availableCapacity.toLocaleString()}\nStatus: ${sh.status}`;
            markerG.appendChild(title);

            resGroup.appendChild(markerG);
        });

        // Render Hospitals
        hospitals.forEach(hosp => {
            const pt = geoToScreen(hosp.lat, hosp.lng);
            const markerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            markerG.setAttribute('class', 'resource-marker hospital-marker');
            markerG.style.cursor = 'pointer';

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', pt.x - 7);
            rect.setAttribute('y', pt.y - 7);
            rect.setAttribute('width', '14');
            rect.setAttribute('height', '14');
            rect.setAttribute('rx', '3');
            rect.setAttribute('fill', '#DC2626');
            rect.setAttribute('stroke', '#FFFFFF');
            rect.setAttribute('stroke-width', '1.5');
            markerG.appendChild(rect);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pt.x);
            label.setAttribute('y', pt.y + 3.5);
            label.setAttribute('fill', '#FFFFFF');
            label.setAttribute('font-size', '9');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = '+';
            markerG.appendChild(label);

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Hospital: ${hosp.name}\nBeds: ${hosp.beds} | Available ICU: ${hosp.availableIcu}\nStatus: ${hosp.status}`;
            markerG.appendChild(title);

            resGroup.appendChild(markerG);
        });

        svg.appendChild(resGroup);
    }

    /**
     * Render Targeted Selection HUD crosshair on active cell
     */
    function renderSelectedCellTargetHUD() {
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cell = cells.find(c => c.id === selectedCellId);
        if (!cell) return;

        const center = geoToScreen(cell.lat, cell.lng);
        const hudGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        hudGroup.setAttribute('id', 'hud-selection-crosshair');
        hudGroup.style.pointerEvents = 'none';

        // Outer targeting reticle ring
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', center.x);
        ring.setAttribute('cy', center.y);
        ring.setAttribute('r', '24');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#38BDF8');
        ring.setAttribute('stroke-width', '2');
        ring.setAttribute('stroke-dasharray', '8,4');
        hudGroup.appendChild(ring);

        // Crosshairs
        const crosshairLen = 32;
        const lineH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineH.setAttribute('x1', center.x - crosshairLen);
        lineH.setAttribute('y1', center.y);
        lineH.setAttribute('x2', center.x + crosshairLen);
        lineH.setAttribute('y2', center.y);
        lineH.setAttribute('stroke', '#38BDF8');
        lineH.setAttribute('stroke-width', '1.5');
        hudGroup.appendChild(lineH);

        const lineV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineV.setAttribute('x1', center.x);
        lineV.setAttribute('y1', center.y - crosshairLen);
        lineV.setAttribute('x2', center.x);
        lineV.setAttribute('y2', center.y + crosshairLen);
        lineV.setAttribute('stroke', '#38BDF8');
        lineV.setAttribute('stroke-width', '1.5');
        hudGroup.appendChild(lineV);

        svg.appendChild(hudGroup);
    }

    /**
     * Floating Tooltip for Hexagon Cells
     */
    function showHexTooltip(cell, classification, screenPt) {
        let tooltip = document.getElementById('gis-map-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.setAttribute('id', 'gis-map-tooltip');
            tooltip.className = 'gis-tactical-tooltip';
            if (container) container.appendChild(tooltip);
        }

        const capacityAnalysis = window.H3_ENGINE.evaluateCarryingCapacity(cell);
        tooltip.innerHTML = `
            <div class="tooltip-header" style="border-left: 3px solid ${classification.color};">
                <span class="tooltip-badge" style="background:${classification.color}; color:#fff;">${classification.badge}</span>
                <span class="tooltip-id">${cell.id.substring(0, 11)}...</span>
            </div>
            <div class="tooltip-title">${cell.name}</div>
            <div class="tooltip-grid">
                <div><span>Risk Score:</span> <strong>${cell.currentRisk || cell.baselineRisk} / 100</strong></div>
                <div><span>Population:</span> <strong>${cell.population.toLocaleString()}</strong></div>
                <div><span>Elevation:</span> <strong>${cell.elevation} m MSL</strong></div>
                <div><span>Safe Capacity:</span> <strong>${capacityAnalysis.effectiveSafeCapacity.toLocaleString()}</strong></div>
                <div class="tooltip-full ${capacityAnalysis.isDeficit ? 'text-danger' : 'text-success'}">
                    <span>${capacityAnalysis.statusLabel}:</span>
                    <strong>${capacityAnalysis.isDeficit ? capacityAnalysis.deficit.toLocaleString() + ' DEFICIT' : capacityAnalysis.surplusCapacity.toLocaleString() + ' SURPLUS'}</strong>
                </div>
            </div>
            <div class="tooltip-action-prompt">Click to Inspect Cell & Relocation Plan →</div>
        `;

        tooltip.style.display = 'block';
        // Position within container bounds
        const containerRect = container.getBoundingClientRect();
        const tooltipX = Math.min(containerRect.width - 270, Math.max(10, screenPt.x + 15));
        const tooltipY = Math.min(containerRect.height - 180, Math.max(10, screenPt.y - 40));

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
    }

    function hideHexTooltip() {
        const tooltip = document.getElementById('gis-map-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    return {
        init,
        render,
        zoomIn,
        zoomOut,
        resetView,
        toggleLayer,
        setBasemap,
        setActivePage,
        selectCell
    };
})();
