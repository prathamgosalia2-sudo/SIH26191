/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Uber H3 Hexagonal Spatial Indexing & Mathematical Risk Engine
 * WHOLE-STATE SIKKIM H3 TESSALATED HONEYCOMB GRID
 * Seamless coverage across North, West, East, and South Sikkim
 */

window.H3_ENGINE = (function() {
    const EARTH_RADIUS_KM = 6371;

    // Mathematical Trajectories of Major River Valleys (Used solely for Risk Modeling, NOT drawn on map)
    const TEESTA_VALLEY = [
        [28.05, 88.52], [27.88, 88.54], [27.72, 88.56],
        [27.65, 88.61], [27.6039, 88.6467], [27.53, 88.52],
        [27.5038, 88.5284], [27.42, 88.53], [27.32, 88.51],
        [27.23, 88.50], [27.14, 88.51], [27.06, 88.46]
    ];

    const RANGEET_VALLEY = [
        [27.45, 88.18], [27.37, 88.22], [27.35, 88.28],
        [27.2833, 88.2833], [27.20, 88.29], [27.12, 88.31], [27.06, 88.46]
    ];

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
     * Minimum distance from a coordinate to a river path in km
     */
    function distanceToRiverKm(lat, lng) {
        let minDist = 9999;
        for (let i = 0; i < TEESTA_VALLEY.length; i++) {
            const d = calculateDistanceKm(lat, lng, TEESTA_VALLEY[i][0], TEESTA_VALLEY[i][1]);
            if (d < minDist) minDist = d;
        }
        for (let i = 0; i < RANGEET_VALLEY.length; i++) {
            const d = calculateDistanceKm(lat, lng, RANGEET_VALLEY[i][0], RANGEET_VALLEY[i][1]);
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    /**
     * Geographic boundary predicate for the entire State of Sikkim
     */
    function isInsideSikkim(lat, lng) {
        if (lat < 27.06 || lat > 28.12 || lng < 88.02 || lng > 88.94) return false;

        // North Sikkim northern glaciated wedge (lat > 27.75)
        if (lat > 27.75) {
            const minLng = 88.16 + (lat - 27.75) * 0.32;
            const maxLng = 88.88 - (lat - 27.75) * 0.22;
            return lng >= minLng && lng <= maxLng;
        }

        // South Sikkim southern taper (lat < 27.20)
        if (lat < 27.20) {
            const minLng = 88.10 - (lat - 27.20) * 0.18;
            const maxLng = 88.68 + (lat - 27.20) * 0.35;
            return lng >= minLng && lng <= maxLng;
        }

        // Central Sikkim (27.20 to 27.75)
        return lng >= 88.04 && lng <= 88.92;
    }

    /**
     * Generate 6 vertices for an H3 hexagon polygon given center lat, lng and resolution radius
     */
    function getHexagonBoundary(centerLat, centerLng, radiusDeg = 0.024) {
        const vertices = [];
        const cosLat = Math.cos(centerLat * Math.PI / 180);
        const lngRadius = radiusDeg / (cosLat > 0.01 ? cosLat : 1.0);

        for (let i = 0; i < 6; i++) {
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
                label: 'Critical Red Zone (81 - 100)',
                badge: 'CRITICAL RED ZONE',
                color: '#DC2626',
                glowColor: 'rgba(220, 38, 38, 0.35)',
                strokeColor: '#B91C1C',
                textColor: '#DC2626',
                action: 'Immediate Mandatory Evacuation & Carrying Capacity Breach'
            };
        } else if (score >= 61) {
            return {
                level: 'orange',
                label: 'High Risk Zone (61 - 80)',
                badge: 'HIGH RISK ALERT',
                color: '#EA580C',
                glowColor: 'rgba(234, 88, 12, 0.30)',
                strokeColor: '#C2410C',
                textColor: '#EA580C',
                action: 'Stage-2 Evacuation Advisory & Route Pre-emption'
            };
        } else if (score >= 36) {
            return {
                level: 'moderate',
                label: 'Moderate Risk Zone (36 - 60)',
                badge: 'MODERATE WATCH',
                color: '#D97706',
                glowColor: 'rgba(217, 119, 6, 0.25)',
                strokeColor: '#B45309',
                textColor: '#D97706',
                action: 'Active Hydrological Monitoring & Transport Alerts'
            };
        } else {
            return {
                level: 'safe',
                label: 'Safe / Low Hazard Zone (0 - 35)',
                badge: 'SAFE REFUGE ZONE',
                color: '#16A34A',
                glowColor: 'rgba(22, 163, 74, 0.25)',
                strokeColor: '#15803D',
                textColor: '#16A34A',
                action: 'Designated Safe Relocation Destination & Staging Base'
            };
        }
    }

    /**
     * Multi-Criteria Evaluation (MCDA) Risk Score Calculator
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

        const score = (
            (factors.rainfallImpact || 50) * weights.rainfall +
            (factors.elevationVulnerability || 50) * weights.elevation +
            (factors.populationDensity || 50) * weights.popDensity +
            (factors.infrastructureVulnerability || 50) * weights.infraVuln +
            (factors.distanceToEmergencyServices || 50) * weights.distServices +
            (100 - (factors.roadAccessibility || 50)) * weights.roadAccess
        );

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    /**
     * Carrying Capacity Assessment
     */
    function evaluateCarryingCapacity(currentPopulation, safeThreshold) {
        const deficit = currentPopulation > safeThreshold ? currentPopulation - safeThreshold : 0;
        const surplus = safeThreshold > currentPopulation ? safeThreshold - currentPopulation : 0;
        const ratio = currentPopulation / (safeThreshold || 1);

        let status = 'normal';
        if (ratio > 1.25) status = 'critical_deficit';
        else if (ratio > 1.0) status = 'deficit';
        else if (ratio < 0.6) status = 'surplus';

        return {
            status,
            deficit,
            surplus,
            ratio: +(ratio.toFixed(2)),
            recommendedEvacuees: deficit > 0 ? Math.round(deficit * 1.15) : 0
        };
    }

    /**
     * Find Optimal Safe Relocation Destinations
     */
    function findOptimalRelocationDestinations(sourceCell, allCells, count = 3) {
        const safeCandidates = allCells.filter(c => c.riskLevel === 'safe' && c.id !== sourceCell.id);

        const scoredCandidates = safeCandidates.map(candidate => {
            const distance = calculateDistanceKm(sourceCell.lat, sourceCell.lng, candidate.lat, candidate.lng);
            const surplus = candidate.surplusCapacity || Math.max(0, (candidate.carryingCapacity || 0) - (candidate.population || 0));

            const distScore = Math.max(0, 100 - distance * 2.5);
            const capScore = Math.min(100, (surplus / 5000) * 100);
            const riskSafetyScore = Math.max(0, 100 - (candidate.currentRisk || 15) * 2);

            const suitabilityScore = Math.round(distScore * 0.40 + capScore * 0.35 + riskSafetyScore * 0.25);

            return {
                cell: candidate,
                distanceKm: +(distance.toFixed(1)),
                surplusCapacity: surplus,
                suitabilityScore,
                recommendedRoute: `${sourceCell.primaryRoad || 'Valley Corridor'} → ${candidate.primaryRoad || 'High Ridge Bypass'}`
            };
        });

        scoredCandidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
        return scoredCandidates.slice(0, count);
    }

    /**
     * Generate Comprehensive H3 Hexagonal Honeycomb Grid for the Whole State of Sikkim
     */
    let cachedGrid = null;

    function generateSikkimHexGrid() {
        if (cachedGrid && cachedGrid.length > 100) {
            return cachedGrid;
        }

        const cells = [];
        const R_LAT = 0.024; // ~2.6 km radius, perfect visual scale
        const stepLat = 1.5 * R_LAT; // ~0.036 deg

        const minLat = 27.08;
        const maxLat = 28.10;

        let rowIdx = 0;
        let cellCounter = 100;

        for (let lat = minLat; lat <= maxLat; lat += stepLat) {
            const cosLat = Math.cos(lat * Math.PI / 180);
            const stepLng = (Math.sqrt(3) * R_LAT) / (cosLat > 0.01 ? cosLat : 1.0);
            const rowOffset = (rowIdx % 2 === 1) ? stepLng * 0.5 : 0;

            for (let lng = 88.04 + rowOffset; lng <= 88.94; lng += stepLng) {
                if (!isInsideSikkim(lat, lng)) {
                    continue;
                }

                cellCounter++;

                const distRiver = distanceToRiverKm(lat, lng);

                // District attribution
                let district = 'Mangan (North Sikkim)';
                if (lat < 27.42 && lng < 88.35) {
                    district = 'Gyalshing (West Sikkim)';
                } else if (lat < 27.35 && lng >= 88.35 && lng < 88.60) {
                    district = 'Namchi (South Sikkim)';
                } else if (lat < 27.45 && lng >= 88.52) {
                    district = 'Gangtok (East Sikkim)';
                }

                // Topographical elevation
                let elevation = 1600;
                if (lat > 27.75) {
                    elevation = Math.round(3200 + (lat - 27.75) * 4500);
                } else if (lat > 27.50) {
                    elevation = Math.round(1400 + distRiver * 150);
                } else if (distRiver < 2.5) {
                    elevation = Math.round(420 + distRiver * 110);
                } else {
                    elevation = Math.round(1350 + distRiver * 140);
                }

                // Risk categorization based on terrain & river proximity
                let riskScore = 20;
                let riskLevel = 'safe';
                let hazardType = 'Safe High-Ground Sanctuary';
                let roadStatus = 'Open';
                let waterLevelM = 0;
                let pop = Math.round(1400 + ((lat * 1000 + lng * 1000) % 1800));

                if (distRiver <= 2.2 && lat <= 27.75 && lat >= 27.15) {
                    if (distRiver <= 1.0) {
                        riskScore = Math.min(98, Math.max(82, Math.round(96 - distRiver * 12)));
                        riskLevel = 'critical';
                        hazardType = 'Fluvial Inundation Surge Corridor';
                        roadStatus = 'Submerged';
                        waterLevelM = +(4.2 + ((cellCounter % 15) / 10)).toFixed(1);
                        pop = Math.round(2800 + ((cellCounter * 137) % 2100));
                    } else {
                        riskScore = Math.min(80, Math.max(62, Math.round(78 - (distRiver - 1.0) * 12)));
                        riskLevel = 'orange';
                        hazardType = 'Alluvial Terrace Backwater Buffer';
                        roadStatus = 'Congested';
                        waterLevelM = +(1.2 + ((cellCounter % 10) / 10)).toFixed(1);
                        pop = Math.round(2200 + ((cellCounter * 113) % 1800));
                    }
                } else if (distRiver <= 5.0) {
                    riskScore = Math.min(58, Math.max(38, Math.round(56 - (distRiver - 2.2) * 6)));
                    riskLevel = 'moderate';
                    hazardType = 'Slope Runoff & Rill Erosion';
                    roadStatus = 'Open';
                    waterLevelM = 0;
                    pop = Math.round(1800 + ((cellCounter * 97) % 1600));
                } else {
                    riskScore = Math.min(32, Math.max(10, Math.round(26 - Math.min(15, (distRiver - 5.0) * 2))));
                    riskLevel = 'safe';
                    hazardType = 'Safe Refuge Sanctuary';
                    roadStatus = 'Open';
                    waterLevelM = 0;
                    pop = Math.round(1600 + ((cellCounter * 83) % 2200));
                }

                // Carrying Capacity
                let currentCap = Math.round(pop * 1.5);
                let safeCap = Math.round(pop * 2.0);
                let capacityDeficit = 0;
                if (riskLevel === 'critical') {
                    currentCap = Math.round(pop * 0.15);
                    safeCap = Math.round(pop * 0.90);
                    capacityDeficit = Math.max(1100, pop - currentCap);
                } else if (riskLevel === 'orange') {
                    currentCap = Math.round(pop * 0.45);
                    safeCap = Math.round(pop * 1.05);
                    capacityDeficit = Math.max(0, pop - currentCap);
                } else if (riskLevel === 'safe') {
                    currentCap = Math.round(pop * 4.5);
                    safeCap = Math.round(pop * 5.0);
                }

                const boundary = getHexagonBoundary(lat, lng, R_LAT);
                const cellId = `892834d${lat.toFixed(2).replace('.', '')}${lng.toFixed(2).replace('.', '')}fff`;

                cells.push({
                    id: cellId,
                    name: `${district.split(' ')[0]} H3 Sector ${cellCounter}`,
                    sector: district,
                    district: district,
                    lat: +(lat.toFixed(4)),
                    lng: +(lng.toFixed(4)),
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
                    nearestShelter: riskLevel === 'safe' ? 'Elevated Ridge Sanctuary Hub' : 'Pelling High Ridge Mega Sanctuary',
                    shelterCapacity: riskLevel === 'safe' ? 32000 : 8000,
                    shelterDistanceKm: +(1.5 + distRiver * 0.7).toFixed(1),
                    evacuationTimeHours: +(0.8 + distRiver * 0.2).toFixed(1),
                    nearbyHospitals: ['District Hospital Mangan', 'District Hospital Gyalshing', 'STNM Hospital Gangtok'],
                    roadStatus: roadStatus,
                    primaryRoad: roadStatus === 'Submerged' ? 'Valley Highway (Submerged)' : 'Mountain Ridge Bypass Road',
                    waterLevelM: waterLevelM,
                    rainfallMm: Math.round(220 + (cellCounter % 90)),
                    factors: {
                        historicalDisasters: Math.round(riskScore / 10),
                        rainfallImpact: Math.min(100, riskScore + 4),
                        elevationVulnerability: Math.max(10, 100 - Math.round(elevation / 45)),
                        populationDensity: Math.round((pop / 4000) * 100),
                        infrastructureVulnerability: riskScore,
                        distanceToEmergencyServices: Math.round(distRiver * 8),
                        roadAccessibility: roadStatus === 'Submerged' ? 12 : 90
                    }
                });
            }
            rowIdx++;
        }

        // Pin the primary hazard cell: Chungthang Dam & Teesta Fluvial Basin
        const primaryIdx = cells.findIndex(c => calculateDistanceKm(c.lat, c.lng, 27.6039, 88.6467) < 3.8);
        if (primaryIdx !== -1) {
            cells[primaryIdx].id = '892834d2d2bffff';
            cells[primaryIdx].name = 'Chungthang Dam & Teesta Fluvial Basin';
            cells[primaryIdx].district = 'Mangan (North Sikkim)';
            cells[primaryIdx].sector = 'Mangan District · Upper Teesta Gorge Reach';
            cells[primaryIdx].currentRisk = 97;
            cells[primaryIdx].baselineRisk = 89;
            cells[primaryIdx].riskLevel = 'critical';
            cells[primaryIdx].hazardType = 'GLOF & Flash Flood Surge';
            cells[primaryIdx].elevation = 1790;
            cells[primaryIdx].population = 3640;
            cells[primaryIdx].capacityDeficit = 1850;
            cells[primaryIdx].carryingCapacity = 850;
            cells[primaryIdx].safeCapacityThreshold = 8500;
            cells[primaryIdx].nearestShelter = 'Kabi Lungchok High Ridge Sanctuary';
            cells[primaryIdx].waterLevelM = 6.2;
            cells[primaryIdx].rainfallMm = 385;
            cells[primaryIdx].roadStatus = 'Submerged';
        }

        // Pin Legship hazard cell
        const legshipIdx = cells.findIndex(c => calculateDistanceKm(c.lat, c.lng, 27.2833, 88.2833) < 3.8);
        if (legshipIdx !== -1) {
            cells[legshipIdx].id = '892834d2d1bffff';
            cells[legshipIdx].name = 'Legship Rangeet River Lowland Floor';
            cells[legshipIdx].district = 'Gyalshing (West Sikkim)';
            cells[legshipIdx].currentRisk = 96;
            cells[legshipIdx].riskLevel = 'critical';
            cells[legshipIdx].hazardType = 'Fluvial Inundation & Dam Breach';
            cells[legshipIdx].elevation = 520;
            cells[legshipIdx].population = 4850;
            cells[legshipIdx].capacityDeficit = 3750;
            cells[legshipIdx].nearestShelter = 'Gyalshing District HQ High Ridge';
            cells[legshipIdx].roadStatus = 'Submerged';
        }

        // Pin Pelling Safe Sanctuary
        const pellingIdx = cells.findIndex(c => calculateDistanceKm(c.lat, c.lng, 27.3167, 88.2333) < 3.8);
        if (pellingIdx !== -1) {
            cells[pellingIdx].id = '892834d2d09ffff';
            cells[pellingIdx].name = 'Pelling High Ridge Mega Sanctuary';
            cells[pellingIdx].district = 'Gyalshing (West Sikkim)';
            cells[pellingIdx].currentRisk = 12;
            cells[pellingIdx].riskLevel = 'safe';
            cells[pellingIdx].hazardType = 'Safe Refuge Sanctuary';
            cells[pellingIdx].elevation = 2150;
            cells[pellingIdx].population = 4200;
            cells[pellingIdx].carryingCapacity = 35000;
            cells[pellingIdx].surplusCapacity = 30800;
            cells[pellingIdx].capacityDeficit = 0;
            cells[pellingIdx].roadStatus = 'Open';
        }

        cachedGrid = cells;
        return cells;
    }

    return {
        calculateDistanceKm,
        getHexagonBoundary,
        getRiskClassification,
        calculateMCDARiskScore,
        evaluateCarryingCapacity,
        findOptimalRelocationDestinations,
        generateSikkimHexGrid,
        generateManaliHexGrid: generateSikkimHexGrid,
        generateKoshiHexGrid: generateSikkimHexGrid,
        generateHexGrid: generateSikkimHexGrid
    };
})();
