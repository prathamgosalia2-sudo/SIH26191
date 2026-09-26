/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Main Application Controller, Navigation, View Management & Interactivity
 */

window.APP = (function() {
    let currentActivePage = 'overview';
    let selectedCell = null;
    let currentHazardFilter = 'Flood';
    let mcdaWeights = {
        rainfall: 0.22,
        elevation: 0.18,
        popDensity: 0.18,
        infraVuln: 0.15,
        distServices: 0.12,
        roadAccess: 0.15
    };

    /**
     * Application Initialization
     */
    function init() {
        // 1. Initialize Map
        const mapContainer = document.getElementById('main-map-container');
        if (mapContainer && window.GIS_MAP) {
            window.GIS_MAP.init(mapContainer, (cell) => {
                openCellInspector(cell);
            });
        }

        // 2. Select initial cell
        const initialCell = window.DISASTER_DATA.h3Cells.find(c => c.riskLevel === 'critical') || window.DISASTER_DATA.h3Cells[0];
        if (initialCell) {
            selectedCell = initialCell;
        }

        // 3. Setup Navigation Sidebar
        setupNavigation();

        // 4. Setup Map Control Buttons
        setupMapControls();

        // 5. Setup Live Military Clock
        startLiveClock();

        // 6. Setup Audio Toggle
        setupAudioToggle();

        // 7. Render initial KPI cards & Active Page
        updateKPICards();
        navigateTo('overview');

        // Setup Simulation event listeners
        setupSimulationView();
    }

    /**
     * Start live UTC & IST Military Clock
     */
    function startLiveClock() {
        function tick() {
            const now = new Date();
            const istTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
            const utcTime = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false });
            const clockEl = document.getElementById('header-military-clock');
            if (clockEl) {
                clockEl.innerHTML = `<span class="clock-ist">IST ${istTime}</span> | <span class="clock-utc">UTC ${utcTime}</span>`;
            }
        }
        tick();
        setInterval(tick, 1000);
    }

    /**
     * Audio toggle handler
     */
    function setupAudioToggle() {
        const btn = document.getElementById('btn-audio-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const enabled = window.APP_SOUNDS.toggleAudio();
            btn.innerHTML = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            btn.classList.toggle('btn-muted', !enabled);
            if (enabled) window.APP_SOUNDS.playBeep();
        });
    }

    /**
     * Setup Navigation
     */
    function setupNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                if (page) {
                    navigateTo(page);
                    if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep();
                }
            });
        });

        // Setup Back to Map Buttons
        document.querySelectorAll('.btn-close-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('overview');
                if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep();
            });
        });
    }

    /**
     * Navigate between 8 Dashboard Views
     */
    function navigateTo(pageId) {
        currentActivePage = pageId;

        // Update active nav item
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-page') === pageId);
        });

        // Hide all page panels
        document.querySelectorAll('.dashboard-view-page').forEach(page => {
            page.style.display = 'none';
        });

        // Show selected view page
        const targetView = document.getElementById(`view-${pageId}`);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Notify Map Engine of active view
        if (window.GIS_MAP) {
            window.GIS_MAP.setActivePage(pageId);
        }

        // Refresh view-specific content
        if (pageId === 'overview') {
            updateKPICards();
        } else if (pageId === 'hazard') {
            refreshHazardView();
        } else if (pageId === 'capacity') {
            refreshCarryingCapacityView();
        } else if (pageId === 'evacuation') {
            refreshEvacuationView();
        } else if (pageId === 'relocation') {
            refreshRelocationView();
        } else if (pageId === 'resources') {
            refreshResourcesView();
        } else if (pageId === 'historical') {
            refreshHistoricalView();
        } else if (pageId === 'simulation') {
            refreshSimulationView();
        }
    }

    /**
     * Update Overview Dashboard KPI Cards
     */
    function updateKPICards() {
        const metrics = window.DISASTER_SIMULATION.getSummaryMetrics();

        const elPop = document.getElementById('kpi-pop-at-risk');
        if (elPop) elPop.textContent = metrics.totalPopAtRisk.toLocaleString();

        const elCrit = document.getElementById('kpi-critical-cells');
        if (elCrit) elCrit.textContent = metrics.criticalCells.toString();

        const elEvac = document.getElementById('kpi-evac-required');
        if (elEvac) elEvac.textContent = metrics.totalEvacuationRequired.toLocaleString();

        const elReloc = document.getElementById('kpi-reloc-requirement');
        if (elReloc) elReloc.textContent = metrics.totalRelocationRequired.toLocaleString();

        const elShelter = document.getElementById('kpi-shelter-capacity');
        if (elShelter) elShelter.textContent = metrics.totalAvailableShelterCapacity.toLocaleString();

        const elRes = document.getElementById('kpi-active-resources');
        if (elRes) elRes.textContent = metrics.activeResourcesCount.toString();

        // Update alert level indicator badge
        const alertBadge = document.getElementById('header-defcon-badge');
        if (alertBadge) {
            if (metrics.criticalCells >= 7) {
                alertBadge.className = 'status-defcon defcon-critical';
                alertBadge.innerHTML = '● ALERT LEVEL 4: CRITICAL BASIN BREACH';
            } else if (metrics.criticalCells >= 3) {
                alertBadge.className = 'status-defcon defcon-high';
                alertBadge.innerHTML = '▲ ALERT LEVEL 3: SEVERE INUNDATION';
            } else {
                alertBadge.className = 'status-defcon defcon-safe';
                alertBadge.innerHTML = '✓ ALERT LEVEL 1: NORMAL STANDBY';
            }
        }
    }

    /**
     * Setup Map Control Buttons & Layer Toggles
     */
    function setupMapControls() {
        const btnZoomIn = document.getElementById('btn-map-zoom-in');
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => { window.GIS_MAP.zoomIn(); if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep(); });

        const btnZoomOut = document.getElementById('btn-map-zoom-out');
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => { window.GIS_MAP.zoomOut(); if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep(); });

        const btnReset = document.getElementById('btn-map-reset');
        if (btnReset) btnReset.addEventListener('click', () => { window.GIS_MAP.resetView(); if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep(); });

        // Basemap switcher
        const basemapSelect = document.getElementById('select-basemap-mode');
        if (basemapSelect) {
            basemapSelect.addEventListener('change', (e) => {
                window.GIS_MAP.setBasemap(e.target.value);
            });
        }

        // Layer checkboxes
        const layerCheckboxes = document.querySelectorAll('.map-layer-toggle-cb');
        layerCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const layerKey = e.target.getAttribute('data-layer');
                if (layerKey && window.GIS_MAP) {
                    window.GIS_MAP.toggleLayer(layerKey, e.target.checked);
                }
            });
        });
    }

    /**
     * Open Detailed H3 Cell Inspector Drawer
     */
    function openCellInspector(cell) {
        selectedCell = cell;
        const drawer = document.getElementById('cell-inspector-drawer');
        if (!drawer) return;

        const classification = window.H3_ENGINE.getRiskClassification(cell.currentRisk || cell.baselineRisk);
        const capacityAnalysis = window.H3_ENGINE.evaluateCarryingCapacity(cell);
        const relocationRecommendation = window.H3_ENGINE.findOptimalRelocationDestinations(cell, window.DISASTER_DATA.h3Cells);

        // Populate drawer contents
        drawer.innerHTML = `
            <div class="inspector-header">
                <div class="inspector-badge" style="background: ${classification.color}; color: #fff;">
                    ${classification.badge}
                </div>
                <button class="btn-close-inspector" id="btn-close-cell-inspector" title="Close Panel">✕</button>
            </div>

            <div class="inspector-title-block">
                <h2 class="inspector-name">${cell.name}</h2>
                <div class="inspector-hex-id">
                    <span class="label">H3 Index:</span>
                    <span class="value font-mono">${cell.id}</span>
                </div>
                <div class="inspector-sector">${cell.sector}</div>
            </div>

            <div class="inspector-metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Risk Score</div>
                    <div class="metric-value font-mono" style="color: ${classification.color}">${cell.currentRisk || cell.baselineRisk} <span class="metric-sub">/ 100</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Hazard Type</div>
                    <div class="metric-value text-accent">${cell.hazardType}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Resident Pop</div>
                    <div class="metric-value font-mono">${cell.population.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Elevation</div>
                    <div class="metric-value font-mono">${cell.elevation} m MSL</div>
                </div>
            </div>

            <!-- Vulnerable Population Breakdown -->
            <div class="inspector-section">
                <h4 class="inspector-section-title">Vulnerable Population Breakdown</h4>
                <div class="vulnerable-chips-grid">
                    <div class="v-chip">
                        <span class="v-icon">👶</span>
                        <span class="v-label">Infants (0-5y):</span>
                        <strong class="v-count">${cell.vulnerablePopulation.infants.toLocaleString()}</strong>
                    </div>
                    <div class="v-chip">
                        <span class="v-icon">👴</span>
                        <span class="v-label">Elderly (65+):</span>
                        <strong class="v-count">${cell.vulnerablePopulation.elderly.toLocaleString()}</strong>
                    </div>
                    <div class="v-chip">
                        <span class="v-icon">♿</span>
                        <span class="v-label">PwD / Impaired:</span>
                        <strong class="v-count">${cell.vulnerablePopulation.disabled.toLocaleString()}</strong>
                    </div>
                    <div class="v-chip">
                        <span class="v-icon">🤰</span>
                        <span class="v-label">Pregnant Women:</span>
                        <strong class="v-count">${cell.vulnerablePopulation.pregnant.toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            <!-- Carrying Capacity & Deficit Analysis -->
            <div class="inspector-section carrying-capacity-box ${capacityAnalysis.isDeficit ? 'border-danger' : 'border-success'}">
                <h4 class="inspector-section-title">Carrying Capacity Assessment</h4>
                <div class="capacity-stats-list">
                    <div class="cap-stat-row">
                        <span>Safe Event Capacity:</span>
                        <strong class="font-mono">${capacityAnalysis.effectiveSafeCapacity.toLocaleString()} pax</strong>
                    </div>
                    <div class="cap-stat-row">
                        <span>Baseline Normal Capacity:</span>
                        <span class="font-mono text-muted">${cell.safeCapacityThreshold.toLocaleString()} pax</span>
                    </div>
                    <div class="cap-stat-row highlight">
                        <span>${capacityAnalysis.isDeficit ? 'Carrying Capacity Deficit:' : 'Available Safe Buffer:'}</span>
                        <strong class="font-mono ${capacityAnalysis.isDeficit ? 'text-danger' : 'text-success'}">
                            ${capacityAnalysis.isDeficit ? '-' + capacityAnalysis.deficit.toLocaleString() + ' PAX DEFICIT' : '+' + capacityAnalysis.surplusCapacity.toLocaleString() + ' PAX SURPLUS'}
                        </strong>
                    </div>
                </div>
                ${capacityAnalysis.isDeficit ? `
                    <div class="capacity-alert-banner">
                        ⚠️ <strong>LOCAL CARRYING CAPACITY EXHAUSTED:</strong><br>
                        ${capacityAnalysis.deficit.toLocaleString()} individuals cannot be safely harbored within this H3 cell and require immediate relocation to designated Green High-Ground zones.
                    </div>
                ` : `
                    <div class="capacity-safe-banner">
                        ✓ <strong>RESILIENT SHELTER RESERVE:</strong><br>
                        This H3 cell maintains ${capacityAnalysis.surplusCapacity.toLocaleString()} safe buffer slots and can receive evacuees from neighboring Red Zones.
                    </div>
                `}
            </div>

            <!-- Emergency Logistics & Road Access -->
            <div class="inspector-section">
                <h4 class="inspector-section-title">Evacuation & Emergency Logistics</h4>
                <div class="logistics-table">
                    <div class="log-row">
                        <span class="log-key">Nearest Designated Shelter:</span>
                        <span class="log-val font-semibold">${cell.nearestShelter} (${cell.shelterCapacity.toLocaleString()} cap)</span>
                    </div>
                    <div class="log-row">
                        <span class="log-key">Primary Road Status:</span>
                        <span class="log-val road-pill road-pill-${cell.roadStatus.toLowerCase()}">${cell.roadStatus.toUpperCase()} - ${cell.primaryRoad}</span>
                    </div>
                    <div class="log-row">
                        <span class="log-key">Est. Evacuation Time:</span>
                        <span class="log-val font-mono">${cell.evacuationTimeHours} Hours</span>
                    </div>
                    <div class="log-row">
                        <span class="log-key">Nearby Hospitals:</span>
                        <span class="log-val">${cell.nearbyHospitals.join(', ')}</span>
                    </div>
                    <div class="log-row">
                        <span class="log-key">Flood Inundation Depth:</span>
                        <span class="log-val font-mono ${cell.waterLevelM > 2 ? 'text-danger' : 'text-info'}">${cell.waterLevelM || 0} m</span>
                    </div>
                </div>
            </div>

            <!-- Intelligent Relocation Recommendation -->
            ${relocationRecommendation.needed && relocationRecommendation.primaryRecommendation ? `
                <div class="inspector-section relocation-recommend-box">
                    <h4 class="inspector-section-title">Recommended Safe Relocation Destination</h4>
                    <div class="reloc-dest-card">
                        <div class="reloc-dest-header">
                            <span class="reloc-dest-name">${relocationRecommendation.primaryRecommendation.destinationCell.name}</span>
                            <span class="badge-safe">SAFE GREEN ZONE</span>
                        </div>
                        <div class="reloc-dest-grid">
                            <div><span>Distance:</span> <strong>${relocationRecommendation.primaryRecommendation.distanceKm} km</strong></div>
                            <div><span>Convoy Travel Time:</span> <strong>${relocationRecommendation.primaryRecommendation.travelTimeMinutes} mins</strong></div>
                            <div><span>Available Surplus:</span> <strong class="text-success font-mono">${relocationRecommendation.primaryRecommendation.availableSurplus.toLocaleString()} pax</strong></div>
                            <div><span>Reception Facility:</span> <strong>${relocationRecommendation.primaryRecommendation.destinationShelter}</strong></div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Tactical Actions -->
            <div class="inspector-actions">
                <button class="btn btn-primary btn-block" id="btn-dispatch-evac-order">
                    🚨 Dispatch Evacuation Order (${cell.population.toLocaleString()} Pax)
                </button>
                <button class="btn btn-secondary btn-block" id="btn-generate-cell-sitrep">
                    📄 Export H3 Cell Operational SitRep
                </button>
            </div>
        `;

        drawer.classList.add('open');

        // Setup Close Button
        document.getElementById('btn-close-cell-inspector').addEventListener('click', () => {
            drawer.classList.remove('open');
        });

        // Setup Dispatch Order Action
        document.getElementById('btn-dispatch-evac-order').addEventListener('click', () => {
            if (window.APP_SOUNDS) window.APP_SOUNDS.playAlertTone();
            alert(`✅ EVACUATION ORDER TRANSMITTED (MHA / NDMA Protocol):\n\nTarget H3 Cell: ${cell.id} (${cell.name})\nPriority: Immediate Life Threat Triage\nEvacuee Allocation: ${cell.population.toLocaleString()} Persons\nDesignated Safe Reception Hub: ${relocationRecommendation.primaryRecommendation ? relocationRecommendation.primaryRecommendation.destinationCell.name : 'Gangtok Capital Safe Ridge'}\nFleet Dispatched: SNT Evacuation Buses + NDRF Boat Platoons + IAF Helicopters.`);
        });

        // Setup SitRep Export
        document.getElementById('btn-generate-cell-sitrep').addEventListener('click', () => {
            openSitRepModal(cell);
        });
    }

    /**
     * Refresh Hazard Assessment Page
     */
    function refreshHazardView() {
        const hazardSelector = document.getElementById('select-hazard-type');
        if (hazardSelector) {
            hazardSelector.value = currentHazardFilter;
            hazardSelector.onchange = (e) => {
                currentHazardFilter = e.target.value;
                refreshHazardView();
            };
        }

        // Render Radar Chart for Selected Cell
        const targetCell = selectedCell || window.DISASTER_DATA.h3Cells[0];
        if (targetCell && window.DISASTER_CHARTS) {
            const factorLabels = {
                rainfallImpact: 'Rainfall',
                elevationVulnerability: 'Elevation',
                populationDensity: 'Pop Density',
                infrastructureVulnerability: 'Infra Vuln',
                distanceToEmergencyServices: 'Dist Services',
                roadAccessibility: 'Road Access'
            };
            window.DISASTER_CHARTS.renderRadarChart('hazard-radar-chart-container', targetCell.factors, factorLabels);

            const cellTitleEl = document.getElementById('hazard-selected-cell-name');
            if (cellTitleEl) cellTitleEl.textContent = `${targetCell.name} (${targetCell.id.substring(0, 11)}...)`;
        }

        // Setup Weight Sensitivity Sliders
        setupMCDASliders();
    }

    /**
     * Setup Multi-Criteria Decision Analysis (MCDA) Weight Sliders
     */
    function setupMCDASliders() {
        const sliderIds = [
            { id: 'slider-w-rainfall', key: 'rainfall', labelId: 'label-w-rainfall' },
            { id: 'slider-w-elevation', key: 'elevation', labelId: 'label-w-elevation' },
            { id: 'slider-w-popdensity', key: 'popDensity', labelId: 'label-w-popdensity' },
            { id: 'slider-w-infra', key: 'infraVuln', labelId: 'label-w-infra' },
            { id: 'slider-w-services', key: 'distServices', labelId: 'label-w-services' },
            { id: 'slider-w-roads', key: 'roadAccess', labelId: 'label-w-roads' }
        ];

        sliderIds.forEach(item => {
            const slider = document.getElementById(item.id);
            const label = document.getElementById(item.labelId);
            if (!slider || !label) return;

            slider.value = Math.round(mcdaWeights[item.key] * 100);
            label.textContent = `${slider.value}%`;

            slider.oninput = (e) => {
                const val = parseInt(e.target.value, 10);
                mcdaWeights[item.key] = val / 100;
                label.textContent = `${val}%`;

                // Recalculate cell risk scores based on new weights
                window.DISASTER_DATA.h3Cells.forEach(c => {
                    if (c.factors) {
                        c.currentRisk = window.H3_ENGINE.calculateMCDARiskScore(c.factors, mcdaWeights);
                        c.riskLevel = window.H3_ENGINE.getRiskClassification(c.currentRisk).level;
                    }
                });

                if (window.GIS_MAP) window.GIS_MAP.render();
                updateKPICards();
            };
        });
    }

    /**
     * Refresh Carrying Capacity Page
     */
    function refreshCarryingCapacityView() {
        const tableBody = document.getElementById('capacity-table-body');
        if (!tableBody) return;

        const cells = window.DISASTER_DATA.h3Cells;
        tableBody.innerHTML = '';

        // Render comparative bar chart
        if (window.DISASTER_CHARTS) {
            window.DISASTER_CHARTS.renderCapacityComparisonBarChart('capacity-bar-chart-container', cells);
        }

        cells.forEach(c => {
            const capEval = window.H3_ENGINE.evaluateCarryingCapacity(c);
            const classification = window.H3_ENGINE.getRiskClassification(c.currentRisk || c.baselineRisk);

            const tr = document.createElement('tr');
            tr.className = `table-row ${capEval.isDeficit ? 'row-deficit' : 'row-surplus'}`;
            tr.style.cursor = 'pointer';

            tr.innerHTML = `
                <td>
                    <div class="cell-main-name font-semibold">${c.name}</div>
                    <div class="cell-sub-id font-mono text-muted">${c.id.substring(0, 11)}...</div>
                </td>
                <td>
                    <span class="badge" style="background: ${classification.color}; color: #fff;">
                        ${c.currentRisk || c.baselineRisk} - ${classification.badge}
                    </span>
                </td>
                <td class="font-mono text-right">${c.population.toLocaleString()}</td>
                <td class="font-mono text-right text-accent">${capEval.effectiveSafeCapacity.toLocaleString()}</td>
                <td class="font-mono text-right ${capEval.isDeficit ? 'text-danger font-bold' : 'text-success'}">
                    ${capEval.isDeficit ? '-' + capEval.deficit.toLocaleString() : '+' + capEval.surplusCapacity.toLocaleString()}
                </td>
                <td>
                    ${capEval.isDeficit ? `
                        <span class="badge-status-danger">RELOCATION REQUIRED</span>
                    ` : `
                        <span class="badge-status-safe">SURPLUS BUFFER</span>
                    `}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline btn-inspect-row">Inspect Cell</button>
                </td>
            `;

            tr.querySelector('.btn-inspect-row').addEventListener('click', (e) => {
                e.stopPropagation();
                openCellInspector(c);
                if (window.GIS_MAP) window.GIS_MAP.selectCell(c.id);
            });

            tr.addEventListener('click', () => {
                openCellInspector(c);
                if (window.GIS_MAP) window.GIS_MAP.selectCell(c.id);
            });

            tableBody.appendChild(tr);
        });

        // Filter buttons on Carrying Capacity
        const btnFilterDeficit = document.getElementById('btn-filter-deficit-only');
        const btnFilterAll = document.getElementById('btn-filter-all-capacity');

        if (btnFilterDeficit) {
            btnFilterDeficit.onclick = () => {
                document.querySelectorAll('#capacity-table-body tr').forEach(r => {
                    r.style.display = r.classList.contains('row-deficit') ? '' : 'none';
                });
            };
        }
        if (btnFilterAll) {
            btnFilterAll.onclick = () => {
                document.querySelectorAll('#capacity-table-body tr').forEach(r => {
                    r.style.display = '';
                });
            };
        }
    }

    /**
     * Refresh Evacuation View
     */
    function refreshEvacuationView() {
        const listContainer = document.getElementById('evacuation-priority-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        const criticalCells = window.DISASTER_DATA.h3Cells.filter(c => (c.currentRisk || c.baselineRisk) >= 61);

        criticalCells.forEach((c, idx) => {
            const classification = window.H3_ENGINE.getRiskClassification(c.currentRisk || c.baselineRisk);
            const isP1 = (c.currentRisk || c.baselineRisk) >= 81;

            const card = document.createElement('div');
            card.className = `evac-priority-card ${isP1 ? 'priority-p1' : 'priority-p2'}`;

            card.innerHTML = `
                <div class="evac-card-header">
                    <span class="priority-badge ${isP1 ? 'badge-p1' : 'badge-p2'}">
                        ${isP1 ? 'PRIORITY 1: IMMEDIATE (<2H)' : 'PRIORITY 2: STAGED (<6H)'}
                    </span>
                    <span class="evac-time font-mono">Est. Time: ${c.evacuationTimeHours}h</span>
                </div>
                <div class="evac-card-title">${c.name}</div>
                <div class="evac-vulnerable-stats">
                    <span>Vulnerable: <strong>${c.vulnerablePopulation.total.toLocaleString()}</strong></span>
                    <span>Infants: <strong>${c.vulnerablePopulation.infants}</strong></span>
                    <span>Elderly: <strong>${c.vulnerablePopulation.elderly}</strong></span>
                    <span>PwD: <strong>${c.vulnerablePopulation.disabled}</strong></span>
                </div>
                <div class="evac-road-status">
                    <span>Corridor: <strong>${c.primaryRoad}</strong></span>
                    <span class="road-pill road-pill-${c.roadStatus.toLowerCase()}">${c.roadStatus.toUpperCase()}</span>
                </div>
                <div class="evac-actions">
                    <button class="btn btn-sm btn-primary btn-dispatch-cell-evac" data-id="${c.id}">
                        Dispatch Evacuation Fleet
                    </button>
                </div>
            `;

            card.querySelector('.btn-dispatch-cell-evac').addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.APP_SOUNDS) window.APP_SOUNDS.playAlertTone();
                alert(`🚨 FLEET DISPATCHED to ${c.name}:\n\n- 12x Inflatable Powerboats (NDRF)\n- 18x State Transport Evacuation Buses\n- 6x ALS Mobile Ambulances\n\nRouting via Safe Elevated Bypass to designated high ground shelter.`);
            });

            listContainer.appendChild(card);
        });
    }

    /**
     * Refresh Relocation View
     */
    function refreshRelocationView() {
        const tableBody = document.getElementById('relocation-allocations-table');
        if (!tableBody) return;

        const allocations = window.DISASTER_DATA.relocationAllocations || [];
        const cells = window.DISASTER_DATA.h3Cells;
        const cellMap = {};
        cells.forEach(c => { cellMap[c.id] = c; });

        tableBody.innerHTML = '';

        allocations.forEach(alloc => {
            const src = cellMap[alloc.sourceCellId];
            const dest = cellMap[alloc.targetCellId];
            if (!src || !dest) return;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="font-semibold text-danger">${src.name}</div>
                    <div class="font-mono text-muted text-xs">${src.id.substring(0, 11)}...</div>
                </td>
                <td class="font-mono text-right font-bold text-danger">${alloc.allocatedPopulation.toLocaleString()}</td>
                <td>
                    <div class="font-semibold text-success">${dest.name}</div>
                    <div class="text-xs text-muted">Shelter: ${dest.nearestShelter}</div>
                </td>
                <td class="font-mono text-right text-success">${dest.capacityDeficit ? Math.abs(dest.capacityDeficit).toLocaleString() : '35,000'}</td>
                <td class="font-mono">${alloc.distanceKm} km</td>
                <td class="font-mono">${alloc.travelTimeMinutes} mins</td>
                <td><span class="badge-status-safe">${alloc.corridorStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-approve-relocation">Execute Plan</button>
                </td>
            `;

            tr.querySelector('.btn-approve-relocation').addEventListener('click', () => {
                if (window.APP_SOUNDS) window.APP_SOUNDS.playAlertTone();
                alert(`✅ RELOCATION DIRECTIVE EXECUTED:\n\nFrom: ${src.name} (Critical Red Zone)\nTo: ${dest.name} (High Ground Green Zone)\nPax Scheduled: ${alloc.allocatedPopulation.toLocaleString()}\nTransit Fleet: ${alloc.transitMode}\nMedical Triage: ${alloc.medicalSupport}`);
            });

            tableBody.appendChild(tr);
        });

        // Approve All Relocation Plans Button
        const btnApproveAll = document.getElementById('btn-approve-all-relocations');
        if (btnApproveAll) {
            btnApproveAll.onclick = () => {
                if (window.APP_SOUNDS) window.APP_SOUNDS.playAlertTone();
                alert('🚨 MHA / NDMA MASTER RELOCATION DIRECTIVE ISSUED:\n\nAll 7 critical carrying-capacity deficit corridors approved. Emergency transport fleets and high-ground shelters placed on active intake status.');
            };
        }
    }

    /**
     * Refresh Resources View
     */
    function refreshResourcesView() {
        const sheltersList = document.getElementById('resources-shelters-list');
        const hospitalsList = document.getElementById('resources-hospitals-list');
        const teamsList = document.getElementById('resources-teams-list');

        if (sheltersList) {
            sheltersList.innerHTML = '';
            (window.DISASTER_DATA.shelters || []).forEach(sh => {
                const el = document.createElement('div');
                el.className = 'resource-card';
                el.innerHTML = `
                    <div class="res-card-header">
                        <span class="res-name font-semibold">${sh.name}</span>
                        <span class="badge ${sh.availableCapacity > 5000 ? 'badge-safe' : 'badge-danger'}">${sh.status}</span>
                    </div>
                    <div class="res-stats-grid">
                        <div>Total Cap: <strong class="font-mono">${sh.capacity.toLocaleString()}</strong></div>
                        <div>Available: <strong class="font-mono text-success">${sh.availableCapacity.toLocaleString()}</strong></div>
                        <div>Food/Water: <strong class="font-mono">${sh.foodWaterDays} Days</strong></div>
                        <div>Power: <strong>${sh.powerBackup}</strong></div>
                    </div>
                `;
                sheltersList.appendChild(el);
            });
        }

        if (hospitalsList) {
            hospitalsList.innerHTML = '';
            (window.DISASTER_DATA.hospitals || []).forEach(hosp => {
                const el = document.createElement('div');
                el.className = 'resource-card';
                el.innerHTML = `
                    <div class="res-card-header">
                        <span class="res-name font-semibold">${hosp.name}</span>
                        <span class="badge ${hosp.availableIcu > 0 ? 'badge-safe' : 'badge-danger'}">${hosp.status}</span>
                    </div>
                    <div class="res-stats-grid">
                        <div>Total Beds: <strong class="font-mono">${hosp.beds}</strong></div>
                        <div>Available ICU: <strong class="font-mono text-accent">${hosp.availableIcu}</strong></div>
                        <div>Trauma Level: <strong>${hosp.traumaCare}</strong></div>
                    </div>
                `;
                hospitalsList.appendChild(el);
            });
        }

        if (teamsList) {
            teamsList.innerHTML = '';
            (window.DISASTER_DATA.emergencyResources || []).forEach(team => {
                const el = document.createElement('div');
                el.className = 'resource-card';
                el.innerHTML = `
                    <div class="res-card-header">
                        <span class="res-name font-semibold">${team.type}</span>
                        <span class="badge badge-safe">${team.status}</span>
                    </div>
                    <div class="res-task-desc">${team.task}</div>
                    <div class="res-stats-grid">
                        <div>Personnel: <strong class="font-mono">${team.personnel}</strong></div>
                        <div>Vehicles/Boats: <strong class="font-mono">${team.boats || team.buses || team.ambulances || team.units}</strong></div>
                        <div>Category: <strong>${team.category}</strong></div>
                    </div>
                `;
                teamsList.appendChild(el);
            });
        }
    }

    /**
     * Refresh Historical View
     */
    function refreshHistoricalView() {
        if (window.DISASTER_CHARTS) {
            window.DISASTER_CHARTS.renderHistoricalTrendChart('historical-trend-chart-container', window.DISASTER_DATA.historicalDisasters);
        }

        const eventsList = document.getElementById('historical-events-list');
        if (eventsList) {
            eventsList.innerHTML = '';
            (window.DISASTER_DATA.historicalDisasters || []).forEach(ev => {
                const el = document.createElement('div');
                el.className = 'historical-event-card';
                el.innerHTML = `
                    <div class="hist-card-header">
                        <span class="hist-year font-mono">${ev.year}</span>
                        <span class="hist-title font-semibold">${ev.name}</span>
                        <span class="badge badge-outline">${ev.type}</span>
                    </div>
                    <div class="hist-stats-row">
                        <div>Affected Population: <strong class="font-mono">${ev.affectedPopulation.toLocaleString()}</strong></div>
                        <div>Critical Cells Breached: <strong class="font-mono text-danger">${ev.criticalCellsBreached}</strong></div>
                        <div>Peak Rainfall: <strong class="font-mono">${ev.peakRainfallMm} mm</strong></div>
                        <div>Relocation Needs: <strong class="font-mono text-accent">${ev.relocationTotal.toLocaleString()}</strong></div>
                    </div>
                    <div class="hist-learning">
                        <span class="label">MHA Tactical Takeaway:</span> ${ev.keyLearning}
                    </div>
                `;
                eventsList.appendChild(el);
            });
        }
    }

    /**
     * Setup Simulation View & Controls
     */
    function setupSimulationView() {
        const btnRun = document.getElementById('btn-run-simulation');
        const btnReset = document.getElementById('btn-reset-simulation');
        const scrubberSteps = document.querySelectorAll('.simulation-step-btn');

        if (btnRun) {
            btnRun.addEventListener('click', () => {
                btnRun.disabled = true;
                btnRun.innerHTML = '⏳ Simulating Inundation Surge...';

                window.DISASTER_SIMULATION.runSimulation(null, (hourStep, stepIdx, total) => {
                    updateSimulationScrubberUI(hourStep);
                }, () => {
                    btnRun.disabled = false;
                    btnRun.innerHTML = '▶ Re-run Simulation';
                    updateKPICards();
                });
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.DISASTER_SIMULATION.resetSimulation();
                updateSimulationScrubberUI(0);
                updateKPICards();
                if (btnRun) {
                    btnRun.disabled = false;
                    btnRun.innerHTML = '▶ Run Simulation';
                }
            });
        }

        scrubberSteps.forEach(btn => {
            btn.addEventListener('click', () => {
                const hour = parseInt(btn.getAttribute('data-hour'), 10);
                window.DISASTER_SIMULATION.applyTimeStep(hour);
                updateSimulationScrubberUI(hour);
                updateKPICards();
                if (window.APP_SOUNDS) window.APP_SOUNDS.playBeep();
            });
        });
    }

    function updateSimulationScrubberUI(hour) {
        document.querySelectorAll('.simulation-step-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-hour'), 10) === hour);
        });
        const hourLabel = document.getElementById('sim-current-hour-display');
        if (hourLabel) hourLabel.textContent = `Hour ${hour} / 24`;
    }

    function refreshSimulationView() {
        updateSimulationScrubberUI(window.DISASTER_SIMULATION.config.currentHourStep);
    }

    /**
     * Callback when simulation time-step updates
     */
    function onSimulationUpdated(hourStep) {
        updateKPICards();
        if (selectedCell) {
            const updated = window.DISASTER_DATA.h3Cells.find(c => c.id === selectedCell.id);
            if (updated) openCellInspector(updated);
        }
    }

    /**
     * Open Situation Report (SITREP) Modal
     */
    function openSitRepModal(cell) {
        const modal = document.getElementById('sitrep-modal');
        const modalBody = document.getElementById('sitrep-modal-content');
        if (!modal || !modalBody) return;

        const metrics = window.DISASTER_SIMULATION.getSummaryMetrics();
        const now = new Date().toUTCString();

        modalBody.innerHTML = `
            <div class="sitrep-doc">
                <div class="sitrep-header text-center">
                    <div class="sitrep-emblem">🇮🇳</div>
                    <div class="sitrep-gov font-semibold">MINISTRY OF HOME AFFAIRS / NATIONAL DISASTER MANAGEMENT AUTHORITY</div>
                    <div class="sitrep-sub">National Emergency Operations Centre (NEOC) - New Delhi</div>
                    <h2 class="sitrep-title">TACTICAL SITUATION REPORT (SITREP #26191)</h2>
                    <div class="sitrep-meta font-mono">Date-Time Group: ${now} | Classification: RESTRICTED / OPERATIONAL</div>
                </div>

                <div class="sitrep-section">
                    <h3 class="sitrep-sec-title">1. INCIDENT OVERVIEW & H3 SPATIAL INDEXING</h3>
                    <p>
                        A catastrophic Glacial Lake Outburst Flood (GLOF) and cloudburst event is currently impacting <strong>Sikkim Teesta River Basin (South Lhonak to Rangpo Reach)</strong>.
                        Using Uber H3 Resolution 7 hexagonal spatial indexing, spatial multi-criteria analysis confirms severe dam overtopping at Chungthang and extensive flash inundation across Singtam and Rangpo.
                    </p>
                    <table class="sitrep-table">
                        <tr><td><strong>Total Population at Risk:</strong></td><td class="font-mono">${metrics.totalPopAtRisk.toLocaleString()}</td></tr>
                        <tr><td><strong>Critical Red Zone H3 Cells:</strong></td><td class="font-mono">${metrics.criticalCells} Cells Breached</td></tr>
                        <tr><td><strong>High Risk Orange Cells:</strong></td><td class="font-mono">${metrics.highRiskCells} Cells Alerted</td></tr>
                        <tr><td><strong>Total Evacuation Required:</strong></td><td class="font-mono">${metrics.totalEvacuationRequired.toLocaleString()} Persons</td></tr>
                        <tr><td><strong>Relocation Requirement (Deficit):</strong></td><td class="font-mono text-danger">${metrics.totalRelocationRequired.toLocaleString()} Persons</td></tr>
                        <tr><td><strong>Available Safe High-Ground Capacity:</strong></td><td class="font-mono text-success">${metrics.totalAvailableShelterCapacity.toLocaleString()} Persons</td></tr>
                    </table>
                </div>

                ${cell ? `
                    <div class="sitrep-section">
                        <h3 class="sitrep-sec-title">2. FOCUSED CELL DOSSIER: ${cell.name} (${cell.id})</h3>
                        <table class="sitrep-table">
                            <tr><td><strong>Current Risk Score:</strong></td><td>${cell.currentRisk} / 100 (${cell.riskLevel.toUpperCase()})</td></tr>
                            <tr><td><strong>Population at Risk:</strong></td><td>${cell.population.toLocaleString()} (Vulnerable: ${cell.vulnerablePopulation.total.toLocaleString()})</td></tr>
                            <tr><td><strong>Carrying Capacity Deficit:</strong></td><td>${cell.capacityDeficit ? cell.capacityDeficit.toLocaleString() : 'N/A'}</td></tr>
                            <tr><td><strong>Designated Safe Destination:</strong></td><td>${cell.targetRelocationCell ? 'Gangtok Capital Safe Ridge / Pakyong Plateau' : 'High-Ground Safe Mountain Ridge'}</td></tr>
                            <tr><td><strong>Access Corridor Status:</strong></td><td>${cell.primaryRoad} - ${cell.roadStatus}</td></tr>
                        </table>
                    </div>
                ` : ''}

                <div class="sitrep-section">
                    <h3 class="sitrep-sec-title">3. DIRECTIVES & COMMAND INSTRUCTIONS</h3>
                    <ol>
                        <li>All field commanders shall enforce mandatory evacuation in designated Red Zone cells along the Teesta riverbed.</li>
                        <li>Civil authorities must direct all outbound traffic via elevated mountain passes avoiding submerged sections of NH-10.</li>
                        <li>Safe green destination reception centers at Paljor Stadium (Gangtok) and Pakyong have activated trauma care, emergency food, and winter shelter reserves.</li>
                    </ol>
                </div>
            </div>
        `;

        modal.style.display = 'flex';

        document.getElementById('btn-close-sitrep-modal').onclick = () => {
            modal.style.display = 'none';
        };
        document.getElementById('btn-print-sitrep').onclick = () => {
            window.print();
        };
    }

    // Expose public API
    return {
        init,
        navigateTo,
        openCellInspector,
        updateKPICards,
        onSimulationUpdated,
        openSitRepModal
    };
})();
