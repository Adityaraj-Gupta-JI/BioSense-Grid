# BioSense Grid

## A Computational Framework for Microbial Bio-Signal Dynamics

> **From Raw Biological Time Series to Reproducible Signal States.**

BioSense Grid is a software-first computational framework for characterizing **real biological time-series measurements** through transparent signal processing, temporal and spectral analysis, deterministic signal-event detection, comparative analysis, structured BioSignal states, and reproducible provenance.

The current MVP is designed around **source-derived microbial electrochemical time profiles** and is intentionally mathematics-first: it analyzes measured observations without treating a spectrum as a permanent biological fingerprint and without silently converting derived signal features into biological conclusions.

### Live application

**https://biosense-grid.adityarajgupta459.workers.dev**

---

## Why BioSense Grid?

Biological time-series datasets often arrive as raw measurements accompanied by uneven metadata, experimental conditions, sampling details, and processing choices. The computational challenge is not only to plot a waveform, but to make the path from **measurement → quality control → processing → feature extraction → comparison → interpretation** explicit and reproducible.

BioSense Grid turns that workflow into a research-oriented instrument.

It is built around four strict distinctions:

| Layer | Meaning |
|---|---|
| **Observed** | Values directly present in the source measurement |
| **Derived** | Values calculated by the BioSense Grid processing pipeline |
| **Context** | Organism, modality, condition, provenance, and experimental metadata |
| **Hypothesis / validated biological conclusion** | Interpretation that requires biological validation beyond signal computation |

The MVP emphasizes the first three layers and does not present signal features as automatic biological explanations.

---

## Current MVP capabilities

### Real-data ingestion

- Source-derived observations included in the application archive
- CSV registration for new observations
- Explicit time-column and signal-column mapping
- Optional signal-unit entry
- Input inspection before analysis
- File-size guard for uploaded CSV observations
- Missing-value, non-finite, duplicate-time, irregular-sampling, and duration/rate checks

### Signal quality and conditioning

The raw observation remains distinct from subsequent processing. Depending on the analysis configuration, the pipeline can apply operations such as:

- offset handling
- detrending
- normalization when justified
- filtering / conditioning
- sampling-rate assessment
- baseline and variability estimation

Processing parameters are surfaced rather than hidden.

### Temporal analysis

The MVP computes signal statistics and temporal descriptors such as:

- mean
- median
- variance
- standard deviation
- RMS
- peak-to-peak range
- minimum / maximum
- slope and derivative-related measures
- autocorrelation / periodicity-related measures
- event intervals and burst statistics where applicable

### Spectral analysis

Frequency-domain analysis includes:

- FFT-based inspection
- Welch PSD
- dominant frequency / band
- spectral centroid
- spectral bandwidth
- spectral entropy
- band-power measurements where defined
- spectral comparison between compatible observations

### Signal-event detection

The event engine is deterministic and parameterized. The current implementation uses a robust rolling-baseline approach with variability estimation and configurable constraints for:

- positive peaks
- negative peaks
- minimum event duration
- minimum event separation
- event grouping
- event rate

Events are reported as **Signal Events** rather than being labelled automatically as biological events.

### Comparative analysis

Compatible observations can be compared using derived signal features and event statistics, including:

- waveform comparison
- metric differences
- spectral differences
- event-count differences
- event-rate differences
- correlation / related similarity measures where valid

Comparisons are framed as **condition-associated signal observations**, not as automatic biological conclusions.

### BioSignal State

BioSense Grid organizes measured, derived, and contextual information into a structured **BioSignal State**.

The current visualization uses six dimensions as an organizational/visualization ontology:

- Energy
- Frequency
- Vibration
- Geometry
- Medium
- Mass

These dimensions are not presented as a scientific theory defining life. Each dimension is intended to be marked as **Measured, Derived, Context, or Unavailable** depending on the observation.

### Provenance and export

The application keeps a visible processing chronicle and supports research-oriented exports, including:

- JSON
- feature CSV
- event-register CSV

Derived values should remain traceable to the source observation, method, parameters, and processing version.

---

## Primary dataset

The current MVP uses a real public source-derived dataset associated with microbial electrochemical time profiles:

