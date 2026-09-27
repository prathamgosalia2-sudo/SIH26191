/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Uber H3 Hexagonal Spatial Indexing & Mathematical Risk Engine
 */

window.H3_ENGINE = (function() {
    // Earth radius in km
    const EARTH_RADIUS_KM = 6371;

    /**
     * Compute Haversine distance between two coordinates in kilometers
     */
    function calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Generate 6 vertices for an H3 hexagon polygon given center lat, lng and resolution radius
     * Orientation: Flat-topped or pointy-topped hexagon. Uber H3 standard orientation has 30-degree rotation.
     */
    function getHexagonBoundary(centerLat, centerLng, radiusDeg = 0.016) {
        const vertices = [];
        // Longitudinal scaling to compensate for spherical latitude distortion
        const cosLat = Math.cos(centerLat * Math.PI / 180);
        const lngRadius = radiusDeg / (cosLat > 0.01 ? cosLat : 1.0);

        for (let i = 0; i < 6; i++) {
            // 30 degree offset for standard H3 orientation
            const angleRad = (60 * i + 30) * Math.PI / 180;
            const lat = centerLat + radiusDeg * Math.sin(angleRad);
            const lng = centerLng + lngRadius * Math.cos(angleRad);
            vertices.push([lat, lng]);
        }
        return vertices;
    }

    /**
     * Get Risk Classification based on Score (0 - 100)
     */
    function getRiskClassification(score) {
        if (score >= 81) {
            return {
                level: 'critical',
                label: 'Critical Hazard Zone (Red Zone)',
                badge: 'CRITICAL RED ZONE',
                color: '#EF4444',
                glowColor: 'rgba(239, 68, 68, 0.45)',
                strokeColor: '#B91C1C',
                textColor: '#FCA5A5',
                action: 'Immediate Mandatory Evacuation & Carrying Capacity Breach'
            };
        } else if (score >= 61) {
            return {
                level: 'orange',
                label: 'High Risk Alert (Orange Zone)',
                badge: 'HIGH RISK ALERT',
                color: '#F97316',
                glowColor: 'rgba(249, 115, 22, 0.35)',
                strokeColor: '#C2410C',
                textColor: '#FDBA74',
                action: 'Stage-2 Evacuation Advisory & Route Pre-emption'
            };
        } else if (score >= 36) {
            return {
                level: 'moderate',
                label: 'Moderate Hazard Watch (Yellow Zone)',
                badge: 'MODERATE WATCH',
                color: '#FBBF24',
                glowColor: 'rgba(251, 191, 36, 0.3)',
                strokeColor: '#D97706',
                textColor: '#FDE68A',
                action: 'Active Hydrological Monitoring & Transport Alerts'
            };
        } else {
            return {
                level: 'safe',
                label: 'Safe Reception Zone (Green Zone)',
                badge: 'SAFE REFUGE ZONE',
                color: '#10B981',
                glowColor: 'rgba(16, 185, 129, 0.3)',
                strokeColor: '#047857',
                textColor: '#6EE7B7',
                action: 'Designated Safe Relocation Destination & Staging Base'
            };
        }
    }

    /**
     * Multi-Criteria Evaluation (MCDA) Risk Score Calculator
     * Computes dynamically from cell contributing factors & user-adjusted weights
     */
    function calculateMCDARiskScore(factors, customWeights) {
        const weights = customWeights || {
            rainfall: 0.22,
            elevation: 0.18,
            popDensity: 0.18,
            infraVuln: 0.15,
            distServices: 0.12,
            roadAccess: 0.15
        };

        // Normalize weights
        const sumW = weights.rainfall + weights.elevation + weights.popDensity +
                     weights.infraVuln + weights.distServices + weights.roadAccess;
        const norm = sumW > 0 ? sumW : 1.0;

        const rainfallScore = factors.rainfallImpact || 50;
        const elevScore = factors.elevationVulnerability || 50;
        const popScore = factors.populationDensity || 50;
        const infraScore = factors.infrastructureVulnerability || 50;
        const distScore = factors.distanceToEmergencyServices || 50;
        // Low road accessibility increases risk, so invert
        const roadInvertedScore = 100 - (factors.roadAccessibility || 50);

        const weightedTotal = (
            rainfallScore * weights.rainfall +
            elevScore * weights.elevation +
            popScore * weights.popDensity +
            infraScore * weights.infraVuln +
            distScore * weights.distServices +
            roadInvertedScore * weights.roadAccess
        ) / norm;

        return Math.min(100, Math.max(5, Math.round(weightedTotal)));
    }

    /**
     * Carrying Capacity & Deficit Formula:
     * Evaluates local safe carrying capacity under current environmental risk
     */
    function evaluateCarryingCapacity(cell, simulationMultiplier = 1.0) {
        const pop = cell.population;
        const baselineSafe = cell.safeCapacityThreshold;
        const risk = cell.currentRisk || cell.baselineRisk;
        const waterM = (cell.waterLevelM || 0) * simulationMultiplier;

        // Inundation factor severely dampens habitable structures
        let degradationRatio = 1.0;
        if (risk >= 80) {
            // Red Zone: Habitability collapsed to 5-15% of normal
            degradationRatio = Math.max(0.06, 0.20 - (waterM * 0.04));
        } else if (risk >= 60) {
            // Orange Zone: Habitability reduced to 30-50%
            degradationRatio = Math.max(0.25, 0.55 - (waterM * 0.05));
        } else if (risk >= 35) {
            // Yellow Zone: Habitability reduced to 60-75%
            degradationRatio = 0.72;
        } else {
            // Green Zone: High ground, full capacity maintained
            degradationRatio = 1.0;
        }

        const effectiveSafeCapacity = Math.round(baselineSafe * degradationRatio);
        const deficit = pop - effectiveSafeCapacity;

        // Problem Statement Tiered Prioritization (Immediate, Short-Term, Medium-Term)
        let relocationHorizon = 'Safe / Resilient Buffer';
        let relocationPriorityTier = 'Safe';
        if (deficit > 0 && risk >= 75) {
            relocationHorizon = 'Immediate (<24h)';
            relocationPriorityTier = 'Immediate';
        } else if ((deficit > 0 && risk >= 50) || risk >= 60) {
            relocationHorizon = 'Short-Term (1-4w)';
            relocationPriorityTier = 'Short-Term';
        } else if (risk >= 35 || (cell.factors && cell.factors.historicalDisasters >= 6)) {
            relocationHorizon = 'Medium-Term (3-12m)';
            relocationPriorityTier = 'Medium-Term';
        }

        return {
            effectiveSafeCapacity,
            deficit: deficit,
            isDeficit: deficit > 0,
            relocationRequired: deficit > 0 ? deficit : 0,
            surplusCapacity: deficit < 0 ? Math.abs(deficit) : 0,
            statusLabel: deficit > 0 ? 'CRITICAL DEFICIT (Relocation Needed)' : 'SAFE SURPLUS BUFFER',
            relocationHorizon,
            relocationPriorityTier
        };
    }

    /**
     * Intelligent Relocation Recommendation Engine:
     * Matches deficit H3 cells to candidate safe Green cells
     */
    function findOptimalRelocationDestinations(sourceCell, allCells) {
        const capacityAnalysis = evaluateCarryingCapacity(sourceCell);
        const peopleToMove = capacityAnalysis.relocationRequired;

        if (peopleToMove <= 0) {
            return {
                needed: false,
                reason: 'Current H3 Cell has sufficient safe carrying capacity.',
                destinations: []
            };
        }

        // Filter potential safe destinations (Risk <= 35)
        const candidates = allCells
            .filter(c => c.id !== sourceCell.id && (c.currentRisk || c.baselineRisk) <= 35)
            .map(dest => {
                const destCap = evaluateCarryingCapacity(dest);
                const distKm = calculateDistanceKm(sourceCell.lat, sourceCell.lng, dest.lat, dest.lng);
                const estMinutes = Math.round((distKm / 35) * 60) + 10; // 35 km/h emergency convoy speed + 10 min staging

                // Optimization Score: Higher is better
                // Prefers higher surplus capacity, closer distance, higher elevation, open road
                const distanceScore = Math.max(0, 100 - (distKm * 5));
                const capacityScore = Math.min(100, (destCap.surplusCapacity / 1000) * 2);
                const roadScore = dest.factors ? dest.factors.roadAccessibility : 80;
                const compositeScore = Math.round(distanceScore * 0.40 + capacityScore * 0.35 + roadScore * 0.25);

                return {
                    destinationCell: dest,
                    distanceKm: Math.round(distKm * 10) / 10,
                    travelTimeMinutes: estMinutes,
                    availableSurplus: destCap.surplusCapacity,
                    destinationShelter: dest.nearestShelter,
                    shelterCapacity: dest.shelterCapacity,
                    medicalSupport: dest.nearbyHospitals[0] || 'Designated Field Unit',
                    score: compositeScore
                };
            })
            .sort((a, b) => b.score - a.score);

        return {
            needed: true,
            peopleToMove,
            primaryRecommendation: candidates[0] || null,
            allCandidates: candidates
        };
    }

    /**
     * Generate H3 Hexagonal Grid over Manali · Rohtang Corridor (Beas River Basin, Himachal Pradesh)
     * Matches the exact Manali H3 Geofence coordinates [32.2396, 77.1887] and H3 Res 9 cells
     */
    function generateManaliHexGrid() {
        const MANALI_CENTER_LAT = 32.2396;
        const MANALI_CENTER_LNG = 77.1887;
        const H3_RES = 9; // ~174m resolution

        // The 3 primary hazard cells from the Manali H3 geofence snippet
        const explicitHazardCells = [
            '892834d2d2bffff', // Old Manali Road Curve
            '892834d2d37ffff', // Beas Riverbed Lowland
            '892834d2d3fffff'  // Bahang Embankment Breach
        ];

        // Beas River flood surge spine coordinates through Manali Valley (extended along valley floor)
        const beasSpine = [
            { lat: 32.3200, lng: 77.1650, name: 'Kothi Gorge Upper' },
            { lat: 32.3000, lng: 77.1700, name: 'Palchan Upper Reach' },
            { lat: 32.2850, lng: 77.1720, name: 'Palchan Reach' },
            { lat: 32.2600, lng: 77.1840, name: 'Bahang Reach' },
            { lat: 32.2450, lng: 77.1930, name: 'Old Manali Curve' },
            { lat: 32.2396, lng: 77.1887, name: 'Manali Mall Core' },
            { lat: 32.2300, lng: 77.1950, name: 'Aleo Riverside' },
            { lat: 32.2150, lng: 77.1980, name: 'Klash 15-Mile' },
            { lat: 32.1800, lng: 77.1900, name: 'Haripur Lower Basin' }
        ];

        const cells = [];
        let hexList = [];

        // Check if Uber h3-js library is available in window
        if (typeof window.h3 !== 'undefined' && typeof window.h3.latLngToCell === 'function') {
            try {
                const baseCell = window.h3.latLngToCell(32.2432, 77.1935, H3_RES) || '892834d2d2bffff';
                // Radius increased by 5 more blocks/rings (from 7 rings to 12 rings = ~469 cells)
                const disk = window.h3.gridDisk(baseCell, 12);
                // Ensure all explicit hazard cells are present
                explicitHazardCells.forEach(hc => {
                    if (!disk.includes(hc)) disk.push(hc);
                });
                hexList = disk.map(cellId => {
                    const coords = window.h3.cellToLatLng(cellId);
                    const boundary = window.h3.cellToBoundary(cellId).map(p => [p[0], p[1]]);
                    return {
                        id: cellId,
                        lat: coords[0],
                        lng: coords[1],
                        boundary: boundary
                    };
                });
            } catch (e) {
                console.warn('h3-js gridDisk error, using geometric fallback:', e);
            }
        }

        // Geometric fallback if h3-js is not available or returned too few cells (expanded by 5 blocks)
        if (!hexList || hexList.length < 50) {
            const cosLat = Math.cos(MANALI_CENTER_LAT * Math.PI / 180);
            const R_LAT = 0.0022; // ~240m radius
            const R_LNG = R_LAT / cosLat;
            const DELTA_LAT = 1.5 * R_LAT;
            const DELTA_LNG = Math.sqrt(3) * R_LNG;
            const ODD_ROW_OFFSET = 0.5 * DELTA_LNG;

            const ROWS = 25; // Expanded by 5 blocks in each direction
            const COLS = 23; // Expanded by 5 blocks in each direction
            const START_LAT = MANALI_CENTER_LAT + 12 * DELTA_LAT;
            const START_LNG = MANALI_CENTER_LNG - 11 * DELTA_LNG;

            hexList = [];
            let fallbackCounter = 0;

            for (let r = 0; r < ROWS; r++) {
                const centerLat = START_LAT - r * DELTA_LAT;
                const rowOffset = (r % 2 === 1) ? ODD_ROW_OFFSET : 0;

                for (let c = 0; c < COLS; c++) {
                    const centerLng = START_LNG + c * DELTA_LNG + rowOffset;
                    const boundary = [];
                    for (let i = 0; i < 6; i++) {
                        const angleRad = (60 * i + 30) * Math.PI / 180;
                        const vLat = centerLat + R_LAT * Math.sin(angleRad);
                        const vLng = centerLng + R_LNG * Math.cos(angleRad);
                        boundary.push([vLat, vLng]);
                    }

                    let cellId = (fallbackCounter < explicitHazardCells.length)
                        ? explicitHazardCells[fallbackCounter]
                        : '892834' + (fallbackCounter.toString(16).padStart(4, '0')) + 'fffff';
                    fallbackCounter++;

                    hexList.push({
                        id: cellId,
                        lat: centerLat,
                        lng: centerLng,
                        boundary: boundary
                    });
                }
            }
        }

        // Process and categorize every H3 cell
        hexList.forEach((hex, idx) => {
            const centerLat = hex.lat;
            const centerLng = hex.lng;
            const cellId = hex.id;

            // Distance to Beas river spine in km
            let minDistKm = 999;
            for (const pt of beasSpine) {
                const d = calculateDistanceKm(centerLat, centerLng, pt.lat, pt.lng);
                if (d < minDistKm) minDistKm = d;
            }

            const isExplicitHazard = explicitHazardCells.includes(cellId);

            let riskScore, riskLevel, hazardType, roadStatus, capacityDeficit, waterLevelM;
            let elevation, pop, safeCap, currentCap;

            if (isExplicitHazard || minDistKm <= 0.35) {
                // Critical Hazard Zone (Active Beas River Inundation & Sharp Road Curve)
                riskScore = isExplicitHazard ? 96 : Math.min(98, Math.round(95 - (minDistKm * 15)));
                riskLevel = 'critical';
                hazardType = 'Beas River Flash Inundation';
                elevation = Math.round(2040 + (minDistKm * 40));
                pop = Math.round(1800 + (idx * 230) % 2400);
                safeCap = Math.round(pop * 0.95);
                currentCap = Math.round(pop * 0.10); // Collapsed carrying capacity
                capacityDeficit = pop - currentCap;
                waterLevelM = +(3.8 + (Math.sin(idx) + 1) * 0.6).toFixed(1);
                roadStatus = 'Submerged';
            } else if (minDistKm <= 0.85) {
                // High Risk Alert Zone (River Terrace & Lowland Buffer)
                riskScore = Math.min(80, Math.max(62, Math.round(78 - (minDistKm - 0.35) * 28)));
                riskLevel = 'orange';
                hazardType = 'Slope Surcharge / Buffer';
                elevation = Math.round(2080 + (minDistKm * 80));
                pop = Math.round(2200 + (idx * 180) % 1800);
                safeCap = Math.round(pop * 1.05);
                currentCap = Math.round(pop * 0.45);
                capacityDeficit = Math.max(0, pop - currentCap);
                waterLevelM = +(0.8 + (Math.cos(idx) + 1) * 0.4).toFixed(1);
                roadStatus = 'Congested';
            } else if (minDistKm <= 1.6) {
                // Moderate Watch Slope Zone
                riskScore = Math.min(58, Math.max(38, Math.round(56 - (minDistKm - 0.85) * 18)));
                riskLevel = 'moderate';
                hazardType = 'Hydrological Watch';
                elevation = Math.round(2140 + (minDistKm * 90));
                pop = Math.round(2800 + (idx * 310) % 2100);
                safeCap = Math.round(pop * 1.2);
                currentCap = safeCap;
                capacityDeficit = 0;
                waterLevelM = 0;
                roadStatus = 'Open';
            } else {
                // Safe High-Ground Sanctuary (ABVIMAS Ridge, Vashisht Crest, Solang Safe Plateau)
                riskScore = Math.min(32, Math.max(12, Math.round(28 - (minDistKm - 1.6) * 6)));
                riskLevel = 'safe';
                hazardType = 'Safe Refuge Center';
                elevation = Math.round(2250 + (minDistKm * 110));
                pop = Math.round(3500 + (idx * 420) % 3000);
                safeCap = Math.round(pop * 2.8); // Large safe reserve
                currentCap = safeCap;
                capacityDeficit = 0;
                waterLevelM = 0;
                roadStatus = 'Open';
            }

            // Descriptive landmark name based on Manali topography
            let cellName = '';
            if (cellId === '892834d2d2bffff') {
                cellName = 'Old Manali Bridge & Curve Sector';
            } else if (cellId === '892834d2d37ffff') {
                cellName = 'Beas Riverbed Lowland Core';
            } else if (cellId === '892834d2d3fffff') {
                cellName = 'Bahang Inundation Embankment';
            } else if (centerLat > 32.250 && centerLng < 77.185) {
                cellName = (riskLevel === 'safe' ? 'Solang High Alpine Plateau' : 'Palchan River Confluence');
            } else if (centerLat > 32.245 && centerLng > 77.195) {
                cellName = (riskLevel === 'safe' ? 'Vashisht Thermal High Ridge' : 'Vashisht Lower Bridge Flank');
            } else if (centerLat < 32.235 && centerLng < 77.185) {
                cellName = (riskLevel === 'safe' ? 'ABVIMAS High Mountaineering Campus' : 'Log Huts Hillside Watch');
            } else if (centerLat < 32.235 && centerLng >= 77.185) {
                cellName = (riskLevel === 'critical' ? 'Aleo - Manali Highway Riverside' : 'Prini Left Bank Terrace');
            } else if (centerLat >= 32.238 && centerLat <= 32.245 && centerLng <= 77.192) {
                cellName = (riskLevel === 'safe' ? 'Old Manali Pine Ridge Safe Zone' : 'Club House - Beas Inundation');
            } else {
                const sectorDir = centerLng > 77.1887 ? 'East' : 'West';
                const sectorLat = centerLat > 32.2396 ? 'North' : 'South';
                cellName = `Manali ${sectorLat}-${sectorDir} Sector ${idx + 1}`;
            }

            cells.push({
                id: cellId,
                name: cellName,
                sector: 'Manali · Rohtang Corridor (Beas River Basin)',
                lat: centerLat,
                lng: centerLng,
                boundary: hex.boundary,
                elevation: elevation,
                baselineRisk: riskScore,
                currentRisk: riskScore,
                riskLevel: riskLevel,
                hazardType: hazardType,
                population: pop,
                vulnerablePopulation: {
                    total: Math.round(pop * 0.28),
                    infants: Math.round(pop * 0.07),
                    elderly: Math.round(pop * 0.11),
                    disabled: Math.round(pop * 0.04),
                    pregnant: Math.round(pop * 0.06)
                },
                carryingCapacity: currentCap,
                safeCapacityThreshold: safeCap,
                capacityDeficit: capacityDeficit,
                surplusCapacity: Math.max(0, currentCap - pop),
                nearestShelter: riskLevel === 'safe' ? `${cellName} Relief Center` : 'ABVIMAS Mountaineering Complex, Manali',
                shelterCapacity: riskLevel === 'safe' ? 30000 : 4000,
                shelterDistanceKm: Math.round((minDistKm + 0.8) * 10) / 10,
                evacuationTimeHours: +(0.8 + minDistKm * 0.5).toFixed(1),
                nearbyHospitals: ['Civil Hospital Manali (Left Bank)', 'Mission Hospital Manali'],
                roadStatus: roadStatus,
                primaryRoad: roadStatus === 'Submerged' ? 'NH-3 Beas Corridor (Submerged at Mile 14 Curve)' : 'Atal Tunnel High Highway Bypass',
                waterLevelM: waterLevelM,
                rainfallMm: Math.round(280 + (idx * 12) % 100),
                factors: {
                    historicalDisasters: Math.round(riskScore / 12),
                    rainfallImpact: Math.min(100, riskScore + 4),
                    elevationVulnerability: Math.max(10, 100 - Math.round(elevation / 25)),
                    populationDensity: Math.round((pop / 5000) * 100),
                    infrastructureVulnerability: riskScore,
                    distanceToEmergencyServices: Math.round(minDistKm * 10),
                    roadAccessibility: roadStatus === 'Submerged' ? 12 : 88
                }
            });
        });

        return cells;
    }

    return {
        calculateDistanceKm,
        getHexagonBoundary,
        getRiskClassification,
        calculateMCDARiskScore,
        evaluateCarryingCapacity,
        findOptimalRelocationDestinations,
        generateManaliHexGrid,
        generateSikkimHexGrid: generateManaliHexGrid // Backward-compatibility alias
    };
})();
