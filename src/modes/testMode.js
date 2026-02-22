// src/modes/testMode.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const translations = {
    en: {
        label: 'Test Mode',
        description: 'Three-state mode (0, 1, 2). Jump up at birth rules, stay at survival rules, jump down otherwise.',
        params: {
            birthRules: 'Birth Rules (Jump Up)',
            survivalRules: 'Survival Rules (Stay)',
        },
    },
    sk: {
        label: 'Testovací režim',
        description: 'Trojstavový režim (0, 1, 2). Zvýšenie pri pravidlách zrodu, zotrvanie pri pravidlách prežitia, inak zníženie.',
        params: {
            birthRules: 'Pravidlá Zrodu (Zvýšenie)',
            survivalRules: 'Pravidlá Prežitia (Zotrvanie)',
        },
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: 'Test Mode uses three discrete states: 0 (Black), 1 (Fading/Purple), and 2 (Peak/Yellow). Both states 1 and 2 are considered "alive" when counting neighbors.',
        },
        sections: [
            {
                title: 'Rules',
                variant: 'secondary',
                body: '1. JUMP UP (Growth): Exactly 3 neighbors increases the cell state by 1 (max 2).<br />2. STAY (Survival): Exactly 2 neighbors leaves the cell state unchanged.<br />3. JUMP DOWN (Decay): Less than 2 or more than 3 neighbors decreases the cell state by 1 (min 0).',
            }
        ],
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Testovací režim používa tri diskrétne stavy: 0 (čierna), 1 (blednúca/fialová) a 2 (vrchol/žltá). Stavy 1 aj 2 sa pri počítaní susedov považujú za "živé".',
        },
        sections: [
            {
                title: 'Pravidlá',
                variant: 'secondary',
                body: '1. ZVÝŠENIE (Rast): Presne 3 susedia zvýšia stav bunky o 1 (max 2).<br />2. ZOTRVANIE (Prežitie): Presne 2 susedia ponechajú stav bunky nezmenený.<br />3. ZNÍŽENIE (Rozpad): Menej ako 2 alebo viac ako 3 susedia znížia stav bunky o 1 (min 0).',
            }
        ],
    }
};

const rulesHtml = buildRulesByLocale(rulesContent);

class TestMode extends LifeMode {
    constructor() {
        super({
            id: 'testMode',
            label: 'Test Mode',
            description: 'Three-state mode: jump up based on birth rules, stay based on survival rules, jump down otherwise.',
            defaultParams: {
                birthRules: '3',
                survivalRules: '2',
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
                const min = parseInt(minStr, 10);
                const max = parseInt(maxStr, 10);
                if (!isNaN(min) && !isNaN(max)) {
                    for (let i = min; i <= max; i++) {
                        rules.add(i);
                    }
                }
            } else {
                const val = parseInt(trimmed, 10);
                if (!isNaN(val)) {
                    rules.add(val);
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
        let liveNeighbors = 0;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ];

        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (grid[nr][nc] > 0) {
                    liveNeighbors++;
                }
            }
        }

        const currentVal = grid[row][col];

        if (this.birthSet.has(liveNeighbors)) {
            return Math.min(currentVal + 1, 2);
        } else if (this.survivalSet.has(liveNeighbors)) {
            return currentVal;
        } else {
            return Math.max(currentVal - 1, 0);
        }
    }

    renderCell(ctx, x, y, val, cellSize) {
        if (val === 2) {
            ctx.fillStyle = "#FFD700"; // Bright Yellow
            ctx.fillRect(x, y, cellSize, cellSize);
        } else if (val === 1) {
            ctx.fillStyle = "#800080"; // Purple
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    serializeCells(grid, includeZeros = false) {
        const cells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cellVal, colIndex) => {
                if (cellVal > 0 || includeZeros) {
                    cells.push({ r: rowIndex, c: colIndex, v: cellVal });
                }
            });
        });
        return cells;
    }

    parseCells(cells) {
        return cells.map(cell => {
            if (Array.isArray(cell)) {
                const [row, col, value] = cell;
                return [row, col, value !== undefined ? value : 2]; // Default to peak state if no value
            }
            if (cell && typeof cell === 'object') {
                const row = cell.r !== undefined ? cell.r : cell.row;
                const col = cell.c !== undefined ? cell.c : cell.col;
                const value = cell.v !== undefined ? cell.v : (cell.value !== undefined ? cell.value : 2);
                return [row, col, value];
            }
            return null;
        }).filter(Boolean);
    }
}

export const testMode = new TestMode();
export default testMode;
