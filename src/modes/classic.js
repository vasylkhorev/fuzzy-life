// src/modes/ClassicMode.js
import { GRID_SIZE } from "../config";

export const computeNextStateClassic = (grid, row, col, params = {}, generation) => {
    let liveNeighbors = 0;
    const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    for (let [dx, dy] of dirs) {
        const nr = row + dx, nc = col + dy;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] >= 0.5) {
            liveNeighbors++;
        }
    }
    const isAlive = grid[row][col] >= 0.5;
    if (isAlive && (liveNeighbors < 2 || liveNeighbors > 3)) return 0;
    if (!isAlive && liveNeighbors === 3) return 1;
    return grid[row][col]; // Preserve exact value (0 or 1)
};

export const renderCellClassic = (ctx, x, y, val, cellSize, generation) => {
    if (val >= 0.5) {
        ctx.fillStyle = "black";
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    // No fill for dead cells
};

export const defaultParams = {};

export const modeInfo = {
    label: 'Classic',
    description: 'Binary cells with standard Conway rules: birth on 3 neighbors, survival on 2-3.'
};

export const rulesHtml = `
<div class="prose prose-sm max-w-none text-gray-200">
  <p><strong>Overview:</strong> The classic Game of Life is a cellular automaton with binary states (alive/dead) on a Moore neighborhood (8 neighbors). Evolution is discrete, synchronous.</p>
  <h4>Mathematical Formulation:</h4>
  <p>Let \\( G_t(i,j) \\in \\{0,1\\} \\) be the state at time \\( t \\), position \\( (i,j) \\). Alive = 1, dead = 0.</p>
  <p>Let \\( N_t(i,j) = \\sum_{di \\in \\{-1,0,1\\}} \\sum_{dj \\in \\{-1,0,1\\}} G_t(i+di, j+dj) - G_t(i,j) \\) be the number of live neighbors (excluding self).</p>
  <p>Next state \\( G_{t+1}(i,j) = \\begin{cases} 
    1 & \\text{if } (G_t(i,j) = 0 \\land N_t(i,j) = 3) \\lor (G_t(i,j) = 1 \\land N_t(i,j) \\in \\{2,3\\}) \\\\
    0 & \\text{otherwise}
  \\end{cases} \\)</p>
  <h4>Rules:</h4>
  <ul class="list-disc ml-4">
    <li><strong>Underpopulation:</strong> A live cell with fewer than 2 live neighbors dies.</li>
    <li><strong>Survival:</strong> A live cell with 2 or 3 live neighbors lives.</li>
    <li><strong>Overpopulation:</strong> A live cell with more than 3 live neighbors dies.</li>
    <li><strong>Reproduction:</strong> A dead cell with exactly 3 live neighbors becomes live.</li>
  </ul>
  <p><em>Reference: Conway (1970). Arbitrary size toroidal grid assumed here.</em></p>
</div>
`;