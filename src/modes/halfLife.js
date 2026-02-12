// src/modes/halfLife.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

// Integer renormalization: 0.0→0, 0.5→1, 1.0→2
const STATE_DEAD = 0;      // 0.0 → 0
const STATE_WEAK = 1;      // 0.5 → 1
const STATE_STRONG = 2;    // 1.0 → 2

// Integer intervals for Conway rules (after renormalization)
// Original: birth on 3, survival on 2-3
// With integer mapping: neighbor sum ranges
const BIRTH_MIN = 5;       // 2.5 * 2 = 5
const BIRTH_MAX = 6;       // 3.0 * 2 = 6
const SURVIVAL_MIN = 4;    // 1.5 * 2 = 3 (for 2 neighbors)
const SURVIVAL_MAX = 6;    // 3.0 * 2 = 6

const translations = {
    en: {
        label: 'Half-Life',
        description: 'Three-state mode: cells transition between 0, 0.5, and 1 following Conway rules (integer renormalized).',
        params: {},
    },
    sk: {
        label: 'HalfLife',
        description: 'Trojstavový režim: bunky sa prepínajú medzi 0, 0.5 a 1 podľa Conwayho pravidiel (celočíselná renormalizácia).',
        params: {},
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Half-Life mode uses three discrete states: 0, 0.5, and 1 (internally mapped to integers 0, 1, 2). Cells follow Conway\'s Game of Life rules using integer renormalization: birth when neighbor sum ∈ {5, 6}, survival when sum ∈ {3, 4, 5, 6}. Transitions occur in 0.5 increments.',
        },
        columns: [
            {
                title: 'State Representation',
                body: 'Cells can be in one of three states: 0 (dead), 0.5 (weak/half-alive), or 1 (strong/fully alive). Internally mapped to integers: 0→0, 0.5→1, 1.0→2 for mathematical precision.',
            },
            {
                title: 'Integer Renormalization',
                body: 'Each neighbor contributes its integer state (0, 1, or 2). Maximum neighbor sum is 16 (8 neighbors × 2). Birth occurs when sum ∈ {5, 6}, survival when sum ∈ {3, 4, 5, 6}. This eliminates rounding and uses simple set membership instead.',
            },
        ],
        sections: [
            {
                title: 'Formal Definition',
                variant: 'secondary',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    'Half-Life mode can be formally defined as a tuple \\( \\mathcal{A} = (\\mathcal{L}, S, \\mathcal{N}, f) \\):<br /><br />' +
                    '<strong>1. Lattice (\\( \\mathcal{L} \\)):</strong> A 2D grid \\( \\mathbb{Z}^2 \\).<br /><br />' +
                    '<strong>2. State Set (\\( S \\)):</strong> \\( S = \\{0, 1, 2\\} \\) (internally mapped from \\( \\{0, 0.5, 1\\} \\)).<br /><br />' +
                    '<strong>3. Neighborhood (\\( \\mathcal{N} \\)):</strong> The Moore neighborhood (8 surrounding cells).<br /><br />' +
                    '<strong>4. Local Transition Function (\\( f \\)):</strong><br /><br />' +
                    'Let \\( C_t(x,y) \\) be the state of a cell at coordinates \\( (x,y) \\) at time \\( t \\).<br />' +
                    'Let \\( \\sigma_t(x,y) \\) be the sum of the states of the neighbors:<br />' +
                    '\\[ \\sigma_t(x,y) = \\sum_{(i,j) \\in \\mathcal{N}} C_t(x+i, y+j) \\]<br /><br />' +
                    '<strong>The Target Function \\( \\tau(\\sigma, C) \\):</strong><br />' +
                    'This function determines where the cell <em>wants</em> to go based on Conway\'s rules.<br />' +
                    '\\[ \\tau(\\sigma, C) = \\begin{cases} 2 & \\text{if } \\sigma \\in \\{5, 6\\} \\quad \\text{(Birth equivalent)} \\\\ 2 & \\text{if } \\sigma \\in \\{3, 4\\} \\text{ AND } C \\ge 1 \\quad \\text{(Survival equivalent)} \\\\ 0 & \\text{otherwise} \\end{cases} \\]<br /><br />' +
                    '<strong>The Transition Rule (The "Inertia" or "Fuzzy" step):</strong><br />' +
                    'The cell moves one step toward the target.<br />' +
                    '\\[ C_{t+1} = \\begin{cases} C_t + 1 & \\text{if } \\tau(\\sigma, C_t) > C_t \\\\ C_t - 1 & \\text{if } \\tau(\\sigma, C_t) < C_t \\\\ C_t & \\text{if } \\tau(\\sigma, C_t) = C_t \\end{cases} \\]',
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Režim Polčas používa tri diskrétne stavy: 0, 0.5 a 1 (interné mapovanie na celé čísla 0, 1, 2). Bunky sa riadia Conwayho pravidlami pomocou celočíselnej renormalizácie: zrod pri súčte susedov ∈ {5, 6}, prežitie pri súčte ∈ {3, 4, 5, 6}. Prechody sa uskutočňujú v krokoch po 0.5.',
        },
        columns: [
            {
                title: 'Reprezentácia stavu',
                body: 'Bunky môžu byť v jednom z troch stavov: 0 (mŕtva), 0.5 (slabá/polovične živá) alebo 1 (silná/plne živá). Interné mapovanie na celé čísla: 0→0, 0.5→1, 1.0→2 pre matematickú presnosť.',
            },
            {
                title: 'Celočíselná renormalizácia',
                body: 'Každý sused prispieva svojou celočíselnou hodnotou stavu (0, 1 alebo 2). Maximálny súčet susedov je 16 (8 susedov × 2). Zrod nastáva pri súčte ∈ {5, 6}, prežitie pri súčte ∈ {3, 4, 5, 6}. Toto eliminuje zaokrúhľovanie a používa jednoduché testovanie príslušnosti k množine.',
            },
        ],
        sections: [
            {
                title: 'Formálna definícia',
                variant: 'secondary',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    'Režim Polčas môže byť formálne definovaný ako n-tica \\( \\mathcal{A} = (\\mathcal{L}, S, \\mathcal{N}, f) \\):<br /><br />' +
                    '<strong>1. Mriežka (\\( \\mathcal{L} \\)):</strong> 2D mriežka \\( \\mathbb{Z}^2 \\).<br /><br />' +
                    '<strong>2. Množina stavov (\\( S \\)):</strong> \\( S = \\{0, 1, 2\\} \\) (interné mapovanie z \\( \\{0, 0.5, 1\\} \\)).<br /><br />' +
                    '<strong>3. Okolie (\\( \\mathcal{N} \\)):</strong> Mooreho okolie (8 okolitých buniek).<br /><br />' +
                    '<strong>4. Lokálna prechodová funkcia (\\( f \\)):</strong><br /><br />' +
                    'Nech \\( C_t(x,y) \\) je stav bunky na súradniciach \\( (x,y) \\) v čase \\( t \\).<br />' +
                    'Nech \\( \\sigma_t(x,y) \\) je súčet stavov susedov:<br />' +
                    '\\[ \\sigma_t(x,y) = \\sum_{(i,j) \\in \\mathcal{N}} C_t(x+i, y+j) \\]<br /><br />' +
                    '<strong>Cieľová funkcia \\( \\tau(\\sigma, C) \\):</strong><br />' +
                    'Táto funkcia určuje, kam sa bunka <em>chce</em> posunúť podľa Conwayho pravidiel.<br />' +
                    '\\[ \\tau(\\sigma, C) = \\begin{cases} 2 & \\text{ak } \\sigma \\in \\{5, 6\\} \\quad \\text{(ekvivalent zrodu)} \\\\ 2 & \\text{ak } \\sigma \\in \\{3, 4\\} \\text{ A } C \\ge 1 \\quad \\text{(ekvivalent prežitia)} \\\\ 0 & \\text{inak} \\end{cases} \\]<br /><br />' +
                    '<strong>Pravidlo prechodu ("zotrvačnosť" alebo "fuzzy" krok):</strong><br />' +
                    'Bunka sa posunie o jeden krok smerom k cieľu.<br />' +
                    '\\[ C_{t+1} = \\begin{cases} C_t + 1 & \\text{ak } \\tau(\\sigma, C_t) > C_t \\\\ C_t - 1 & \\text{ak } \\tau(\\sigma, C_t) < C_t \\\\ C_t & \\text{ak } \\tau(\\sigma, C_t) = C_t \\end{cases} \\]',
            },
        ],
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Convert float value to integer state (0, 1, or 2)
const valueToIntegerState = (value) => {
    const clamped = clamp01(value);
    if (clamped < 0.25) return STATE_DEAD;   // 0.0 → 0
    if (clamped < 0.75) return STATE_WEAK;   // 0.5 → 1
    return STATE_STRONG;                      // 1.0 → 2
};

// Convert integer state back to float value for storage
const integerStateToValue = (intState) => {
    if (intState === STATE_DEAD) return 0.0;
    if (intState === STATE_WEAK) return 0.5;
    return 1.0;  // STATE_STRONG
};

// Snap float value to nearest discrete state (returns float for compatibility)
const snapToState = (value) => {
    const intState = valueToIntegerState(value);
    return integerStateToValue(intState);
};

// Step towards target state (using integer logic)
const stepTowards = (current, target) => {
    const currentInt = valueToIntegerState(current);
    const targetInt = valueToIntegerState(target);

    if (currentInt === targetInt) {
        return integerStateToValue(currentInt);
    }

    // Step by 1 integer unit towards target
    if (currentInt < targetInt) {
        const nextInt = currentInt + 1;
        return integerStateToValue(nextInt);
    } else {
        const nextInt = currentInt - 1;
        return integerStateToValue(nextInt);
    }
};

class HalfLifeMode extends LifeMode {
    constructor() {
        super({
            id: 'halfLife',
            label: 'Half-Life',
            description: 'Three-state mode: cells transition between 0, 0.5, and 1 following Conway rules (integer renormalized).',
            defaultParams: {},
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col) {
        let neighborSumInt = 0;  // Integer sum (0 to 16)
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                // Each neighbor contributes its integer state value (0, 1, or 2)
                const neighborIntState = valueToIntegerState(grid[nr][nc]);
                neighborSumInt += neighborIntState;
            }
        }

        // Integer-based Conway rules (no rounding needed)
        // Birth: neighbor sum ∈ {5, 6} (equivalent to 2.5-3.0 in original)
        // Survival: neighbor sum ∈ {3, 4, 5, 6} (equivalent to 1.5-3.0 in original)
        const birth = neighborSumInt >= BIRTH_MIN && neighborSumInt <= BIRTH_MAX;
        const isAlive = valueToIntegerState(grid[row][col]) >= STATE_WEAK;
        const survival = isAlive && neighborSumInt >= SURVIVAL_MIN && neighborSumInt <= SURVIVAL_MAX;

        const targetAlive = birth || survival;
        const targetValue = targetAlive ? 1.0 : 0.0;
        return stepTowards(grid[row][col], targetValue);
    }

    renderCell(ctx, x, y, val, cellSize) {
        const level = snapToState(val);
        // Render all non-zero states (0.5 and 1)
        if (level > 0) {
            const gray = Math.floor(255 * (1 - level));
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    serializeCells(grid, includeZeros = false) {
        const cells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const snapped = snapToState(cell);
                if (snapped > 0 || includeZeros) {
                    cells.push({ r: rowIndex, c: colIndex, v: snapped });
                }
            });
        });
        return cells;
    }

    parseCells(cells) {
        return cells.map(cell => {
            if (Array.isArray(cell)) {
                // Legacy format: [row, col] - default to 1.0
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

export const halfLifeMode = new HalfLifeMode();
export default halfLifeMode;

