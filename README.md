# 🛡️ PRISM — Predictive Risk Intelligence & Spatial Management
### Smart India Hackathon (SIH26191) Prototype
**“Intelligent Identification of Hazard-Based Red Zone Carrying Capacity, Assessment, and Relocation Needs”**  
*Target Authority: Ministry of Home Affairs (MHA) / National Disaster Management Authority (NDMA)*  
*Disaster Scenario: Sikkim Teesta River Basin Glacial Lake Outburst Flood (GLOF) & Flash Inundation*

---

## 📌 1. Project Overview & Problem Statement Compliance Matrix

### 🎯 Official SIH Problem Statement (Detailed):
> **Background:** India’s disaster-prone regions face recurring hazards such as landslides, floods, coastal erosion, and cloudbursts. Vulnerable habitations often remain in unsafe zones, leading to repeated loss of lives and property. Current relocation efforts are largely reactive, initiated after disasters strike, rather than proactively planned.  
> **Description:** The initiative seeks to develop an intelligent, GIS-enabled decision support platform. This platform will dynamically identify and update multi-hazard Red Zones (areas unsuitable for permanent habitation), assess the carrying capacity of safer alternative sites, and prioritize vulnerable habitations for relocation. The system will integrate hazard intensity, population vulnerability, and disaster history to guide evidence-based decisions.  
> **Expected Solution:** A robust, AI-driven GIS platform that maps and updates hazard-based Red Zones in real time, assesses suitability and carrying capacity of safer relocation sites, prioritizes vulnerable habitations for **immediate, short-term, and medium-term relocation**, and provides actionable insights to State Disaster Management Authorities for proactive planning.

### 🛡️ How PRISM Meets Every Requirement of the Problem Statement:

| PS Core Requirement | PRISM Implementation in Codebase | Technical Verification |
| :--- | :--- | :--- |
| **1. Dynamic Multi-Hazard Red Zone Mapping** | Maps GLOFs, flash floods, and slope hazards across an Uber H3 hexagonal grid (Resolution 7). When river surge (+5.2m) or extreme rain occurs, cells dynamically cross thresholds into **Critical Red Zones (81–100)** where habitability is unviable. | `js/h3-engine.js` (`calculateMCDARiskScore`) & `js/simulation.js` (`applyTimeStep`) |
| **2. Hazard Intensity Integration** | Evaluates real-time telemetry: rainfall (mm), inundation depth (m), slope steepness, elevation MSL, and road accessibility. | `js/simulation.js` & `js/data.js` (`factors`) |
| **3. Population Vulnerability Micro-Data** | Tracks demographic micro-data per H3 cell: Total population, infants (0–5y), elderly (65+y), persons with disabilities (PwD), and pregnant women. | `js/data.js` (`vulnerablePopulation`) & Cell Inspector Drawer |
| **4. Disaster History Integration** | Incorporates historical catastrophic events (2023 South Lhonak GLOF, 2021 Teesta flash floods, 2018 cloudbursts, 2011 earthquake) into spatial vulnerability weighting. | `js/data.js` (`historicalDisasters`) & Module 7 (`#view-historical`) |
| **5. Carrying Capacity & Deficit Analysis** | Mathematical model calculating habitability collapse under crisis vs safe capacity threshold. Computes exact **Pax Deficits** and **Safe Surplus Buffers** to prevent over-allocation. | `js/h3-engine.js` (`evaluateCarryingCapacity`) & Module 3 (`#view-capacity`) |
| **6. Suitability of Safer Relocation Sites** | Evaluates candidate high-ground ridges (Gangtok, Pakyong, Namchi, Ravangla) by surplus capacity, Level-1/2 trauma hospitals, ICU beds, shelter food/water days, and power resilience. | `js/data.js` (`shelters`, `hospitals`) & Module 6 (`#view-resources`) |
| **7. 3-Tier Relocation Prioritization** | Classifies habitations into: <br>• **🔴 Immediate (<24h):** Active Red Zone life threat & collapsed capacity.<br>• **🟠 Short-Term (1–4 Weeks):** High-risk Orange zones & pre-monsoon staging.<br>• **🟡 Medium-Term (3–12 Months):** Permanent planned resettlement from chronic floodplains. | `js/h3-engine.js`, `js/app.js` (`refreshEvacuationView`, `refreshRelocationView`) |
| **8. Actionable Insights for SDMA / NDMA** | Generates formal MHA / NDMA Operational Situation Reports (SitReps), incident action plans, and fleet dispatch directives for SNT buses, NDRF, and Army airbridges. | `js/app.js` (`openSitRepModal`, `btn-approve-all-relocations`) |

