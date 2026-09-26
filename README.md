# 🛡️ MHA-NDMA RESILIENT-HEX COMMAND SYSTEM
### Smart India Hackathon (SIH26191) Prototype
**“Intelligent Identification of Hazard Based Red Zone Carrying Capacity, Assessment and Relocation Needs”**  
*Developed for: Ministry of Home Affairs (MHA) / National Disaster Management Authority (NDMA)*

---

## 📌 Executive Summary & Problem Statement

During catastrophic hydrometeorological disasters (such as extreme monsoon floods, cloudbursts, and dam discharges), administrative boundaries fail to reflect natural inundation contours. Low-elevation floodplains rapidly breach their **safe local carrying capacity**, leaving citizens stranded while local storm shelters and arterial roadways submerge.

**RESILIENT-HEX** solves this critical challenge by providing an intelligent GIS command and decision-support platform powered by **Uber H3 hexagonal spatial indexing** (Resolution 7 / 8). The platform dynamically identifies hazard-based **Critical Red Zones**, computes carrying capacity deficits, plans priority-triaged evacuations avoiding submerged corridors, and recommends optimal high-ground **Green Zone safe destinations**.

---

## 🔄 End-to-End Decision Support Workflow

The prototype explicitly demonstrates the standard operating procedure pipeline of the National Emergency Operations Centre (NEOC):

```
┌─────────────────────────────────┐
│       1. Data Sources           │ (CWC Gauges, IMD Doppler, DEM Elevation, Census Grids)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│   2. Uber H3 Spatial Indexing   │ (Discrete Hexagonal Global Grid, Equidistant Topology)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 3. Hazard & Risk Assessment     │ (Multi-Criteria MCDA: Rain, Slope, Pop, Infra, Access)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 4. Carrying Capacity Assessment │ (Safe Structural Threshold vs Pop: Deficit Calculation)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 5. Evacuation Planning          │ (Vulnerable Triage, Road Submergence Bypasses)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 6. Relocation Recommendation    │ (Multi-Objective Matching to Surplus High-Ground Cells)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 7. Disaster Command Dashboard   │ (Real-Time Telemetry, Simulation Studio, SITREP Export)
└─────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Tactical Command Overview & Interactive H3 GIS Map
- **H3 Hexagonal Grid**: 24 discrete cells spanning the vulnerable Brahmaputra flood basin and surrounding high-ground ridges.
- **Dynamic Risk Categorization**:
  - 🟢 **Safe Zone (0–35)**: High-ground refuge, relocation destination.
  - 🟡 **Moderate Zone (36–60)**: Active monitoring & logistical standby.
  - 🟠 **High Risk Zone (61–80)**: Staged evacuation advisory & transport restrictions.
  - 🔴 **Critical Red Zone (81–100)**: Mandatory evacuation, local carrying capacity collapsed.
- **Interactive Inspection Drawer**: Click any hexagon or table row to inspect H3 Cell ID, risk score, resident population, vulnerable demographic breakdown (infants, elderly, PwD, pregnant women), carrying capacity deficit, nearest shelter, and road access.

### 2. ⚠️ Hazard Assessment & Multi-Factor Intelligence
- Multi-hazard switch: Flood, Landslide, Cyclone, Earthquake, Wildfire.
- Multi-Criteria Decision Analysis (MCDA) weight calibration sliders allowing the commissioner to adjust factor sensitivities (Rainfall, Elevation, Pop Density, Infrastructure, Services, Road Access).
- Interactive SVG Radar / Spider chart showing localized vulnerability profiles.

### 3. ⚖️ Carrying Capacity & Deficit Engine
- Calculates local safe carrying capacity during disaster conditions:
  $$\text{Deficit} = \max(0, \text{Resident Population} - \text{Safe Event Capacity})$$
- When $\text{Deficit} > 0$, the cell is marked as **RELOCATION REQUIRED**.
- Comparative bar chart contrasting population at risk against safe capacity.

### 4. 🚨 Evacuation Planning Cockpit
- Vulnerable population triage: Priority 1 (Immediate life threat <2h) vs Priority 2 (Urgent staged <6h).
- Submerged road detection: Identifies submerged river embankments and routes evacuees along open elevated bypasses (NH-27).
- Vehicle fleet dispatch triggers (NDRF powerboats, ASTC evacuation buses, ALS ambulances).

### 5. 🔄 Intelligent Relocation Recommendation Engine
- Mathematical multi-objective optimization matching critical deficit cells to surplus green cells (Khanapara Safe Ridge, Dispur Capital Ridge, Changsari AIIMS High Ground, Narengi Cantonment).
- Displays convoy distance, travel time, available surplus buffer, and designated medical facilities.
- One-click directive execution and master relocation approval.

### 6. 🏥 Resources, Facilities & Emergency Assets
- Comprehensive inventory tracking for 8 designated shelters, 7 trauma hospitals, and 8 specialized response units (NDRF, Indian Army Amphibious Task Force, Mobile Medical Squads).

### 7. 📈 Historical Disaster Intelligence
- Longitudinal analysis (2018–2024) tracking affected population trends and recurring high-risk H3 hotspots.

### 8. ⚡ Disaster Simulation Studio ("Simulate Disaster" Workflow)
- Interactive time-step scrubber:
  - **Hour 0**: Baseline normal state (green/yellow cells).
  - **Hour 6**: Heavy rainfall inflow (water level rise +1.4m).
  - **Hour 12**: Embankment breach (water overspill +2.6m, road submergence).
  - **Hour 24**: Peak catastrophic inundation (7 critical Red Zones, 142k capacity deficit, dynamic relocation recalculation).

### 9. 📄 Official MHA/NDMA Situation Report (SITREP) Generator
- Produces a formatted operational briefing document with print and PDF export capability.

### 10. 🔊 Web Audio API Tactical Sound Synthesizer
- Generates tactical UI beeps, alert chimes, and emergency siren alarms natively using the browser's Web Audio API without requiring any external audio files.

---

## 💻 How to Run the Application

The application is built using modern standard web technologies (HTML5, Vanilla CSS, and JavaScript) and is **100% self-contained** with **zero external CDN dependencies**, ensuring it runs reliably anywhere:

1. Navigate to the project directory:
   ```
   c:\Users\Jigna Gosalia\Desktop\SIH26191\
   ```
2. Double-click or open **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave).
3. Interact with the GIS map, click H3 hexagons, navigate through the sidebar tabs, run the disaster simulation, and export operational reports!

---

*SIH26191 Prototype — Ministry of Home Affairs / National Disaster Management Authority*
