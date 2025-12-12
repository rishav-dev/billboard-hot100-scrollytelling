// Main application initialization

// ---------- AUDIO CONTROLLER (Howler.js) ----------
const AudioController = {
  enabled: false,
  fadeMs: 250,
  volume: 0.35,

  // keeps current era + preview timer
  currentEra: null,
  previewTimer: null,

  sounds: {},

  init() {
    if (typeof Howl === "undefined") return;

    this.sounds = {
      "2000–2005": new Howl({ src: ["audio/early.mp3"], loop: true, volume: this.volume }),
      "2006–2011": new Howl({ src: ["audio/edm.mp3"], loop: true, volume: this.volume }),
      "2012–2019": new Howl({ src: ["audio/sadpop.mp3"], loop: true, volume: this.volume }),
      "2020–2023": new Howl({ src: ["audio/pandemic.mp3"], loop: true, volume: this.volume }),
    };

    const btn = document.getElementById("audio-toggle");
    if (btn) {
      btn.addEventListener("click", () => this.toggle());
      btn.textContent = "Audio: Off";
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("audio-toggle");
    if (btn) btn.textContent = this.enabled ? "Audio: On" : "Audio: Off";

    if (!this.enabled) this.stopAll();
  },

  stopAll() {
    // stop preview timer
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = null;
    this.currentEra = null;

    // hard stop all sounds (no overlaps)
    Object.values(this.sounds).forEach((s) => {
      try { s.stop(); } catch (_) {}
    });
  },

  // Preview mode: plays for N seconds then stops automatically
  previewEra(eraKey, seconds = 4) {
    if (!this.enabled) return;
    if (!this.sounds[eraKey]) return;

    // if still the same era, do nothing (prevents jitter)
    if (this.currentEra === eraKey) return;

    this.stopAll();
    this.currentEra = eraKey;

    const sound = this.sounds[eraKey];
    try { sound.volume(this.volume); } catch (_) {}
    sound.play();

    // auto-stop after preview, unless user keeps hovering and re-enters
    this.previewTimer = setTimeout(() => {
      this.stopAll();
    }, seconds * 1000);
  },

  // Call this on mouse leave to stop immediately
  stop() {
    this.stopAll();
  }
};

window.AudioController = AudioController;

// ---------- APP INIT ----------
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Initializing Billboard Scrollytelling...");

  // Audio init
  AudioController.init();

  // 1. Load data
  await BillboardData.loadAll();
  window.billboardData = BillboardData.getSongs();

  // 2. Hero 3D animation
  Visualizations.initHero();

  // 3. Scroll controller
  ScrollController.init();

  // 4. Placeholders + intro
  initPlaceholders();
  renderIntroChart();

  console.log("Billboard Scrollytelling initialized successfully");
});

function initPlaceholders() {
  const vizContainers = [
    "viz-intro",
    "viz-danceability",
    "viz-distribution",
    "viz-trends",
    "viz-acoustic",
    "viz-3d",
    "viz-timeline-sphere",
    "viz-sound-wave",
    "viz-data-wave",
    "viz-artist-taylor",
    "viz-artist-drake",
    "viz-artist-weeknd",
    "viz-era-compare",
    "viz-artists",
    "viz-conclusion",
  ];

  vizContainers.forEach((id) => {
    const container = document.getElementById(id);
    if (container && container.children.length === 0) {
      container.innerHTML = '<div class="loading">Loading visualization</div>';
    }
  });

  renderIntroChart();
}

function renderIntroChart() {
  const container = document.getElementById("viz-intro");
  if (!container || !window.billboardData || !window.billboardData.length) return;

  container.innerHTML =
    '<h3 class="chart-title">24 Years of Billboard Hot 100</h3>' +
    '<p class="chart-subtitle">2000 - 2023</p><svg></svg>';

  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#viz-intro svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const yearCounts = d3.rollup(
    billboardData,
    (v) => v.length,
    (d) => d.year
  );

  const data = Array.from(yearCounts, ([year, count]) => ({ year, count })).sort(
    (a, b) => a.year - b.year
  );

  const x = d3.scaleBand().domain(data.map((d) => d.year)).range([0, width]).padding(0.2);

  const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.count)]).range([height, 0]);

  const colorScale = d3.scaleSequential(d3.interpolateCool).domain([2000, 2023]);

  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.year))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", (d) => colorScale(d.year))
    .attr("opacity", 0.8)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 30)
    .attr("y", (d) => y(d.count))
    .attr("height", (d) => height - y(d.count));

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 3 === 0)))
    .attr("class", "axis")
    .selectAll("text")
    .style("font-size", "11px");

  svg.append("g").call(d3.axisLeft(y)).attr("class", "axis");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Year");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Number of Songs");
}

let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {}, 250);
});
