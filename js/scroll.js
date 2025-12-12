// Scroll-triggered animations using Intersection Observer

const ScrollController = {
  observers: [],

  init() {
    this.setupIntersectionObservers();
    this.setupSmoothScroll();
  },

  setupIntersectionObservers() {
    const sections = document.querySelectorAll(".scroll-section");

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -20% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const section = entry.target.dataset.section;
          this.triggerVisualization(section, entry.intersectionRatio);

          // Add fade-in class to text content
          const textContent = entry.target.querySelector(".text-column");
          if (textContent && !textContent.classList.contains("fade-in")) {
            textContent.classList.add("fade-in");
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
    this.observers.push(observer);
  },

  triggerVisualization(section, ratio) {
    // Trigger specific visualizations based on section
    switch (section) {
      case "intro":
        // Intro already rendered in main.js
        break;
      case "danceability":
        if (ratio > 0.3 && !this.visualizations.danceability) {
          Visualizations.renderTrends(
            "viz-danceability",
            billboardData,
            "danceability",
            "Danceability Over Time"
          );
          this.visualizations.danceability = true;
        }
        break;
      case "distribution":
        if (ratio > 0.3 && !this.visualizations.distribution) {
          Visualizations.renderDistribution(
            "viz-distribution",
            billboardData,
            "danceability"
          );
          this.visualizations.distribution = true;
        }
        break;
      case "trends":
        if (ratio > 0.3 && !this.visualizations.trends) {
          Visualizations.renderTrends(
            "viz-trends",
            billboardData,
            "energy",
            "Energy Over Time"
          );
          this.visualizations.trends = true;
        }
        break;
      case "acoustic":
        if (ratio > 0.3 && !this.visualizations.acoustic) {
          Visualizations.renderTrends(
            "viz-acoustic",
            billboardData,
            "acousticness",
            "Acousticness Over Time"
          );
          this.visualizations.acoustic = true;
        }
        break;
      case "3d-explore":
        if (ratio > 0.2 && !this.visualizations.scatter3d) {
          Visualizations.init3DScatter("viz-3d", billboardData);
          this.visualizations.scatter3d = true;
        }
        break;
      case "timeline-sphere":
        if (ratio > 0.2 && !this.visualizations.timelineSphere) {
          Visualizations.initTimelineSphere(
            "viz-timeline-sphere",
            billboardData
          );
          this.visualizations.timelineSphere = true;
        }
        break;
      case "sound-wave":
        if (ratio > 0.2 && !this.visualizations.soundWave) {
          Visualizations.initSoundWave("viz-sound-wave", billboardData);
          this.visualizations.soundWave = true;
        }
        break;
      case "data-wave":
        if (ratio > 0.2 && !this.visualizations.dataWave) {
          Visualizations.initDataWave("viz-data-wave", billboardData);
          this.visualizations.dataWave = true;
        }
        break;
      case "artist-taylor":
        if (ratio > 0.3 && !this.visualizations.artistTaylor) {
          Visualizations.renderArtistRadar("viz-artist-taylor", "Taylor Swift");
          this.visualizations.artistTaylor = true;
        }
        break;
      case "artist-drake":
        if (ratio > 0.3 && !this.visualizations.artistDrake) {
          Visualizations.renderArtistRadar("viz-artist-drake", "Drake");
          this.visualizations.artistDrake = true;
        }
        break;
      case "artist-weeknd":
        if (ratio > 0.3 && !this.visualizations.artistWeeknd) {
          Visualizations.renderArtistRadar("viz-artist-weeknd", "The Weeknd");
          this.visualizations.artistWeeknd = true;
        }
        break;
      case "artists":
        if (ratio > 0.3 && !this.visualizations.artists) {
          Visualizations.renderArtistBubbles("viz-artists", billboardData);
          this.visualizations.artists = true;
        }
        break;
      case "conclusion":
        if (ratio > 0.3 && !this.visualizations.conclusion) {
          this.renderConclusionChart();
          this.visualizations.conclusion = true;
        }
        break;
    }
  },

  renderConclusionChart() {
    const container = document.getElementById("viz-conclusion");
    if (!container) return;

    container.innerHTML =
      '<h3 class="chart-title">All Metrics Combined</h3><svg></svg>';

    const margin = { top: 20, right: 120, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select("#viz-conclusion svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const metrics = ["danceability", "energy", "valence", "acousticness"];
    const colors = ["#e85d75", "#4ecdc4", "#ffe66d", "#95e1d3"];

    const x = d3
      .scaleLinear()
      .domain([2000, 2023])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    metrics.forEach((metric, index) => {
      const data = BillboardData.getAverageByYear(metric);

      const path = svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors[index])
        .attr("stroke-width", 2.5)
        .attr("d", line)
        .attr("opacity", 0.8);

      // Animate
      const pathLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", pathLength + " " + pathLength)
        .attr("stroke-dashoffset", pathLength)
        .transition()
        .duration(2000)
        .delay(index * 300)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Legend
      svg
        .append("text")
        .attr("x", width + 10)
        .attr("y", index * 25 + 10)
        .style("fill", colors[index])
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text(metric.charAt(0).toUpperCase() + metric.slice(1))
        .style("opacity", 0)
        .transition()
        .duration(500)
        .delay(2000 + index * 300)
        .style("opacity", 1);
    });

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .attr("class", "axis");

    svg.append("g").call(d3.axisLeft(y)).attr("class", "axis");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Year");
  },

  setupSmoothScroll() {
    document.documentElement.style.scrollBehavior = "smooth";
  },

  visualizations: {},
};
