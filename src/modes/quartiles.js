// src/modes/continuousQuartiles.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const QUARTILE_STEP = 0.25;
const QUARTILES = [0, 0.25, 0.5, 0.75, 1];

const translations = {
    en: {
        label: 'Quartiles',
        description: 'Parameter-free, quartile-stepped take on Conway that eases toward birth/death in 0.25 increments.',
        params: {},
    },
    sk: {
        label: 'Kvartily',
        description:
            'Bezparametrická kvartilová verzia Conwayovej hry života, v ktorej sa intenzita buniek mení po krokoch 0.25.',
        params: {},
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Classic Conway targets are kept (birth on 3 neighbors, survival on 2–3) but cell intensity only moves along five quartile levels: 0, 0.25, 0.5, 0.75, 1. Updates nudge one quartile toward the classic target each tick.',
        },
        columns: [
            {
                title: 'Neighbor Measure',
                body: 'Each neighbor contributes its snapped quartile value. The rounded sum approximates the live-neighbor count used by B3/S23.',
            },
            {
                title: 'Transition',
                body: 'If Conway would keep a cell alive, it steps +0.25 toward 1; otherwise it steps –0.25 toward 0. Values are clamped to {0, 0.25, 0.5, 0.75, 1}.',
            },
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Zachovávame Conwayove pravidlá (zrod pri 3 susedoch, prežitie pri 2–3), ale intenzita bunky môže nadobúdať iba päť diskrétnych úrovní: 0, 0.25, 0.5, 0.75, 1. Pri každom kroku sa hodnota posunie najviac o jeden kvartil smerom k stavu, ktorý by určovali klasické pravidlá B3/S23.',
        },
        columns: [
            {
                title: 'Miera susedov',
                body: 'Každý sused prispieva svojou hodnotou zaokrúhlenou na najbližší kvartil. Súčet týchto zaokrúhlených hodnôt po zaokrúhlení na celé číslo približne zodpovedá počtu živých susedov v klasickej hre života (B3/S23).',
            },
            {
                title: 'Prechod',
                body: 'Ak by podľa klasických pravidiel Conwayovej hry života bunka zostala živá, jej intenzita sa zvýši o +0.25 smerom k 1; v opačnom prípade sa zníži o –0.25 smerom k 0. Po každom kroku sa hodnota oreže na množinu {0, 0.25, 0.5, 0.75, 1}.',
            },
        ],
    },
};


const rulesHtml = buildRulesByLocale(rulesContent);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const snapToQuartile = (value) => {
    const clamped = clamp01(value);
    const index = Math.round(clamped / QUARTILE_STEP);
    return QUARTILES[index];
};

const stepTowards = (current, target) => {
    const snappedCurrent = snapToQuartile(current);
    if (snappedCurrent === target) return snappedCurrent;
    return snappedCurrent < target
        ? snapToQuartile(snappedCurrent + QUARTILE_STEP)
        : snapToQuartile(snappedCurrent - QUARTILE_STEP);
};

class QuartileContinuousMode extends LifeMode {
    constructor() {
        super({
            id: 'continuousQuartiles',
            label: 'Continuous (Quartiles)',
            description: 'Simplified, parameter-free quartile interpolation of Conway\'s Game of Life.',
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
                neighborSum += snapToQuartile(grid[nr][nc]);
            }
        }

        const approxNeighbors = Math.round(neighborSum);
        const isAlive = grid[row][col] >= 0.5;

        const birth = approxNeighbors === 3;
        const survival = approxNeighbors === 2 || approxNeighbors === 3;
        const targetAlive = birth || (isAlive && survival);

        const targetValue = targetAlive ? 1 : 0;
        return stepTowards(grid[row][col], targetValue);
    }

    renderCell(ctx, x, y, val, cellSize) {
        const level = snapToQuartile(val);
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
                const snapped = snapToQuartile(cell);
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

export const continuousQuartilesMode = new QuartileContinuousMode();
export default continuousQuartilesMode;
