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
     * Generate mathematically non-overlapping regular hexagonal tessellation grid across Sikkim
     */
    function generateSikkimHexGrid() {
        const REF_LAT = 27.38;
        const cosLat = Math.cos(REF_LAT * Math.PI / 180);
        
        // Exact regular hexagon sizing (radius in latitude and longitude)
        const R_LAT = 0.0215; // ~2.38 km radius
        const R_LNG = R_LAT / cosLat; // ~0.02421 degrees

        const DELTA_LAT = 1.5 * R_LAT; // Vertical step between rows = 0.03225
        const DELTA_LNG = Math.sqrt(3) * R_LNG; // Horizontal step between columns = 0.04193
        const ODD_ROW_OFFSET = 0.5 * DELTA_LNG; // 0.02096

        // Expanded by 2 outer concentric layers in all directions (+2 North, +2 South, +2 West, +2 East)
        const START_LAT = +(27.56 + 2 * DELTA_LAT).toFixed(5);
        const START_LNG = +(88.38 - 2 * DELTA_LNG).toFixed(5);
        const ROWS = 16; // 12 + 4
        const COLS = 14; // 10 + 4

        // Teesta River flood surge spine coordinates
        const teestaSpine = [
            { lat: 27.60, lng: 88.65, name: 'Chungthang' },
            { lat: 27.52, lng: 88.62, name: 'Toong' },
            { lat: 27.42, lng: 88.53, name: 'Dikchu' },
            { lat: 27.33, lng: 88.51, name: 'Singtam North' },
            { lat: 27.24, lng: 88.50, name: 'Singtam' },
            { lat: 27.17, lng: 88.53, name: 'Rangpo' }
        ];

        const cells = [];
        let idCounter = 1;

        for (let r = 0; r < ROWS; r++) {
            const centerLat = START_LAT - r * DELTA_LAT;
            const rowOffset = (r % 2 === 1) ? ODD_ROW_OFFSET : 0;

            for (let c = 0; c < COLS; c++) {
                const centerLng = START_LNG + c * DELTA_LNG + rowOffset;

                // Calculate exact 6 vertices sharing borders with adjacent hexagons with 0 overlap
                const boundary = [];
                for (let i = 0; i < 6; i++) {
                    const angleRad = (60 * i + 30) * Math.PI / 180;
                    const vLat = centerLat + R_LAT * Math.sin(angleRad);
                    const vLng = centerLng + R_LNG * Math.cos(angleRad);
                    boundary.push([vLat, vLng]);
                }

                // Calculate distance to nearest point on Teesta River spine
                let minDistKm = 999;
                for (const pt of teestaSpine) {
                    const d = calculateDistanceKm(centerLat, centerLng, pt.lat, pt.lng);
                    if (d < minDistKm) {
                        minDistKm = d;
                    }
                }

                // Topography & flood physics classification
                let riskScore, riskLevel, hazardType, roadStatus, capacityDeficit, waterLevelM;
                let elevation, pop, safeCap, currentCap;

                const hexId = '886189' + (idCounter.toString(16).padStart(4, '0')) + 'fffff';
                idCounter++;

                if (minDistKm <= 2.2) {
                    // Critical Inundation & GLOF Dam Breach Zone (Teesta Riverbed)
                    riskScore = Math.min(98, Math.round(96 - (minDistKm * 4) + (Math.sin(r + c) * 2)));
                    riskLevel = 'critical';
                    hazardType = 'GLOF / Flash Flood';
                    elevation = Math.round(340 + minDistKm * 80);
                    pop = Math.round(14000 + (r * 1100) % 12000);
                    safeCap = Math.round(pop * 0.9);
                    currentCap = Math.round(pop * 0.1); // Capacity collapsed
                    capacityDeficit = pop - currentCap;
                    waterLevelM = +(3.8 + (Math.sin(r) + 1) * 0.7).toFixed(1);
                    roadStatus = 'Submerged';
                } else if (minDistKm <= 4.5) {
                    // High Risk Landslide & Surge Buffer Zone
                    riskScore = Math.min(80, Math.max(62, Math.round(78 - (minDistKm - 2.2) * 7)));
                    riskLevel = 'orange';
                    hazardType = 'Landslide / Surge Buffer';
                    elevation = Math.round(650 + minDistKm * 120);
                    pop = Math.round(9000 + (c * 900) % 8000);
                    safeCap = Math.round(pop * 1.1);
                    currentCap = Math.round(pop * 0.5);
                    capacityDeficit = Math.max(0, pop - currentCap);
                    waterLevelM = +(1.0 + (Math.cos(c) + 1) * 0.6).toFixed(1);
                    roadStatus = 'Congested';
                } else if (minDistKm <= 7.5) {
                    // Moderate Watch Slope Zone
                    riskScore = Math.min(58, Math.max(38, Math.round(56 - (minDistKm - 4.5) * 5)));
                    riskLevel = 'moderate';
                    hazardType = 'Hydrological Watch';
                    elevation = Math.round(1100 + minDistKm * 90);
                    pop = Math.round(7500 + (r * 700) % 6000);
                    safeCap = Math.round(pop * 1.2);
                    currentCap = safeCap;
                    capacityDeficit = 0;
                    waterLevelM = 0;
                    roadStatus = 'Open';
                } else {
                    // Safe High-Ground Mountain Refuge Sanctuary (Gangtok, Pakyong, Namchi, Ravangla ridges)
                    riskScore = Math.min(32, Math.max(12, Math.round(28 - (minDistKm - 7.5) * 2)));
                    riskLevel = 'safe';
                    hazardType = 'Safe Refuge Center';
                    elevation = Math.round(1450 + (minDistKm * 80) % 650);
                    pop = Math.round(18000 + (c * 1500) % 18000);
                    safeCap = Math.round(pop * 2.2); // Large safe capacity
                    currentCap = safeCap;
                    capacityDeficit = 0;
                    waterLevelM = 0;
                    roadStatus = 'Open';
                }

                // Descriptive location name based on geography
                let cellName = '';
                if (centerLat > 27.50 && centerLng > 88.58) {
                    cellName = (riskLevel === 'critical' ? 'Chungthang Dam Breach Reach' : (riskLevel === 'orange' ? 'Toong Valley Sector' : 'Lachen High Slope'));
                } else if (centerLat > 27.38 && centerLng > 88.56) {
                    cellName = (riskLevel === 'safe' ? 'Gangtok Upper Ridge' : (riskLevel === 'critical' ? 'Dikchu Surge Basin' : 'Mangan District Flank'));
                } else if (centerLat > 27.30 && centerLng > 88.56) {
                    cellName = (riskLevel === 'safe' ? 'Gangtok Capital Safe Ridge' : (riskLevel === 'critical' ? 'Ranipool Flood Basin' : 'Tadong Mid-Slope'));
                } else if (centerLat < 27.28 && centerLat > 27.20 && centerLng > 88.45 && centerLng < 88.55) {
                    cellName = (riskLevel === 'critical' ? 'Singtam Riverine Market Basin' : 'Singtam Buffer Zone');
                } else if (centerLat <= 27.20 && centerLng > 88.48 && centerLng < 88.56) {
                    cellName = (riskLevel === 'critical' ? 'Rangpo Border Gorge' : 'Majitar Lowland Basin');
                } else if (centerLng >= 88.58 && centerLat <= 27.26) {
                    cellName = 'Pakyong High Plateau Sanctuary';
                } else if (centerLng <= 88.45 && centerLat <= 27.24) {
                    cellName = 'Namchi Mountain Sanctuary';
                } else if (centerLng <= 88.45 && centerLat > 27.25) {
                    cellName = 'Ravangla High Crest Refuge';
                } else {
                    const sectorDir = centerLng > 88.58 ? 'East' : (centerLng < 88.50 ? 'West' : 'Central');
                    const sectorElev = centerLat > 27.40 ? 'North' : 'South';
                    cellName = `${sectorElev} Sikkim ${sectorDir} Sector ${r + 1}-${c + 1}`;
                }

                cells.push({
                    id: hexId,
                    name: cellName,
                    sector: `${centerLat > 27.38 ? 'North' : 'South'} Sikkim Teesta Basin`,
                    lat: centerLat,
                    lng: centerLng,
                    row: r,
                    col: c,
                    boundary: boundary,
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
                    nearestShelter: riskLevel === 'safe' ? `${cellName} Community Center` : 'Paljor Stadium Safe Ridge, Gangtok',
                    shelterCapacity: riskLevel === 'safe' ? 12000 : 4500,
                    shelterDistanceKm: Math.round((minDistKm + 1.2) * 10) / 10,
                    evacuationTimeHours: +(1.5 + minDistKm * 0.6).toFixed(1),
                    nearbyHospitals: ['STNM Central Hospital Gangtok', 'Singtam District Unit'],
                    roadStatus: roadStatus,
                    primaryRoad: roadStatus === 'Submerged' ? 'NH-10 (Submerged at Mile 19)' : 'Ridge Bypass Open',
                    waterLevelM: waterLevelM,
                    rainfallMm: Math.round(280 + (r * 15) % 120),
                    factors: {
                        historicalDisasters: Math.round(riskScore / 12),
                        rainfallImpact: Math.min(100, riskScore + 5),
                        elevationVulnerability: Math.max(10, 100 - Math.round(elevation / 20)),
                        populationDensity: Math.round((pop / 30000) * 100),
                        infrastructureVulnerability: riskScore,
                        distanceToEmergencyServices: Math.round(minDistKm * 8),
                        roadAccessibility: roadStatus === 'Submerged' ? 15 : 85
                    }
                });
            }
        }
        return cells;
    }

    return {
        calculateDistanceKm,
        getHexagonBoundary,
        getRiskClassification,
        calculateMCDARiskScore,
        evaluateCarryingCapacity,
        findOptimalRelocationDestinations,
        generateSikkimHexGrid
    };
})();
