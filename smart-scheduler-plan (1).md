# AI Smart Scheduler for FAST Channels - Plan

This plan defines an AI-driven scheduler for FAST channels that optimizes viewer retention, enforces constraints, and self-heals when assets become unavailable. It is designed for data-rich FAST environments with granular per-program analytics.

---

## 1. Product Goals

- Build lineups that maximize continuous watch time while respecting rights, policies, and ad-break rules.
- Use natural language input to generate scheduling intents.
- Predict and improve audience flow across program transitions.
- Simulate outcomes before schedules go live.
- Automatically repair schedules when assets change.

---

## 2. Inputs and Data Signals

### A. Viewer Behavior Signals
- Watch duration
- Channel switching events
- Time of day
- Genre history
- Seasonal patterns

### B. Multimodal Content Signals
- Show description
- Transcript
- Video frames
- Audio mood

### C. FAST Analytics (Per-Program Granularity)
- Program title / content ID
- Start and end time
- Concurrent viewers
- Unique viewers
- Average watch duration
- Audience retention curve
- Drop-off timestamps
- Ad impressions and completion rates
- Viewer entry and exit points
- Device types (mobile, TV, web)
- Geographic regions
- CTR for interactive elements (if available)

---

## 3. Core AI Modules

### A. Viewer Behavior Prediction Model
**Purpose:** Forecast per-slot retention and switching likelihood.

**Inputs:**
- Watch duration
- Channel switching events
- Time of day
- Genre history
- Seasonal patterns

**Candidate Models:**
- Temporal Fusion Transformer
- LSTM
- Sequential Transformer

**Outputs:**
- Predicted retention curve per slot
- Drop-off risk score per transition
- Expected watch duration per asset

### B. Multimodal Content Understanding Model
**Purpose:** Build a structured content embedding for similarity and policy checks.

**Inputs:**
- Show description
- Transcript
- Video frames
- Audio mood

**Candidate Models:**
- Text embedding model
- Vision Transformer
- Audio Spectrogram Transformer
- Multimodal fusion model

**Outputs:**
- Unified content embedding
- Genre and mood tags
- Similarity scores for replacement
- Policy-relevant metadata

### C. Viewer Journey Optimization Engine
**Purpose:** Optimize sequences, not just single slots.

**Current naive flow:**
- Movie
- Cartoon
- Reality show

**Learned flow example:**
- Movie
- Sitcom
- Family series
- Holiday special

**Goal:**
- Increase continuous watch time across transitions

### D. Self-Healing Scheduler
**Purpose:** Automatically repair schedules when assets are unavailable.

**Example:**
- Asset unavailable: Christmas Movie A
- Replacement: Christmas Movie C
- Similarity = 0.91

**Behavior:**
- Replace with closest match that satisfies constraints
- Log the change with clear operator visibility

### E. Digital Twin Simulator
**Purpose:** Simulate outcomes before schedules go live.

**Outputs:**
- Predicted retention change
- Predicted viewer exits change
- Transition risk hotspots

**Example:**
- Predicted: Retention +14%
- Predicted: Viewer exits -9%

---

## 4. Scheduling Constraints

- Rights window by region and time
- Content rating and time-of-day rules
- Frequency caps (ad fatigue and content repetition)
- Ad-break structure and SCTE-35 boundaries
- Operator-defined channel policies

---

## 5. Scheduling Workflow

1. Operator inputs natural-language intent.
2. System parses intent into constraints and goals.
3. Content embeddings and behavior predictions score candidate sequences.
4. Optimizer selects a lineup that maximizes retention under constraints.
5. Digital twin simulates predicted outcomes.
6. Operator reviews, applies overrides if needed.
7. Schedule is saved and published.

---

## 6. Outputs and UI Elements

- Natural-language request panel
- Optimized lineup with confidence scores
- Transition heatmap
- Retention forecast chart
- Conflict warnings with override controls
- Self-healing log of automated replacements

---

## 7. Metrics for Success

- Increase in continuous watch time
- Reduction in drop-offs at transitions
- Fewer manual schedule fixes
- Higher ad completion rates
- Improved retention in seasonal blocks

---

## 8. Tech Stack (Prototype-Ready, AI-Extendable)

### A. Frontend
- HTML5 + CSS3 (custom design system, no framework required)
- Vanilla ES6+ JavaScript for state and UI logic
- D3 or lightweight SVG utilities for charts
- Web Workers for simulation and scoring loops (optional)

### B. Data & Storage
- JSON-based catalog and analytics fixtures
- LocalStorage for saved schedules and overrides
- CSV import/export for content and analytics

### C. AI and ML (Prototype)
- Mock inference layer in JavaScript
- Deterministic rules for constraints and scoring
- Precomputed embeddings stored as JSON vectors

### D. AI and ML (Future Extension)
- Python model service (FastAPI)
- Model stack: PyTorch or TensorFlow
- Embedding store: FAISS or pgvector
- Feature store: parquet on object storage

### E. Deployment
- Static hosting for prototype (GitHub Pages, Netlify)
- Optional Dockerized backend for future AI service

---

## 9. Architecture Overview

- **UI Layer:** Natural-language input, schedule canvas, analytics panels
- **Scheduler Core:** Constraint engine + sequence optimizer
- **Prediction Layer:** Retention and transition scoring
- **Simulation Layer:** Digital twin rollout and KPI projections
- **Data Layer:** Content catalog, analytics, embeddings

---

## 10. Project Plan and Milestones

### Phase 1: Foundation (Week 1)
- Define catalog schema and analytics fixtures
- Build base UI layout and schedule timeline
- Implement constraint rule engine

### Phase 2: AI Prototype (Week 2)
- Mock natural-language intent parser
- Implement sequence scoring and optimizer
- Add self-healing replacement logic

### Phase 3: Digital Twin (Week 3)
- Simulate retention and drop-offs
- Build transition heatmap and KPI summary
- Add scenario comparison view

### Phase 4: Polish and Demo (Week 4)
- Refine UI/UX and interactions
- Add export/import and override history
- Validate with sample schedules

---

## 11. Risks and Mitigations

- **Sparse or noisy analytics:** Use smoothing and fallback priors
- **Model confidence gaps:** Surface confidence and allow overrides
- **Cold start content:** Use embeddings + rule priors
- **Over-optimization:** Enforce diversity and policy constraints

---

## 12. Prototype Scope

- Mock model outputs with deterministic rules
- Static datasets for content library and analytics
- Simulated retention curves and replacement decisions
- Operator override interactions

---

## 13. Next Steps

- Define a sample content catalog with metadata
- Implement a mock predictor and similarity engine
- Build the lineup optimizer with constraint checks
- Create a digital twin simulator view
- Validate with example schedules and metrics
