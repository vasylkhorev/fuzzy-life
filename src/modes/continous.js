// src/modes/continuous.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

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
            'Smooth-valued Life: cells hold intensity in [0,1] and follow Conway targets (birth on 3, survive on 2-3) with blended updates.',
        params: {
            decay: {
                label: 'Decay',
                help: 'How much a cell fades when the neighbor sum S is outside 2–3. Lower = faster drop, higher = slower, softer fade.',
            },
            sustainPull: {
                label: 'Sustain Pull',
                help: 'How fast alive cells with neighbor sum S in 2–3 are pulled toward their target intensity.',
            },
            birthPush: {
                label: 'Birth Push',
                help: 'How strongly dead cells are pushed upward when the neighbor sum S is close to 3.',
            },
        },
    },
    sk: {
        label: 'Kontinuálny',
        description:
            'Plynulý Life: bunky držia intenzitu v [0,1] a kopírujú Conwayho ciele (zrod pri 3, prežitie pri 2-3) s plynulými zmenami.',
        params: {
            decay: {
                label: 'Decay',
                help: 'Ako silno bunka zoslabne, keď je súčet intenzít susedov S mimo pásma 2–3. Nižšia hodnota = rýchlejšie vyhasínanie, vyššia = pomalšie, jemnejšie klesanie.',
            },
            sustainPull: {
                label: 'Sustain Pull',
                help: 'Ako rýchlo sa živé bunky so súčtom susedov S v pásme 2–3 priťahujú k svojej cieľovej intenzite.',
            },
            birthPush: {
                label: 'Birth Push',
                help: 'Ako silno sa mŕtve bunky posunú smerom k životu, keď je súčet susedov S blízko 3.',
            },
        },
    },
};


const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Each cell stores an intensity \\( G(i,j) \\in [0,1] \\). Underpopulation, survival, overcrowding, and reproduction stay on the Conway B3/S23 targets, but values blend instead of flipping between 0 and 1.',
        },
        sections: [
            {
                title: 'Neighborhood Metrics',
                body: 'Moore neighbors contribute their current intensity. The sum \\( S = \\sum_{neigh} G \\) replaces the live-neighbor count (range 0-8) and the mean \\( \\bar{G} = \\frac{S}{k} \\) provides a smooth target.',
                variant: 'secondary',
            },
        ],
        breakdown: {
            title: 'Rule Breakdown',
            items: [
                { title: 'Underpopulation', body: 'If \\( S < 2 \\) the cell decays by multiplying its value with decay.' },
                { title: 'Survival', body: 'Alive cells (\\( G \\ge 0.5 \\)) with \\( 2 \\le S \\le 3 \\) move toward a steady intensity using sustainPull.' },
                { title: 'Overpopulation', body: 'If \\( S > 3 \\) the cell decays with the same factor.' },
                { title: 'Reproduction', body: 'When \\( S \\) is near 3 and the cell is dead, birthPush nudges it upward.' },
            ],
        },
        listSections: [
            {
                title: 'Parameters',
                items: [
                    '<strong>Decay</strong> — how hard values drop when S is outside 2-3.',
                    '<strong>Sustain Pull</strong> — how quickly alive cells in 2-3 settle to their target.',
                    '<strong>Birth Push</strong> — how strongly near-3 sums lift dead cells.',
                ],
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Každá bunka drží intenzitu \\( G(i,j) \\in [0,1] \\). Hlad, prežitie, preľudnenie aj zrod ostávajú podľa B3/S23, len sa miešajú hodnoty namiesto prepínania 0/1.',
        },
        sections: [
            {
                title: 'Metriky okolia',
                body: 'Mooreho susedia prispievajú aktuálnou intenzitou. Súčet \\( S = \\sum_{neigh} G \\) nahrádza počet živých susedov (0-8) a priemer \\( \\bar{G} = \\frac{S}{k} \\) dáva plynulý cieľ.',
                variant: 'secondary',
            },
        ],
        breakdown: {
            title: 'Rozpis pravidiel',
            items: [
                { title: 'Podpopulácia', body: 'Ak \\( S < 2 \\), bunka sa znižuje pomocou faktora decay.' },
                { title: 'Prežitie', body: 'Živé bunky s \\( 2 \\le S \\le 3 \\) sa posúvajú k stabilnej intenzite podľa sustainPull.' },
                { title: 'Preľudnenie', body: 'Ak \\( S > 3 \\), bunka rovnako slabne tým istým faktorom.' },
                { title: 'Rozmnožovanie', body: 'Keď je \\( S \\) pri 3 a bunka je mŕtva, birthPush ju posunie k životu.' },
            ],
        },
        listSections: [
            {
                title: 'Parametre',
                items: [
                    '<strong>Decay</strong> — ako rýchlo klesá hodnota mimo pásma 2-3.',
                    '<strong>Sustain Pull</strong> — ako rýchlo sa živé bunky v pásme 2-3 ustália.',
                    '<strong>Birth Push</strong> — sila, ktorou blízkosť S=3 zdvihne mŕtve bunky.',
                ],
            },
        ],
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

class ContinuousMode extends LifeMode {
    constructor() {
        super({
            id: 'continuous',
            label: 'Continuous',
            description: 'Smooth-valued Life: cells hold intensity in [0,1] and follow Conway targets (birth on 3, survive on 2-3) with blended updates.',
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

export const continuousMode = new ContinuousMode();
export default continuousMode;
