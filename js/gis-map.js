/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Real-Time Leaflet GIS Map Engine with High-Resolution Satellite Basemap (Sikkim Teesta Basin)
 */

window.GIS_MAP = (function() {
    let map = null;
    let container = null;
    let onCellSelectedCallback = null;
    let selectedCellId = null;
    let activePage = 'overview';

    // Manali · Rohtang Corridor (Beas River Basin, Himachal Pradesh) Center & Zoom
    const MANALI_CENTER = [32.2396, 77.1887];
    const SIKKIM_CENTER = MANALI_CENTER; // Backward compatibility alias
    const DEFAULT_ZOOM = 14;

    // Tile Layers
    let tileLayers = {};
    let currentBasemap = 'satellite'; // High-res satellite basemap matching user geofence system

    // Feature Layer Groups
    let hexLayerGroup = null;
    let roadLayerGroup = null;
    let evacLayerGroup = null;
    let relocLayerGroup = null;
    let resourceLayerGroup = null;
    let riverSurgeGroup = null;

    // Layer visibility state
    const layerVisibility = {
        h3Grid: true,
        riverInundation: true,
        roadNetwork: true,
        evacuationRoutes: true,
        resources: true,
        relocationArcs: true
    };

    // Keep track of polygon elements by cell id
    const polygonMap = {};

    /**
     * Initialize Leaflet Map
     */
    function init(containerElement, onCellSelected) {
        container = containerElement;
        onCellSelectedCallback = onCellSelected;

        if (map) {
            map.remove();
            map = null;
        }

        container.innerHTML = '';
        const mapDiv = document.createElement('div');
        mapDiv.id = 'leaflet-map-inner';
        mapDiv.style.width = '100%';
        mapDiv.style.height = '100%';
        container.appendChild(mapDiv);

        // Create Leaflet Map Instance
        map = L.map(mapDiv, {
            center: SIKKIM_CENTER,
            zoom: DEFAULT_ZOOM,
            minZoom: 8,
            maxZoom: 18,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
            zoomControl: false, // We use custom command-center HUD zoom controls
            attributionControl: true
        });

        // 1. OpenStreetMap (Standard OpenStreetMap - Worldwide, ultra-reliable, zero key)
        tileLayers.osm = L.tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }
        );

        // 2. OpenStreetMap Humanitarian (HOT - high contrast terrain & disaster response)
        tileLayers.hot = L.tileLayer(
            'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }
        );

        // 3. Satellite Basemap (ESRI World Imagery - High Resolution Real Satellite Terrain)
        tileLayers.satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: '&copy; <a href="https://www.esri.com/">ESRI World Imagery</a> | Manali Beas H3 Geofence GIS',
                maxZoom: 19,
                subdomains: ['server', 'services']
            }
        );

        // Add default basemap (OpenStreetMap)
        tileLayers[currentBasemap].addTo(map);

        // Initialize Layer Groups (Hexagon Grid and Simulation Vectors)
        hexLayerGroup = L.layerGroup().addTo(map);
        riverSurgeGroup = L.layerGroup().addTo(map);
        roadLayerGroup = L.layerGroup().addTo(map);
        evacLayerGroup = L.layerGroup().addTo(map);
        relocLayerGroup = L.layerGroup().addTo(map);
        resourceLayerGroup = L.layerGroup().addTo(map);

        // Map click handler: Clicking outside any hexagon automatically closes the inspector box
        map.on('click', () => {
            if (window.APP && typeof window.APP.closeCellInspector === 'function') {
                window.APP.closeCellInspector();
            }
        });

        // Render GIS layers
        render();

        // Window resize handler
        window.addEventListener('resize', () => {
            if (map) map.invalidateSize();
        });

        // Trigger immediate and staggered invalidateSize to guarantee tiles render when flex/absolute dimensions resolve
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                map.setView(SIKKIM_CENTER, DEFAULT_ZOOM);
            }
        }, 50);

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 250);

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 700);
    }

    /**
     * Switch Basemap Tile Layer
     */
    function setBasemap(mode) {
        if (!map || !tileLayers[mode]) return;
        if (tileLayers[currentBasemap]) {
            map.removeLayer(tileLayers[currentBasemap]);
        }
        currentBasemap = mode;
        tileLayers[currentBasemap].addTo(map);
        tileLayers[currentBasemap].bringToBack();
    }

    /**
     * Zoom In
     */
    function zoomIn() {
        if (map) map.zoomIn();
    }

    /**
     * Zoom Out
     */
    function zoomOut() {
        if (map) map.zoomOut();
    }

    /**
     * Reset View to default Sikkim Teesta Basin
     */
    function resetView() {
        if (map) map.setView(SIKKIM_CENTER, DEFAULT_ZOOM, { animate: true });
    }

    /**
     * Toggle layer visibility
     */
    function toggleLayer(layerKey, isVisible) {
        layerVisibility[layerKey] = isVisible;
        if (layerKey === 'h3Grid') {
            if (isVisible) map.addLayer(hexLayerGroup);
            else map.removeLayer(hexLayerGroup);
        } else if (layerKey === 'riverInundation') {
            if (isVisible) map.addLayer(riverSurgeGroup);
            else map.removeLayer(riverSurgeGroup);
        } else if (layerKey === 'roadNetwork') {
            if (isVisible) map.addLayer(roadLayerGroup);
            else map.removeLayer(roadLayerGroup);
        } else if (layerKey === 'evacuationRoutes') {
            if (isVisible) map.addLayer(evacLayerGroup);
            else map.removeLayer(evacLayerGroup);
        } else if (layerKey === 'relocationArcs') {
            if (isVisible) map.addLayer(relocLayerGroup);
            else map.removeLayer(relocLayerGroup);
        } else if (layerKey === 'resources') {
            if (isVisible) map.addLayer(resourceLayerGroup);
            else map.removeLayer(resourceLayerGroup);
        }
    }

    /**
     * Set active dashboard page
     */
    function setActivePage(page) {
        activePage = page;
        render();
    }

    /**
     * Select a cell and pan to it
     */
    function selectCell(cellId) {
        selectedCellId = cellId;
        const cell = (window.DISASTER_DATA.h3Cells || []).find(c => c.id === cellId);
        if (cell && map) {
            map.panTo([cell.lat, cell.lng], { animate: true, duration: 0.5 });
        }
        render();
        if (onCellSelectedCallback && cell) {
            onCellSelectedCallback(cell);
        }
    }

    /**
     * Clear cell selection
     */
    function clearSelection() {
        selectedCellId = null;
        render();
    }

    /**
     * Main Render Function: Clears clutter, renders seamless non-overlapping H3 hexagons and Google Maps Red Drop Pin
     */
    function render() {
        if (!map) return;

        // Clear any auxiliary layers
        if (riverSurgeGroup) riverSurgeGroup.clearLayers();
        if (roadLayerGroup) roadLayerGroup.clearLayers();
        if (evacLayerGroup) evacLayerGroup.clearLayers();
        if (relocLayerGroup) relocLayerGroup.clearLayers();
        if (resourceLayerGroup) resourceLayerGroup.clearLayers();

        // 1. Render mathematically non-overlapping Uber H3 Hexagons
        renderH3Hexagons();
    }

    /**
     * Render the Teesta River Path across Sikkim
     */
    function renderRiverSurge() {
        if (!riverSurgeGroup) return;
        riverSurgeGroup.clearLayers();

        // Real coordinates of Teesta River through Sikkim
        // From Lachen/Lachung down through Chungthang, Dikchu, Singtam, and Rangpo
        const teestaRiverPath = [
            [27.7150, 88.5550], // Lachen
            [27.6039, 88.6465], // Chungthang
            [27.5450, 88.6320], // Toong - Naga
            [27.4200, 88.5250], // Dikchu
            [27.2850, 88.5200], // Singtam North
            [27.2350, 88.4980], // Singtam Market
            [27.1760, 88.5280], // Rangpo
            [27.1350, 88.5400]  // West Bengal Border
        ];

        // Animated river polyline
        const riverLine = L.polyline(teestaRiverPath, {
            color: '#0284c7',
            weight: 7,
            opacity: 0.85,
            smoothFactor: 1.0,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(riverSurgeGroup);

        riverLine.bindTooltip('≈ TEESTA RIVER GLOF SURGE CORRIDOR (WATER LEVEL: +4.6M ABOVE DANGER MARK) ≈', {
            sticky: true,
            className: 'river-tooltip'
        });

        // Pulsing water glow layer
        L.polyline(teestaRiverPath, {
            color: '#38bdf8',
            weight: 14,
            opacity: 0.35,
            lineCap: 'round'
        }).addTo(riverSurgeGroup);
    }

    /**
     * Render Road Networks (NH-10, North Sikkim Highway, Ridge Bypasses)
     */
    function renderRoads() {
        if (!roadLayerGroup) return;
        roadLayerGroup.clearLayers();

        const roads = window.DISASTER_DATA.roadNetwork || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        roads.forEach(road => {
            const from = cellMap[road.fromCell];
            const to = cellMap[road.toCell];
            if (!from || !to) return;

            let color = '#06B6D4'; // Open
            let dashArray = null;
            let weight = 4;
            let opacity = 0.85;

            if (road.status === 'Submerged') {
                color = '#EF4444';
                dashArray = '6, 6';
                weight = 5;
                opacity = 0.95;
            } else if (road.status === 'Congested') {
                color = '#F59E0B';
                dashArray = '10, 4';
                weight = 4.5;
            } else if (road.status === 'Damaged') {
                color = '#DC2626';
                dashArray = '4, 4';
                weight = 4;
            }

            const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
                color: color,
                weight: weight,
                opacity: opacity,
                dashArray: dashArray,
                lineCap: 'round'
            }).addTo(roadLayerGroup);

            line.bindTooltip(`🛣️ ${road.name}<br>Status: <strong>${road.status.toUpperCase()}</strong> | Flow: ${road.maxFlowPph.toLocaleString()} pax/hr`, {
                sticky: true,
                className: 'tactical-map-tooltip'
            });

            // If submerged, add warning hazard pin at midpoint
            if (road.status === 'Submerged') {
                const midLat = (from.lat + to.lat) / 2;
                const midLng = (from.lng + to.lng) / 2;
                const hazardIcon = L.divIcon({
                    className: 'road-submerged-icon',
                    html: `<div style="background:#EF4444; color:#fff; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border:2px solid #fff; box-shadow:0 0 10px rgba(239,68,68,0.8);">✕</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                L.marker([midLat, midLng], { icon: hazardIcon, interactive: false }).addTo(roadLayerGroup);
            }
        });
    }

    /**
     * Render Uber H3 Hexagonal Grid over Sikkim (Mathematically non-overlapping seamless tessellation)
     */
    function renderH3Hexagons() {
        if (!hexLayerGroup) return;
        hexLayerGroup.clearLayers();

        // Ensure non-overlapping tessellated grid is loaded
        if (window.H3_ENGINE && typeof window.H3_ENGINE.generateSikkimHexGrid === 'function') {
            if (!window.DISASTER_DATA.h3Cells || window.DISASTER_DATA.h3Cells.length < 50) {
                window.DISASTER_DATA.h3Cells = window.H3_ENGINE.generateSikkimHexGrid();
            }
        }

        const cells = window.DISASTER_DATA.h3Cells || [];

        cells.forEach(cell => {
            const risk = cell.currentRisk || cell.baselineRisk;
            const classification = window.H3_ENGINE.getRiskClassification(risk);
            
            // Use exact precomputed non-overlapping boundary vertices (zero gap, zero overlap)
            const boundary = cell.boundary || window.H3_ENGINE.getHexagonBoundary(cell.lat, cell.lng, 0.0215);

            let fillColor = '#10B981';
            let fillOpacity = 0.28;
            let strokeColor = '#00FF88';
            let strokeWeight = 1.6;

            if (classification.level === 'critical') {
                fillColor = '#EF4444';
                fillOpacity = 0.55;
                strokeWeight = 2.4;
                strokeColor = '#FF2222';
            } else if (classification.level === 'orange') {
                fillColor = '#F97316';
                fillOpacity = 0.40;
                strokeWeight = 2.0;
                strokeColor = '#FB923C';
            } else if (classification.level === 'moderate') {
                fillColor = '#F59E0B';
                fillOpacity = 0.30;
                strokeWeight = 1.6;
                strokeColor = '#FCD34D';
            }

            if (selectedCellId === cell.id) {
                strokeColor = '#FFFFFF';
                strokeWeight = 3.6;
                fillOpacity = 0.75;
            }

            // Create Leaflet Polygon with smoothFactor 0.1 so borders match to exact millimeter
            const poly = L.polygon(boundary, {
                color: strokeColor,
                weight: strokeWeight,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                smoothFactor: 0.1,
                className: `h3-hex-${classification.level}`
            }).addTo(hexLayerGroup);

            // Click listener: stops propagation so clicking a hexagon does not trigger map outside-click
            poly.on('click', (e) => {
                if (e) {
                    L.DomEvent.stop(e);
                }
                selectCell(cell.id);
            });

            // Hover effects
            poly.on('mouseover', () => {
                poly.setStyle({ fillOpacity: 0.85, weight: strokeWeight + 1.2 });
            });
            poly.on('mouseout', () => {
                poly.setStyle({ fillOpacity: selectedCellId === cell.id ? 0.75 : fillOpacity, weight: strokeWeight });
            });

            // Rich Tooltip on hover
            const deficitText = cell.capacityDeficit > 0 
                ? `<span style="color:#EF4444; font-weight:bold;">${cell.capacityDeficit.toLocaleString()} Pax DEFICIT</span>`
                : `<span style="color:#10B981; font-weight:bold;">${(cell.surplusCapacity || 15000).toLocaleString()} Pax SURPLUS</span>`;

            poly.bindTooltip(`
                <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="background:${classification.color}; color:#fff; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px;">${classification.badge}</span>
                        <span style="font-family:monospace; font-size:10px; color:#94a3b8;">${cell.id.substring(0, 11)}...</span>
                    </div>
                    <div style="font-size:13px; font-weight:bold; color:#fff; margin-bottom:6px;">${cell.name}</div>
                    <div style="font-size:11px; color:#cbd5e1; display:grid; grid-template-columns:1fr 1fr; gap:4px;">
                        <div>Risk: <strong>${risk}/100</strong></div>
                        <div>Elevation: <strong>${cell.elevation}m</strong></div>
                        <div>Pop: <strong>${cell.population.toLocaleString()}</strong></div>
                        <div>Status: ${deficitText}</div>
                    </div>
                    <div style="margin-top:6px; font-size:10.5px; color:#38BDF8;">
                        Nearest Safe Shelter: <strong>${cell.nearestShelter}</strong>
                    </div>
                </div>
            `, {
                sticky: true,
                className: 'tactical-map-tooltip'
            });
        });
    }

    /**
     * Render Evacuation Corridors on Leaflet
     */
    function renderEvacuationRoutes() {
        if (!evacLayerGroup) return;
        evacLayerGroup.clearLayers();

        if (activePage !== 'evacuation' && activePage !== 'overview' && activePage !== 'simulation') return;

        const allocations = window.DISASTER_DATA.relocationAllocations || [];
        const cells = window.DISASTER_DATA.h3Cells;
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        allocations.forEach(alloc => {
            const src = cellMap[alloc.sourceCellId];
            const dest = cellMap[alloc.targetCellId];
            if (!src || !dest) return;

            // Route around high risk by adding a mountain pass mid-way coordinate
            const midLat = (src.lat + dest.lat) / 2 + 0.015;
            const midLng = (src.lng + dest.lng) / 2 - 0.010;

            const path = L.polyline([[src.lat, src.lng], [midLat, midLng], [dest.lat, dest.lng]], {
                color: '#10B981',
                weight: 4,
                opacity: 0.85,
                dashArray: '8, 6',
                className: 'animated-evac-path'
            }).addTo(evacLayerGroup);

            path.bindTooltip(`🚨 Evacuation Corridor: ${src.name} → ${dest.name}<br>Volume: <strong>${alloc.allocatedPopulation.toLocaleString()} evacuees</strong> | Route: ${alloc.corridorStatus}`, {
                sticky: true,
                className: 'tactical-map-tooltip'
            });
        });
    }

    /**
     * Render Relocation Flow Vectors on Leaflet
     */
    function renderRelocationFlow() {
        if (!relocLayerGroup) return;
        relocLayerGroup.clearLayers();

        if (activePage !== 'relocation' && activePage !== 'simulation') return;

        const allocations = window.DISASTER_DATA.relocationAllocations || [];
        const cells = window.DISASTER_DATA.h3Cells;
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        allocations.forEach(alloc => {
            const src = cellMap[alloc.sourceCellId];
            const dest = cellMap[alloc.targetCellId];
            if (!src || !dest) return;

            // Arcing curve points
            const midLat = (src.lat + dest.lat) / 2 + 0.025;
            const midLng = (src.lng + dest.lng) / 2 + 0.015;

            const flowLine = L.polyline([[src.lat, src.lng], [midLat, midLng], [dest.lat, dest.lng]], {
                color: '#38BDF8',
                weight: Math.min(6, Math.max(3, alloc.allocatedPopulation / 5000)),
                opacity: 0.9,
                dashArray: '6, 5',
                className: 'animated-relocation-flow'
            }).addTo(relocLayerGroup);

            // Flow Badge
            const badgeIcon = L.divIcon({
                className: 'reloc-flow-badge',
                html: `
                    <div style="background:#0F172A; border:1px solid #38BDF8; color:#38BDF8; border-radius:4px; padding:2px 7px; font-size:10px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.7);">
                        ↷ ${(alloc.allocatedPopulation / 1000).toFixed(1)}k Pax (${alloc.travelTimeMinutes}m)
                    </div>
                `,
                iconSize: [80, 22],
                iconAnchor: [40, 11]
            });
            L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }).addTo(relocLayerGroup);
        });
    }

    /**
     * Render Shelters & Hospitals
     */
    function renderResources() {
        if (!resourceLayerGroup) return;
        resourceLayerGroup.clearLayers();

        const shelters = window.DISASTER_DATA.shelters || [];
        const hospitals = window.DISASTER_DATA.hospitals || [];
        const cells = window.DISASTER_DATA.h3Cells || [];
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        // Shelters
        shelters.forEach(sh => {
            const cell = cellMap[sh.cellId];
            if (!cell) return;

            const shelterIcon = L.divIcon({
                className: 'resource-leaflet-icon',
                html: `<div style="background:#0284C7; color:#fff; border-radius:6px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:2px solid #fff; box-shadow:0 0 10px rgba(2,132,199,0.8);">🛡️</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([cell.lat + 0.008, cell.lng - 0.008], { icon: shelterIcon }).addTo(resourceLayerGroup);
            marker.bindPopup(`
                <div style="font-family:sans-serif; padding:4px;">
                    <strong style="color:#38BDF8;">🏠 Shelter: ${sh.name}</strong><br>
                    <span style="font-size:12px; color:#cbd5e1;">
                        Total Capacity: <strong>${sh.capacity.toLocaleString()}</strong><br>
                        Available: <strong style="color:#4ade80;">${sh.availableCapacity.toLocaleString()}</strong><br>
                        Food & Water: <strong>${sh.foodWaterDays} Days</strong><br>
                        Status: <strong>${sh.status}</strong>
                    </span>
                </div>
            `);
        });

        // Hospitals
        hospitals.forEach(hosp => {
            const hospIcon = L.divIcon({
                className: 'resource-leaflet-icon',
                html: `<div style="background:#DC2626; color:#fff; border-radius:6px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:2px solid #fff; box-shadow:0 0 10px rgba(220,38,38,0.8);">🏥</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon }).addTo(resourceLayerGroup);
            marker.bindPopup(`
                <div style="font-family:sans-serif; padding:4px;">
                    <strong style="color:#F87171;">🏥 Hospital: ${hosp.name}</strong><br>
                    <span style="font-size:12px; color:#cbd5e1;">
                        Total Beds: <strong>${hosp.beds}</strong><br>
                        Available ICU: <strong style="color:#38BDF8;">${hosp.availableIcu}</strong><br>
                        Trauma Level: <strong>${hosp.traumaCare}</strong><br>
                        Status: <strong>${hosp.status}</strong>
                    </span>
                </div>
            `);
        });
    }

    return {
        init,
        render,
        zoomIn,
        zoomOut,
        resetView,
        invalidateSize: () => { if (map) map.invalidateSize(); },
        toggleLayer,
        setBasemap,
        setActivePage,
        selectCell,
        clearSelection
    };
})();
