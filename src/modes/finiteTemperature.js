// src/modes/finiteTemperature.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";

const NEIGHBOR_DELTAS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
];

const defaultParams = {
    temperature: 0.5,
    energyShift: 2.25,
    stateShift: 6,
    useClassicAtT0: true,
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const translations = {
    en: {
        label: 'Finite Temperature',
        description: 'Logistic energy from "Game of Life at finite temperature" with toroidal wrap-around and an optional classic fallback.',
        params: {
            temperature: {
                label: 'Temperature T',
                help: 'Thermal agitation level. Lower values mimic classic Life; higher values soften transitions.',
            },
            energyShift: {
                label: 'Energy Shift E0',
                help: 'Offsets the energy parabola vertically, changing how easily values cross the logistic midpoint.',
            },
            stateShift: {
                label: 'State Shift x0',
                help: 'Horizontal shift applied before energy is computed, tuning which neighbor sums trigger growth.',
            },
            useClassicAtT0: {
                label: 'Classic at T = 0',
                help: 'When enabled and T equals zero, run exact Conway B3/S23 steps instead of the logistic curve.',
            },
        },
    },
    sk: {
        label: 'Konečná teplota',
        description: 'Logistické energetické pole z práce „Game of Life at finite temperature“ s toroidným obtokom a voliteľným návratom ku klasike.',
        params: {
            temperature: {
                label: 'Teplota T',
                help: 'Stupeň tepelného rozptylu. Nižšie hodnoty napodobňujú klasické Life, vyššie zjemňujú prechody.',
            },
            energyShift: {
                label: 'Energetický posun E0',
                help: 'Posúva parabolu energie nahor alebo nadol a určuje, ako ľahko sa hodnota dostane cez stred logistickej funkcie.',
            },
            stateShift: {
                label: 'Posun stavu x0',
                help: 'Horizontálny posun pred výpočtom energie, ktorý určuje, pri ktorom počte susedov sa bunka podporí.',
            },
            useClassicAtT0: {
                label: 'Klasika pri T = 0',
                help: 'Ak je zapnuté a T je nula, použijú sa presné Conwayho kroky B3/S23 namiesto logistickej krivky.',
            },
        },
    },
};

const rulesHtml = {
    en: `
<div class="space-y-4">
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Thermalized Update</h4>
    <p class="text-slate-300 text-sm">
      Based on "The Game of Life at finite temperature" (Physica D, 2004). Each cell stores S<sub>ij</sub> in [0,1] and interacts with the Moore neighborhood sum n<sub>ij</sub>.
    </p>
  </section>
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Equations</h5>
    <p class="text-slate-300 text-sm leading-relaxed">
      x<sub>ij</sub>(t) = S<sub>ij</sub>(t) + 2n<sub>ij</sub>(t) <br />
      E<sub>ij</sub>(t) = E0 - (x<sub>ij</sub>(t) - x0)<sup>2</sup> <br />
      S<sub>ij</sub>(t+1) = 1 / (1 + exp(-2E<sub>ij</sub>/T))
    </p>
    <p class="text-slate-400 text-xs">
      When T approaches zero the logistic becomes a step function and the Life rule B3/S23 reappears.
    </p>
  </section>
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Parameters</h5>
    <ul class="text-slate-300 text-sm list-disc space-y-1 pl-5">
      <li><strong>T</strong> - thermal agitation level. Article examples use T ≈ 0.5 with E0 = 2.25, x0 = 6.</li>
      <li><strong>E0</strong> - raises or lowers the energy parabola, changing how easily energy becomes positive.</li>
      <li><strong>x0</strong> - horizontal shift that tunes which neighbor sums trigger reproduction or survival.</li>
    </ul>
  </section>
</div>
`,
    sk: `
<div class="space-y-4">
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h4 class="text-lg font-semibold text-slate-100 mb-2">Termalizovaná aktualizácia</h4>
    <p class="text-slate-300 text-sm">
      Východiskom je práca „The Game of Life at finite temperature“ (Physica D, 2004). Každá bunka ukladá S<sub>ij</sub> v rozsahu [0,1] a reaguje na súčet susedov n<sub>ij</sub>.
    </p>
  </section>
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Rovnice</h5>
    <p class="text-slate-300 text-sm leading-relaxed">
      x<sub>ij</sub>(t) = S<sub>ij</sub>(t) + 2n<sub>ij</sub>(t) <br />
      E<sub>ij</sub>(t) = E0 - (x<sub>ij</sub>(t) - x0)<sup>2</sup> <br />
      S<sub>ij</sub>(t+1) = 1 / (1 + exp(-2E<sub>ij</sub>/T))
    </p>
    <p class="text-slate-400 text-xs">
      Keď T smeruje k nule, logistická funkcia sa zmení na prah a objaví sa pravidlo B3/S23.
    </p>
  </section>
  <section class="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 shadow-inner">
    <h5 class="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2">Parametre</h5>
    <ul class="text-slate-300 text-sm list-disc space-y-1 pl-5">
      <li><strong>T</strong> – úroveň tepelného rozptylu. Typické príklady používajú T ≈ 0.5 s E0 = 2.25, x0 = 6.</li>
      <li><strong>E0</strong> – zdvíha alebo znižuje parabolu energie, čím mení, ako ľahko sa hodnota stane kladnou.</li>
      <li><strong>x0</strong> – horizontálny posun, ktorý určuje, pri ktorých sumách susedov bunka prežije alebo ožije.</li>
    </ul>
  </section>
</div>
`,
};

const logistic = (energy, temperature) => {
    if (temperature <= 1e-5) {
        return energy >= 0 ? 1 : 0;
    }
    const exponent = -2 * energy / temperature;
    const clampedExponent = Math.max(-50, Math.min(50, exponent));
    return 1 / (1 + Math.exp(clampedExponent));
};

const wrapIndex = (idx) => {
    if (idx < 0) {
        return (idx % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
    }
    if (idx >= GRID_SIZE) {
        return idx % GRID_SIZE;
    }
    return idx;
};

const getCellValue = (grid, row, col) => {
    const rowData = grid[row];
    if (!rowData) {
        return 0;
    }
    const cell = rowData[col];
    return typeof cell === "number" ? cell : 0;
};

class FiniteTemperatureMode extends LifeMode {
    constructor() {
        super({
            id: 'finiteTemperature',
            label: 'Finite Temperature',
            description: 'Implements the "Game of Life at finite temperature" model with toroidal wrap-around and an optional classic fallback.',
            defaultParams,
            rulesHtml,
            translations,
        });
    }

    applyClassicFallback(grid, row, col) {
        let liveNeighbors = 0;
        for (const [dx, dy] of NEIGHBOR_DELTAS) {
            const nr = wrapIndex(row + dx);
            const nc = wrapIndex(col + dy);
            if (getCellValue(grid, nr, nc) >= 0.5) {
                liveNeighbors++;
            }
        }

        const isAlive = getCellValue(grid, row, col) >= 0.5;
        if (isAlive && (liveNeighbors < 2 || liveNeighbors > 3)) {
            return 0;
        }
        if (!isAlive && liveNeighbors === 3) {
            return 1;
        }
        return isAlive ? 1 : 0;
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        const resolved = { ...this.defaultParams, ...params };
        const { temperature, energyShift, stateShift, useClassicAtT0 } = resolved;

        if (useClassicAtT0 && temperature <= 0) {
            return this.applyClassicFallback(grid, row, col);
        }

        let neighborSum = 0;
        for (const [dx, dy] of NEIGHBOR_DELTAS) {
            const nr = wrapIndex(row + dx);
            const nc = wrapIndex(col + dy);
            neighborSum += getCellValue(grid, nr, nc);
        }

        const current = getCellValue(grid, row, col);
        const x = current + 2 * neighborSum;
        const energy = energyShift - Math.pow(x - stateShift, 2);
        const next = logistic(energy, temperature);

        return clamp01(next);
    }

    renderCell(ctx, x, y, val, cellSize) {
        if (val <= 0) {
            return;
        }
        const intensity = Math.round(255 * (1 - clamp01(val)));
        ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        ctx.fillRect(x, y, cellSize, cellSize);
    }
}

export const finiteTemperatureMode = new FiniteTemperatureMode();
export default finiteTemperatureMode;
