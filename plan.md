# AI Smart Scheduler for FAST Channels - Unified Master Plan

This master plan combines the comprehensive viewer behavior signals, multimodal embedding structures, self-healing engines, and digital twin simulation parameters from your specification with our professional glassmorphic Master Control Room (MCR) layout. 

The application is structured as a **Zero-Dependency Python REST Server** (backend) paired with a **High-Performance Glassmorphic Web App** (frontend) running purely on vanilla technologies.

---

## 1. Core Architectural Modules

The platform is engineered around five core modules that execute dynamically in our pure-Python server:

### A. Viewer Behavior Prediction Model (`/api/predict`)
* **Inputs:** Watch duration, channel switching events, time-of-day slots, demographic ages, seasonal indexes, and catalog metadata.
* **Math Pipeline:** Mapped as an active sequential transition probability. Calculates drop-off risk between any two consecutive scheduled segments $(C_i, C_{i+1})$ using a weighted sigmoid score:
  $$P(\text{Drop-off}) = \sigma\left( - \left( 4.0 \cdot S_g + 3.0 \cdot S_d + 2.5 \cdot A_t - 1.5 \cdot F \right) \right)$$
  - $S_g$ = Cosine similarity of the 8-dimensional precomputed multimodal content embeddings.
  - $S_d$ = Demographic target rating alignment score.
  - $A_t$ = Time-of-day slot appropriateness multiplier.
  - $F$ = Genre continuous duration fatigue (decays viewer retention if the same genre plays consecutively).

### B. Multimodal Content Understanding Database
* **Signal Capture:** Incorporates mock precomputed 8-dimensional **Embedding Vectors** representing dense semantic signals (descriptions, video moods, audio pace).
* **Catalog Assets:** Pre-loaded with distinct metadata categories:
  - *Feature Movies & Episode Series*: Detailed titles, age ratings, license windows (rights start/expiry times), geo-allowlists.
  - *Short-Form Promos & Fillers*: Brand ads, station IDs, community announcements (active as gap fillers).

### C. Natural-Language Intent Parser (`/api/parse-intent`)
* Parses raw conversational operator queries into active optimizer instructions:
  - *"Schedule a family-friendly drama marathon for Saturday evening"* $\to$ filters catalog for `rating <= PG`, `genre == Drama`, sets optimization weights to prioritize continuous retention.
  - *"Run high-revenue schedule"* $\to$ increases optimization weight for ad inventory fill rates and brand match compatibility.

### D. Self-Healing Scheduler Engine (`/api/self-heal`)
* Runs active telemetry checks to identify scheduling conflicts: expired content rights, dead air (empty slot gaps), or geofencing blocks.
* Automatically resolves conflicts by querying the catalog for the best semantic replacement:
  $$\text{Replacement}^* = \text{ArgMax}_{C \in \text{Valid}} \left[ \text{CosineSimilarity}(\mathbf{e}_{\text{failed}}, \mathbf{e}_{C}) \right]$$
* Logs healing decisions with clear operator visibility, recording original asset ID, replacement asset ID, similarity confidence score, and constraint audits.

### E. Digital Twin Simulator (`/api/simulate`)
* Pre-calculates simulated outcomes before any schedule goes live, rendering before-vs-after telemetry overlays for:
  - Cumulative viewer retention curves (SVG graph).
  - Viewer drop-off hotspots.
  - Projected cumulative ad revenue index.

---

## 2. File & Component Layout

We will create and organize the following four source components in `/home/badrinathan/Desktop/Projects/SmartSchedule`:

### 1. `main.py` (Zero-Dependency REST Server Backend)
* Employs standard library `http.server` to serve the static frontend components (`index.html`, `styles.css`, `app.js`) and expose the JSON API handlers (`/api/assets`, `/api/predict`, `/api/optimize`, `/api/parse-intent`, `/api/self-heal`, `/api/simulate`).
* Implements the dense asset library, embedding vectors, cosine math layers, greedy search scheduler optimization loop, and self-healing validators in pure Python.

### 2. `index.html` (Master UI Layout)
* Structures the visual MCR interface:
  - *Sidebar Panel*: Navigation tabs (Control Room, Smart Planner, ML Analytics).
  - *Playout Monitor*: High-frequency HTML5 Canvas rendering a simulated live broadcast feed (lower-thirds, subtitles, SCTE-35 tickers).
  - *Terminal Emulator*: A retro scrolling server log printing active playout threads and SSAI triggers.
  - *EPG Schedule Tracker*: Visual scheduling track with drag-and-drop slots, separated by interactive drop-off risk nodes.
  - *Natural-Language Panel*: Operational intent dialog textbox.

### 3. `styles.css` (MCR CSS3 Style Sheet)
* Implements the premium Control Room theme:
  - Dark primary canvas (`#060814`) with glassmorphic dashboards (`backdrop-filter`).
  - Vivid CSS variables for state feedback (Beacons for Active Playout, Alert Red for Rights Violations, Hot Orange for Churn Risks).
  - Dynamic scale animations for dragged elements and scrolling log lists.

### 4. `app.js` (Frontend Playout Logic & Events)
* Coordinates timeline drag-and-drop actions and pointer handlers.
* Executes the real-time canvas animation loop (synchronizes visual video stream, overlay bugs, subtitles, and ad timers with timeline playback).
* Connects frontend click events to backend JSON APIs, displaying interactive SVG graphs of drop-off distributions, feature importance bar charts, and self-healing repair reports.

---

## 3. Implementation Checklist

- [ ] Program Python base HTTP server, catalog models, and sequence calculations (`main.py`)
- [ ] Create EPG timeline layouts, prompt consoles, and Canvas containers (`index.html`)
- [ ] Implement variables, neon borders, and glowing dot classes (`styles.css`)
- [ ] Program drag-and-drop coordinates, canvas drawing loops, and REST API handlers (`app.js`)
- [ ] Structure linear playout SCTE-35 guides and manual presentation walkthrough (`README.md`)
- [ ] Run browser-based walkthroughs and verify all features
