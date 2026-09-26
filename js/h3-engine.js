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

        return {
            effectiveSafeCapacity,
            deficit: deficit,
            isDeficit: deficit > 0,
            relocationRequired: deficit > 0 ? deficit : 0,
            surplusCapacity: deficit < 0 ? Math.abs(deficit) : 0,
            statusLabel: deficit > 0 ? 'CRITICAL DEFICIT (Relocation Needed)' : 'SAFE SURPLUS BUFFER'
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

    return {
        calculateDistanceKm,
        getHexagonBoundary,
        getRiskClassification,
        calculateMCDARiskScore,
        evaluateCarryingCapacity,
        findOptimalRelocationDestinations
    };
})();