---

## 🗺️ 2. Comprehensive Mapped Features (Numbered Point Format)

The system features and operational capabilities are mapped below in numbered point format:

### Point 1: PRISM Tactical High-Command Interface & Telemetry Header
- **Unified Branding**: Clear high-tech PRISM identification displaying system name, descriptive tagline, and official hackathon identifier (`SIH26191`).
- **DEFCON Live Alert Status**: Prominent visual indicator (`ALERT LEVEL 4: CRITICAL BASIN BREACH`) with animated warning pulse reflecting real-time threat severity.
- **Dual Military Time Synchronizer**: Live clock displaying synchronized Indian Standard Time (IST) and Coordinated Universal Time (UTC) for inter-agency coordination.
- **Quick Action Triggers**: Instant-access buttons for viewing the decision workflow pipeline modal and exporting formal situation reports.

### Point 2: Dual-Trigger Compact Dropdown Navigation Menu (`Menu ▼`)
- **Space-Efficient Menu Trigger**: Minimalist `Menu ▼` button (76px width) replacing bulky sidebar panels to maximize visible map real estate.
- **Dual Accessibility**: Accessible both from the fixed top command header and as a floating button in the upper-left of the GIS map stage.
- **8 Modular Views**: Direct one-click switching between Overview, Hazard Assessment, Carrying Capacity, Evacuation, Relocation, Resources, Historical Analysis, and Simulation.
- **Frictionless UX**: Automatic dropdown dismissal upon option selection, outside click detection, or pressing the `Escape` key.

### Point 3: Expanded 224-Cell Uber H3 Hexagonal Spatial Indexing Grid
- **Wide Spatial Coverage**: 16 rows × 14 columns of discrete H3 hexagonal cells spanning the entire Sikkim Teesta basin from North Sikkim glaciers down to the plains.
- **Concentric Two-Layer Outward Expansion**: Outer ring layers prevent viewport boundary clipping and encompass receiving high-ground ridges.
- **Equidistant Non-Overlapping Topology**: Equal-area hexagonal cells ensure uniform multi-criteria spatial scoring and neighbor relationship consistency.

### Point 4: Multi-Tier Color-Coded Hazard Risk Level Classification
- **🔴 Critical Red Zone (Risk Score: 81–100)**: Catastrophic inundation, local carrying capacity collapsed, mandatory immediate evacuation active.
- **🟠 High Risk Zone (Risk Score: 61–80)**: Severe surge advisory, road transit restrictions, staged mobilization.
- **🟡 Moderate Risk Zone (Risk Score: 36–60)**: Active surveillance zone, logistical and supply standby.
- **🟢 Safe / Low Hazard Zone (Risk Score: 0–35)**: Stable high-ground receiving ridges (e.g., Gangtok, Pakyong, Rhenock) designated for relocation.

### Point 5: Real-Time User Pinpoint Geolocation & Proximity Detection
- **Live User Location Pin**: Integrates browser GPS Geolocation to render the exact position of field responders or citizens using a red drop-pin marker.
- **Concentric Ping Wave Animation**: Live pulsing radar wave indicating proximity to breached river channels and active red zones.
- **One-Click Re-Center Button**: Dedicated HUD locate button (`📍`) instantly centers and zooms the map onto the user's live coordinates.

### Point 6: Multi-Provider Real GIS Leaflet Basemap Engine
- **Hardware-Accelerated Vector Engine**: Powered by Leaflet.js rendering smooth SVG vectors and interactive polygons directly over geographic tiles.
- **Tactical Basemap Switcher**: On-the-fly selection between multiple map tile providers:
  - *OpenStreetMap (Real Terrestrial)* — Default high-contrast physical map.
  - *USGS Satellite Imagery* — High-resolution orbital terrain photos.
  - *Carto Voyager* — Clean operational navigational cartography.
  - *OpenTopoMap* — Detailed topographical elevation contours and relief.
  - *ESRI Physical Terrain* — Shaded relief showcasing mountain valleys and ridges.

