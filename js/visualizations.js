// Visualization Functions using Three.js and D3.js

const Visualizations = {
  // Hero 3D Particle Animation
  initHero() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.position.z = 5;

    // Create particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    // Animation
    function animate() {
      requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener("resize", () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
  },

  // Distribution Histogram
  renderDistribution(containerId, _data, metric) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML =
      '<h3 class="chart-title">Distribution of ' +
      metric.charAt(0).toUpperCase() +
      metric.slice(1) +
      "</h3><svg></svg>";

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(`#${containerId} svg`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const histogram = BillboardData.getDistribution(metric, 25);

    const x = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(histogram, (d) => d.count)])
      .range([height, 0]);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);

    // Draw bars
    svg
      .selectAll("rect")
      .data(histogram)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.min))
      .attr("y", height)
      .attr("width", (d) => Math.max(0, x(d.max) - x(d.min) - 1))
      .attr("height", 0)
      .attr("fill", (d) => colorScale((d.min + d.max) / 2))
      .attr("opacity", 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count));

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10))
      .attr("class", "axis");

    // Y axis
    svg.append("g").call(d3.axisLeft(y)).attr("class", "axis");

    // Axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text(metric.charAt(0).toUpperCase() + metric.slice(1));

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Number of Songs");
  },

  // Line Chart for Trends
  renderTrends(containerId, _data, metric, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<h3 class="chart-title">${title}</h3><svg></svg>`;

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(`#${containerId} svg`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yearlyData = BillboardData.getAverageByYear(metric);

    const x = d3
      .scaleLinear()
      .domain([2000, 2023])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("class", "grid-line");

    // Line
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg
      .append("path")
      .datum(yearlyData)
      .attr("fill", "none")
      .attr("stroke", "#e85d75")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line drawing
    const pathLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", pathLength + " " + pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Add points
    svg
      .selectAll("circle")
      .data(yearlyData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.value))
      .attr("r", 0)
      .attr("fill", "#e85d75")
      .transition()
      .duration(500)
      .delay((d, i) => i * 80)
      .attr("r", 4);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .attr("class", "axis");

    svg.append("g").call(d3.axisLeft(y)).attr("class", "axis");

    // Labels
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
      .text(
        "Average " + metric.charAt(0).toUpperCase() + metric.slice(1)
      );
  },

  // 3D Scatter Plot
  init3DScatter(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

  
    container.style.position = "relative";

    container.innerHTML = `
      <h3 class="chart-title">Multi-Dimensional Music Space</h3>
      <p class="chart-subtitle">Each point is a song • Position: danceability/energy/valence • Color: year</p>
      <div id="canvas-3d" style="position:relative; height:520px;"></div>
      <div class="axis-label-3d axis-energy">Energy ↑</div>
      <div class="axis-label-3d axis-dance">Danceability →</div>
      <div class="axis-label-3d axis-valence">Valence ↗</div>
      <div id="tooltip-3d" class="tooltip"></div>
    `;

    const canvasContainer = container.querySelector("#canvas-3d");
    const tooltip         = container.querySelector("#tooltip-3d");
    const lblEnergy       = container.querySelector(".axis-energy");
    const lblDance        = container.querySelector(".axis-dance");
    const lblValence      = container.querySelector(".axis-valence");

    [lblEnergy, lblDance, lblValence].forEach((l) => {
      l.style.position = "absolute";
      l.style.left = "0px";
      l.style.top = "0px";
      l.style.fontSize = "12px";
      l.style.fontWeight = "600";
      l.style.color = "#333";
      l.style.pointerEvents = "none";
    });

    const width  = canvasContainer.clientWidth;
    const height = 520;

    const N = Math.min(3000, data.length);
    const sampled = d3.shuffle([...data]).slice(0, N);

    const sx = d3.scaleLinear().domain([0, 1]).range([-5, 5]); 
    const sy = d3.scaleLinear().domain([0, 1]).range([-5, 5]); 
    const sz = d3.scaleLinear().domain([0, 1]).range([-5, 5]); 

    const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([2000, 2023]);

    const popVals = sampled.map((d) => d.popularity ?? 50);
    const sizeScale = d3
      .scaleSqrt()
      .domain([d3.min(popVals), d3.max(popVals)])
      .range([0.05, 0.18]);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 10, 35);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 0);
    canvasContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(8, 10, 8);
    scene.add(dir);

    const axes = new THREE.AxesHelper(6);
    scene.add(axes);

    // 3D positions of axis label anchors
    const axisPositions = {
      energy:  new THREE.Vector3(0, 6, 0),
      dance:   new THREE.Vector3(6, 0, 0),
      valence: new THREE.Vector3(0, 0, 6),
    };

    // instanced points
    const geometry = new THREE.SphereGeometry(1, 10, 10);
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, sampled.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(sampled.length * 3);
    const color  = new THREE.Color();

    sampled.forEach((d, i) => {
      dummy.position.set(
        sx(+d.danceability || 0),
        sy(+d.energy || 0),
        sz(+d.valence || 0)
      );
      const r = sizeScale(d.popularity ?? 50);
      dummy.scale.set(r, r, r);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.set(colorScale(+d.year || 2000));
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    // hover picking
    const raycaster = new THREE.Raycaster();
    const pointer   = new THREE.Vector2();

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(mesh);

      if (hits.length) {
        const idx = hits[0].instanceId;
        const d = sampled[idx];

        tooltip.classList.add("visible");
        tooltip.style.left = e.clientX - rect.left + 12 + "px";
        tooltip.style.top  = e.clientY - rect.top + 12 + "px";
        tooltip.innerHTML = `
          <div style="font-weight:700">${d.song ?? d.title ?? "Song"}</div>
          <div style="opacity:.85">${d.band_singer ?? d.artist ?? "Artist"} • ${d.year}</div>
          <div style="opacity:.85">
            dance ${(+d.danceability || 0).toFixed(2)} •
            energy ${(+d.energy || 0).toFixed(2)} •
            valence ${(+d.valence || 0).toFixed(2)}
          </div>
        `;
      } else {
        tooltip.classList.remove("visible");
      }
    }

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("mouseleave", () =>
      tooltip.classList.remove("visible")
    );

    // animation + axis label projection
    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.003;

      camera.position.x = Math.cos(t) * 13;
      camera.position.z = Math.sin(t) * 13;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      const canvasRect    = renderer.domElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const w  = canvasRect.width;
      const h  = canvasRect.height;
      const ox = canvasRect.left - containerRect.left;
      const oy = canvasRect.top  - containerRect.top;

      function placeLabel(labelEl, pos) {
        const p = pos.clone().project(camera);
        const x = ox + (p.x * 0.5 + 0.5) * w;
        const y = oy + (-p.y * 0.5 + 0.5) * h;
        labelEl.style.transform = `translate(${x}px, ${y}px)`;
      }

      placeLabel(lblEnergy,  axisPositions.energy);
      placeLabel(lblDance,   axisPositions.dance);
      placeLabel(lblValence, axisPositions.valence);
    }

  animate();

  window.addEventListener("resize", () => {
    const newWidth = canvasContainer.clientWidth;
    camera.aspect = newWidth / height;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, height);
  });
},

  // Timeline Sphere - 3D rotating sphere with years as rings
  initTimelineSphere(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h3 class="chart-title">24 Years as a Living Globe</h3>
    <p class="chart-subtitle">Ring thickness = energy • Color = year</p>
    <div id="canvas-timeline" style="width:100%; height:520px;"></div>
  `;

  const mount = container.querySelector('#canvas-timeline');
  if (!mount) return;

  // If WebGL fails or Three.js missing, show readable error
  if (typeof THREE === 'undefined') {
    mount.innerHTML = `<div class="loading">Three.js not loaded (THREE is undefined)</div>`;
    return;
  }

  // Clear any previous canvas
  mount.innerHTML = '';

  const width = mount.clientWidth;
  const height = mount.clientHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    mount.innerHTML = `<div class="loading">WebGL failed: ${e.message}</div>`;
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 10, 40);

  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 0, 14);
  camera.lookAt(0, 0, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(10, 12, 8);
  scene.add(dir);

  // Group all rings for easy rotation
  const globe = new THREE.Group();
  scene.add(globe);

  // Group data by year
  const yearGroups = d3.group(data, d => +d.year);
  const years = Array.from(yearGroups.keys()).sort((a, b) => a - b);

  const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
    .domain([2023, 2000]);

  // Build “latitude” rings
  const radius = 5;
  const pointsPerRing = 44;

  years.forEach((year, idx) => {
    const songs = yearGroups.get(year) || [];
    const avgEnergy = d3.mean(songs, d => d.energy) ?? 0.5;

    // map year index to latitude
    const lat = (idx / (years.length - 1)) * Math.PI - Math.PI / 2;

    // thickness based on energy
    const size = 0.05 + avgEnergy * 0.10;

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorScale(year)),
      emissive: new THREE.Color(colorScale(year)),
      emissiveIntensity: 0.18,
      roughness: 0.4,
      metalness: 0.05
    });

    const geo = new THREE.SphereGeometry(size, 10, 10);

    for (let i = 0; i < pointsPerRing; i++) {
      const lon = (i / pointsPerRing) * Math.PI * 2;

      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);

      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, z);
      globe.add(p);
    }
  });

  // Subtle outline sphere so it reads as a globe
  const outline = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.03 })
  );
  globe.add(outline);

  // Fit camera 
  const box = new THREE.Box3().setFromObject(globe);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let camZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.35;

  camera.position.set(center.x, center.y, camZ);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  // Animate: slow orbit
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.003;
    globe.rotation.y = t;
    globe.rotation.x = Math.sin(t * 0.35) * 0.12;
    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    const newW = mount.clientWidth;
    const newH = mount.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
},



  // Sound Wave Visualization with scroll-based pulse
  initSoundWave(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h3 class="chart-title">Energy Waveform</h3>
    <p class="chart-subtitle">Center line = average energy • Thickness = danceability • Peaks = era shifts</p>
    <canvas id="wave-canvas" style="width:100%; height:460px;"></canvas>
  `;

  const canvas = container.querySelector('#wave-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    // crisp canvas on retina
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function fillYears(series, start=2000, end=2023) {
    const m = new Map(series.map(d => [d.year, d.value]));
    const out = [];
    for (let y = start; y <= end; y++) out.push({ year: y, value: m.get(y) ?? null });

    // linear interpolate nulls
    for (let i = 0; i < out.length; i++) {
      if (out[i].value != null) continue;

      // find prev and next
      let p = i - 1; while (p >= 0 && out[p].value == null) p--;
      let n = i + 1; while (n < out.length && out[n].value == null) n++;

      if (p >= 0 && n < out.length) {
        const t = (out[i].year - out[p].year) / (out[n].year - out[p].year);
        out[i].value = out[p].value + (out[n].value - out[p].value) * t;
      }
    }
    return out;
  }

  resize();
  window.addEventListener('resize', resize);

  const yearlyEnergy = fillYears(BillboardData.getAverageByYear('energy'));
  const yearlyDance  = fillYears(BillboardData.getAverageByYear('danceability'));

  // Build quick maps year -> value
  const E = new Map(yearlyEnergy.map(d => [d.year, d.value]));
  const D = new Map(yearlyDance.map(d => [d.year, d.value]));

  const years = yearlyEnergy.map(d => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  
  // Find "biggest change" years for annotation
  const deltas = yearlyEnergy.slice(1).map((d, i) => ({
    year: d.year,
    delta: d.value - yearlyEnergy[i].value
  }));
  const topShifts = [...deltas]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .sort((a, b) => a.year - b.year); 

  // Helpers
  const lerp = (a, b, t) => a + (b - a) * t;

  function draw(scrollT = 0) {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = 'rgba(250,250,250,1)';
    ctx.fillRect(0, 0, w, h);

    const padL = 50, padR = 20, padT = 30, padB = 45;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    const xForYear = (year) => padL + ((year - minYear) / (maxYear - minYear)) * innerW;
    const yForVal = (v) => padT + (1 - v) * innerH;

    // axes
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;

    // horizontal grid
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * innerH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + innerW, y);
      ctx.stroke();
    }

    // x ticks
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    for (let yr = 2000; yr <= 2023; yr += 4) {
      const x = xForYear(yr);
      ctx.beginPath();
      ctx.moveTo(x, padT + innerH);
      ctx.lineTo(x, padT + innerH + 6);
      ctx.stroke();

      ctx.fillText(String(yr), x - 12, padT + innerH + 22);
    }

    // Draw the wave
    const points = yearlyEnergy.map(d => ({
      year: d.year,
      e: d.value,
      d: D.get(d.year) ?? 0.5
    }));

    // Animate reveal with scrollT (0..1)
    const visibleCount = Math.max(2, Math.floor(lerp(2, points.length, scrollT)));

    for (let i = 1; i < visibleCount; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      const x0 = xForYear(p0.year);
      const y0 = yForVal(p0.e);
      const x1 = xForYear(p1.year);
      const y1 = yForVal(p1.e);

      // thickness from danceability
      const thick = 2 + (p1.d * 10);

      // color from year (cool->warm via hue)
      const t = (p1.year - minYear) / (maxYear - minYear);
      const hue = lerp(210, 20, t); // blue->red
      ctx.strokeStyle = `hsla(${hue}, 75%, 45%, 0.85)`;
      ctx.lineWidth = thick;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Markers for top shifts
    ctx.font = '12px Inter, system-ui, sans-serif';
    topShifts.forEach(s => {
      const x = xForYear(s.year);
      const y = yForVal(E.get(s.year));

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      const label = `${s.year} shift`;
      ctx.fillText(label, x + 8, y - 8);
    });

    // Y label
    ctx.save();
    ctx.translate(16, padT + innerH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Energy (0 → 1)', 0, 0);
    ctx.restore();

    // Legend
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText('Line thickness = danceability', padL, 18);
    ctx.fillText('Color = year (cool → warm)', padL + 210, 18);
  }

  let animT = 0;
  let playing = false;

  function animateToEnd() {
    if (!playing) return;
    animT = Math.min(1, animT + 0.04); 
    draw(animT);
    if (animT < 1) requestAnimationFrame(animateToEnd);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e.isIntersecting && !playing) {
        playing = true;
        requestAnimationFrame(animateToEnd);
      }
    },
    { threshold: 0.25 } 
  );

  observer.observe(container);

  // draw initial state
  draw(0);

},


  // 3D Data Wave
  initDataWave(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h3 class="chart-title">The Evolution Ribbon (2000 → 2023)</h3>
    <p class="chart-subtitle">X = year • Y = energy • Z = danceability • Color = valence</p>
    <div id="canvas-wave" style="position:relative;"></div>
  `;

  const canvasContainer = container.querySelector('#canvas-wave');
  const width = container.clientWidth;
  const height = 560;

  // yearly averages 
  const energyByYear = BillboardData.getAverageByYear('energy');
  const danceByYear  = BillboardData.getAverageByYear('danceability');
  const valByYear    = BillboardData.getAverageByYear('valence');

  // merge into one array
  const yearly = energyByYear.map((d, i) => ({
    year: d.year,
    energy: d.value,
    danceability: danceByYear[i]?.value ?? 0.5,
    valence: valByYear[i]?.value ?? 0.5
  }));

  // scales to scene space
  const xScale = d3.scaleLinear().domain([2000, 2023]).range([-10, 10]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([-4.5, 4.5]);
  const zScale = d3.scaleLinear().domain([0, 1]).range([-4.5, 4.5]);
  const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([0, 1]); // valence

  // three.js scene 
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 10, 40);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(18, 10, 18);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff, 0);
  canvasContainer.appendChild(renderer.domElement);

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 12, 8);
  scene.add(dir);

  // axes helper for meaning
  const axes = new THREE.AxesHelper(8);
  scene.add(axes);

  //  build a colored tube along the timeline 
  const points = yearly.map(d => new THREE.Vector3(
    xScale(d.year),
    yScale(d.energy),
    zScale(d.danceability)
  ));

  const curve = new THREE.CatmullRomCurve3(points);
  const tubularSegments = 200;
  const radius = 0.22;
  const radialSegments = 14;
  const closed = false;

  const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);

  // vertex colors based on valence along the tube
  const colors = [];
  const pos = tubeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // map vertex index to year index
    const t = i / (pos.count - 1);
    const approxIndex = Math.min(yearly.length - 1, Math.floor(t * (yearly.length - 1)));
    const v = yearly[approxIndex].valence;

    const c = new THREE.Color(colorScale(v));
    colors.push(c.r, c.g, c.b);
  }
  tubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const tubeMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.95
  });

  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);

  const beadGeo = new THREE.SphereGeometry(0.18, 16, 16);

  yearly.forEach(d => {
    const beadMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorScale(d.valence)),
      emissive: new THREE.Color(colorScale(d.valence)),
      emissiveIntensity: 0.15
    });

    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(xScale(d.year), yScale(d.energy), zScale(d.danceability));
    scene.add(bead);
  });

  //  add a simple “legend” as HTML overlay 
  const legend = document.createElement('div');
  legend.style.position = 'absolute';
  legend.style.right = '12px';
  legend.style.bottom = '12px';
  legend.style.background = 'rgba(255,255,255,0.85)';
  legend.style.border = '1px solid #ddd';
  legend.style.borderRadius = '8px';
  legend.style.padding = '10px 12px';
  legend.style.fontSize = '12px';
  legend.style.color = '#333';
  legend.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">How to read this</div>
    <div>→ X: Year</div>
    <div>↑ Y: Energy</div>
    <div>↗ Z: Danceability</div>
    <div>Color: Valence (sad → happy)</div>
  `;
  canvasContainer.appendChild(legend);

  // animate orbit
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.0025;
    camera.position.x = Math.cos(t) * 22;
    camera.position.z = Math.sin(t) * 22;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();

  // resize
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    camera.aspect = newWidth / height;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, height);
  });
},

  // Sonic Radar Graph: hard-coded comparison of Taylor Swift, Drake, The Weeknd
  renderArtistRadar(containerId, focusArtist) {
    const container = document.getElementById(containerId);
    if (!container) return;

    //  static artist profiles (0–1, already normalized-ish) 
    const artists = [
      {
        id: "taylor",
        name: "Taylor Swift",
        songs: 31,
        color: "#e85d75",
        metrics: {
          danceability: 0.66,
          energy:       0.59,
          valence:      0.56,
          acousticness: 0.36,
          tempo:        0.57
        }
      },
      {
        id: "drake",
        name: "Drake",
        songs: 40,
        color: "#1dd3b0",
        metrics: {
          danceability: 0.78,
          energy:       0.64,
          valence:      0.52,
          acousticness: 0.21,
          tempo:        0.60
        }
      },
      {
        id: "weeknd",
        name: "The Weeknd",
        songs: 18,
        color: "#7b5cff",
        metrics: {
          danceability: 0.72,
          energy:       0.72,
          valence:      0.38,
          acousticness: 0.14,
          tempo:        0.63
        }
      }
    ];

    // Which artist should be highlighted in this section?
    function guessFocusId(name) {
      const n = (name || "").toLowerCase();
      if (n.includes("drake")) return "drake";
      if (n.includes("weeknd")) return "weeknd";
      if (n.includes("weeknd")) return "weeknd";
      return "taylor";
    }
    const focusId = guessFocusId(focusArtist);
    artists.forEach(a => (a.isFocus = a.id === focusId));

    //  build container + svg 
    container.innerHTML = `
      <h3 class="chart-title">Sonic Fingerprint</h3>
      <p class="chart-subtitle">
        Comparing Taylor Swift, Drake, and The Weeknd across five audio features
      </p>
      <svg></svg>
    `;

    const width  = container.clientWidth || 600;
    const height = 420;
    const margin = 80;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3
      .select(`#${containerId} svg`)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const metrics = [
      { key: "danceability", label: "Danceability" },
      { key: "energy",       label: "Energy" },
      { key: "valence",      label: "Valence (mood)" },
      { key: "acousticness", label: "Acousticness" },
      { key: "tempo",        label: "Tempo (normalized)" }
    ];
    const angleSlice = (Math.PI * 2) / metrics.length;

    //  background grid
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach((lvl) => {
      const r = radius * lvl;
      svg
        .append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1);

      svg
        .append("text")
        .attr("x", 0)
        .attr("y", -r - 4)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#999")
        .text(lvl.toFixed(1));
    });

    //  axes + axis labels 
    metrics.forEach((m, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // axis line
      svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#cccccc")
        .attr("stroke-width", 1);

      // axis label
      svg
        .append("text")
        .attr("x", x * 1.17)
        .attr("y", y * 1.17)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#333")
        .text(m.label);
    });

    const line = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveLinearClosed);

    function pointsForArtist(a) {
      return metrics.map((m, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const value = Math.max(0, Math.min(1, a.metrics[m.key] || 0));
        return {
          x: Math.cos(angle) * radius * value,
          y: Math.sin(angle) * radius * value
        };
      });
    }

    // draw non-highlighted artists first, then highlighted on top
    const drawOrder = artists
      .slice()
      .sort((a, b) => (a.isFocus === b.isFocus ? 0 : a.isFocus ? 1 : -1));

    drawOrder.forEach((a) => {
      const pts = pointsForArtist(a);
      const group = svg.append("g");

      group
        .append("path")
        .datum(pts)
        .attr("d", line)
        .attr("fill", a.color)
        .attr("fill-opacity", a.isFocus ? 0.40 : 0.16)
        .attr("stroke", a.color)
        .attr("stroke-width", a.isFocus ? 3 : 2);

      if (a.isFocus) {
        // highlight points with dots
        group
          .selectAll("circle")
          .data(pts)
          .enter()
          .append("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", 4)
          .attr("fill", a.color);
      }
    });

    //  legend 
    const legendRoot = d3
      .select(`#${containerId} svg`)
      .append("g")
      .attr(
        "transform",
        `translate(${margin}, ${height - margin + 8})`
      );

    const legend = legendRoot
      .selectAll(".legend-item")
      .data(artists)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(${i * 200}, 0)`);

    legend
      .append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", (d) => d.color)
      .attr("opacity", (d) => (d.isFocus ? 1 : 0.7));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 11)
      .style("font-size", "12px")
      .style("fill", "#333")
      .text((d) => {
        const base = `${d.name} (${d.songs} songs)`;
        return d.isFocus ? `${base} • highlighted` : base;
      });
  },




  // Bubble Chart for Artists
  renderArtistBubbles(containerId, _data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML =
      '<h3 class="chart-title">Artists by Sound Characteristics</h3><svg></svg>';

    container.style.position = "relative"; 

    const tip = document.createElement("div");
    tip.className = "bubble-tooltip";
    tip.style.position = "absolute";
    tip.style.pointerEvents = "none";
    tip.style.opacity = "0";
    tip.style.transform = "translate(-50%, -120%)";
    tip.style.padding = "10px 12px";
    tip.style.borderRadius = "10px";
    tip.style.background = "rgba(255,255,255,0.95)";
    tip.style.border = "1px solid rgba(0,0,0,0.12)";
    tip.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
    tip.style.fontSize = "12px";
    tip.style.color = "#222";
    tip.style.zIndex = "10";
    container.appendChild(tip);

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(`#${containerId} svg`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);


    const raw = (_data && _data.length) ? _data : (BillboardData?.data || []);
    console.log("[renderArtistBubbles] raw rows:", raw.length);


    const rows = raw
      .map(d => ({
        artist: d.band_singer ?? d.artist ?? d.artist_name ?? null,
        danceability: +d.danceability,
        energy: +d.energy
      }))
      .filter(d =>
        d.artist &&
        Number.isFinite(d.danceability) &&
        Number.isFinite(d.energy)
      );


    const artistData = d3.rollups(
      rows,
      v => ({
        danceability: d3.mean(v, d => d.danceability),
        energy: d3.mean(v, d => d.energy),
        count: v.length
      }),
      d => d.artist
    ).map(([artist, stats]) => ({ artist, ...stats }))
    .filter(d => Number.isFinite(d.danceability) && Number.isFinite(d.energy));

    console.log("[renderArtistBubbles] artists:", artistData.length);

    if (!artistData.length) {
      svg.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .style("fill", "#666")
        .style("font-size", "14px")
        .text("No artist data to plot (check artist column + data loading).");
      return;
    }

    // Scales
    const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    const size = d3.scaleSqrt()
      .domain([0, d3.max(artistData, d => d.count)])
      .range([5, 40]);

    const colorScale = d3.scaleSequential(d3.interpolateTurbo)
      .domain([0, artistData.length]);

    // Sort biggest first for labels
    artistData.sort((a, b) => b.count - a.count);

    // Bubbles
    let pinned = null;

    const bubbles = svg
      .selectAll("circle")
      .data(artistData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.danceability))
      .attr("cy", d => y(d.energy))
      .attr("r", d => size(d.count))
      .attr("fill", (d, i) => colorScale(i))
      .attr("opacity", 0.65)
      .attr("stroke", "rgba(255,255,255,0.9)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // bring-to-front helper
    function raise(sel) { sel.each(function(){ this.parentNode.appendChild(this); }); }

    function showTip(event, d) {
      const [mx, my] = d3.pointer(event, container);
      tip.innerHTML = `
        <div style="font-weight:800; font-size:13px; margin-bottom:4px;">${d.artist}</div>
        <div style="opacity:.85">Hits in dataset: <b>${d.count}</b></div>
        <div style="opacity:.85">Danceability: <b>${d.danceability.toFixed(2)}</b></div>
        <div style="opacity:.85">Energy: <b>${d.energy.toFixed(2)}</b></div>
        <div style="margin-top:6px; opacity:.6">Click to pin</div>
      `;
      tip.style.left = `${mx}px`;
      tip.style.top = `${my}px`;
      tip.style.opacity = "1";
    }

    function hideTip() {
      if (!pinned) tip.style.opacity = "0";
    }

    function highlight(d) {
      bubbles
        .attr("opacity", b => (pinned ? (b.artist === pinned ? 0.95 : 0.18) : 0.35))
        .attr("stroke-width", b => (b.artist === d.artist ? 3.5 : 2));

      const sel = bubbles.filter(b => b.artist === d.artist);
      raise(sel);
      sel.attr("opacity", 0.95);
    }

    bubbles
      .on("mousemove", function(event, d) {
        if (!pinned) showTip(event, d);
        highlight(d);
      })
      .on("mouseenter", function(event, d) {
        if (!pinned) showTip(event, d);
        highlight(d);
      })
      .on("mouseleave", function() {
        if (!pinned) {
          bubbles.attr("opacity", 0.65).attr("stroke-width", 2);
          hideTip();
        }
      })
      .on("click", function(event, d) {
        // toggle pin
        pinned = (pinned === d.artist) ? null : d.artist;

        if (pinned) {
          showTip(event, d);
          highlight(d);
          tip.innerHTML = tip.innerHTML.replace("Click to pin", "Click again to unpin");
          tip.style.opacity = "1";
        } else {
          bubbles.attr("opacity", 0.65).attr("stroke-width", 2);
          tip.style.opacity = "0";
        }
      });


    // Labels
    svg.selectAll("text.artist-label")
      .data(artistData.slice(0, 8))
      .enter()
      .append("text")
      .attr("class", "artist-label")
      .attr("x", d => x(d.danceability))
      .attr("y", d => y(d.energy))
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text(d => d.artist)
      .transition()
      .duration(400)
      .delay(1000)
      .style("opacity", 1);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr("class", "axis");

    svg.append("g")
      .call(d3.axisLeft(y))
      .attr("class", "axis");

    // Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Average Danceability");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Average Energy");
  },

};
// -----------------------------
// ERA COMPARISON (Grouped Bars)
// + hover triggers era soundtrack
// -----------------------------
// -----------------------------
// ERA COMPARISON (Grouped Bars)
// + hover triggers era soundtrack
// -----------------------------
Visualizations.renderEraComparison = function (containerId, _data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h3 class="chart-title">Era Comparison (Top-10 avg)</h3>
    <div class="era-hint">Hover over an era to hear its soundscape</div>
    <svg></svg>
  `;

  const ERAS = [
    { key: "2000–2005", start: 2000, end: 2005 },
    { key: "2006–2011", start: 2006, end: 2011 },
    { key: "2012–2019", start: 2012, end: 2019 },
    { key: "2020–2023", start: 2020, end: 2023 },
  ];

  const METRICS = [
    { key: "danceability", label: "Danceability" },
    { key: "energy", label: "Energy" },
    { key: "valence", label: "Valence" },
  ];

  const margin = { top: 90, right: 30, bottom: 70, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 420 - margin.top - margin.bottom;


  d3.select(container).selectAll(".legend, .legend-wrap, .chart-legend").remove();

  // svg element (real <svg>)
  const svgEl = d3
    .select(`#${containerId} svg`)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .html("");

  // plot group (translated by margins)
  const g = svgEl
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // --- tooltip helpers ---
  let tooltip = d3.select(container).select(".era-tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select(container)
      .append("div")
      .attr("class", "era-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  function showEraTooltip(event, eraKey) {
    tooltip
      .style("opacity", 1)
      .html(`<strong>${eraKey}</strong><div>Sound preview: 10s</div>`);
    moveEraTooltip(event);
  }

  function moveEraTooltip(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left + 12;
    const y = event.clientY - rect.top + 12;
    tooltip.style("left", `${x}px`).style("top", `${y}px`);
  }

  function hideEraTooltip() {
    tooltip.style("opacity", 0);
  }

  // Modern palette
  const color = d3
    .scaleOrdinal()
    .domain(METRICS.map((m) => m.key))
    .range(["#7C83FD", "#2DD4BF", "#FDBA74"]);

  // aggregated yearly series (provided by your data layer)
  const yearly = {
    danceability: BillboardData.getAverageByYear("danceability"),
    energy: BillboardData.getAverageByYear("energy"),
    valence: BillboardData.getAverageByYear("valence"),
  };

  const meanInEra = (arr, era) => {
    const values = arr
      .filter((d) => d.year >= era.start && d.year <= era.end)
      .map((d) => d.value)
      .filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
    return values.length ? d3.mean(values) : 0;
  };

  const data = [];
  ERAS.forEach((era) => {
    METRICS.forEach((m) => {
      data.push({
        era: era.key,
        metric: m.key,
        metricLabel: m.label,
        value: meanInEra(yearly[m.key], era),
      });
    });
  });

  // scales
  const x0 = d3
    .scaleBand()
    .domain(ERAS.map((e) => e.key))
    .range([0, width])
    .paddingInner(0.2);

  const x1 = d3
    .scaleBand()
    .domain(METRICS.map((m) => m.key))
    .range([0, x0.bandwidth()])
    .padding(0.15);

  const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  // axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "12px");

  g.append("g").call(d3.axisLeft(y).ticks(5));

  // groups per era
  const groups = g
    .selectAll(".era-group")
    .data(ERAS.map((e) => e.key))
    .enter()
    .append("g")
    .attr("class", "era-group")
    .attr("transform", (d) => `translate(${x0(d)},0)`);

  // bars
  groups
    .selectAll("rect.bar")
    .data((eraKey) => data.filter((d) => d.era === eraKey))
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x1(d.metric))
    .attr("y", height)
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", (d) => color(d.metric))
    .attr("opacity", 0.92)
    .attr("stroke", "rgba(0,0,0,0.14)")
    .attr("stroke-width", 0.5)
    .transition()
    .duration(900)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => height - y(d.value));

  // one hover zone per era (prevents jitter)
  groups
    .append("rect")
    .attr("class", "era-hover-zone")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", x0.bandwidth())
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseenter", function (event, eraKey) {
      if (window.AudioController) window.AudioController.previewEra(eraKey, 10);

      // dim all bars
      groups.selectAll("rect.bar").attr("opacity", 0.25);

      // highlight current era bars
      d3.select(this.parentNode).selectAll("rect.bar").attr("opacity", 0.95);

      showEraTooltip(event, eraKey);
    })
    .on("mousemove", function (event) {
      moveEraTooltip(event);
    })
    .on("mouseleave", function () {
      if (window.AudioController) window.AudioController.stop();

      groups.selectAll("rect.bar").attr("opacity", 0.92);
      hideEraTooltip();
    });

  // --- legend in SVG header (single, always visible) ---
  svgEl.selectAll(".legend").remove();

  const legend = svgEl
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width - 190}, 10)`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 180)
    .attr("height", 78)
    .attr("rx", 10)
    .attr("fill", "white")
    .attr("stroke", "rgba(0,0,0,0.10)");

  const legendItems = [
    { label: "Danceability", color: "#7C83FD" },
    { label: "Energy", color: "#2DD4BF" },
    { label: "Valence", color: "#FDBA74" },
  ];

  const legendRow = legend
    .selectAll(".legend-row")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("class", "legend-row")
    .attr("transform", (d, i) => `translate(12, ${14 + i * 22})`);

  legendRow
    .append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 3)
    .attr("fill", (d) => d.color);

  legendRow
    .append("text")
    .attr("x", 20)
    .attr("y", 6)
    .text((d) => d.label)
    .attr("font-size", 13)
    .attr("fill", "#111")
    .attr("dominant-baseline", "middle");

  legend.raise();
  legend.style("pointer-events", "none");
};
