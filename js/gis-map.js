/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Real-Time Leaflet GIS Map Engine with High-Resolution Satellite & Light Basemaps
 * WHOLE-STATE SIKKIM H3 GEOFENCE GIS THEATER
 * Focus: Whole State of Sikkim · Mangan, Gyalshing, Gangtok, Namchi
 */

window.GIS_MAP = (function() {
    let map = null;
    let container = null;
    let onCellSelectedCallback = null;
    let selectedCellId = null; // Clean map initially - NO irritating popup in the middle!
    let activePage = 'overview';

    // State of Sikkim Geographic Center & Full-State Overview Zoom
    const SIKKIM_CENTER = [27.5600, 88.5000];
    const DEFAULT_ZOOM = 9.6;

    // Tile Layers
    let tileLayers = {};
    let currentBasemap = 'satellite';

    // Feature Layer Groups
    let boundaryLayerGroup = null;
    let hexLayerGroup = null;
    let townLayerGroup = null;
    let leaderLineGroup = null;
    let roadLayerGroup = null;
    let evacLayerGroup = null;
    let relocLayerGroup = null;
    let resourceLayerGroup = null;

    const layerVisibility = {
        h3Grid: true,
        roadNetwork: true,
        evacuationRoutes: true,
        resources: true,
        relocationArcs: true
    };

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

        map = L.map(mapDiv, {
            center: SIKKIM_CENTER,
            zoom: DEFAULT_ZOOM,
            minZoom: 8,
            maxZoom: 18,
            zoomSnap: 0.2,
            zoomDelta: 0.5,
            zoomControl: false,
            attributionControl: true
        });

        // Dedicated High-Priority Popup Pane (In front of all floating UI elements)
        map.createPane('h3PopupPane');
        const popupPane = map.getPane('h3PopupPane');
        if (popupPane) {
            popupPane.style.zIndex = '9999';
            popupPane.style.pointerEvents = 'auto';
        }

        // 1. ESRI Satellite Basemap
        tileLayers.satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: '&copy; ESRI World Imagery | Sikkim Whole-State H3 Geofence GIS',
                maxZoom: 19,
                subdomains: ['server', 'services']
            }
        );

        // 2. OpenStreetMap Standard
        tileLayers.osm = L.tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }
        );

        // 3. Carto Positron (Clean Crisp Light Basemap)
        tileLayers.cartoLight = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; OpenStreetMap contributors & CartoDB',
                maxZoom: 19,
                subdomains: 'abcd'
            }
        );

        tileLayers[currentBasemap].addTo(map);

        // Layer Groups
        boundaryLayerGroup = L.layerGroup().addTo(map);
        hexLayerGroup = L.layerGroup().addTo(map);
        leaderLineGroup = L.layerGroup().addTo(map);
        townLayerGroup = L.layerGroup().addTo(map);
        roadLayerGroup = L.layerGroup().addTo(map);
        evacLayerGroup = L.layerGroup().addTo(map);
        relocLayerGroup = L.layerGroup().addTo(map);
        resourceLayerGroup = L.layerGroup().addTo(map);

        render();

        // Dismiss popup if user clicks on empty map area
        map.on('click', () => {
            clearSelection();
        });

        window.addEventListener('resize', () => {
            if (map) map.invalidateSize();
        });

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                map.setView(SIKKIM_CENTER, DEFAULT_ZOOM);
            }
        }, 80);

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 400);
    }

    function setBasemap(mode) {
        if (!map || !tileLayers[mode]) return;
        if (tileLayers[currentBasemap]) {
            map.removeLayer(tileLayers[currentBasemap]);
        }
        currentBasemap = mode;
        tileLayers[currentBasemap].addTo(map);
        tileLayers[currentBasemap].bringToBack();
    }

    function zoomIn() { if (map) map.zoomIn(); }
    function zoomOut() { if (map) map.zoomOut(); }
    function resetView() {
        if (map) map.setView(SIKKIM_CENTER, DEFAULT_ZOOM, { animate: true });
    }

    function toggleLayer(layerKey, isVisible) {
        layerVisibility[layerKey] = isVisible;
        if (layerKey === 'h3Grid') {
            if (isVisible) map.addLayer(hexLayerGroup);
            else map.removeLayer(hexLayerGroup);
        }
    }

    function setActivePage(page) {
        activePage = page;
        render();
    }

    function selectCell(cellId) {
        selectedCellId = cellId;
        const allCells = window.H3_ENGINE ? window.H3_ENGINE.generateSikkimHexGrid() : [];
        const cell = allCells.find(c => c.id === cellId) || (window.DISASTER_DATA.h3Cells || []).find(c => c.id === cellId);
        if (onCellSelectedCallback && cell) {
            onCellSelectedCallback(cell);
        }
    }

    function clearSelection() {
        selectedCellId = null;
        if (leaderLineGroup) leaderLineGroup.clearLayers();
    }

    /**
     * Render State Boundary Outline of Sikkim
     * (Dotted line removed as requested)
     */
    function renderStateBoundary() {
        if (!boundaryLayerGroup) return;
        boundaryLayerGroup.clearLayers();
    }

    /**
     * Render Clean Town & Settlement Markers
     */
    function renderTowns() {
        if (!townLayerGroup) return;
        townLayerGroup.clearLayers();

        const towns = [
            { name: 'Mangan (HQ)', lat: 27.5038, lng: 88.5284, isCapital: true },
            { name: 'Chungthang', lat: 27.6039, lng: 88.6467, isCapital: false },
            { name: 'Lachen', lat: 27.7167, lng: 88.5577, isCapital: false },
            { name: 'Lachung', lat: 27.6891, lng: 88.7430, isCapital: false },
            { name: 'Gyalshing (HQ)', lat: 27.2885, lng: 88.2464, isCapital: true },
            { name: 'Pelling', lat: 27.3167, lng: 88.2333, isCapital: false },
            { name: 'Yuksom', lat: 27.3719, lng: 88.2232, isCapital: false },
            { name: 'Legship', lat: 27.2833, lng: 88.2833, isCapital: false },
            { name: 'Gangtok (State Capital)', lat: 27.3300, lng: 88.6100, isCapital: true },
            { name: 'Namchi', lat: 27.1650, lng: 88.3500, isCapital: true }
        ];

        towns.forEach(t => {
            const icon = L.divIcon({
                className: 'town-marker-badge',
                html: `
                    <div class="town-dot-wrap ${t.isCapital ? 'capital-dot' : ''}">
                        <div class="town-dot-center"></div>
                    </div>
                    <div class="town-name-label">${t.name}</div>
                `,
                iconSize: [140, 22],
                iconAnchor: [6, 11]
            });

            L.marker([t.lat, t.lng], { icon, interactive: false }).addTo(townLayerGroup);
        });
    }

    /**
     * Show Tactical Popup Card when an H3 Hexagon is CLICKED
     */
    function showCellClickPopup(cell) {
        if (!leaderLineGroup) return;
        leaderLineGroup.clearLayers();
        selectedCellId = cell.id;

        // Position popup offset dynamically based on quadrant
        const offsetLat = cell.lat > SIKKIM_CENTER[0] ? 0.034 : 0.038;
        const offsetLng = cell.lng > SIKKIM_CENTER[1] ? 0.062 : 0.062;
        const anchorLat = cell.lat + offsetLat;
        const anchorLng = cell.lng + offsetLng;

        const riskColor = cell.riskLevel === 'critical' ? '#DC2626' : (cell.riskLevel === 'orange' ? '#EA580C' : (cell.riskLevel === 'moderate' ? '#D97706' : '#16A34A'));

        // Accent leader line connecting hexagon center to popup card (matches cell's risk color)
        L.polyline([[cell.lat, cell.lng], [anchorLat, anchorLng]], {
            color: riskColor,
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.85,
            interactive: false
        }).addTo(leaderLineGroup);

        // Center dot on hexagon
        L.circleMarker([cell.lat, cell.lng], {
            radius: 4,
            color: '#FFFFFF',
            fillColor: riskColor,
            fillOpacity: 1,
            weight: 2,
            interactive: false
        }).addTo(leaderLineGroup);

        // Clean White Popup Card with Close Button & View Dossier Trigger
        const popupIcon = L.divIcon({
            className: 'mockup-popup-container',
            html: `
                <div class="mockup-popup-card click-popup-card">
                    <button class="popup-card-close" id="btn-close-hex-popup" title="Close Popup">&times;</button>
                    <div class="mockup-popup-badge-row">
                        <span class="mockup-popup-badge badge-${cell.riskLevel}">${cell.riskLevel === 'critical' ? 'CRITICAL RED ZONE' : (cell.riskLevel === 'orange' ? 'HIGH RISK' : (cell.riskLevel === 'moderate' ? 'MODERATE WATCH' : 'SAFE ZONE'))}</span>
                        <span class="mockup-popup-district">${cell.district || 'Sikkim'}</span>
                    </div>
                    <div class="mockup-popup-id">H3 Cell: ${cell.id}</div>
                    <div class="mockup-popup-name">${cell.name}</div>
                    <div class="mockup-popup-body">
                        <div class="mockup-row">
                            <span class="mockup-label">Risk Score:</span>
                            <strong class="mockup-val mockup-score" style="color: ${riskColor}">${cell.currentRisk} / 100</strong>
                        </div>
                        <div class="mockup-row">
                            <span class="mockup-label">Elevation:</span>
                            <span class="mockup-val">${cell.elevation.toLocaleString()} m</span>
                        </div>
                        <div class="mockup-row">
                            <span class="mockup-label">Population:</span>
                            <span class="mockup-val">${cell.population.toLocaleString()}</span>
                        </div>
                        <div class="mockup-row">
                            <span class="mockup-label">Status:</span>
                            <span class="mockup-val text-deficit" style="color: ${cell.capacityDeficit > 0 ? '#DC2626' : '#16A34A'}">${cell.capacityDeficit > 0 ? 'PAX DEFICIT (-' + cell.capacityDeficit.toLocaleString() + ')' : 'BUFFER SURPLUS'}</span>
                        </div>
                        <div class="mockup-row mockup-safe-site">
                            <span class="mockup-label">Nearest Safe Site:</span>
                            <span class="mockup-val">${cell.nearestShelter || 'Pelling High Ridge Mega Sanctuary'}</span>
                        </div>
                    </div>
                    <button class="mockup-popup-btn" id="btn-view-cell-dossier" data-cell-id="${cell.id}">View Full Intelligence Dossier</button>
                </div>
            `,
            iconSize: [285, 235],
            iconAnchor: [0, 115]
        });

        L.marker([anchorLat, anchorLng], { 
            icon: popupIcon, 
            interactive: true,
            pane: 'h3PopupPane',
            zIndexOffset: 10000 
        }).addTo(leaderLineGroup);

        // Frame the popup cleanly within view
        map.panTo([anchorLat, anchorLng], { animate: true, duration: 0.35 });

        // Wire button clicks via event delegation on the entire map container
        // (more reliable than getElementById inside Leaflet panes)
        if (container._h3PopupHandler) {
            container.removeEventListener('click', container._h3PopupHandler, true);
        }

        container._h3PopupHandler = function(e) {
            const closeBtn = e.target.closest('#btn-close-hex-popup');
            if (closeBtn) {
                e.stopPropagation();
                clearSelection();
                container.removeEventListener('click', container._h3PopupHandler, true);
                container._h3PopupHandler = null;
                return;
            }
            const dossierBtn = e.target.closest('#btn-view-cell-dossier');
            if (dossierBtn) {
                e.stopPropagation();
                selectCell(cell.id);
                container.removeEventListener('click', container._h3PopupHandler, true);
                container._h3PopupHandler = null;
                return;
            }
        };

        container.addEventListener('click', container._h3PopupHandler, true);
    }

    /**
     * Render Whole-State Sikkim H3 Hexagonal Honeycomb Grid
     */
    function renderHexGrid() {
        if (!hexLayerGroup) return;
        hexLayerGroup.clearLayers();
        if (leaderLineGroup) leaderLineGroup.clearLayers();

        const cells = window.H3_ENGINE ? window.H3_ENGINE.generateSikkimHexGrid() : [];

        cells.forEach(cell => {
            // Risk Palette
            let fillColor = '#16A34A';
            let strokeColor = '#15803D';
            let fillOpacity = 0.30;

            if (cell.riskLevel === 'critical' || cell.currentRisk >= 81) {
                fillColor = '#DC2626'; strokeColor = '#B91C1C'; fillOpacity = 0.52;
            } else if (cell.riskLevel === 'orange' || cell.riskLevel === 'high' || cell.currentRisk >= 61) {
                fillColor = '#EA580C'; strokeColor = '#C2410C'; fillOpacity = 0.44;
            } else if (cell.riskLevel === 'moderate' || cell.currentRisk >= 36) {
                fillColor = '#D97706'; strokeColor = '#B45309'; fillOpacity = 0.38;
            } else {
                fillColor = '#16A34A'; strokeColor = '#15803D'; fillOpacity = 0.30;
            }

            const polygon = L.polygon(cell.boundary, {
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                color: strokeColor,
                weight: 0.9,
                opacity: 0.75,
                className: 'h3-hex-poly'
            });

            // CLICK EVENT: "when i click on thr h3 tht timethe popup hsould come other wise not needed"
            polygon.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                showCellClickPopup(cell);
            });

            polygon.addTo(hexLayerGroup);
        });
    }

    /**
     * Master Render Function
     */
    function render() {
        if (!map) return;
        renderStateBoundary();
        renderTowns();
        renderHexGrid();
    }

    return {
        init,
        setBasemap,
        zoomIn,
        zoomOut,
        resetView,
        toggleLayer,
        setActivePage,
        selectCell,
        clearSelection,
        render,
        invalidateSize: () => { if (map) map.invalidateSize(); }
    };
})();
