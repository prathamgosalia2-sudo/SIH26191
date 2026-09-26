/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Real-Time Disaster Simulation Engine & Dynamic Impact Recalculation
 */

window.DISASTER_SIMULATION = (function() {
    // Current simulation parameters
    let config = {
        disasterType: 'Glacial Lake Outburst Flood (GLOF) & Dam Breach',
        severityLevel: 4, // 1 to 5
        rainfallMm: 380,
        waterLevelRiseM: 4.8,
        durationHours: 24,
        affectedSector: 'Sikkim Teesta River Basin (Chungthang - Singtam - Rangpo Reach)',
        currentHourStep: 24 // 0, 6, 12, 24
    };

    let isRunning = false;
    let timerInterval = null;
    let originalBaselineData = null;

    /**
     * Cache initial baseline state for resetting
     */
    function cacheBaseline() {
        if (!originalBaselineData && window.DISASTER_DATA && window.DISASTER_DATA.h3Cells) {
            originalBaselineData = JSON.parse(JSON.stringify(window.DISASTER_DATA.h3Cells));
        }
    }

    /**
     * Apply time-step state across all H3 cells and road networks
     * Step: 0 (Baseline/Safe), 6 (Early Alert), 12 (Embankment Breach), 24 (Peak Red Zone)
     */
    function applyTimeStep(hourStep) {
        cacheBaseline();
        config.currentHourStep = hourStep;

        const cells = window.DISASTER_DATA.h3Cells;
        const roads = window.DISASTER_DATA.roadNetwork;

        cells.forEach((cell, idx) => {
            const base = originalBaselineData.find(b => b.id === cell.id) || cell;

            if (hourStep === 0) {
                // Hour 0: Baseline - Mostly Safe Green / Yellow
                if (base.baselineRisk >= 70) {
                    cell.currentRisk = Math.min(48, Math.round(base.baselineRisk * 0.45));
                } else if (base.baselineRisk >= 40) {
                    cell.currentRisk = Math.min(32, Math.round(base.baselineRisk * 0.40));
                } else {
                    cell.currentRisk = Math.max(10, Math.round(base.baselineRisk * 0.50));
                }
                cell.waterLevelM = 0.2;
                cell.rainfallMm = 45;
            } else if (hourStep === 6) {
                // Hour 6: Heavy Rain & Inundation Warning
                if (base.baselineRisk >= 70) {
                    cell.currentRisk = Math.min(74, Math.round(base.baselineRisk * 0.85));
                    cell.waterLevelM = 1.6;
                } else if (base.baselineRisk >= 40) {
                    cell.currentRisk = Math.min(52, Math.round(base.baselineRisk * 0.70));
                    cell.waterLevelM = 0.6;
                } else {
                    cell.currentRisk = Math.min(22, base.baselineRisk);
                    cell.waterLevelM = 0.0;
                }
                cell.rainfallMm = 180;
            } else if (hourStep === 12) {
                // Hour 12: Chungthang Dam Overspill & River Breach
                if (base.baselineRisk >= 70) {
                    cell.currentRisk = Math.min(88, Math.round(base.baselineRisk * 1.15));
                    cell.waterLevelM = 3.2;
                } else if (base.baselineRisk >= 40) {
                    cell.currentRisk = Math.min(72, Math.round(base.baselineRisk * 1.05));
                    cell.waterLevelM = 1.4;
                } else {
                    cell.currentRisk = Math.min(26, base.baselineRisk);
                    cell.waterLevelM = 0.0;
                }
                cell.rainfallMm = 280;
            } else {
                // Hour 24: Peak Red Zone Catastrophe (GLOF Flood Peak)
                if (base.baselineRisk >= 70) {
                    cell.currentRisk = Math.min(96, Math.round(base.baselineRisk * 1.30));
                    cell.waterLevelM = 5.2;
                } else if (base.baselineRisk >= 40) {
                    cell.currentRisk = Math.min(78, Math.round(base.baselineRisk * 1.20));
                    cell.waterLevelM = 2.1;
                } else {
                    cell.currentRisk = Math.min(30, base.baselineRisk);
                    cell.waterLevelM = 0.0;
                }
                cell.rainfallMm = config.rainfallMm;
            }

            // Update classification & carrying capacity deficit
            const capEval = window.H3_ENGINE.evaluateCarryingCapacity(cell);
            cell.carryingCapacity = capEval.effectiveSafeCapacity;
            cell.capacityDeficit = capEval.deficit;
            cell.riskLevel = window.H3_ENGINE.getRiskClassification(cell.currentRisk).level;

            if (cell.currentRisk >= 81) {
                cell.roadStatus = 'Submerged';
            } else if (cell.currentRisk >= 61) {
                cell.roadStatus = 'Congested';
            } else {
                cell.roadStatus = 'Open';
            }
        });

        // Update road network statuses based on hourStep
        roads.forEach(road => {
            if (hourStep === 0) {
                road.status = 'Open';
            } else if (hourStep === 6) {
                if (road.id === 'ROAD-02' || road.id === 'ROAD-08') road.status = 'Congested';
                else road.status = 'Open';
            } else if (hourStep === 12) {
                if (road.id === 'ROAD-02' || road.id === 'ROAD-08') road.status = 'Submerged';
                if (road.id === 'ROAD-03' || road.id === 'ROAD-05') road.status = 'Congested';
            } else {
                // Hour 24
                if (road.id === 'ROAD-02' || road.id === 'ROAD-08' || road.id === 'ROAD-05') road.status = 'Submerged';
                if (road.id === 'ROAD-03') road.status = 'Congested';
                if (road.id === 'ROAD-01' || road.id === 'ROAD-04' || road.id === 'ROAD-07') road.status = 'Open';
            }
        });

        // Trigger updates in app & map
        if (window.APP && window.APP.onSimulationUpdated) {
            window.APP.onSimulationUpdated(hourStep);
        }
        if (window.GIS_MAP) {
            window.GIS_MAP.render();
        }
    }

    /**
     * Run Multi-stage simulation sequence
     */
    function runSimulation(targetConfig, onStepProgress, onComplete) {
        cacheBaseline();
        if (targetConfig) {
            config = Object.assign(config, targetConfig);
        }

        isRunning = true;
        let currentStepIndex = 0;
        const steps = [0, 6, 12, 24];

        if (window.APP_SOUNDS) window.APP_SOUNDS.playAlertTone();

        if (timerInterval) clearInterval(timerInterval);

        // Advance steps sequentially
        timerInterval = setInterval(() => {
            if (!isRunning) {
                clearInterval(timerInterval);
                return;
            }

            const step = steps[currentStepIndex];
            applyTimeStep(step);

            if (onStepProgress) onStepProgress(step, currentStepIndex, steps.length);

            currentStepIndex++;
            if (currentStepIndex >= steps.length) {
                clearInterval(timerInterval);
                isRunning = false;
                if (window.APP_SOUNDS) window.APP_SOUNDS.playAlarm();
                if (onComplete) onComplete();
            }
        }, 1400); // 1.4 seconds per step
    }

    /**
     * Stop or pause simulation
     */
    function stopSimulation() {
        isRunning = false;
        if (timerInterval) clearInterval(timerInterval);
    }

    /**
     * Reset back to 0h Baseline
     */
    function resetSimulation() {
        stopSimulation();
        applyTimeStep(0);
    }

    /**
     * Calculate summary metrics for current simulation state
     */
    function getSummaryMetrics() {
        const cells = window.DISASTER_DATA.h3Cells || [];
        let totalPopAtRisk = 0;
        let criticalCells = 0;
        let highRiskCells = 0;
        let safeCells = 0;
        let totalEvacuationRequired = 0;
        let totalRelocationRequired = 0;
        let totalAvailableShelterCapacity = 0;
        let totalDeficit = 0;

        cells.forEach(c => {
            const risk = c.currentRisk || c.baselineRisk;
            const capEval = window.H3_ENGINE.evaluateCarryingCapacity(c);

            if (risk >= 81) {
                criticalCells++;
                totalPopAtRisk += c.population;
                totalEvacuationRequired += Math.round(c.population * 0.95);
                totalRelocationRequired += capEval.relocationRequired;
            } else if (risk >= 61) {
                highRiskCells++;
                totalPopAtRisk += Math.round(c.population * 0.65);
                totalEvacuationRequired += Math.round(c.population * 0.50);
                totalRelocationRequired += capEval.relocationRequired;
            } else if (risk <= 35) {
                safeCells++;
                totalAvailableShelterCapacity += capEval.surplusCapacity;
            }

            if (capEval.isDeficit) {
                totalDeficit += capEval.deficit;
            }
        });

        // Sum active resources
        const resources = window.DISASTER_DATA.emergencyResources || [];
        const activeResourcesCount = resources.reduce((acc, r) => acc + (r.units || 1), 0);

        return {
            totalPopAtRisk,
            criticalCells,
            highRiskCells,
            safeCells,
            totalEvacuationRequired,
            totalRelocationRequired,
            totalAvailableShelterCapacity,
            totalDeficit,
            activeResourcesCount,
            currentHourStep: config.currentHourStep
        };
    }

    return {
        config,
        applyTimeStep,
        runSimulation,
        stopSimulation,
        resetSimulation,
        getSummaryMetrics
    };
})();
