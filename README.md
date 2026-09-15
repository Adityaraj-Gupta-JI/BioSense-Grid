# BioSense Grid

A computational framework for characterizing microbial bio-signal dynamics through systematic analysis of real biological time-series data.

**From Raw Biological Time Series to Reproducible Signal States.**

## Project Status

| Aspect | Status |
|--------|--------|
| **Stage** | MVP Planning and Repository Initialization |
| **Development Status** | Early Development |
| **Primary Platform** | Web Application |
| **Future Platform** | Cross-Platform Desktop Research Application |
| **Scientific Focus** | Real Microbial Bio-Signal Time-Series Data |

---

## About

BioSense Grid is a software-first computational framework designed for biological signal research, computational biology, and bioengineering education. It enables researchers and students to work with real experimental time-series data through standardized data ingestion, signal quality analysis, temporal and spectral processing, event detection, statistical feature extraction, and reproducible reporting.

The system is intentionally designed as a research and education platform, not as a diagnostic or clinical tool.

---

## The Problem

Biological systems produce complex, time-varying signals, but experimental observations are often distributed across:

- Different repositories
- Multiple file formats
- Varied measurement systems
- Disconnected analysis scripts
- Fragmented workflows

Researchers and students frequently need to manually perform:

- Dataset discovery
- File inspection
- Column identification
- Unit interpretation
- Sampling-rate validation
- Signal cleaning and preprocessing
- Temporal analysis
- Frequency-domain analysis
- Event detection and characterization
- Cross-experiment comparison
- Report preparation and documentation
- Provenance tracking

This fragmentation makes reproducible comparison and interpretation difficult.

---

## The Solution

BioSense Grid provides a standardized computational layer between raw experimental data and biological interpretation. The platform enables users to work with real biological time-series data through:

1. Curated public datasets
2. User-uploaded experimental data
3. Automated data profiling
4. Schema validation
5. Signal quality assessment
6. Signal conditioning and preprocessing
7. Temporal analysis
8. Spectral analysis
9. Statistical feature extraction
10. Event and dynamic-state analysis
11. Comparative analysis across datasets
12. BioSignal signature generation
13. Reproducible research reports
14. Machine-readable JSON and CSV outputs
15. Complete processing provenance

The system preserves the critical distinction between:

- **Measured data** — raw experimental observations
- **Derived features** — mathematical transformations
- **Experimental context** — conditions and metadata
- **Hypotheses** — proposed explanations
- **Validated conclusions** — experimentally verified findings

---

## Scientific Principles

BioSense Grid follows three core scientific principles:

### 1. Real Data First

The system works exclusively with experimentally observed biological measurements. BioSense Grid does not present fabricated or synthetic biological data as real observations.

### 2. Traceable Derivations

Every derived feature is traceable to:

- The source signal
- The selected data window
- The processing method
- The processing parameters
- The software version

### 3. No Automatic Biological Overclaiming

Mathematical patterns do not automatically represent biological mechanisms. The platform maintains this hierarchy:

```
Observation
    ↓
Mathematical Derivation
    ↓
Interpretation
    ↓
Biological Validation
```

BioSense Grid is a computational characterization platform. It does not automatically establish biological causation or clinical diagnosis.

---

## MVP Direction

### Initial Scientific Focus

The MVP focuses on real microbial electrical/current time-series data, with **Shewanella oneidensis MR-1** as the primary candidate dataset for the first implementation.

### Future Expansion

Additional organisms and modalities planned for future phases:

- Additional electrogenic microorganisms
- Ionic-current waveforms
- Biofilm electrical dynamics
- Optical biological time series
- Mechanical biological signals
- Chemical biological time series
- Multimodal biological observations

---

## Core Features

### Dataset Library

Curated library of real experimental datasets including:

- Organism information and taxonomy
- Signal modality (electrical, optical, mechanical, chemical)
- Measurement units
- Experimental conditions
- Dataset source and attribution
- Citation information
- License terms
- Sampling information and rates
- Available experimental runs
- Processing compatibility
- Scientific limitations and caveats

### Data Ingestion

Supported formats include:

- CSV
- TSV
- JSON
- XLSX
- TXT
- HDF5
- Domain-specific formats (future phases)

### Input Profiling

Automated inspection of:

- Time columns and format
- Signal-value columns
- Units and unit conversion
- Sampling interval and rate
- Total duration
- Missing values and gaps
- Duplicate timestamps
- Irregular sampling patterns
- NaN and infinite values
- Signal clipping
- Flatline behavior
- Embedded metadata
- Multiple channels and signal streams

### Signal Analysis

Supported analysis methods include:

**Statistical Measures:**
- Mean, median, variance, standard deviation
- RMS (root mean square)
- Peak-to-peak amplitude
- Minimum and maximum values
- Skewness and kurtosis

**Temporal Analysis:**
- Derivative and slope calculations
- Zero-crossing analysis
- Autocorrelation functions
- Periodicity detection
- Change-point analysis
- Burst statistics

**Spectral Analysis:**
- Fast Fourier Transform (FFT)
- Welch power spectral density
- Spectral centroid and bandwidth
- Spectral entropy
- Band power analysis
- Spectrogram generation

**Event Detection:**
- Automated event identification
- Comparative analysis across signals
- Dynamic signal-state tracking

### Visualization

Planned visualizations include:

- Raw waveform display
- Processed/conditioned waveform
- Power spectral density plots
- Spectrogram representations
- Event timelines
- Feature summary dashboards
- Signal-quality indicators
- Comparative multi-signal plots
- Dynamic signal-state views
- Bio-Signal State Wheel

### Outputs

The platform generates:

