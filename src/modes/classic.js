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

export const rulesHtml = {
    en: `
<div class="space-y-5">
  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Overview</h4>
    <p class="text-slate-300">
      Conway's Game of Life uses binary states with synchronous updates over an eight-neighbor (Moore) lattice.
      Cells are either alive (1) or dead (0); simple rules produce rich emergent behavior.
    </p>
  </section>

  <div class="grid gap-4 md:grid-cols-2">
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Neighbor Count</h5>
      <p class="text-slate-300">
        Live neighbors \\( N_t(i,j) = \\sum_{di \\in \\{-1,0,1\\}} \\sum_{dj \\in \\{-1,0,1\\}} G_t(i+di,j+dj) - G_t(i,j) \\).
        Values range from 0-8.
      </p>
    </section>
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Transition Rule</h5>
      <p class="text-slate-300">
        \\[
          G_{t+1}(i,j) =
          \\begin{cases}
            1 &\\text{if } (G_t(i,j)=0 \\land N_t=3) \\lor (G_t(i,j)=1 \\land N_t \\in \\{2,3\\}) \\\\
            0 &\\text{otherwise}
          \\end{cases}
        \\]
      </p>
    </section>
  </div>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">Rule Breakdown</h5>
    <dl class="space-y-3">
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Birth</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Dead cell with exactly three live neighbors becomes alive.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Survival</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Live cell with two or three neighbors stays alive.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Underpopulation</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Fewer than two neighbors causes a live cell to die.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Overpopulation</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          More than three neighbors also kills a live cell.
        </dd>
      </div>
    </dl>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Notes</h5>
    <p class="text-slate-300">
      Equivalent to the B3/S23 life-like rule family.
      Reference: Conway (1970). Works on any finite grid; edges here are non-wrapping.
    </p>
  </section>
</div>
`,
    sk: `
<div class="space-y-5">
  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Prehľad</h4>
    <p class="text-slate-300">
      Conwayova hra života používa binárne stavy so synchronnými aktualizáciami na mriežke s ôsmimi susedmi (Mooreho okolie).
      Bunky sú buď živé (1) alebo mŕtve (0); jednoduché pravidlá vytvárajú bohaté emergentné správanie.
    </p>
  </section>

  <div class="grid gap-4 md:grid-cols-2">
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Počet susedov</h5>
      <p class="text-slate-300">
        Živí susedia \\( N_t(i,j) = \\sum_{di \\in \\{-1,0,1\\}} \\sum_{dj \\in \\{-1,0,1\\}} G_t(i+di,j+dj) - G_t(i,j) \\).
        Hodnoty sú v rozsahu 0-8.
      </p>
    </section>
    <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
      <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Prechodové pravidlo</h5>
      <p class="text-slate-300">
        \\[
          G_{t+1}(i,j) =
          \\begin{cases}
            1 &\\text{ak } (G_t(i,j)=0 \\land N_t=3) \\lor (G_t(i,j)=1 \\land N_t \\in \\{2,3\\}) \\\\
            0 &\\text{inak}
          \\end{cases}
        \\]
      </p>
    </section>
  </div>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">Rozpis pravidiel</h5>
    <dl class="space-y-3">
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Zrod</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Mŕtva bunka s presne tromi živými susedmi ožije.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Prežitie</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Živá bunka s dvoma alebo tromi susedmi zostáva živá.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Podpopulácia</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Menej ako dvaja susedia spôsobia, že bunka zomrie.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Preľudnenie</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Viac ako traja susedia takisto vedú k smrti bunky.
        </dd>
      </div>
    </dl>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Poznámky</h5>
    <p class="text-slate-300">
      Ekvivalent rodiny pravidiel typu life-like B3/S23.
      Referencia: Conway (1970). Funguje na každej konečnej mriežke; okraje sa tu neprepájajú.
    </p>
  </section>
</div>
`,
};
