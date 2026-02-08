// src/modes/finiteTemperature.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const NEIGHBOR_DELTAS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
];

const defaultParams = {
    temperature: 0.5,
    energyShift: 2.25,
    stateShift: 6,
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const translations = {
    en: {
        label: 'Finite Temperature',
        description:
            'Finite-temperature logistic-energy version of Life based on "The Game of Life at finite temperature" (Adachi 2004).',
        params: {
            temperature: {
                label: 'Temperature T',
                help: 'Amount of thermal smearing. Lower T yields sharper, almost classical behaviour; higher T smooths transitions.',
            },
            energyShift: {
                label: 'Energy Shift E0',
                help: 'Adds a constant offset to the cell energy. Moves the logistic midpoint for birth/survival probability.',
            },
            stateShift: {
                label: 'State Shift x0',
                help: 'Horizontal shift of the argument before energy is computed, setting which neighbour sums are favoured.',
            },
        },
    },
    sk: {
        label: 'Konečná teplota',
        description:
            'Logistický energetický režim podľa článku "The Game of Life at finite temperature" (Adachi 2004).',
        params: {
            temperature: {
                label: 'Teplota T',
                help: 'Miera tepelného rozmazania. Nižšie T dáva ostrejšie, takmer klasické správanie; vyššie T zjemňuje prechody.',
            },
            energyShift: {
                label: 'Energetický posun E0',
                help: 'Pridáva konštantný posun k energii bunky. Posúva stred logistickej funkcie pre pravdepodobnosť zrodu/prežitia.',
            },
            stateShift: {
                label: 'Posun stavu x0',
                help: 'Horizontálny posun argumentu pred výpočtom energie; určuje, pri ktorých sumách susedov je bunka zvýhodnená.',
            },
        },
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body:
                'Implements the finite-temperature Life model with a logistic energy field proposed by Adachi, Peper and Lee in ' +
                '"The Game of Life at finite temperature", Physica D 198 (2004). ' +
                'Original paper: <a class="text-sky-300 hover:text-sky-200" href="https://doi.org/10.1016/j.physd.2004.04.010" target="_blank" rel="noopener noreferrer">doi:10.1016/j.physd.2004.04.010</a>.',
        },
        sections: [
            {
                title: 'Thermalized Update',
                titleTag: 'h4',
                variant: 'dark',
                bodyClass: 'text-slate-300 text-sm',
                body:
                    'Each cell stores an intensity \\( S_{ij} \\in [0,1] \\) and interacts with the Moore-neighbourhood sum \\( n_{ij} \\). ' +
                    'The energy field then feeds a logistic activation that depends on the temperature \\( T \\).',
            },
            {
                title: 'Equations',
                variant: 'dark',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    '\\( x_{ij}(t) = S_{ij}(t) + 2 n_{ij}(t) \\) <br />' +
                    '\\( E_{ij}(t) = E_0 - (x_{ij}(t) - x_0)^2 \\) <br />' +
                    '\\( S_{ij}(t+1) = \\dfrac{1}{1 + e^{-2E_{ij}/T}} \\) <br />' +
                    '<span class="text-slate-400 text-xs block mt-2">As \\( T \\to 0 \\), the logistic approaches a step function.</span>',
            },
        ],
        listSections: [
            {
                title: 'Parameters',
                variant: 'dark',
                items: [
                    '<strong>T</strong> — thermal smearing level. Typical examples in the paper use \\( T \\approx 0.5 \\) with \\( E_0 = 2.25 \\), \\( x_0 = 6 \\).',
                    '<strong>E0</strong> — raises or lowers the energy parabola, changing how easily the energy becomes positive.',
                    '<strong>x0</strong> — horizontal shift that sets which neighbour sums favour reproduction or survival.',
                ],
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body:
                'Režim implementuje konečne teplotný model hry života s logistickým energetickým poľom podľa Adachi, Peper a Lee, ' +
                '"The Game of Life at finite temperature", Physica D 198 (2004). ' +
                'Pôvodný článok: <a class="text-sky-300 hover:text-sky-200" href="https://doi.org/10.1016/j.physd.2004.04.010" target="_blank" rel="noopener noreferrer">doi:10.1016/j.physd.2004.04.010</a>.',
        },
        sections: [
            {
                title: 'Termalizovaná aktualizácia',
                titleTag: 'h4',
                variant: 'dark',
                bodyClass: 'text-slate-300 text-sm',
                body:
                    'Každá bunka ukladá intenzitu \\( S_{ij} \\in [0,1] \\) a reaguje na súčet Mooreho susedov \\( n_{ij} \\). ' +
                    'Z týchto hodnôt sa vypočíta energia, ktorá vstupuje do logistickej funkcie závislej od teploty \\( T \\).',
            },
            {
                title: 'Rovnice',
                variant: 'dark',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    '\\( x_{ij}(t) = S_{ij}(t) + 2 n_{ij}(t) \\) <br />' +
                    '\\( E_{ij}(t) = E_0 - (x_{ij}(t) - x_0)^2 \\) <br />' +
                    '\\( S_{ij}(t+1) = \\dfrac{1}{1 + e^{-2E_{ij}/T}} \\) <br />' +
                    '<span class="text-slate-400 text-xs block mt-2">Keď \\( T \\to 0 \\), logistická funkcia sa blíži k prahovej funkcii.</span>',
            },
        ],
        listSections: [
            {
                title: 'Parametre',
                variant: 'dark',
                items: [
                    '<strong>T</strong> — úroveň tepelného rozmazania. Typické príklady používajú \\( T \\approx 0.5 \\) s \\( E_0 = 2.25 \\) a \\( x_0 = 6 \\).',
                    '<strong>E0</strong> — zdvíha alebo znižuje parabolu energie a mení, ako ľahko sa energia stane kladnou.',
                    '<strong>x0</strong> — horizontálny posun, ktorý určuje, pri ktorých sumách susedov je bunka energeticky zvýhodnená.',
                ],
            },
        ],
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

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
            description: 'Implements the "Game of Life at finite temperature" model with toroidal wrap-around.',
            defaultParams,
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        const resolved = { ...this.defaultParams, ...params };
        const { temperature, energyShift, stateShift } = resolved;

        let neighborSum = 0;
        for (const [dx, dy] of NEIGHBOR_DELTAS) {
            const nr = wrapIndex(row + dx);
            const nc = wrapIndex(col + dy);
            neighborSum += getCellValue(grid, nr, nc);
        }

        const current = getCellValue(grid, row, col);
        const x = current + 2 * neighborSum;
        const energy = energyShift - (x - stateShift) * (x - stateShift);
        const next = logistic(energy, temperature);

        return clamp01(next);
    }

    renderCell(ctx, x, y, val, cellSize) {
        if (val > 0) {
            const gray = Math.floor(255 * (1 - val));
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    serializeCells(grid, includeZeros = false) {
        const cells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell > 0 || includeZeros) {
                    cells.push({ r: rowIndex, c: colIndex, v: cell });
                }
            });
        });
        return cells;
    }

    parseCells(cells) {
        return cells.map(cell => {
            if (Array.isArray(cell)) {
                const [row, col] = cell;
                return [row, col, 1.0];
            }
            if (cell && typeof cell === 'object') {
                const row = cell.r !== undefined ? cell.r : cell.row;
                const col = cell.c !== undefined ? cell.c : cell.col;
                const value = cell.v !== undefined ? cell.v : 1.0;
                return [row, col, value];
            }
            return null;
        }).filter(Boolean);
    }
}

export const finiteTemperatureMode = new FiniteTemperatureMode();
export default finiteTemperatureMode;
