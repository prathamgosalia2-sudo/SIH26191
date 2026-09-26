/**
 * SIH26191 - MHA/NDMA Disaster Command System
 * Realistic GIS & H3 Hexagonal Cell Dataset for SIKKIM (Teesta River Basin / GLOF Inundation Corridor)
 * Focus: Chungthang - Mangan - Dikchu - Singtam - Rangpo - Gangtok - Pakyong
 */

window.DISASTER_DATA = (function() {
    // 24 H3 Hexagonal Cells across Sikkim's vulnerable Teesta Basin & High-Ground Relocation Ridges
    const h3Cells = [
        // CRITICAL RED ZONES (Active Inundation & GLOF Surge along Teesta Valley)
        {
            id: '8861892543fffff',
            name: 'Chungthang Dam Breach Reach',
            sector: 'North Sikkim Teesta-III Basin',
            lat: 27.6039,
            lng: 88.6465,
            elevation: 1790.0, // meters MSL
            baselineRisk: 88,
            currentRisk: 96,
            riskLevel: 'critical', // green, yellow, orange, critical
            hazardType: 'Flood', // GLOF / Flash Flood
            population: 12400,
            vulnerablePopulation: {
                total: 3650,
                infants: 980,
                elderly: 1420,
                disabled: 450,
                pregnant: 800
            },
            carryingCapacity: 800, // Safe carrying capacity collapsed due to reservoir overspill
            safeCapacityThreshold: 11000,
            capacityDeficit: 11600,
            nearestShelter: 'Chungthang ITBP Higher Cantonment Ground',
            shelterCapacity: 2500,
            shelterDistanceKm: 2.1,
            evacuationTimeHours: 4.8,
            nearbyHospitals: ['Chungthang Primary Health Centre (Submerged)', 'Mangan District Hospital (24km)'],
            roadStatus: 'Submerged',
            primaryRoad: 'North Sikkim Highway (NH-310A) - Embankment Loss',
            rainfallMm: 380,
            waterLevelM: 5.2,
            factors: {
                historicalDisasters: 8,
                rainfallImpact: 98,
                elevationVulnerability: 95,
                populationDensity: 74,
                infrastructureVulnerability: 96,
                distanceToEmergencyServices: 88,
                roadAccessibility: 12
            },
            recommendedAction: 'Immediate Mandatory Helicopter Extraction & High-Ground Relocation',
            targetRelocationCell: '8861892501fffff' // Gangtok Capital Safe Ridge
        },
        {
            id: '8861892541fffff',
            name: 'Singtam Riverine Market Basin',
            sector: 'East Sikkim Central Teesta Reach',
            lat: 27.2350,
            lng: 88.4980,
            elevation: 350.0, // Lowest elevation pocket in Central Sikkim!
            baselineRisk: 82,
            currentRisk: 94,
            riskLevel: 'critical',
            hazardType: 'Flood',
            population: 26800,
            vulnerablePopulation: {
                total: 7800,
                infants: 2200,
                elderly: 3100,
                disabled: 1050,
                pregnant: 1450
            },
            carryingCapacity: 2400,
            safeCapacityThreshold: 22000,
            capacityDeficit: 24400,
            nearestShelter: 'Singtam Government Senior Secondary High Campus',
            shelterCapacity: 4500,
            shelterDistanceKm: 1.8,
            evacuationTimeHours: 5.6,
            nearbyHospitals: ['Singtam District Hospital (Water Perimeter Watch)', 'STNM Multispecialty Gangtok (26km)'],
            roadStatus: 'Submerged',
            primaryRoad: 'NH-10 Teesta Arterial Highway (Submerged at Indreni Bridge)',
            rainfallMm: 340,
            waterLevelM: 4.6,
            factors: {
                historicalDisasters: 9,
                rainfallImpact: 94,
                elevationVulnerability: 98,
                populationDensity: 96,
                infrastructureVulnerability: 92,
                distanceToEmergencyServices: 65,
                roadAccessibility: 18
            },
            recommendedAction: 'Immediate Mandatory Evacuation (Priority 1) via Pakyong High Corridor',
            targetRelocationCell: '8861892503fffff' // Pakyong Airport Plateau
        },
        {
            id: '8861892545fffff',
            name: 'Rangpo Border Floodplain',
            sector: 'South-East Sikkim Gateway Basin',
            lat: 27.1760,
            lng: 88.5280,
            elevation: 300.0,
            baselineRisk: 78,
            currentRisk: 91,
            riskLevel: 'critical',
            hazardType: 'Flood',
            population: 24500,
            vulnerablePopulation: {
                total: 6900,
                infants: 1950,
                elderly: 2700,
                disabled: 910,
                pregnant: 1340
            },
            carryingCapacity: 3100,
            safeCapacityThreshold: 20000,
            capacityDeficit: 21400,
            nearestShelter: 'Rangpo Mining Ground Elevated Staging Camp',
            shelterCapacity: 5000,
            shelterDistanceKm: 1.4,
            evacuationTimeHours: 4.2,
            nearbyHospitals: ['Rangpo PHC (1.2km)', 'Namchi District Hospital (28km)'],
            roadStatus: 'Submerged',
            primaryRoad: 'NH-10 Siliguri-Gangtok Highway (Severed at Rangpo Checkpost)',
            rainfallMm: 320,
            waterLevelM: 4.1,
            factors: {
                historicalDisasters: 7,
                rainfallImpact: 90,
                elevationVulnerability: 96,
                populationDensity: 92,
                infrastructureVulnerability: 88,
                distanceToEmergencyServices: 58,
                roadAccessibility: 22
            },
            recommendedAction: 'Immediate Evacuation via Rorathang-Rhenock Ridge Bypass',
            targetRelocationCell: '8861892507fffff' // Rhenock Safe Terrace
        },
        {
            id: '8861892547fffff',
            name: 'Dikchu Hydro Confluence Basin',
            sector: 'North-East Teesta Junction',
            lat: 27.4200,
            lng: 88.5250,
            elevation: 680.0,
            baselineRisk: 75,
            currentRisk: 89,
            riskLevel: 'critical',
            hazardType: 'Flood',
            population: 14200,
            vulnerablePopulation: {
                total: 4100,
                infants: 1100,
                elderly: 1650,
                disabled: 520,
                pregnant: 830
            },
            carryingCapacity: 1800,
            safeCapacityThreshold: 12000,
            capacityDeficit: 12400,
            nearestShelter: 'Dikchu Power Station High Concourse',
            shelterCapacity: 3200,
            shelterDistanceKm: 2.2,
            evacuationTimeHours: 4.5,
            nearbyHospitals: ['Dikchu Dispensary (1.5km)', 'STNM Gangtok (18km)'],
            roadStatus: 'Damaged',
            primaryRoad: 'Dikchu-Gangtok Spine (Mudflows at Mile 4)',
            rainfallMm: 310,
            waterLevelM: 3.8,
            factors: {
                historicalDisasters: 8,
                rainfallImpact: 92,
                elevationVulnerability: 90,
                populationDensity: 76,
                infrastructureVulnerability: 90,
                distanceToEmergencyServices: 72,
                roadAccessibility: 25
            },
            recommendedAction: 'Priority-1 Evacuation to Gangtok Northern Ridge',
            targetRelocationCell: '8861892501fffff' // Gangtok Capital Safe Ridge
        },
        {
            id: '8861892549fffff',
            name: 'Toong - Naga Landslide Gorge',
            sector: 'Upper Teesta Squeeze',
            lat: 27.5450,
            lng: 88.6320,
            elevation: 1520.0,
            baselineRisk: 80,
            currentRisk: 92,
            riskLevel: 'critical',
            hazardType: 'Landslide',
            population: 9800,
            vulnerablePopulation: {
                total: 2800,
                infants: 780,
                elderly: 1120,
                disabled: 360,
                pregnant: 540
            },
            carryingCapacity: 900,
            safeCapacityThreshold: 8500,
            capacityDeficit: 8900,
            nearestShelter: 'Naga Village Monastery High Ground',
            shelterCapacity: 1800,
            shelterDistanceKm: 1.5,
            evacuationTimeHours: 5.2,
            nearbyHospitals: ['Mangan Hospital (12km)'],
            roadStatus: 'Damaged',
            primaryRoad: 'North Sikkim Highway - Landslide Toe Washout',
            rainfallMm: 360,
            waterLevelM: 3.5,
            factors: {
                historicalDisasters: 9,
                rainfallImpact: 95,
                elevationVulnerability: 88,
                populationDensity: 65,
                infrastructureVulnerability: 94,
                distanceToEmergencyServices: 85,
                roadAccessibility: 15
            },
            recommendedAction: 'Immediate Ropeway & Helo Extraction of Stranded Mountain Hamlets',
            targetRelocationCell: '8861892509fffff' // Ravangla High Buffer
        },
        {
            id: '8861892551fffff',
            name: 'Dzongu Lepcha Reserve Lowlands',
            sector: 'Protected Indigenous Basin',
            lat: 27.4800,
            lng: 88.4600,
            elevation: 920.0,
            baselineRisk: 74,
            currentRisk: 88,
            riskLevel: 'critical',
            hazardType: 'Flood',
            population: 8600,
            vulnerablePopulation: {
                total: 2500,
                infants: 690,
                elderly: 1020,
                disabled: 310,
                pregnant: 480
            },
            carryingCapacity: 1100,
            safeCapacityThreshold: 7500,
            capacityDeficit: 7500,
            nearestShelter: 'Passingdang Lepcha High Concourse',
            shelterCapacity: 2200,
            shelterDistanceKm: 2.8,
            evacuationTimeHours: 5.8,
            nearbyHospitals: ['Passingdang PHC (2.1km)'],
            roadStatus: 'Damaged',
            primaryRoad: 'Sankalang Bamboo Suspension Bridge (Severed)',
            rainfallMm: 325,
            waterLevelM: 3.2,
            factors: {
                historicalDisasters: 8,
                rainfallImpact: 90,
                elevationVulnerability: 86,
                populationDensity: 52,
                infrastructureVulnerability: 95,
                distanceToEmergencyServices: 90,
                roadAccessibility: 10
            },
            recommendedAction: 'Airdrop Emergency Rations & SDRF Mountain Search Taskforce',
            targetRelocationCell: '8861892505fffff' // Mangan Elevated Ridge
        },
        {
            id: '8861892553fffff',
            name: 'Lachen GLOF Flow Channel',
            sector: 'Far North High Himalayan Valley',
            lat: 27.7150,
            lng: 88.5550,
            elevation: 2750.0,
            baselineRisk: 85,
            currentRisk: 95,
            riskLevel: 'critical',
            hazardType: 'Flood', // South Lhonak outburst surge
            population: 6200,
            vulnerablePopulation: {
                total: 1750,
                infants: 480,
                elderly: 710,
                disabled: 220,
                pregnant: 340
            },
            carryingCapacity: 700,
            safeCapacityThreshold: 5500,
            capacityDeficit: 5500,
            nearestShelter: 'Lachen Army Forward Base Plateau',
            shelterCapacity: 3500,
            shelterDistanceKm: 1.2,
            evacuationTimeHours: 3.8,
            nearbyHospitals: ['Military Field Dispensary (1.0km)'],
            roadStatus: 'Submerged',
            primaryRoad: 'Lachen-Chungthang Gorge Link (Washed away)',
            rainfallMm: 395,
            waterLevelM: 4.8,
            factors: {
                historicalDisasters: 9,
                rainfallImpact: 96,
                elevationVulnerability: 92,
                populationDensity: 45,
                infrastructureVulnerability: 98,
                distanceToEmergencyServices: 94,
                roadAccessibility: 8
            },
            recommendedAction: 'Immediate Army High-Altitude Shelter Intake & Satellite Comms Activation',
            targetRelocationCell: '8861892501fffff' // Gangtok
        },

        // ORANGE ALERT HIGH RISK ZONES (Approaching Capacity Breach)
        {
            id: '8861892555fffff',
            name: 'Mangan Town Slope Reach',
            sector: 'North Sikkim District HQ',
            lat: 27.5050,
            lng: 88.5280,
            elevation: 1310.0,
            baselineRisk: 58,
            currentRisk: 76,
            riskLevel: 'orange',
            hazardType: 'Landslide',
            population: 18400,
            vulnerablePopulation: {
                total: 4800,
                infants: 1300,
                elderly: 1900,
                disabled: 620,
                pregnant: 980
            },
            carryingCapacity: 9200,
            safeCapacityThreshold: 16000,
            capacityDeficit: 9200,
            nearestShelter: 'Mangan District Administrative Complex Ground',
            shelterCapacity: 7500,
            shelterDistanceKm: 0.8,
            evacuationTimeHours: 3.2,
            nearbyHospitals: ['Mangan District Civil Hospital (0.6km)'],
            roadStatus: 'Congested',
            primaryRoad: 'Mangan-Singtam Highway',
            rainfallMm: 270,
            waterLevelM: 1.6,
            factors: {
                historicalDisasters: 6,
                rainfallImpact: 78,
                elevationVulnerability: 68,
                populationDensity: 74,
                infrastructureVulnerability: 72,
                distanceToEmergencyServices: 35,
                roadAccessibility: 52
            },
            recommendedAction: 'Stage-2 Pre-emptive Relocation of Cliffside Settlements to Gangtok',
            targetRelocationCell: '8861892501fffff' // Gangtok
        },
        {
            id: '8861892557fffff',
            name: 'Ranipool Transport Hub',
            sector: 'East Sikkim Confluence Gateway',
            lat: 27.2850,
            lng: 88.5850,
            elevation: 850.0,
            baselineRisk: 55,
            currentRisk: 74,
            riskLevel: 'orange',
            hazardType: 'Flood',
            population: 22100,
            vulnerablePopulation: {
                total: 5800,
                infants: 1550,
                elderly: 2300,
                disabled: 750,
                pregnant: 1200
            },
            carryingCapacity: 11500,
            safeCapacityThreshold: 19500,
            capacityDeficit: 10600,
            nearestShelter: 'Saramsa Garden High Ground Pavilion',
            shelterCapacity: 6000,
            shelterDistanceKm: 1.6,
            evacuationTimeHours: 2.8,
            nearbyHospitals: ['Central Referral Hospital Manipal (3.2km)'],
            roadStatus: 'Congested',
            primaryRoad: 'NH-10 Ranipool Bridge Sector',
            rainfallMm: 250,
            waterLevelM: 2.1,
            factors: {
                historicalDisasters: 5,
                rainfallImpact: 76,
                elevationVulnerability: 70,
                populationDensity: 82,
                infrastructureVulnerability: 68,
                distanceToEmergencyServices: 28,
                roadAccessibility: 58
            },
            recommendedAction: 'Restrict Heavy Convoys; Route Evacuees Eastward to Pakyong Plateau',
            targetRelocationCell: '8861892503fffff' // Pakyong
        },
        {
            id: '8861892559fffff',
            name: 'Lachung Mountain Gateway',
            sector: 'Northeast Valley Reach',
            lat: 27.6900,
            lng: 88.7400,
            elevation: 2700.0,
            baselineRisk: 62,
            currentRisk: 78,
            riskLevel: 'orange',
            hazardType: 'Landslide',
            population: 7400,
            vulnerablePopulation: {
                total: 1900,
                infants: 520,
                elderly: 760,
                disabled: 240,
                pregnant: 380
            },
            carryingCapacity: 3800,
            safeCapacityThreshold: 6800,
            capacityDeficit: 3600,
            nearestShelter: 'Lachung Monastery High Concourse',
            shelterCapacity: 3200,
            shelterDistanceKm: 0.9,
            evacuationTimeHours: 3.4,
            nearbyHospitals: ['Lachung PHC (0.8km)'],
            roadStatus: 'Congested',
            primaryRoad: 'Lachung Valley Road',
            rainfallMm: 290,
            waterLevelM: 1.8,
            factors: {
                historicalDisasters: 6,
                rainfallImpact: 82,
                elevationVulnerability: 72,
                populationDensity: 48,
                infrastructureVulnerability: 75,
                distanceToEmergencyServices: 80,
                roadAccessibility: 42
            },
            recommendedAction: 'Evacuate Riverside Homestays; Tourists Staged at High Monastery',
            targetRelocationCell: '8861892501fffff'
        },

        // MODERATE YELLOW ZONES (Active Hydrological Monitoring)
        {
            id: '8861892561fffff',
            name: 'Tadong Urban Terrace',
            sector: 'Gangtok Suburb Transit Corridor',
            lat: 27.3150,
            lng: 88.6020,
            elevation: 1320.0,
            baselineRisk: 38,
            currentRisk: 52,
            riskLevel: 'moderate',
            hazardType: 'Flood',
            population: 29500,
            vulnerablePopulation: { total: 6100, infants: 1650, elderly: 2450, disabled: 800, pregnant: 1200 },
            carryingCapacity: 23000,
            safeCapacityThreshold: 28000,
            capacityDeficit: 6500,
            nearestShelter: 'Sikkim Manipal Institute Ground',
            shelterCapacity: 8500,
            shelterDistanceKm: 1.1,
            evacuationTimeHours: 1.6,
            nearbyHospitals: ['SMIMS Hospital Tadong (0.5km)'],
            roadStatus: 'Open',
            primaryRoad: 'Indira Bypass Flyover',
            rainfallMm: 165,
            waterLevelM: 0.4,
            factors: { historicalDisasters: 3, rainfallImpact: 52, elevationVulnerability: 45, populationDensity: 84, infrastructureVulnerability: 48, distanceToEmergencyServices: 14, roadAccessibility: 85 },
            recommendedAction: 'Maintain Normal Transit, Stage Relief Supplies for Displaced Persons',
            targetRelocationCell: '8861892501fffff'
        },
        {
            id: '8861892563fffff',
            name: 'Burtuk North Ridge Spur',
            sector: 'North Gangtok Approach',
            lat: 27.3550,
            lng: 88.6180,
            elevation: 1480.0,
            baselineRisk: 34,
            currentRisk: 48,
            riskLevel: 'moderate',
            hazardType: 'Landslide',
            population: 15800,
            vulnerablePopulation: { total: 3200, infants: 850, elderly: 1300, disabled: 410, pregnant: 640 },
            carryingCapacity: 14000,
            safeCapacityThreshold: 17000,
            capacityDeficit: 1800,
            nearestShelter: 'Burtuk Helipad Relief Pavilion',
            shelterCapacity: 6000,
            shelterDistanceKm: 0.6,
            evacuationTimeHours: 1.4,
            nearbyHospitals: ['STNM Hospital (4.5km)'],
            roadStatus: 'Open',
            primaryRoad: 'Burtuk Spine Way',
            rainfallMm: 155,
            waterLevelM: 0.2,
            factors: { historicalDisasters: 2, rainfallImpact: 48, elevationVulnerability: 40, populationDensity: 60, infrastructureVulnerability: 42, distanceToEmergencyServices: 22, roadAccessibility: 88 },
            recommendedAction: 'Helipad Staging Active; Prepared for Air-Bridge Cargo',
            targetRelocationCell: '8861892501fffff'
        },

        // SAFE DESTINATION GREEN ZONES (High Altitude Safe Ridges - Relocation Destinations)
        {
            id: '8861892501fffff',
            name: 'Gangtok Capital Safe Ridge',
            sector: 'Central High Elevation Safe Fortress',
            lat: 27.3389,
            lng: 88.6065,
            elevation: 1650.0, // High Mountain Ridge! Completely immune to Teesta river flash floods
            baselineRisk: 12,
            currentRisk: 16,
            riskLevel: 'safe', // Green Zone
            hazardType: 'Flood',
            population: 32000,
            vulnerablePopulation: {
                total: 5100,
                infants: 1350,
                elderly: 2100,
                disabled: 680,
                pregnant: 970
            },
            carryingCapacity: 95000, // Massive safe carrying capacity!
            safeCapacityThreshold: 110000,
            capacityDeficit: -63000, // Massive SURPLUS of 63,000 safe capacity!
            nearestShelter: 'Paljor Stadium Mega Relief Hub & Gymnasium',
            shelterCapacity: 35000,
            shelterDistanceKm: 0.4,
            evacuationTimeHours: 0.4,
            nearbyHospitals: ['STNM Multispecialty Hospital Sochakgang (Level 1 Trauma)', 'New STNM Medical College'],
            roadStatus: 'Open',
            primaryRoad: 'MG Marg Elevated Spine & National Highway 10A',
            rainfallMm: 95,
            waterLevelM: 0.0,
            factors: {
                historicalDisasters: 0,
                rainfallImpact: 18,
                elevationVulnerability: 8,
                populationDensity: 42,
                infrastructureVulnerability: 14,
                distanceToEmergencyServices: 6,
                roadAccessibility: 98
            },
            recommendedAction: 'PRIMARY STATE RELOCATION RECEPTION ZONE: Field Hospital & Food Supply Active',
            targetRelocationCell: null
        },
        {
            id: '8861892503fffff',
            name: 'Pakyong Airport Plateau',
            sector: 'East Sikkim Elevated Safe Tableland',
            lat: 27.2280,
            lng: 88.5900,
            elevation: 1400.0, // High tableland safe from river surges
            baselineRisk: 14,
            currentRisk: 18,
            riskLevel: 'safe',
            hazardType: 'Flood',
            population: 18500,
            vulnerablePopulation: {
                total: 3100,
                infants: 810,
                elderly: 1250,
                disabled: 410,
                pregnant: 630
            },
            carryingCapacity: 72000,
            safeCapacityThreshold: 85000,
            capacityDeficit: -53500, // Surplus of 53,500!
            nearestShelter: 'Pakyong Aviation Logistics Hangar & St. Xavier Complex',
            shelterCapacity: 28000,
            shelterDistanceKm: 0.8,
            evacuationTimeHours: 0.6,
            nearbyHospitals: ['Pakyong District Civil Hospital (1.2km)'],
            roadStatus: 'Open',
            primaryRoad: 'Pakyong Green Expressway Corridor',
            rainfallMm: 105,
            waterLevelM: 0.0,
            factors: {
                historicalDisasters: 0,
                rainfallImpact: 20,
                elevationVulnerability: 10,
                populationDensity: 32,
                infrastructureVulnerability: 15,
                distanceToEmergencyServices: 15,
                roadAccessibility: 96
            },
            recommendedAction: 'SECONDARY RELOCATION RECEPTION HUB: Aviation Airbridge & Convoy Reception',
            targetRelocationCell: null
        },
        {
            id: '8861892505fffff',
            name: 'Namchi District Safe Ridge',
            sector: 'South Sikkim Safe Mountain Ridge',
            lat: 27.1660,
            lng: 88.3630,
            elevation: 1315.0,
            baselineRisk: 15,
            currentRisk: 19,
            riskLevel: 'safe',
            hazardType: 'Flood',
            population: 21000,
            vulnerablePopulation: {
                total: 3600,
                infants: 920,
                elderly: 1480,
                disabled: 490,
                pregnant: 710
            },
            carryingCapacity: 58000,
            safeCapacityThreshold: 68000,
            capacityDeficit: -37000, // Surplus of 37,000!
            nearestShelter: 'Bhaichung Stadium Mega Relief Pavilion',
            shelterCapacity: 22000,
            shelterDistanceKm: 0.5,
            evacuationTimeHours: 0.7,
            nearbyHospitals: ['Namchi District Hospital (Level 2 Trauma) (0.9km)'],
            roadStatus: 'Open',
            primaryRoad: 'Namchi-Jorethang High Spine Road',
            rainfallMm: 110,
            waterLevelM: 0.0,
            factors: {
                historicalDisasters: 0,
                rainfallImpact: 22,
                elevationVulnerability: 12,
                populationDensity: 35,
                infrastructureVulnerability: 16,
                distanceToEmergencyServices: 18,
                roadAccessibility: 94
            },
            recommendedAction: 'SOUTH REGION RELOCATION DESTINATION: Receiving Singtam & Rangpo Evacuees',
            targetRelocationCell: null
        },
        {
            id: '8861892507fffff',
            name: 'Rhenock Safe Terrace',
            sector: 'East Sikkim Border High Ground',
            lat: 27.1750,
            lng: 88.6400,
            elevation: 1050.0,
            baselineRisk: 18,
            currentRisk: 22,
            riskLevel: 'safe',
            hazardType: 'Flood',
            population: 14200,
            vulnerablePopulation: {
                total: 2400,
                infants: 620,
                elderly: 980,
                disabled: 320,
                pregnant: 480
            },
            carryingCapacity: 45000,
            safeCapacityThreshold: 52000,
            capacityDeficit: -30800, // Surplus of 30,800
            nearestShelter: 'Sikkim Government College Rhenock Complex',
            shelterCapacity: 16000,
            shelterDistanceKm: 1.1,
            evacuationTimeHours: 0.8,
            nearbyHospitals: ['Rhenock Primary Health Centre (1.4km)'],
            roadStatus: 'Open',
            primaryRoad: 'Rorathang-Rhenock Ridge Highway',
            rainfallMm: 115,
            waterLevelM: 0.0,
            factors: {
                historicalDisasters: 1,
                rainfallImpact: 24,
                elevationVulnerability: 14,
                populationDensity: 30,
                infrastructureVulnerability: 18,
                distanceToEmergencyServices: 25,
                roadAccessibility: 92
            },
            recommendedAction: 'EAST RELOCATION DEPOT: Directing Rangpo Traffic via Reshi Corridor',
            targetRelocationCell: null
        },
        {
            id: '8861892509fffff',
            name: 'Ravangla High Mountain Pass',
            sector: 'South-Central Alpine Safe Buffer',
            lat: 27.3070,
            lng: 88.3630,
            elevation: 2100.0, // High Alpine Plateau
            baselineRisk: 11,
            currentRisk: 15,
            riskLevel: 'safe',
            hazardType: 'Flood',
            population: 9800,
            vulnerablePopulation: {
                total: 1600,
                infants: 410,
                elderly: 650,
                disabled: 210,
                pregnant: 330
            },
            carryingCapacity: 38000,
            safeCapacityThreshold: 45000,
            capacityDeficit: -28200, // Surplus of 28,200
            nearestShelter: 'Tathagata Tsal High Ground Complex',
            shelterCapacity: 18000,
            shelterDistanceKm: 0.9,
            evacuationTimeHours: 0.7,
            nearbyHospitals: ['Ravangla Primary Health Centre (1.1km)'],
            roadStatus: 'Open',
            primaryRoad: 'Ravangla-Legship Mountain Highway',
            rainfallMm: 90,
            waterLevelM: 0.0,
            factors: {
                historicalDisasters: 0,
                rainfallImpact: 16,
                elevationVulnerability: 6,
                populationDensity: 20,
                infrastructureVulnerability: 12,
                distanceToEmergencyServices: 30,
                roadAccessibility: 90
            },
            recommendedAction: 'ALPINE RELOCATION BUFFER: Military Heli-Drop & Field Staging Operations',
            targetRelocationCell: null
        },
        {
            id: '8861892511fffff',
            name: 'Soreng Agricultural Terrace',
            sector: 'West Sikkim High Foothills',
            lat: 27.1650,
            lng: 88.2050,
            elevation: 1450.0,
            baselineRisk: 16,
            currentRisk: 20,
            riskLevel: 'safe',
            hazardType: 'Flood',
            population: 12400,
            vulnerablePopulation: { total: 2100, infants: 550, elderly: 860, disabled: 290, pregnant: 400 },
            carryingCapacity: 35000,
            safeCapacityThreshold: 42000,
            capacityDeficit: -22600,
            nearestShelter: 'Soreng Community High Concourse',
            shelterCapacity: 14000,
            shelterDistanceKm: 1.2,
            evacuationTimeHours: 0.9,
            nearbyHospitals: ['Soreng District Hospital (1.5km)'],
            roadStatus: 'Open',
            primaryRoad: 'Soreng-Nayabazar Arterial',
            rainfallMm: 100,
            waterLevelM: 0.0,
            factors: { historicalDisasters: 0, rainfallImpact: 20, elevationVulnerability: 10, populationDensity: 28, infrastructureVulnerability: 16, distanceToEmergencyServices: 32, roadAccessibility: 89 },
            recommendedAction: 'West Safe Buffer Active; Field Relief Kitchens Ready',
            targetRelocationCell: null
        }
    ];

    // Arterial Road Networks across Sikkim (Teesta Valley Corridor)
    const roadNetwork = [
        { id: 'ROAD-01', name: 'NH-10 Siliguri-Rangpo-Singtam Arterial', fromCell: '8861892545fffff', toCell: '8861892541fffff', status: 'Submerged', lanes: 2, maxFlowPph: 0, riskMultiplier: 5.2 },
        { id: 'ROAD-02', name: 'Singtam-Ranipool-Gangtok Highway (NH-10 Spur)', fromCell: '8861892541fffff', toCell: '8861892501fffff', status: 'Congested', lanes: 4, maxFlowPph: 3500, riskMultiplier: 2.1 },
        { id: 'ROAD-03', name: 'Pakyong Elevated Green Highway Bypass', fromCell: '8861892541fffff', toCell: '8861892503fffff', status: 'Open', lanes: 4, maxFlowPph: 6800, riskMultiplier: 1.0 },
        { id: 'ROAD-04', name: 'North Sikkim Highway (Dikchu-Mangan)', fromCell: '8861892547fffff', toCell: '8861892555fffff', status: 'Damaged', lanes: 2, maxFlowPph: 600, riskMultiplier: 3.8 },
        { id: 'ROAD-05', name: 'Chungthang-Toong Gorge Road', fromCell: '8861892543fffff', toCell: '8861892549fffff', status: 'Submerged', lanes: 2, maxFlowPph: 0, riskMultiplier: 5.8 },
        { id: 'ROAD-06', name: 'Gangtok-Burtuk High Spine Expressway', fromCell: '8861892501fffff', toCell: '8861892563fffff', status: 'Open', lanes: 4, maxFlowPph: 7200, riskMultiplier: 1.0 },
        { id: 'ROAD-07', name: 'Rangpo-Rhenock High Elevation Corridor', fromCell: '8861892545fffff', toCell: '8861892507fffff', status: 'Open', lanes: 2, maxFlowPph: 4500, riskMultiplier: 1.1 },
        { id: 'ROAD-08', name: 'Namchi-Singtam Ridge Bypass (via Temi)', fromCell: '8861892541fffff', toCell: '8861892505fffff', status: 'Open', lanes: 2, maxFlowPph: 4200, riskMultiplier: 1.2 }
    ];

    // Dedicated Emergency Shelters across Sikkim
    const shelters = [
        { id: 'SH-01', name: 'Paljor Stadium Mega Relief Hub & Gymnasium', cellId: '8861892501fffff', capacity: 35000, currentOccupancy: 9200, availableCapacity: 25800, status: 'Active Reception', foodWaterDays: 28, medicalUnits: 18, powerBackup: 'Dual 500kVA GenSet + Solar Grid' },
        { id: 'SH-02', name: 'Pakyong Aviation Logistics Hangar Complex', cellId: '8861892503fffff', capacity: 28000, currentOccupancy: 6400, availableCapacity: 21600, status: 'Active Reception', foodWaterDays: 24, medicalUnits: 15, powerBackup: 'Airport Dedicated Dual Substation' },
        { id: 'SH-03', name: 'Bhaichung Stadium Mega Pavilion (Namchi)', cellId: '8861892505fffff', capacity: 22000, currentOccupancy: 4800, availableCapacity: 17200, status: 'Active Reception', foodWaterDays: 20, medicalUnits: 12, powerBackup: 'Diesel Generators + Solar Backup' },
        { id: 'SH-04', name: 'Tathagata Tsal High Ground Complex (Ravangla)', cellId: '8861892509fffff', capacity: 18000, currentOccupancy: 3100, availableCapacity: 14900, status: 'Active Reception', foodWaterDays: 30, medicalUnits: 10, powerBackup: 'Monastery Clean Microgrid' },
        { id: 'SH-05', name: 'Sikkim Government College Rhenock Complex', cellId: '8861892507fffff', capacity: 16000, currentOccupancy: 3800, availableCapacity: 12200, status: 'Active Reception', foodWaterDays: 15, medicalUnits: 8, powerBackup: 'High Power GenSet' },
        { id: 'SH-06', name: 'Singtam Government Senior Secondary Camp', cellId: '8861892541fffff', capacity: 4500, currentOccupancy: 4500, availableCapacity: 0, status: 'AT CAPACITY BREACH', foodWaterDays: 2, medicalUnits: 4, powerBackup: 'Submerged / Generator Offline' },
        { id: 'SH-07', name: 'Chungthang ITBP Forward Ground', cellId: '8861892543fffff', capacity: 2500, currentOccupancy: 2500, availableCapacity: 0, status: 'COMPROMISED (Water Surrounding)', foodWaterDays: 3, medicalUnits: 3, powerBackup: 'Solar Inverter Only' }
    ];

    // Major Hospitals & Medical Facilities in Sikkim
    const hospitals = [
        { id: 'HOSP-01', name: 'STNM Multispecialty Hospital Sochakgang (Gangtok)', cellId: '8861892501fffff', beds: 1200, icuBeds: 160, availableIcu: 52, traumaCare: 'Level 1 Trauma Centre', status: 'Optimal / Safe Mountain Ridge', lat: 27.322, lng: 88.601 },
        { id: 'HOSP-02', name: 'Central Referral Hospital Manipal (Tadong)', cellId: '8861892561fffff', beds: 650, icuBeds: 85, availableIcu: 22, traumaCare: 'Level 1 Trauma', status: 'Operational / Heavy Load', lat: 27.312, lng: 88.598 },
        { id: 'HOSP-03', name: 'Namchi District Civil Hospital', cellId: '8861892505fffff', beds: 450, icuBeds: 50, availableIcu: 18, traumaCare: 'Level 2 Trauma', status: 'Optimal / Safe Zone', lat: 27.168, lng: 88.360 },
        { id: 'HOSP-04', name: 'Pakyong District Hospital', cellId: '8861892503fffff', beds: 250, icuBeds: 35, availableIcu: 14, traumaCare: 'Level 2 Trauma', status: 'Operational / Safe Corridor', lat: 27.225, lng: 88.588 },
        { id: 'HOSP-05', name: 'Singtam District Hospital', cellId: '8861892541fffff', beds: 180, icuBeds: 20, availableIcu: 2, traumaCare: 'Level 2 Trauma', status: 'EVACUATION IN PROGRESS (Flooding Perimeter)', lat: 27.238, lng: 88.495 },
        { id: 'HOSP-06', name: 'Mangan District Hospital', cellId: '8861892555fffff', beds: 200, icuBeds: 25, availableIcu: 6, traumaCare: 'Level 2 Trauma', status: 'High Load / Landslide Perimeter Watch', lat: 27.502, lng: 88.525 },
        { id: 'HOSP-07', name: 'Chungthang Primary Health Centre', cellId: '8861892543fffff', beds: 40, icuBeds: 4, availableIcu: 0, traumaCare: 'Level 3 Rural Emergency', status: 'INOPERATIVE (Basement Inundated by GLOF)', lat: 27.605, lng: 88.648 }
    ];

    // Emergency Response Teams & Specialized Himalayan Assets
    const emergencyResources = [
        { id: 'RES-01', type: 'NDRF 2nd Battalion (Sikkim Platoon)', category: 'Swift Water & Mountain Rescue', units: 16, boats: 24, personnel: 160, deployedCell: '8861892541fffff', status: 'Active Rescue', task: 'Evacuating flooded Singtam commercial core' },
        { id: 'RES-02', type: 'Indian Army Trishakti Corps Engineers', category: 'Heavy Amphibious & Bailey Bridge Taskforce', units: 12, helo: 6, personnel: 320, deployedCell: '8861892543fffff', status: 'Active Extraction', task: 'Operating Chungthang airbridge & ropeway evacuations' },
        { id: 'RES-03', type: 'SDRF Sikkim Quick Reaction Force', category: 'Alpine Search & Evacuation', units: 14, vehicles: 28, personnel: 120, deployedCell: '8861892547fffff', status: 'Active Rescue', task: 'Dikchu valley slope search & extraction' },
        { id: 'RES-04', type: 'Indian Air Force (IAF) Eastern Command Rotary Fleet', category: 'Airborne Medical Evacuation (MI-17 / ALH)', units: 8, helo: 8, personnel: 48, deployedCell: '8861892503fffff', status: 'Active Airbridge', task: 'Pakyong Airport to Chungthang trauma airlift' },
        { id: 'RES-05', type: 'Sikkim Nationalised Transport (SNT) Evacuation Fleet', category: 'High-Altitude Bus & Heavy Convoy', units: 95, buses: 95, personnel: 140, deployedCell: '8861892501fffff', status: 'Active Transit', task: 'Shuttling evacuees from Singtam bypass to Paljor Stadium' },
        { id: 'RES-06', type: '108 Advanced Life Support (ALS) Mountain Ambulances', category: 'Critical Care Mobile Units', units: 36, ambulances: 36, personnel: 72, deployedCell: '8861892501fffff', status: 'Dispatched', task: 'Transferring ICU patients from Singtam to STNM Hospital' },
        { id: 'RES-07', type: 'Border Roads Organisation (BRO Project Swastik)', category: 'Road Clearance & Rock-Excavation', units: 20, bulldozers: 35, personnel: 180, deployedCell: '8861892545fffff', status: 'Debris Clearance', task: 'Clearing landslide blockages on Rangpo-Rhenock bypass' },
        { id: 'RES-08', type: 'Central Water Commission (CWC) Teesta Sensor Grid', category: 'Hydrological Telemetry Sensor Squad', units: 8, sensors: 16, personnel: 16, deployedCell: '8861892541fffff', status: 'Continuous Telemetry', task: 'Monitoring Teesta surge levels and lake discharge velocity' }
    ];

    // Historical Disasters in the Sikkim Teesta Valley
    const historicalDisasters = [
        {
            year: 2023,
            name: 'South Lhonak Glacial Lake Outburst Flood (GLOF)',
            type: 'GLOF & Dam Breach Deluge',
            affectedPopulation: 88500,
            criticalCellsBreached: 7,
            peakRainfallMm: 395,
            evacuationTotal: 32400,
            relocationTotal: 48600,
            maxCarryingCapacityDeficit: 84000,
            durationDays: 8,
            keyLearning: 'Chungthang dam washed away; established that Teesta river valley floor must be completely evacuated to Gangtok and Pakyong ridges.'
        },
        {
            year: 2021,
            name: 'Severe Teesta Monsoon Flash Floods',
            type: 'Riverine Flash Inundation',
            affectedPopulation: 42000,
            criticalCellsBreached: 5,
            peakRainfallMm: 290,
            evacuationTotal: 18200,
            relocationTotal: 22000,
            maxCarryingCapacityDeficit: 38000,
            durationDays: 5,
            keyLearning: 'Singtam market and Rangpo lowlands inundated within 90 minutes of upper cloudburst.'
        },
        {
            year: 2018,
            name: 'Sikkim Cloudburst & Landslide Surge',
            type: 'Compound Slope Collapse & River Damming',
            affectedPopulation: 54000,
            criticalCellsBreached: 6,
            peakRainfallMm: 320,
            evacuationTotal: 21500,
            relocationTotal: 28000,
            maxCarryingCapacityDeficit: 45000,
            durationDays: 6,
            keyLearning: 'NH-10 severed at multiple locations, demonstrating need for intelligent alternative ridge routing.'
        },
        {
            year: 2011,
            name: 'Great Sikkim Himalayan Earthquake & Landslides',
            type: 'M6.9 Seismic Slope Failure',
            affectedPopulation: 110000,
            criticalCellsBreached: 12,
            peakRainfallMm: 180,
            evacuationTotal: 45000,
            relocationTotal: 62000,
            maxCarryingCapacityDeficit: 95000,
            durationDays: 14,
            keyLearning: 'Identified Gangtok and Namchi ridges as the only structural high-capacity shelters.'
        }
    ];

    // Relocation Matching Allocations for Sikkim (Deficit Cells -> Safe High Ridges)
    const relocationAllocations = [
        {
            sourceCellId: '8861892541fffff', // Singtam (Critical, Deficit: 24,400)
            targetCellId: '8861892503fffff', // Pakyong Airport Plateau (Surplus: 53,500)
            allocatedPopulation: 24400,
            distanceKm: 18.2,
            travelTimeMinutes: 42,
            corridorStatus: 'Pakyong Green Elevated Highway (Open)',
            medicalSupport: 'Pakyong District Hospital & Aviation Field Infirmary',
            priority: 'P1 - Immediate',
            transitMode: 'SNT Heavy Bus Fleet & 4x4 Mountain Transport'
        },
        {
            sourceCellId: '8861892543fffff', // Chungthang (Critical, Deficit: 11,600)
            targetCellId: '8861892501fffff', // Gangtok Capital Safe Ridge (Surplus: 63,000)
            allocatedPopulation: 11600,
            distanceKm: 42.5,
            travelTimeMinutes: 75,
            corridorStatus: 'North Sikkim Highway Ridge Link + Airbridge',
            medicalSupport: 'STNM Multispecialty Hospital Gangtok',
            priority: 'P1 - Life Threat',
            transitMode: 'IAF Helo Airbridge + High-Ground Military Convoys'
        },
        {
            sourceCellId: '8861892545fffff', // Rangpo (Critical, Deficit: 21,400)
            targetCellId: '8861892507fffff', // Rhenock Safe Terrace (Surplus: 30,800)
            allocatedPopulation: 21400,
            distanceKm: 15.6,
            travelTimeMinutes: 36,
            corridorStatus: 'Rorathang-Rhenock High Ridge Highway',
            medicalSupport: 'Rhenock PHC & Field Relief Station',
            priority: 'P1 - Immediate',
            transitMode: 'SNT Buses & Civil Defence Fleets'
        },
        {
            sourceCellId: '8861892547fffff', // Dikchu (Critical, Deficit: 12,400)
            targetCellId: '8861892501fffff', // Gangtok Capital Safe Ridge
            allocatedPopulation: 12400,
            distanceKm: 19.8,
            travelTimeMinutes: 45,
            corridorStatus: 'Dikchu-Burtuk Ridge Spine (Open)',
            medicalSupport: 'STNM Hospital Gangtok',
            priority: 'P1 - Immediate',
            transitMode: 'SDRF Mountain All-Terrain Vehicles & Shuttles'
        },
        {
            sourceCellId: '8861892549fffff', // Toong - Naga (Critical, Deficit: 8,900)
            targetCellId: '8861892509fffff', // Ravangla High Mountain Pass (Surplus: 28,200)
            allocatedPopulation: 8900,
            distanceKm: 34.2,
            travelTimeMinutes: 68,
            corridorStatus: 'Ravangla-Legship High Alpine Bypass',
            medicalSupport: 'Ravangla Primary Health Centre & Camp',
            priority: 'P1 - Life Threat',
            transitMode: 'Army 4x4 Troop Carriers & Ropeway Shuttles'
        },
        {
            sourceCellId: '8861892551fffff', // Dzongu (Critical, Deficit: 7,500)
            targetCellId: '8861892505fffff', // Namchi Safe Ridge (Surplus: 37,000)
            allocatedPopulation: 7500,
            distanceKm: 38.0,
            travelTimeMinutes: 70,
            corridorStatus: 'Namchi-Temi Mountain Expressway',
            medicalSupport: 'Namchi District Hospital Trauma Centre',
            priority: 'P1 - Immediate',
            transitMode: 'Mountain Search & Rescue Transport Squad'
        }
    ];

    // If H3 Engine is loaded, use mathematically non-overlapping hexagonal tessellation grid
    const tessellatedGrid = (window.H3_ENGINE && typeof window.H3_ENGINE.generateSikkimHexGrid === 'function')
        ? window.H3_ENGINE.generateSikkimHexGrid()
        : h3Cells;

    return {
        h3Cells: tessellatedGrid,
        fallbackH3Cells: h3Cells,
        roadNetwork,
        shelters,
        hospitals,
        emergencyResources,
        historicalDisasters,
        relocationAllocations
    };
})();