### Point 7: Floating Minimizable H3 Color Meanings Legend
- **Upper-Right Floating Legend Card**: Draggable glassmorphic widget explaining risk score ranges, hazard severity, and operational protocols.
- **Minimizable Pill Mode**: Collapsible with a single click into a compact floating badge to keep map views clear.

### Point 8: High-Contrast Live Emergency Flash Alert Ticker
- **Prominent Tactical Alert Bar**: Deep slate navy background (`rgba(15, 23, 42, 0.98)`) with glowing crimson borders (`#EF4444`) anchored below the KPI ribbon.
- **Pulsing Emergency Badge**: Vivid red `FLASH ALERT` badge with infinite alert pulse.
- **Single-Line Concise Advisory**: Formatted without wordy sentences or ellipsis (`...`) truncation:
  `⚠️ SOUTH LHONAK GLOF: Dam breach (+5.2m surge). Mandatory evacuation active for Singtam & Rangpo.`
- **Ultra-High Contrast**: Bright white text with neon yellow (`#FDE047`) alerts legible against any map background.

### Point 9: Executive Tactical KPI Ribbon Dashboard
- **Population at Risk**: Displays total count of citizens residing inside active critical and high-risk cells.
- **Critical H3 Cells**: Live tally of breached red zones requiring emergency dispatch.
- **Evacuation Capacity Deficit**: Quantifies net overflow population exceeding local safe sheltering capacity.
- **Safe High-Ground H3 Cells**: Number of identified receiving cells with surplus shelter buffers.
- **Active Relocation Corridors**: Number of open, unbreached transit corridors (e.g., National Highway 10).
- **Teesta Peak Discharge Telemetry**: Real-time river sensor discharge rate (e.g., 4,280 m³/s).

### Point 10: Interactive H3 Hexagon Cell Inspector Dossier Drawer
- **Deep-Dive Hexagon Analytics**: Clicking any H3 hexagon or table record slides open an inspection drawer detailing cell parameters:
  - Cell H3 ID and geographic centroid coordinates.
  - Calculated risk score and primary hazard triggers.
  - Total population and vulnerable demographic breakdown (infants, elderly, PwD, pregnant women).
  - Local safe carrying capacity vs. population deficit.
  - Nearest designated emergency shelter and structural integrity index.
  - Road network accessibility status and bridge submergence warnings.

### Point 11: Multi-Factor Hazard Assessment & Sensitivity Sliders (Module 2)
- **Multi-Hazard Event Filter**: Switch between Floods, Slope Landslides, Storm Surges, Seismic Liquefaction, and Wildfire perimeters.
- **Multi-Criteria Decision Analysis (MCDA) Calibration**: Sliders allow command staff to dynamically adjust weights:
  - Rainfall Intensity (mm/hr)
  - Elevation & Slope Steepness (%)
  - Population Density
  - Infrastructure Fragility
  - Critical Services Proximity
  - Road Accessibility Index
- **Interactive SVG Spider / Radar Chart**: Real-time multi-axis visual assessment of vulnerability factors.

### Point 12: Carrying Capacity & Deficit Engine (Module 3)
- **Mathematical Safe Threshold Model**: Evaluates cell-level capacity:
  $$\text{Deficit} = \max(0, \text{Resident Population} - \text{Safe Event Capacity})$$
- **Relocation Trigger**: Automatically flags any cell where $\text{Deficit} > 0$ as requiring immediate external relocation.
- **Visual Comparative Analytics**: Dynamic bar charts contrasting population at risk against available emergency shelter ceilings.

### Point 13: Evacuation Planning & Route Optimization Cockpit (Module 4)
- **Vulnerability-Based Priority Triage**:
  - *Priority 1 (Red)*: Life threat imminent (<2 hours) — Non-ambulatory, elderly, infants.
  - *Priority 2 (Yellow)*: Urgent staged evacuation (<6 hours) — Ambulatory population.
