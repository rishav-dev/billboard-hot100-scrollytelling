# The Evolution of the Billboard Hot 100 (2000–2023)

A scrollytelling, data‑driven exploration of how popular music has evolved over the last two decades. This project combines **D3.js** and **Three.js** to visualize trends in danceability, energy, acousticness, and artist dominance using Billboard Hot 100 data enriched with Spotify audio features.

---

## Overview

This project answers a simple question:

> **How has pop music changed from 2000 to 2023?**

By analyzing thousands of Billboard Hot 100 entries and their audio characteristics, the site walks the reader through:

* Long‑term trends in musical features (danceability, energy, acousticness, valence)
* Distributional shifts in what makes a song “popular”
* Multi‑dimensional 3D explorations of music space
* Artist‑level deep dives (e.g., Taylor Swift, Drake, The Weeknd)

The page is an interactive narrative you scroll through, not a dashboard.

---

## Data Source

All data is derived from the following Kaggle dataset:

**Billboard Hot 100 (2000–2023) with Audio Features**
[https://www.kaggle.com/datasets/suparnabiswas/billboard-hot-1002000-2023-data-with-features](https://www.kaggle.com/datasets/suparnabiswas/billboard-hot-1002000-2023-data-with-features)

### What the dataset contains

* Billboard Hot 100 chart entries from **2000–2023**
* Track metadata: song title, artist, year, rank
* Spotify audio features:

  * danceability
  * energy
  * valence
  * acousticness
  * tempo
  * loudness
  * speechiness
  * instrumentalness
  * liveness
  * popularity

---

## Data Processing

The original Kaggle dataset is preprocessed into three cleaned JSON files used by the frontend:

* **`songs_clean.json`**
  Track‑level data (one row per song per year)

* **`yearly_features.json`**
  Year‑level aggregates (average audio features per year)

* **`artist_summary.json`**
  Artist‑level aggregates (averaged features + song counts)

Missing or invalid numeric values are normalized to `null` and filtered where appropriate. Yearly aggregates are computed dynamically if not available.

---

## Project Structure

```
├── index.html            # Main scrollytelling page
├── css/
│   └── style.css         # Global layout, typography, and visualization styles
├── js/
│   ├── main.js           # App initialization and intro chart
│   ├── data.js           # Data loading, parsing, and aggregation helpers
│   ├── scroll.js         # Scroll-triggered logic (IntersectionObserver)
│   └── visualizations.js # D3 + Three.js visualizations
├── data/
│   ├── songs_clean.json
│   ├── yearly_features.json
│   └── artist_summary.json
```

---

## Visualizations

### 2D (D3.js)

* Bar chart: song counts per year
* Line charts: long‑term feature trends
* Histograms: feature distributions
* Multi‑line comparison of core metrics

### 3D (Three.js)

* **Music Space Scatter**: danceability × energy × valence
* **Timeline Sphere**: years wrapped as latitude rings
* **Energy Waveform**: animated canvas showing era shifts
* **Evolution Ribbon**: 3D tube tracing music evolution over time

Each 3D view maps axes, color, and motion to a specific data variable.

---

## Tech Stack

* **HTML5 / CSS3** – layout and typography
* **JavaScript (ES6)** – application logic
* **D3.js** – data aggregation and 2D visualizations
* **Three.js** – 3D and WebGL visualizations
* **Intersection Observer API** – scroll‑based triggering

No backend or build system is required.

---

## Running the Project Locally

Because the project loads JSON files, it must be served from a local web server.

### Option 1: Python

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

### Option 2: VS Code Live Server

* Install the **Live Server** extension
* Right‑click `index.html` → **Open with Live Server**

---
