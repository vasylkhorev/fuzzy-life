// src/modes/halfLife.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const HALF_STEP = 0.5;
const STATES = [0, 0.5, 1];

const translations = {
    en: {
        label: 'Half-Life',
        description: 'Three-state mode: cells transition between 0, 0.5, and 1 following Conway rules.',
        params: {},
    },
    sk: {
        label: 'Polčas',
        description: 'Trojstavový režim: bunky sa prepínajú medzi 0, 0.5 a 1 podľa Conwayho pravidiel.',
        params: {},
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Half-Life mode uses three discrete states: 0, 0.5, and 1. Cells follow Conway\'s Game of Life rules (birth on 3 neighbors, survival on 2-3) but transition between these three states in 0.5 increments.',
        },
        columns: [
            {
                title: 'State Representation',
                body: 'Cells can be in one of three states: 0 (dead), 0.5 (half-alive), or 1 (fully alive). Values are snapped to the nearest state.',
            },
            {
                title: 'Transition Rule',
                body: 'Each neighbor contributes its snapped state value (0, 0.5, or 1). The rounded sum approximates the live-neighbor count. If Conway rules indicate birth or survival, the cell steps +0.5 toward 1; otherwise it steps –0.5 toward 0. Values are clamped to {0, 0.5, 1}.',
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Režim Polčas používa tri diskrétne stavy: 0, 0.5 a 1. Bunky sa riadia Conwayho pravidlami (zrod pri 3 susedoch, prežitie pri 2-3), ale prepínajú sa medzi týmito troma stavmi v krokoch po 0.5.',
        },
        columns: [
            {
                title: 'Reprezentácia stavu',
                body: 'Bunky môžu byť v jednom z troch stavov: 0 (mŕtva), 0.5 (polovične živá) alebo 1 (plne živá). Hodnoty sa zaokrúhľujú na najbližší stav.',
            },
            {
                title: 'Pravidlo prechodu',
                body: 'Každý sused prispieva svojou hodnotou stavu (0, 0.5 alebo 1). Zaokrúhlený súčet aproximuje počet živých susedov. Ak Conwayho pravidlá naznačujú zrod alebo prežitie, bunka sa posunie o +0.5 smerom k 1; inak sa posunie o –0.5 smerom k 0. Hodnoty sa orežú na množinu {0, 0.5, 1}.',
            },
        ],
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const snapToState = (value) => {
    const clamped = clamp01(value);
    // Snap to nearest state: 0, 0.5, or 1
    if (clamped < 0.25) return 0;
    if (clamped < 0.75) return 0.5;
    return 1;
};

const stepTowards = (current, target) => {
    const snappedCurrent = snapToState(current);
    if (snappedCurrent === target) return snappedCurrent;
    
    // Step by 0.5 towards target
    if (snappedCurrent < target) {
        return snapToState(snappedCurrent + HALF_STEP);
    } else {
        return snapToState(snappedCurrent - HALF_STEP);
    }
};

class HalfLifeMode extends LifeMode {
    constructor() {
        super({
            id: 'halfLife',
            label: 'Half-Life',
            description: 'Three-state mode: cells transition between 0, 0.5, and 1 following Conway rules.',
            defaultParams: {},
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col) {
        let neighborSum = 0;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                // Each neighbor contributes its snapped state value directly
                neighborSum += snapToState(grid[nr][nc]);
            }
        }

        // Round the total sum to get approximate neighbor count for Conway rules
        const approxNeighbors = Math.round(neighborSum);
        const isAlive = grid[row][col] >= 0.5;

        const birth = approxNeighbors === 3;
        const survival = approxNeighbors === 2 || approxNeighbors === 3;
        const targetAlive = birth || (isAlive && survival);

        const targetValue = targetAlive ? 1 : 0;
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
}

export const halfLifeMode = new HalfLifeMode();
export default halfLifeMode;