**Zenodo DOI:** [10.5281/zenodo.7050972](https://doi.org/10.5281/zenodo.7050972)

The source reports hundreds of microbial current time profiles collected under controlled high-throughput bioelectrochemical conditions. The MVP is currently centered on verified **_Shewanella oneidensis_ MR-1** observations from that source.

The application does not digitize plots from published figures. Data used in the MVP are machine-readable source-derived records.

### Dataset provenance policy

- Source records remain attributable to their original dataset.
- Biological metadata are treated separately from calculated signal features.
- Incompatible units, sampling regimes, modalities, or processing configurations are not treated as directly comparable without qualification.
- Public demo records are not presented as universal fingerprints for an organism.

---

## Scientific positioning

BioSense Grid is a **computational signal-analysis framework**, not a diagnostic system and not a claim that every organism has a fixed characteristic frequency signature.

The framework models a measured observation conceptually as containing contributions from:

\[
X_{observed}(t) = X_{biological}(t) + X_{environmental}(t) + X_{instrument}(t)
\]

This is a modeling perspective, not an exact decomposition unless controls and experimental design support it.

Common mathematical foundations used by the framework include:

\[
I = \frac{dQ}{dt}
\]

\[
P = VI
\]

\[
E = \int P(t)\,dt
\]

alongside standard sampling, statistical, Fourier/spectral, filtering, and event-detection methods.

### Signal analysis vs biological interpretation

A spectral peak, event, or statistical difference can be a reproducible property of the measured signal without by itself establishing a biological mechanism. Biological interpretation therefore belongs to the validation layer of the workflow.

---

## Processing pipeline

```text
REAL BIOLOGICAL TIME SERIES
            │
            ▼
     DATASET / UPLOAD
            │
            ▼
   SCHEMA VALIDATION
            │
            ▼
     NORMALIZATION
            │
            ▼
        QA / QC
            │
            ▼
   CONDITIONING / CONTROLS
            │
            ▼
 WINDOW + SIGNAL-EVENT PARSER
            │
      ┌─────┴─────┐
      ▼           ▼
 TEMPORAL      SPECTRAL
 ANALYSIS       ANALYSIS
      │           │
      └─────┬─────┘
            ▼
     FEATURE EXTRACTION
            │
            ▼
    COMPARATIVE ANALYSIS
            │
            ▼
      BIOSIGNAL STATE
            │
      ┌─────┼──────┐
      ▼     ▼      ▼
     UI   EXPORT  PROVENANCE
```

---

## Architecture

```text
┌──────────────────────────────────────────────┐
│ React + TypeScript + Vite                    │
│ Victorian Scientific Instrument UI            │
├──────────────────────────────────────────────┤
│ Archive / Upload / Visualization              │
│ Waveform / PSD / Events / Comparison         │
│ Provenance / JSON / CSV                      │
├──────────────────────────────────────────────┤
│ Scientific Signal Engine                     │
│ Validation / QA / Temporal / Spectral        │
│ Event detection / Feature extraction         │
├──────────────────────────────────────────────┤
│ Source-derived observation records            │
│ JSON / CSV / metadata                         │
└──────────────────────────────────────────────┘
```

The current frontend is built with React, TypeScript, Vite, Tailwind CSS, Radix UI components, Recharts, and supporting utility libraries. Scientific computation in the current MVP is implemented in the browser-side TypeScript signal engine so that the deployed demo can operate without a separate scientific-compute service.

A Node/Express server remains in the repository as a local production static host. It is not required for the deployed assets-only Cloudflare Worker.

---

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS + custom scientific-instrument CSS |
| UI primitives | Radix UI |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest |
| Package manager | pnpm |
| Deployment | Cloudflare Workers + Static Assets |
| Version control | Git + GitHub |

---

## Repository structure

```text
BioSense-Grid/
├── client/
│   ├── public/
│   │   └── data/                  # Source-derived demo observations
│   └── src/
│       ├── components/             # UI components
│       ├── contexts/               # App context
│       ├── hooks/                  # React hooks
│       ├── lib/
│       │   ├── biosense.ts        # Signal engine
│       │   └── biosense.test.ts   # Scientific tests
│       └── pages/
│           └── Home.tsx
├── patches/                        # Dependency patching
├── server/
│   └── index.ts                    # Local Node static host
├── shared/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── wrangler.jsonc                  # Cloudflare Workers config
└── tsconfig*.json
```

---

## Run locally

### Requirements

- Node.js
- pnpm
- Git

### Install dependencies

```bash
pnpm install
```

### Development server

```bash
pnpm run dev
```

The Vite development server serves the application on the local machine.

### TypeScript validation

```bash
pnpm run check
```

### Scientific tests

```bash
pnpm test
```

### Production build

```bash
pnpm run build
```

The build produces the Vite frontend assets in `dist/public` and a local Node server bundle in `dist/index.js`.

### Preview the built frontend

```bash
pnpm run preview
```

---

## Deploy to Cloudflare Workers

The repository uses the Cloudflare Vite plugin and Wrangler.

```bash
pnpm run build
npx wrangler deploy
```

Cloudflare publishes the static application through the configured Worker. The current public deployment is:

**https://biosense-grid.adityarajgupta459.workers.dev**

Generated local Cloudflare state under `client/.wrangler/` is ignored by Git.

---

## Reproducibility principles

BioSense Grid follows these principles for every analysis path:

1. **Preserve the observed data.** Raw/source-derived values are not silently overwritten by derived values.
2. **Make methods visible.** Sampling assumptions, windows, overlap, event parameters, and conditioning choices are surfaced.
3. **Separate observation from interpretation.** Derived signal features are not automatically treated as biological conclusions.
4. **Keep provenance attached.** Source, condition, processing version, and analysis configuration belong to the record.
5. **Avoid incompatible comparisons.** Different units, sampling rates, modalities, or processing choices require explicit handling.
6. **Prefer deterministic computation.** The same input and configuration should yield the same derived output within the defined numerical tolerance.

---

## Limitations of the current MVP

The hackathon release is intentionally constrained.

- The current archive is small and organism coverage is limited.
- The present MVP focuses on time-series signal characterization rather than complete experimental interpretation.
- Geometry and mass are usually unavailable in the current signal-only observations.
- Environmental and instrument contributions cannot be perfectly separated from a single trace without suitable controls.
- Event detection is algorithmic and can produce false positives or false negatives depending on sampling, drift, noise, and threshold configuration.
- Comparisons are meaningful only when observations are sufficiently compatible.
- A BioSignal State is a structured representation of an observed signal state, not a permanent organism fingerprint.

---

## Roadmap

### Hackathon release

- Real-data archive
- CSV observation registration
- QA/QC inspection
- Temporal and spectral analysis
- Deterministic signal-event detection
- A/B comparison
- BioSignal State visualization
- Provenance chronicle
- JSON / CSV export
- Cloudflare Workers deployment

### Post-hackathon

- Larger multi-organism observation library
- More validated multimodal datasets
- Control-aware interference analysis
- richer statistical validation and uncertainty reporting
- batch analysis
- experiment management
- research report generation
- reproducible analysis packages
- desktop application via Tauri + Rust + React + TypeScript

Future extensions will be evaluated against real datasets and validation requirements before being promoted into the scientific core.

---

## Scientific safety and interpretation policy

BioSense Grid is designed to make signal computation visible without overstating biological meaning.

The project does **not** claim that:

- microorganisms universally operate at one frequency;
- a spectral peak is automatically a biological mechanism;
- one organism corresponds to one permanent spectral fingerprint;
- the current MVP provides diagnosis, treatment, or clinical decision support;
- mathematical signal-event detection is equivalent to identifying a biological event.

Where biological meaning is discussed, it should be identified as context, hypothesis, or experimentally validated conclusion rather than silently derived from the signal-processing layer.

---

## Team

**Team:** AI Bangers  
**Project owner:** Adityaraj Gupta  
**Hackathon:** VMEDITHON 3.0 — VIT Chennai  
**Project:** BioSense Grid

---

## License

This repository uses the **MIT License** as specified by the project package metadata. Dataset licensing and attribution remain governed by the respective source records; users should follow the license and citation requirements of each external dataset.

---

## Citation

When referencing the current project, cite:

> **BioSense Grid: A Computational Framework for Microbial Bio-Signal Dynamics.** From Raw Biological Time Series to Reproducible Signal States.

For the primary public dataset used in the MVP, cite the Zenodo record:

> Zenodo, **Multivariate landscapes constructed by Bayesian estimation over five hundred microbial electrochemical time profiles / Bayesian Estimation on Microbial Electrochemical Time Profiles obtained by a High-Throughput Bioelectrochemical Device**, DOI: [10.5281/zenodo.7050972](https://doi.org/10.5281/zenodo.7050972).

---

## Status

**Hackathon MVP — deployed and operational.**

Live: **https://biosense-grid.adityarajgupta459.workers.dev**
