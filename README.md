# Amagi Smart Scheduler & Playout Simulator

A Zero-Dependency Python REST Server + Glassmorphic MCR Web Console designed to solve real-world FAST scheduling problems.

## Setup & Run
```bash
python3 main.py
```
Open your browser to `http://localhost:8000`.

## Architecture

This project is a modular, zero-dependency implementation of a high-end AI scheduling platform:
- `main.py`: Local HTTP server.
- `server/predictor.py`: Sequence transition probability math using embedded cosine similarities.
- `server/optimizer.py`: Heuristic solver (Simulated Annealing) for multi-objective sequence reordering.
- `server/self_heal.py`: Constraint validation and similarity-based auto-repair engine.
- `static/`: Pure Vanilla JS & CSS3 glassmorphic design system. No Node.js, React, or build step required.

## Features

1. **AI Contextual Ad Guard & Smart Capping**: Predicts viewer drop-off probabilities based on age mismatches, genre fatigue, and time slot restrictions.
2. **Multi-Objective Optimizer**: Optimizes sequences to maximize retention, watch time, and SCTE-35 ad revenue.
3. **Self-Healing Engine**: Detects licensing expirations, dead air, or region blocks and automatically swaps in the closest semantic match.
4. **Digital Twin Dashboard**: SVG retention curve visualizations comparing the baseline vs optimized schedules.
