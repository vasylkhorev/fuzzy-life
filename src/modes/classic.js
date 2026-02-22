// src/modes/classic.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const translations = {
    en: {
        label: 'Classic',
        description: 'Binary cells with standard Conway rules: birth on 3 neighbors, survival on 2-3.',
        params: {},
    },
    sk: {
        label: 'Klasicky',
        description: 'Binárne bunky so štandardnými Conwayho pravidlami: zrod pri 3 susedoch, prežitie pri 2-3.',
        params: {},
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: "Conway's Game of Life uses binary states with synchronous updates over an eight-neighbor (Moore) lattice. Cells are either alive (1) or dead (0); simple rules produce rich emergent behavior.",
        },
        sections: [
            {
                title: 'Neighbor Count',
                variant: 'secondary',
                body: 'Live neighbors \\( N_t(i,j) = \\sum_{di \\in \\{-1,0,1\\}} \\sum_{dj \\in \\{-1,0,1\\}} G_t(i+di,j+dj) - G_t(i,j) \\). Values range from 0-8.',
            },
            {
                title: 'Transition Rule',
                variant: 'secondary',
                body: `\\[
  G_{t+1}(i,j) =
  \\begin{cases}
    1 &\\text{if } (G_t(i,j)=0 \\land N_t=3) \\lor (G_t(i,j)=1 \\land N_t \\in \\{2,3\\}) \\\\
    0 &\\text{otherwise}
  \\end{cases}
\\]`,
            },
        ],
        breakdown: {
            title: 'Rule Breakdown',
            items: [
                { title: 'Birth', body: 'Dead cell with exactly three live neighbors becomes alive.' },
                { title: 'Survival', body: 'Live cell with two or three neighbors stays alive.' },
                { title: 'Underpopulation', body: 'Fewer than two neighbors causes a live cell to die.' },
                { title: 'Overpopulation', body: 'More than three neighbors also kills a live cell.' },
            ],
        },
        notes: {
            title: 'Notes',
            body: 'Equivalent to the B3/S23 life-like rule family. Reference: Conway (1970). Works on any finite grid; edges here are non-wrapping.',
        },
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Conwayova hra života používa binárne stavy so synchronnými aktualizáciami na mriežke s ôsmimi susedmi (Mooreho okolie). Bunky sú buď živé (1) alebo mŕtve (0); jednoduché pravidlá vytvárajú bohaté emergentné správanie.',
        },
        sections: [
            {
                title: 'Počet susedov',
                variant: 'secondary',
                body: 'Živí susedia \\( N_t(i,j) = \\sum_{di \\in \\{-1,0,1\\}} \\sum_{dj \\in \\{-1,0,1\\}} G_t(i+di,j+dj) - G_t(i,j) \\). Hodnoty sú v rozsahu 0-8.',
            },
            {
                title: 'Prechodové pravidlo',
                variant: 'secondary',
                body: `\\[
  G_{t+1}(i,j) =
  \\begin{cases}
    1 &\\text{ak } (G_t(i,j)=0 \\land N_t=3) \\lor (G_t(i,j)=1 \\land N_t \\in \\{2,3\\}) \\\\
    0 &\\text{inak}
  \\end{cases}
\\]`,
            },
        ],
        breakdown: {
            title: 'Rozpis pravidiel',
            items: [
                { title: 'Zrod', body: 'Mŕtva bunka s presne tromi živými susedmi ožije.' },
                { title: 'Prežitie', body: 'Živá bunka s dvoma alebo tromi susedmi zostáva živá.' },
                { title: 'Podpopulácia', body: 'Menej ako dvaja susedia spôsobia, že bunka zomrie.' },
                { title: 'Preľudnenie', body: 'Viac ako traja susedia tiež vedú k smrti bunky.' },
            ],
        },
        notes: {
            title: 'Poznámky',
            body: 'Ekvivalent rodiny pravidiel typu B3/S23. Referencia: Conway (1970). Funguje na akejkoľvek konečnej mriežke; okraje sa tu neprepájajú.',
        },
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

class ClassicMode extends LifeMode {
    constructor() {
        super({
            id: 'classic',
            label: 'Classic',
            description: 'Binary cells with standard Conway rules: birth on 3 neighbors, survival on 2-3.',
            defaultParams: {},
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        let liveNeighbors = 0;
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        for (const [dx, dy] of dirs) {
            const nr = row + dx;
            const nc = col + dy;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] >= 0.5) {
                liveNeighbors++;
            }
        }
        const isAlive = grid[row][col] >= 0.5;
        if (isAlive && (liveNeighbors < 2 || liveNeighbors > 3)) return 0;
        if (!isAlive && liveNeighbors === 3) return 1;
        return grid[row][col];
    }

    renderCell(ctx, x, y, val, cellSize) {
        if (val >= 0.5) {
            ctx.fillStyle = "black";
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    serializeCells(grid, includeZeros = false) {
        const cells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell >= 0.5 || (includeZeros && cell === 0)) {
                    cells.push([rowIndex, colIndex]);
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
                const val = cell.v !== undefined ? cell.v : (cell.value !== undefined ? cell.value : 1.0);
                return [row, col, val];
            }
            return null;
        }).filter(Boolean);
    }
}

export const classicMode = new ClassicMode();
export default classicMode;
