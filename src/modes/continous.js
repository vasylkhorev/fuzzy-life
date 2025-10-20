// src/modes/ContinuousMode.js
import { GRID_SIZE } from "../config";

export const defaultParams = {
  birthLow: 0.35,
  birthHigh: 0.4,
  survLow: 0.2,
  survHigh: 0.45,
  fadeRate: 0.9,    // Multiplier for fading down
  promoteRate: 1.1, // Multiplier for promoting up
  oscillation: 0.05 // Small oscillation in high quartile
};

const QUARTILE_CENTERS = [0.125, 0.375, 0.625, 0.875];

export const computeNextStateContinuous = (grid, row, col, params = defaultParams, generation = 0) => {
  let sumN = 0;
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  let neighborCount = 0;
  for (let [dx, dy] of dirs) {
    const nr = row + dx, nc = col + dy;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      sumN += grid[nr][nc];
      neighborCount++;
    }
  }
  const N = sumN / Math.max(1, neighborCount);
  let M = grid[row][col];

  // Determine quartile: 0 [0,0.25), 1 [0.25,0.5), 2 [0.5,0.75), 3 [0.75,1]
  const quartile = Math.floor(M * 4);

  let nextM;
  switch (quartile) {
    case 0: // Low/Dead - Unique: Probabilistic birth
      if (params.birthLow < N && N < params.birthHigh) {
        // Probabilistic birth: higher N increases chance to high quartile
        const prob = (N - params.birthLow) / (params.birthHigh - params.birthLow);
        nextM = Math.random() < prob ? QUARTILE_CENTERS[3] : M * params.fadeRate;
      } else {
        nextM = M * params.fadeRate; // Slow fade to 0
      }
      break;
    case 1: // Med-Low - Unique: Gradual promotion
      if (params.survLow < N && N < 0.3) {
        nextM = M; // Stable
      } else if (N > 0.35) {
        nextM = Math.min(0.5, M * params.promoteRate); // Smooth promote toward med-high
      } else {
        nextM = Math.max(0, M * params.fadeRate); // Fade toward low
      }
      break;
    case 2: // Med-High - Unique: Balanced oscillation
      if (0.3 < N && N < 0.4) {
        nextM = M + params.oscillation * Math.sin(generation * 0.1); // Light oscillation
      } else if (N < 0.25) {
        nextM = Math.max(0.25, M * params.fadeRate); // Demote toward med-low
      } else {
        nextM = Math.min(1, M * params.promoteRate); // Promote toward high
      }
      break;
    case 3: // High - Unique: Survival with decay
      if (params.survLow < N && N < params.survHigh) {
        nextM = M; // Stable alive
      } else if (N < params.survLow) {
        nextM = Math.max(0.5, M * params.fadeRate); // Gradual fade to med-high
      } else {
        nextM = 0; // Sudden death to low
      }
      break;
    default:
      nextM = M;
  }

  return Math.max(0, Math.min(1, nextM));
};

export const renderCellContinuous = (ctx, x, y, val, cellSize, generation) => {
  if (val > 0) { // Only fill if >0 to avoid overdraw
    // Shade of gray: val=0 white (no fill), val=1 black
    const gray = Math.floor(255 * (1 - val)); // Inverted: high val -> low gray (black)
    ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
    ctx.fillRect(x, y, cellSize, cellSize);
  }
};

export const modeInfo = {
  label: 'Continuous',
  description: 'Cells evolve in quartiles with unique mechanics: probabilistic birth in low, gradual promotion in med-low, oscillation in med-high, and decay survival in high. Shades of gray visualize intensity.'
};

export const rulesHtml = `
<div class="space-y-5">
  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Overview</h4>
    <p class="text-slate-300">
      A fuzzy Game of Life variant where intensities \\( G(i,j) \\in [0,1] \\) evolve instead of binary states.
      Values fall into quartiles
      <span class="font-mono text-slate-200">Q0</span>,
      <span class="font-mono text-slate-200">Q1</span>,
      <span class="font-mono text-slate-200">Q2</span>,
      <span class="font-mono text-slate-200">Q3</span>.
      Moore neighborhood mean \\( N(i,j) = \\frac{1}{k} \\sum_{neighbors} G(neigh) \\) with \\( k \\le 8 \\).
    </p>
  </section>

  <div class="grid gap-4 md:grid-cols-2">
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">State Space</h5>
      <p class="text-slate-300">
        Quartile index \\( Q = \\lfloor G_t(i,j) \\times 4 \\rfloor \\).
        Representative centers \\( C = [0.125, 0.375, 0.625, 0.875] \\) guide transitions.
      </p>
    </section>
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Update Formula</h5>
      <p class="text-slate-300">
        Next state \\( G_{t+1}(i,j) = f(Q, N_t(i,j), params, generation) \\) selects behaviors per quartile.
        Values are always clamped to \\([0,1]\\).
      </p>
    </section>
  </div>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">Quartile Behaviors</h5>
    <dl class="space-y-3">
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100 flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-xs font-bold">Q0</span>
          Low / Dormant
        </dt>
        <dd class="text-slate-300 mt-1 text-sm">
          If \\( birthLow < N < birthHigh \\) then
          probability \\( \\frac{N - birthLow}{birthHigh - birthLow} \\) promotes to \\( C_3 \\);
          otherwise value fades by \\( fadeRate \\).
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100 flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-xs font-bold">Q1</span>
          Med-Low / Growing
        </dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Stable when \\( survLow < N < 0.3 \\); if \\( N > 0.35 \\) gently promotes toward \\( 0.5 \\) via
          \\( promoteRate \\); else decays by \\( fadeRate \\).
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100 flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-xs font-bold">Q2</span>
          Med-High / Oscillating
        </dt>
        <dd class="text-slate-300 mt-1 text-sm">
          When \\( 0.3 < N < 0.4 \\) adds oscillation
          \\( +\\,oscillation \\cdot \\sin(generation \\times 0.1) \\);
          low neighborhoods demote toward 0.25, otherwise promote toward 1.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100 flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-xs font-bold">Q3</span>
          High / Intense
        </dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Survives while \\( survLow < N < survHigh \\);
          low density causes a fade toward 0.5, otherwise the cell collapses to 0.
        </dd>
      </div>
    </dl>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Rendering & Parameters</h5>
    <p class="text-slate-300">
      Intensity \\( G \\) renders as gray scale: \\( rgb(255(1-G), 255(1-G), 255(1-G)) \\) for \\( G > 0 \\).
      Tunable parameters: <span class="font-mono text-slate-200">birthLow</span>,
      <span class="font-mono text-slate-200">birthHigh</span>,
      <span class="font-mono text-slate-200">survLow</span>,
      <span class="font-mono text-slate-200">survHigh</span>,
      <span class="font-mono text-slate-200">fadeRate</span>,
      <span class="font-mono text-slate-200">promoteRate</span>,
      <span class="font-mono text-slate-200">oscillation</span>.
    </p>
  </section>
</div>
`;
