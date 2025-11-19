// src/modes/continuous.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";

const defaultParams = {
    decay: 0.45,
    sustainPull: 0.35,
    birthPush: 0.75,
};

const SURVIVAL_MIN = 2;
const SURVIVAL_MAX = 3;
const REPRO_CENTER = 3;
const REPRO_WIDTH = 0.6;

const translations = {
    en: {
        label: 'Continuous',
        description:
            'Continuous-valued life energy that tracks Conway-like underpopulation, survival, birth, and overcrowding with smooth transitions.',
        params: {
            decay: {
                label: 'Decay',
                help: 'Multiplier applied when a cell is dying from starvation or overcrowding. Lower makes deaths harsher; higher leaves more residual energy.',
            },
            sustainPull: {
                label: 'Sustain Pull',
                help: 'How quickly surviving cells move toward their equilibrium intensity. Higher values make stable regions settle faster.',
            },
            birthPush: {
                label: 'Birth Push',
                help: 'Strength of the nudge toward life when reproduction conditions are met. Higher values create quicker, brighter births.',
            },
        },
    },
    sk: {
        label: 'Kontinuálny',
        description:
            'Kontinuálna životná energia sledujúca Conwayho hladovanie, prežitie, zrod aj preľudnenie s plynulými prechodmi.',
        params: {
            decay: {
                label: 'Rozpad',
                help: 'Násobiteľ použitý pri odumieraní bunky vplyvom hladu alebo preľudnenia. Nižšie štiepi bunky rýchlejšie, vyššie necháva viac zvyškov.',
            },
            sustainPull: {
                label: 'Stabilizačný ťah',
                help: 'Určuje, akou rýchlosťou sa prežívajúce bunky približujú k rovnovážnej intenzite. Vyššia hodnota znamená rýchlejšie ustálenie.',
            },
            birthPush: {
                label: 'Impulz zrodu',
                help: 'Sila ťahu smerom k životu, keď sú splnené podmienky rozmnožovania. Vyššie hodnoty vytvárajú rýchlejšie a jasnejšie záblesky života.',
            },
        },
    },
};

const rulesHtml = {
    en: `
<div class="space-y-4">
  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Overview</h4>
    <p class="text-slate-300">
      Each cell stores a life intensity \\( G(i,j) \\in [0,1] \\). Updates reuse the Conway ideas - underpopulation, survival,
      overcrowding, and reproduction - but blend values instead of toggling between 0 and 1.
    </p>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Neighborhood Metrics</h5>
    <p class="text-slate-300">
      Moore neighbors contribute their current intensity. The sum \\( S = \\sum_{neigh} G \\) replaces the live-neighbor count
      (range 0-8) and the mean \\( \\bar{G} = \\frac{S}{k} \\) provides a smooth target.
    </p>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">Rule Breakdown</h5>
    <dl class="space-y-3">
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Underpopulation</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          If \\( S &lt; 2 \\) the cell is starved and decays by multiplying its value with <span class="font-mono text-slate-200">decay</span>.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Survival</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Alive cells (\\( G \\ge 0.5 \\)) with \\( 2 \\le S \\le 3 \\) ease toward a steady target, nudged by
          <span class="font-mono text-slate-200">sustainPull</span>.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Overpopulation</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          If \\( S > 3 \\) the cell collapses using the same decay rule, mirroring Conway's overcrowding death.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Reproduction</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          When the neighbor sum sits near \\( S = 3 \\) the cell is nudged toward life using <span class="font-mono text-slate-200">birthPush</span>.
        </dd>
      </div>
    </dl>
  </section>
</div>
`,
    sk: `
<div class="space-y-4">
  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Prehľad</h4>
    <p class="text-slate-300">
      Každá bunka ukladá intenzitu života \\( G(i,j) \\in [0,1] \\). Aktualizácie kopírujú Conwayho myšlienky – hladovanie, prežitie,
      zrod aj preľudnenie – ale hodnoty miešajú namiesto prepínania medzi 0 a 1.
    </p>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/50 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Metri ky okolia</h5>
    <p class="text-slate-300">
      Mooreho susedia prispievajú svojou aktuálnou intenzitou. Súčet \\( S = \\sum_{neigh} G \\) nahrádza počet živých susedov
      (rozsah 0-8) a priemer \\( \\bar{G} = \\frac{S}{k} \\) poskytuje plynulý cieľ.
    </p>
  </section>

  <section class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">Rozpis pravidiel</h5>
    <dl class="space-y-3">
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Podpopulácia</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Ak \\( S < 2 \\), bunka hladovie a znižuje sa pomocou <span class="font-mono text-slate-200">decay</span>.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Prežitie</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Živé bunky s \\( 2 \\le S \\le 3 \\) sa približujú k stabilnej hodnote podľa parametra <span class="font-mono text-slate-200">sustainPull</span>.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Preľudnenie</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Ak \\( S > 3 \\), bunka kolabuje s rovnakým rozpadovým pravidlom ako pri hladovaní.
        </dd>
      </div>
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">Rozmnožovanie</dt>
        <dd class="text-slate-300 mt-1 text-sm">
          Keď sa súčet susedov blíži k \\( S = 3 \\), bunka je posúvaná k životu pomocou <span class="font-mono text-slate-200">birthPush</span>.
        </dd>
      </div>
    </dl>
  </section>
</div>
`,
};

class ContinuousMode extends LifeMode {
    constructor() {
        super({
            id: 'continuous',
            label: 'Continuous',
            description: 'Continuous-valued life energy that blends underpopulation, survival, birth, and overcrowding with smooth transitions.',
            defaultParams,
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        const resolved = { ...this.defaultParams, ...params };
        const { decay, sustainPull, birthPush } = resolved;

        let neighborSum = 0;
        let neighborCount = 0;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                neighborSum += grid[nr][nc];
                neighborCount++;
            }
        }

        const neighborAverage = neighborCount ? neighborSum / neighborCount : 0;
        const current = grid[row][col];
        const alive = current >= 0.5;

        const underPop = neighborSum < SURVIVAL_MIN;
        const overPop = neighborSum > SURVIVAL_MAX;
        const survivalBand = !underPop && !overPop;
        const distanceFromBirth = Math.abs(neighborSum - REPRO_CENTER);
        const inBirthBand = !alive && distanceFromBirth <= REPRO_WIDTH;

        let next = current;

        if (underPop || overPop) {
            next = current * decay;
        } else if (survivalBand && alive) {
            const normalized = Math.min(1, Math.max(0, neighborSum - SURVIVAL_MIN));
            const survivalTarget = 0.7 + 0.3 * normalized;
            next = current + (survivalTarget - current) * sustainPull;
        } else if (survivalBand && !alive) {
            const blend = 0.3;
            next = current * (1 - blend) + neighborAverage * blend;
        }

        if (inBirthBand) {
            const birthStrength = 1 - distanceFromBirth / REPRO_WIDTH;
            const birthTarget = Math.max(neighborAverage, 0.65);
            next = Math.max(next, current + (birthTarget - current) * birthPush * birthStrength);
        }

        return Math.max(0, Math.min(1, next));
    }

    renderCell(ctx, x, y, val, cellSize) {
        if (val > 0) {
            const gray = Math.floor(255 * (1 - val));
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }
}

export const continuousMode = new ContinuousMode();
export default continuousMode;
