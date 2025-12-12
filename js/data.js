// js/data.js

let billboardSongs = [];
let yearlyFeatures = [];
let artistSummary = [];

function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

const BillboardData = {
  _loaded: false,

  async loadAll() {
    if (this._loaded) return;

    const [songsRaw, yearlyRaw, artistsRaw] = await Promise.all([
      fetch("data/songs_clean.json").then((r) => r.json()),
      fetch("data/yearly_features.json").then((r) => r.json()),
      fetch("data/artist_summary.json").then((r) => r.json()),
    ]);

    // Songs 
    billboardSongs = songsRaw.map((d) => ({
      year: Number(d.year),
      rank: Number(d.rank),
      title: d.title,
      artist: d.artist,
      danceability: toNumberOrNull(d.danceability),
      energy: toNumberOrNull(d.energy),
      valence: toNumberOrNull(d.valence),
      acousticness: toNumberOrNull(d.acousticness),
      tempo: toNumberOrNull(d.tempo),
      loudness: toNumberOrNull(d.loudness),
      speechiness: toNumberOrNull(d.speechiness),
      instrumentalness: toNumberOrNull(d.instrumentalness),
      liveness: toNumberOrNull(d.liveness),
      popularity: toNumberOrNull(d.popularity),
    }));

    // Yearly aggregates
    yearlyFeatures = yearlyRaw.map((d) => ({
      year: Number(d.year),
      danceability: toNumberOrNull(d.danceability),
      energy: toNumberOrNull(d.energy),
      valence: toNumberOrNull(d.valence),
      acousticness: toNumberOrNull(d.acousticness),
      tempo: toNumberOrNull(d.tempo),
      loudness: toNumberOrNull(d.loudness),
      speechiness: toNumberOrNull(d.speechiness),
      instrumentalness: toNumberOrNull(d.instrumentalness),
      liveness: toNumberOrNull(d.liveness),
    }));

    // Artist-level aggregates
    artistSummary = artistsRaw.map((d) => ({
      artist: d.artist,
      danceability: toNumberOrNull(d.danceability),
      energy: toNumberOrNull(d.energy),
      valence: toNumberOrNull(d.valence),
      acousticness: toNumberOrNull(d.acousticness),
      tempo: toNumberOrNull(d.tempo),
      loudness: toNumberOrNull(d.loudness),
      speechiness: toNumberOrNull(d.speechiness),
      instrumentalness: toNumberOrNull(d.instrumentalness),
      liveness: toNumberOrNull(d.liveness),
      count: Number(d.count),
    }));

    this._loaded = true;

    console.log(
      "[BillboardData] Loaded",
      billboardSongs.length,
      "songs,",
      yearlyFeatures.length,
      "yearly rows,",
      artistSummary.length,
      "artists"
    );
  },

  // Getters 

  getSongs() {
    return billboardSongs;
  },

  getYearlyFeatures() {
    return yearlyFeatures;
  }

  ,
  getArtistSummary() {
    // Filter out artists with missing metrics or zero songs
    return artistSummary.filter(
      (a) =>
        a.count > 0 &&
        a.danceability !== null &&
        a.energy !== null
    );
  },

  // Helpers

  getAverageByYear(metric) {

  const fromYearly = yearlyFeatures
    .map(d => ({ year: d.year, value: d[metric] }))
    .filter(d => d.value !== null && d.value !== undefined && !Number.isNaN(d.value));

  if (fromYearly.length >= 20) return fromYearly.sort((a,b) => a.year - b.year);

  // Compute from track-level songs
  const byYear = d3.rollups(
    billboardSongs.filter(s => s[metric] !== null && s[metric] !== undefined && !Number.isNaN(s[metric])),
    v => d3.mean(v, s => s[metric]),
    s => s.year
  );

  return byYear
    .map(([year, value]) => ({ year: +year, value }))
    .sort((a,b) => a.year - b.year);
},


  // Histogram over track-level values for a metric
  getDistribution(metric, binCount = 20) {
    const values = billboardSongs
      .map((d) => d[metric])
      .filter((v) => v !== null && !Number.isNaN(v));

    if (!values.length) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const binSize = range / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      min: min + i * binSize,
      max: min + (i + 1) * binSize,
      count: 0,
    }));

    values.forEach((v) => {
      let idx = Math.floor((v - min) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= binCount) idx = binCount - 1;
      bins[idx].count += 1;
    });

    return bins;
  },
};

// Make the songs array available like before for any legacy usages
window.BillboardData = BillboardData;