- **Submerged Road Avoidance**: Detects submerged river valley roads and reroutes evacuation convoys along elevated bypass highways.
- **Fleet Dispatch Controller**: Allocates and tracks NDRF powerboats, state transport buses, and ALS ambulances.

### Point 14: Intelligent Relocation Recommendation Engine (Module 5)
- **Multi-Objective Spatial Matching**: Matches critical deficit red cells to high-ground green receiving ridges (Gangtok Ridge, Pakyong Ridge, Rhenock Plateau).
- **Convoy Metrics**: Displays travel distance (km), estimated transit duration (mins), receiving shelter capacity headroom, and trauma center links.
- **One-Click Directive Approval**: Authorizes master relocation orders and synchronizes transit manifests.

### Point 15: Emergency Resources & Facilities Inventory (Module 6)
- **Designated Relief Shelters**: Real-time capacity utilization meters and supply status for disaster shelters.
- **Trauma Centers & Hospitals**: Monitors intensive care bed counts, blood bank units, and operational status.
- **Specialized Tactical Assets**: Tracks NDRF battalions, Army task forces, and medical response units.

### Point 16: Longitudinal Historical Disaster Hotspot Analytics (Module 7)
- **Historical Event Database**: Records and analyzes past extreme GLOF and monsoon flood events (2018–2024).
- **Hotspot Persistence Tracking**: Identifies recurring vulnerability patterns in the Teesta river valley for long-term land-use planning.

### Point 17: Interactive Disaster Simulation Studio (Module 8)
- **Time-Step Progression Scrubber**:
  - *Hour 0*: Normal baseline state (green & yellow cells).
  - *Hour 6*: Heavy monsoon rainfall inflow (+1.4m surge).
  - *Hour 12*: Glacial lake breach & dam failure (+2.6m surge, road submergence).
  - *Hour 24*: Peak catastrophic inundation (7 critical red cells, 142k capacity deficit, dynamic relocation recalculation).
- **Live Re-indexing**: Triggers real-time re-coloring of the H3 grid and recalculation of all KPI cards.

### Point 18: Automated Official SITREP (Situation Report) Export
- **Operational Report Generator**: Generates formatted Situation Reports adhering to national disaster management standards.
- **Print & PDF Optimization**: Built-in CSS `@media print` rules generating clean, page-break-optimized documentation.

### Point 19: Tactical Floating HUD Navigation & Compass Controls
- **Ergonomic Control Cluster**: Floating buttons on bottom-right:
  - `📍` Center on User Location Pin
  - `+` Zoom In
  - `−` Zoom Out
  - `⌂` Reset Valley View
- **Compact Multi-Column Layout**: Adapts automatically into a 2-column grid on small viewports so buttons remain bounded on mobile devices.

### Point 20: Mobile & Phone Desktop View Dynamic Viewport Adaptation
- **Dynamic Viewport Units**: Implements `height: 100dvh` to account for dynamic mobile address bars and navigation controls.
- **Safe-Area Inset Protection**: Employs `env(safe-area-inset-bottom)` to ensure bottom controls stay above device home indicators.
- **Zero-Overlap Architecture**: Dropdown `Menu ▼` occupies only 76px, leaving clear horizontal and vertical separation from KPI cards.

### Point 21: Native Web Audio API Sound Synthesizer
- **Self-Contained Audio Engine**: Uses browser `AudioContext` oscillators to generate UI clicks, warning chimes, and emergency sirens.
- **No External Audio Assets**: Completely zero-dependency; functions offline without missing audio file errors.

### Point 22: Zero-Dependency Architecture & Instant Local Deployment
- **Standard Technologies**: 100% native HTML5, modern Vanilla CSS, and modular ES6 JavaScript.
- **Native Windows Web Server**: Includes `start-server.ps1` utilizing .NET `System.Net.HttpListener` for instant execution without installing Node.js or Python.

---

## 💻 3. How to Run the Application Locally

1. **Option A (Instant Direct Open)**:
   - Double-click **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).

2. **Option B (Native PowerShell Web Server)**:
   - Open PowerShell in the project directory and run:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\start-server.ps1
     ```
   - Opens automatically at `http://localhost:8080/`.

---

*PRISM Prototype (SIH26191) — Predictive Risk Intelligence & Spatial Management*