- BioSignal Signature (structured signal representation)
- JSON data export
- CSV feature tables
- Analysis reports
- Comparative summaries
- Processing history and logs
- Provenance metadata
- Dataset citations

---

## BioSignal Concept

A **BioSignal** is an observed biological time series with complete associated context.

### Structure

```
BioSignal
├── Raw measurements
├── Time information
├── Measurement modality
├── Units
├── Organism and taxonomy
├── Experimental condition
├── Sampling information
├── Quality indicators
├── Derived features
├── Detected events
├── Interpretation context
└── Provenance and lineage
```

### BioSignal Signature

A BioSignal Signature is a structured representation of an observed signal state. It is **not** a permanent or universal biological fingerprint.

```
Same organism ≠ same spectrum
```

Repeated observations of the same organism may differ significantly due to:

- Experimental conditions and protocol variations
- Growth phase and metabolic state
- Culture medium composition
- Measurement system characteristics
- Sampling rate and resolution
- Environmental factors (temperature, pH, dissolved oxygen)
- Biological variability and population heterogeneity
- Instrument effects and calibration drift
- Processing parameter choices

---

## Technology Stack

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Library | Hero UI |

### Scientific Computing

| Component | Technology |
|-----------|------------|
| Language | Python |
| Numerical Computing | NumPy |
| Scientific Computing | SciPy |
| Data Manipulation | pandas |

### Backend & API

| Component | Technology |
|-----------|------------|
| API Framework | FastAPI |
| Database | SQLite (metadata) |
| Storage | File/Object Storage |

### Development & Deployment

| Component | Technology |
|-----------|------------|
| Version Control | Git + GitHub |
| CI/CD | GitHub Actions |
| Deployment | Cloudflare (web) |

### Future Desktop Application

| Component | Technology |
|-----------|------------|
| App Framework | Tauri |
| Language | Rust |
| Frontend | React + TypeScript |
| Build Tool | Vite |

---

## Architecture

### High-Level Design

```
React + TypeScript Frontend
            ↓
      API Layer (FastAPI)
            ↓
Python Scientific Processing
   (NumPy / SciPy / pandas)
            ↓
Database & Storage Layer
  (SQLite / Object Storage)
```

### Design Principles

The architecture is intentionally modular to support future reuse of the frontend inside a Tauri desktop application.

---

## Development Roadmap

### Phase 0 — Foundation
- GitHub repository setup
- README and project documentation
- Development conventions and guidelines
- Initial project metadata

### Phase 1 — Data Foundation
- Dataset catalog and curation
- Data ingestion pipeline
- Canonical BioSignal schema
- Input profiling engine
- Schema validation
- Quality-control reports

### Phase 2 — Signal Engine
- Temporal analysis module
- Spectral analysis module
- Statistical analysis module
- Event detection engine
- Feature extraction pipeline

### Phase 3 — Visualization
- Waveform viewer
- Power spectral density viewer
- Spectrogram visualization
- Event timeline interface
- Comparative analysis view
- Signal-quality dashboard

### Phase 4 — Reproducibility
- Processing provenance tracking
- Processing history logging
- Versioned outputs
- JSON export functionality
- CSV export functionality
- Research report generation

### Phase 5 — Dataset Expansion
- Additional organisms
- Additional signal modalities
- Dataset adapter framework
- Advanced comparative analysis tools

### Phase 6 — Desktop Application
- Tauri integration
- Rust application shell
- Local processing capabilities
- Cross-platform packaging and distribution

---

## Scope

### Included in MVP

- Biological time-series characterization
- Real experimental data ingestion and processing
- Data validation and quality assessment
- Signal processing and analysis
- Statistical feature extraction
- Interactive visualization
- Research-oriented reporting
- Educational documentation
- Provenance and reproducibility tracking

### Out of Scope (Current & Future)

- Clinical diagnosis or screening
- Medical treatment recommendations
- Automatic biological causation claims
- Synthetic data presented as experimental data
- Hardware or sensor development
- IoT or microcontroller integration
- Potentiostat or electrode control
- Digital-twin simulation
- Autonomous laboratory automation
- General-purpose programming language features
- Large-scale AI/RAG as primary analysis method

---

## Repository Structure

The initial repository contains:

```
biosense-grid/
├── README.md
├── .gitignore
├── package.json
├── pyproject.toml
└── docs/
    └── (documentation to be added)
```

Structure expands incrementally as implementation progresses.

---

## Team

| Role | Contact |
|------|---------|
| **Project Lead** | [To be added] |
| **Scientific Advisor** | [To be added] |
| **Frontend Developer** | [To be added] |
| **Backend Developer** | [To be added] |
| **Data Scientist** | [To be added] |
| **Documentation** | [To be added] |

**Contact:** [To be added]

---

## Resources

| Resource | Link |
|----------|------|
| **Live Demo** | [To be added] |
| **Documentation** | [To be added] |
| **Research Paper** | [To be added] |
| **Presentation** | [To be added] |
| **Issue Tracker** | GitHub Issues |
| **Repository** | [To be added] |

---

## Disclaimer

BioSense Grid is currently a research and education-oriented software project.

Its computational outputs are characterizations of input data and should **not** be interpreted as:

- Clinical diagnoses
- Medical advice
- Validated biological conclusions

without appropriate experimental verification and domain-specific expert review.

---

## License

To be decided.

---

## Acknowledgements

[To be added]

---

## Citation

Citation metadata will be added after the project reaches a stable release.

---

## Contributing

Contributions are welcome. Please refer to the development guidelines in the repository for pull request procedures and coding standards.

---

**Learn Biological Signals. Understand the Data. Validate the Science.**