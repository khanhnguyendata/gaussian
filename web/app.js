const TAYLOR_COEFFS = [
  0,
  0.8862269254527579,
  0.0,
  0.2320136665346544,
  0.0,
  0.1275561753055979,
  0.0,
  0.08655212924154748,
  0.0,
  0.06495961774538536,
  0.0,
  0.05173128198461632,
  0.0,
  0.0428367206517973,
  0.0,
  0.03646592930853158,
  0.0,
  0.031689005021605404,
  0.0,
  0.027980632964995183,
  0.0,
  0.025022275841198312,
  0.0,
  0.02260986331889753,
  0.0,
  0.02060678037905896,
  0.0,
  0.018918217250778815,
  0.0,
  0.017476370562856506,
  0.0,
  0.01623150098768521,
  0.0,
  0.015146315063247762,
  0.0,
  0.014192316002509923,
  0.0,
  0.013347364197421255,
  0.0,
  0.01259400487133203,
  0.0,
  0.011918295936392001,
  0.0,
  0.011308970105922496,
  0.0,
  0.010756825303317919,
  0.0,
  0.01025427408185343,
  0.0,
  0.009795005770071136,
  0.0
];

const REF_DEGREE = 50;
const EPSILON = 1e-6;
const CHART_POINTS = 400;
const HIST_RANGE = [-4, 4];

const state = {
  sampleCount: 1000,
  degree: 21,
  seedX: 42,
  seedY: 24,
  uniformXs: [],
  uniformYs: [],
  gaussianXs: [],
  gaussianYs: []
};

function clampArea(a) {
  return Math.min(1 - EPSILON, Math.max(EPSILON, a));
}

function evaluateSeries(b, degree) {
  const maxDegree = Math.min(degree, TAYLOR_COEFFS.length - 1);
  let sum = 0;
  let powerValue = 1; // b^0
  for (let power = 0; power <= maxDegree; power++) {
    const coeff = TAYLOR_COEFFS[power];
    if (coeff !== 0) {
      sum += coeff * powerValue;
    }
    powerValue *= b;
  }
  return sum;
}

function inverseCdfFromArea(area, degree) {
  const b = 2 * clampArea(area) - 1; // Map to [-1, 1]
  const approxErfInv = evaluateSeries(b, degree);
  return Math.SQRT2 * approxErfInv;
}

function createRng(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function sampleStreams(sampleCount, seedX, seedY, degree) {
  const rngX = createRng(seedX);
  const rngY = createRng(seedY);
  const uniformXs = new Array(sampleCount);
  const uniformYs = new Array(sampleCount);
  const gaussianXs = new Array(sampleCount);
  const gaussianYs = new Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const areaX = rngX();
    const areaY = rngY();
    uniformXs[i] = areaX;
    uniformYs[i] = areaY;
    gaussianXs[i] = inverseCdfFromArea(areaX, degree);
    gaussianYs[i] = inverseCdfFromArea(areaY, degree);
  }

  return { uniformXs, uniformYs, gaussianXs, gaussianYs };
}

function erf(x) {
  if (x === 0) return 0;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const poly = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const expTerm = Math.exp(-absX * absX);
  return sign * (1 - poly * expTerm);
}

function pdf(z) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

function cdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function computeQuality(degree) {
  let errSq = 0;
  let maxErr = 0;
  let minSample = Infinity;
  let maxSample = -Infinity;
  for (let i = 0; i < CHART_POINTS; i++) {
    const area = EPSILON + (i / (CHART_POINTS - 1)) * (1 - 2 * EPSILON);
    const approx = inverseCdfFromArea(area, degree);
    const ref = inverseCdfFromArea(area, REF_DEGREE);
    const err = approx - ref;
    errSq += err * err;
    if (Math.abs(err) > maxErr) maxErr = Math.abs(err);
    if (approx < minSample) minSample = approx;
    if (approx > maxSample) maxSample = approx;
  }
  return {
    rmse: Math.sqrt(errSq / CHART_POINTS),
    maxError: maxErr,
    window: [minSample, maxSample]
  };
}

function renderMapChart(degree) {
  const areas = [];
  const approxLine = [];
  const refLine = [];
  for (let i = 0; i < CHART_POINTS; i++) {
    const area = EPSILON + (i / (CHART_POINTS - 1)) * (1 - 2 * EPSILON);
    areas.push(area);
    approxLine.push(inverseCdfFromArea(area, degree));
    refLine.push(inverseCdfFromArea(area, REF_DEGREE));
  }
  const layout = {
    margin: { t: 24, r: 16, b: 40, l: 50 },
    legend: { orientation: 'h' },
    xaxis: { title: 'Left-side area (U(0, 1))' },
    yaxis: { title: 'Gaussian sample', zeroline: true, zerolinewidth: 1, zerolinecolor: '#999' },
    hovermode: 'x unified',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };
  const data = [
    {
      x: areas,
      y: refLine,
      name: 'Degree 50 (reference)',
      mode: 'lines',
      line: { color: '#0f172a', width: 3 }
    },
    {
      x: areas,
      y: approxLine,
      name: `Degree ${degree}`,
      mode: 'lines',
      line: { color: '#fb923c', width: 3 }
    }
  ];
  Plotly.react('mapChart', data, layout, { responsive: true });
}

