import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

// Integer renormalization/mapping shared with standard Half-Life
const STATE_DEAD = 0;      // 0.0 → 0
const STATE_WEAK = 1;      // 0.5 → 1
const STATE_STRONG = 2;    // 1.0 → 2

const translations = {
    en: {
        label: 'Custom Half-Life',
        description: 'Half-Life mode with customizable Conway rules (integer renormalized neighbors).',
        params: {
            birthMin: { label: 'Birth Min (Integers)', help: 'Minimum neighbor sum for birth (0-16).' },
            birthMax: { label: 'Birth Max (Integers)', help: 'Maximum neighbor sum for birth (0-16).' },
            survivalMin: { label: 'Survival Min (Integers)', help: 'Minimum neighbor sum for survival (0-16).' },
            survivalMax: { label: 'Survival Max (Integers)', help: 'Maximum neighbor sum for survival (0-16).' },
        },
    },
    sk: {
        label: 'Vlastný Polčas',
        description: 'Režim Polčas s prispôsobiteľnými Conwayho pravidlami.',
        params: {
            birthMin: { label: 'Zrod Min (Celé čísla)', help: 'Minimálny súčet susedov pre zrod (0-16).' },
            birthMax: { label: 'Zrod Max (Celé čísla)', help: 'Maximálny súčet susedov pre zrod (0-16).' },
            survivalMin: { label: 'Prežitie Min (Celé čísla)', help: 'Minimálny súčet susedov pre prežitie (0-16).' },
            survivalMax: { label: 'Prežitie Max (Celé čísla)', help: 'Maximálny súčet susedov pre prežitie (0-16).' },
        },
    },
};

// Reusing the rules content structure but noting it's custom
// Ideally we would dynamically generate the rules text based on params, 
// but for now static text describing the mechanism is sufficient.
const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'This mode functions exactly like Half-Life but allows you to define the Birth and Survival intervals. The neighbor sum is calculated by summing the integer states of neighbors (0, 1, or 2). Max sum is 16.',
        },
        columns: [
            {
                title: 'Parameters',
                body: 'Configure the integer ranges for Birth and Survival. Standard Half-Life uses Birth [5, 6] and Survival [4, 6] (renormalized from original range values).',
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Tento režim funguje rovnako ako Polčas, ale umožňuje definovať intervaly pre Zrod a Prežitie. Súčet susedov sa počíta sčítaním celočíselných stavov susedov (0, 1 alebo 2). Max súčet je 16.',
        },
        columns: [
            {
                title: 'Parametre',
                body: 'Nastavte celočíselné rozsahy pre Zrod a Prežitie. Štandardný Polčas používa Zrod [5, 6] a Prežitie [4, 6].',
            },
        ],
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const valueToIntegerState = (value) => {
    const clamped = clamp01(value);
    if (clamped < 0.25) return STATE_DEAD;
    if (clamped < 0.75) return STATE_WEAK;
    return STATE_STRONG;
};

const integerStateToValue = (intState) => {
    if (intState === STATE_DEAD) return 0.0;
    if (intState === STATE_WEAK) return 0.5;
    return 1.0;
};

const snapToState = (value) => {
    const intState = valueToIntegerState(value);
    return integerStateToValue(intState);
};

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

class CustomHalfLifeMode extends LifeMode {
    constructor() {
        super({
            id: 'customHalfLife',
            label: 'Custom Half-Life',
            description: 'Customizable Half-Life rules.',
            defaultParams: {
                birthMin: 5,
                birthMax: 6,
                survivalMin: 4,
                survivalMax: 6,
            },
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col) {
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

        const { birthMin, birthMax, survivalMin, survivalMax } = this.params;

        const birth = neighborSumInt >= birthMin && neighborSumInt <= birthMax;
        const isAlive = valueToIntegerState(grid[row][col]) >= STATE_WEAK;
        const survival = isAlive && neighborSumInt >= survivalMin && neighborSumInt <= survivalMax;

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

export const customHalfLifeMode = new CustomHalfLifeMode();
export default customHalfLifeMode;
