// src/modes/exclusiveHalfLife.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

// Integer renormalization: 0.0→0, 0.5→1, 1.0→2
const STATE_DEAD = 0;      // 0.0 → 0
const STATE_WEAK = 1;      // 0.5 → 1
const STATE_STRONG = 2;    // 1.0 → 2

const translations = {
    en: {
        label: 'Exclusive Half-Life',
        description: 'Three-state mode with exclusive birth: birth applies only to strictly dead (0) cells. Transition between 0, 0.5, and 1.',
        params: {
            birthRules: 'Birth Rules',
            survivalRules: 'Survival Rules',
        },
    },
    sk: {
        label: 'Exkluzívny Polčas',
        description: 'Trojstavový režim s exkluzívnym narodením: narodenie sa aplikuje len na mŕtve (0) bunky. Prechody medzi 0, 0.5 a 1.',
        params: {
            birthRules: 'Pravidlá Zrodu',
            survivalRules: 'Pravidlá Prežitia',
        },
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Exclusive Half-Life mode uses three states: 0, 0.5, and 1. It features exclusive birth: a cell must be strictly dead (0) to be born. Half-alive (0.5) cells must satisfy survival rules to become fully alive, otherwise they decay to 0.',
        },
        columns: [
            {
                title: 'State Representation',
                body: 'Cells can be in one of three states: 0 (dead), 0.5 (weak/half-alive), or 1 (strong/fully alive). Internally mapped to integers: 0→0, 0.5→1, 1.0→2.',
            },
            {
                title: 'Exclusive Target Function',
                body: 'Birth occurs when sum ∈ Birth rules AND cell is exactly 0. Survival occurs when sum ∈ Survival rules AND cell is ≥ 0.5. The cell moves by 0.5 steps towards the resulting target.',
            },
        ],
        sections: [
            {
                title: 'Formal Definition',
                variant: 'secondary',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    'Exclusive Half-Life mode modifies the target function \\( \\tau(\\sigma, C) \\) to enforce exclusive birth:<br /><br />' +
                    '\\[ \\tau(\\sigma, C) = \\begin{cases} 2 & \\text{if } \\sigma \\in B \\text{ AND } C = 0 \\quad \\text{(Exclusive Birth)} \\\\ 2 & \\text{if } \\sigma \\in S \\text{ AND } C \\ge 1 \\quad \\text{(Survival)} \\\\ 0 & \\text{otherwise} \\end{cases} \\]<br /><br />' +
                    '<strong>The Transition Rule:</strong><br />' +
                    'The cell moves one step toward the target.<br />' +
                    '\\[ C_{t+1} = \\begin{cases} C_t + 1 & \\text{if } \\tau(\\sigma, C_t) > C_t \\\\ C_t - 1 & \\text{if } \\tau(\\sigma, C_t) < C_t \\\\ C_t & \\text{if } \\tau(\\sigma, C_t) = C_t \\end{cases} \\]',
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Režim Exkluzívny Polčas používa tri stavy: 0, 0.5 a 1. Vyznačuje sa exkluzívnym narodením: bunka musí byť prísne mŕtva (0), aby sa narodila. Polomŕtve (0.5) bunky musia spĺňať pravidlá prežitia, inak klesnú na 0.',
        },
        columns: [
            {
                title: 'Reprezentácia stavu',
                body: 'Bunky môžu byť v jednom z troch stavov: 0 (mŕtva), 0.5 (slabá/polovične živá) alebo 1 (silná/plne živá). Interné mapovanie na celé čísla: 0→0, 0.5→1, 1.0→2.',
            },
            {
                title: 'Exkluzívna funkcia',
                body: 'Narodenie nastáva pri súčte ∈ B-pravidlá A bunka je presne 0. Prežitie pri súčte ∈ S-pravidlá A bunka je ≥ 0.5. Bunka sa približuje k cieľu v krokoch 0.5.',
            },
        ],
        sections: [
            {
                title: 'Formálna definícia',
                variant: 'secondary',
                bodyClass: 'text-slate-300 text-sm leading-relaxed',
                body:
                    'Exkluzívny Polčas mení cieľovú funkciu \\( \\tau(\\sigma, C) \\) na vynútenie exkluzívneho narodenia:<br /><br />' +
                    '\\[ \\tau(\\sigma, C) = \\begin{cases} 2 & \\text{ak } \\sigma \\in B \\text{ A } C = 0 \\quad \\text{(Exkluzívne narodenie)} \\\\ 2 & \\text{ak } \\sigma \\in S \\text{ A } C \\ge 1 \\quad \\text{(Prežitie)} \\\\ 0 & \\text{inak} \\end{cases} \\]<br /><br />' +
                    '<strong>Pravidlo prechodu:</strong><br />' +
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

    if (currentInt < targetInt) {
        return integerStateToValue(currentInt + 1);
    } else {
        return integerStateToValue(currentInt - 1);
    }
};

class ExclusiveHalfLifeMode extends LifeMode {
    constructor() {
        super({
            id: 'exclusiveHalfLife',
            label: 'Exclusive Half-Life',
            description: 'Three-state mode with exclusive birth: birth applies only to strictly dead (0) cells.',
            defaultParams: {
                birthRules: '4-6',
                survivalRules: '1-3',
            },
            rulesHtml,
            translations,
        });

        this.birthSet = new Set();
        this.survivalSet = new Set();
        this.lastParams = null;
    }

    parseRules(ruleString) {
        const rules = new Set();
        if (!ruleString) return rules;
        const parts = ruleString.replace(/,/g, ' ').split(/\s+/).filter(Boolean);

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [minStr, maxStr] = trimmed.split('-');
                const min = parseFloat(minStr);
                const max = parseFloat(maxStr);

                if (!isNaN(min) && !isNaN(max)) {
                    for (let i = min; i <= max; i += 0.5) {
                        rules.add(Math.round(i * 2));
                    }
                }
            } else {
                const val = parseFloat(trimmed);
                if (!isNaN(val)) {
                    rules.add(Math.round(val * 2));
                }
            }
        }
        return rules;
    }

    updateRulesIfChanged(params) {
        if (!params) return;

        if (this.lastParams !== params) {
            this.birthSet = this.parseRules(params.birthRules);
            this.survivalSet = this.parseRules(params.survivalRules);
            this.lastParams = params;
        }
    }

    computeNextState(grid, row, col, params, generation) {
        const safeParams = params || this.getDefaultParams();
        this.updateRulesIfChanged(safeParams);

        let neighborSumInt = 0;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                const neighborIntState = valueToIntegerState(grid[nr][nc]);
                neighborSumInt += neighborIntState;
            }
        }

        const currentIntState = valueToIntegerState(grid[row][col]);
        const isDead = currentIntState === STATE_DEAD;
        const isAlive = currentIntState >= STATE_WEAK;

        // Exclusive Birth: ONLY if strictly dead
        const birth = isDead && this.birthSet.has(neighborSumInt);
        const survival = isAlive && this.survivalSet.has(neighborSumInt);

        const targetAlive = birth || survival;
        const targetValue = targetAlive ? 1.0 : 0.0;
        return stepTowards(grid[row][col], targetValue);
    }

    renderCell(ctx, x, y, val, cellSize) {
        const level = snapToState(val);
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
                const [row, col, val] = cell;
                return [row, col, val !== undefined ? val : 1.0];
            }
            if (cell && typeof cell === 'object') {
                const row = cell.r !== undefined ? cell.r : cell.row;
                const col = cell.c !== undefined ? cell.c : cell.col;
                const value = cell.v !== undefined ? cell.v : (cell.value !== undefined ? cell.value : 1.0);
                return [row, col, value];
            }
            return null;
        }).filter(Boolean);
    }
}

export const exclusiveHalfLifeMode = new ExclusiveHalfLifeMode();
export default exclusiveHalfLifeMode;