function downSample(arr, stride) {
  if (stride <= 1) return arr;
  const out = [];
  for (let i = 0; i < arr.length; i += stride) {
    out.push(arr[i]);
  }
  return out;
}

function renderScatter(uniformXs, uniformYs, gaussianXs, gaussianYs) {
  const SCATTER_MAX = 2000;
  const stride = Math.ceil(uniformXs.length / SCATTER_MAX);
  const ux = downSample(uniformXs, stride);
  const uy = downSample(uniformYs, stride);
  const gx = downSample(gaussianXs, stride);
  const gy = downSample(gaussianYs, stride);

  Plotly.react(
    'uniformChart',
    [
      {
        x: ux,
        y: uy,
        mode: 'markers',
        name: 'Uniform',
        marker: { size: 6, opacity: 0.7, color: '#38bdf8' }
      }
    ],
    {
      margin: { t: 10, r: 10, b: 40, l: 40 },
      xaxis: { title: 'Area X', range: [0, 1] },
      yaxis: { title: 'Area Y', range: [0, 1] },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    },
    { responsive: true }
  );

  Plotly.react(
    'gaussianChart',
    [
      {
        x: gx,
        y: gy,
        mode: 'markers',
        name: 'Gaussian',
        marker: { size: 6, opacity: 0.7, color: '#fb923c' }
      }
    ],
    {
      margin: { t: 10, r: 10, b: 40, l: 40 },
      xaxis: { title: 'Z₁', range: [-4, 4] },
      yaxis: { title: 'Z₂', range: [-4, 4] },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    },
    { responsive: true }
  );
}

function renderHistogram(samples) {
  const layout = {
    margin: { t: 20, r: 20, b: 45, l: 55 },
    barmode: 'overlay',
    xaxis: { title: 'Sample value', range: HIST_RANGE },
    yaxis: { title: 'Density' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };
  const histTrace = {
    type: 'histogram',
    x: samples,
    nbinsx: 60,
    marker: { color: 'rgba(251, 146, 60, 0.8)' },
    opacity: 0.65,
    histnorm: 'probability density',
    name: 'Samples'
  };
  const z = [];
  const density = [];
  const steps = 200;
  for (let i = 0; i < steps; i++) {
    const value = HIST_RANGE[0] + (i / (steps - 1)) * (HIST_RANGE[1] - HIST_RANGE[0]);
    z.push(value);
    density.push(pdf(value));
  }
  const pdfTrace = {
    type: 'scatter',
    mode: 'lines',
    x: z,
    y: density,
    name: 'Target PDF',
    line: { color: '#0f172a', width: 3 }
  };
  Plotly.react('histChart', [histTrace, pdfTrace], layout, { responsive: true });
}

function updateMetrics({ rmse, maxError, window }) {
  document.getElementById('rmseMetric').textContent = rmse.toFixed(4);
  document.getElementById('maxErrorMetric').textContent = maxError.toFixed(4);
  document.getElementById('windowMetric').textContent = `${window[0].toFixed(2)} → ${window[1].toFixed(2)}`;
}

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function attachControlSync(input) {
  const target = document.querySelector(`[data-for="${input.id}"]`);
  if (!target) return;
  const sync = () => (target.textContent = input.value);
  input.addEventListener('input', sync);
  sync();
}

function refresh() {
  const { sampleCount, degree, seedX, seedY } = state;
  const { uniformXs, uniformYs, gaussianXs, gaussianYs } = sampleStreams(sampleCount, seedX, seedY, degree);
  state.uniformXs = uniformXs;
  state.uniformYs = uniformYs;
  state.gaussianXs = gaussianXs;
  state.gaussianYs = gaussianYs;

  renderMapChart(degree);
  renderScatter(uniformXs, uniformYs, gaussianXs, gaussianYs);
  renderHistogram(gaussianXs);
  updateMetrics(computeQuality(degree));
}

function init() {
  const sampleInput = document.getElementById('sampleCount');
  const degreeInput = document.getElementById('degree');
  const seedXInput = document.getElementById('seedX');
  const seedYInput = document.getElementById('seedY');
  const resampleBtn = document.getElementById('resample');

  [sampleInput, degreeInput].forEach(attachControlSync);

  sampleInput.addEventListener('input', (event) => {
    state.sampleCount = toInt(event.target.value, state.sampleCount);
    refresh();
  });
  degreeInput.addEventListener('input', (event) => {
    state.degree = toInt(event.target.value, state.degree);
    refresh();
  });
  seedXInput.addEventListener('change', (event) => {
    state.seedX = toInt(event.target.value, state.seedX);
    refresh();
  });
  seedYInput.addEventListener('change', (event) => {
    state.seedY = toInt(event.target.value, state.seedY);
    refresh();
  });
  resampleBtn.addEventListener('click', () => {
    refresh();
  });

  refresh();
}

window.addEventListener('DOMContentLoaded', init);
