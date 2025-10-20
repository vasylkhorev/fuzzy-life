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
  label: 'Continuous (Quartile Fuzzy)',
  description: 'Cells evolve in quartiles with unique mechanics: probabilistic birth in low, gradual promotion in med-low, oscillation in med-high, and decay survival in high. Shades of gray visualize intensity.'
};

export const rulesHtml = `
<div class="prose prose-sm max-w-none text-gray-200">
  <p><strong>Overview:</strong> A fuzzy variant where states \\( G(i,j) \\in [0,1] \\) (intensity/aliveness). Divided into quartiles: Q0 [0,0.25) low/dead, Q1 [0.25,0.5) med-low, Q2 [0.5,0.75) med-high, Q3 [0.75,1] high/alive. Moore neighborhood average \\( N(i,j) = \\frac{1}{k} \\sum_{neighbors} G(neigh) \\), where \\( k \\leq 8 \\).</p>
  <h4>Mathematical Formulation:</h4>
  <p>Quartile \\( Q = \\lfloor G_t(i,j) \\times 4 \\rfloor \\). Centers: \\( C = [0.125, 0.375, 0.625, 0.875] \\).</p>
  <p>Next state \\( G_{t+1}(i,j) = f(Q, N_t(i,j), params) \\), where \\( f \\) is:</p>
  <ul class="list-disc ml-4">
    <li><strong>Q0 (Low):</strong> If \\( birthLow < N < birthHigh \\), prob = \\( \\frac{N - birthLow}{birthHigh - birthLow} \\), then \\( G' = \\text{rand} < \\text{prob} ? C_3 : G \\times fadeRate \\); else \\( G \\times fadeRate \\).</li>
    <li><strong>Q1 (Med-Low):</strong> If \\( survLow < N < 0.3 \\), \\( G' = G \\); elif \\( N > 0.35 \\), \\( G' = \\min(0.5, G \\times promoteRate) \\); else \\( \\max(0, G \\times fadeRate) \\).</li>
    <li><strong>Q2 (Med-High):</strong> If \\( 0.3 < N < 0.4 \\), \\( G' = G + oscillation \\times \\sin(generation \\times 0.1) \\); elif \\( N < 0.25 \\), \\( \\max(0.25, G \\times fadeRate) \\); else \\( \\min(1, G \\times promoteRate) \\).</li>
    <li><strong>Q3 (High):</strong> If \\( survLow < N < survHigh \\), \\( G' = G \\); elif \\( N < survLow \\), \\( \\max(0.5, G \\times fadeRate) \\); else 0.</li>
  </ul>
  <p>Clamp \\( G' \\in [0,1] \\). Rendering: Fill gray \\( rgb(255(1-G), 255(1-G), 255(1-G)) \\) if \\( G > 0 \\).</p>
  <p><em>Parameters: birthLow/High, survLow/High, fadeRate, promoteRate, oscillation. Tuned for emergent fuzzy patterns.</em></p>
</div>
`;