// src/modes/1d.js
import { GRID_SIZE } from "../config";
import LifeMode from "./LifeMode";
import { buildRulesByLocale } from "./rulesTemplate";

const translations = {
    en: {
        label: '1D',
        description: 'One-dimensional cellular automaton with YYXYY neighborhood (outer totalistic rule 624, k=2, r=2).',
        params: {
            rule: {
                label: 'Rule Code',
                help: 'Outer totalistic rule code (default: 624). Try different codes for varied behaviors.',
            },
        },
    },
    sk: {
        label: '1D',
        description: 'Jednorozmerný celulárny automat so susedstvom YYXYY (vonkajší totálny pravidlo 624, k=2, r=2).',
        params: {
            rule: {
                label: 'Kód pravidla',
                help: 'Kód vonkajšieho totálneho pravidla (predvolené: 624). Skúste rôzne kódy pre rozmanité správanie.',
            },
        },
    },
};

const rulesContent = {
    en: {
        overview: {
            title: 'Overview',
            body: "This is a one-dimensional cellular automaton with a five-cell neighborhood pattern YYXYY, where X is the center cell and Y are its neighbors. The evolution follows outer totalistic rules as classified by Stephen Wolfram in 'A New Kind of Science' (2002).",
        },
        sections: [
            {
                title: 'Neighborhood Structure',
                variant: 'secondary',
                body: 'The neighborhood consists of 5 cells: \\( Y_{-2}, Y_{-1}, X, Y_{+1}, Y_{+2} \\). The center cell X depends on its own state and the four Y neighbors.',
            },
            {
                title: 'Outer Totalistic Rule 624',
                variant: 'secondary',
                body: 'With k=2 (binary states) and r=2 (radius 2), rule 624 specifies: (1) Birth if 2 or 3 Y-neighbors are alive, (2) Survival if 2 or 4 Y-neighbors are alive.',
            },
            {
                title: 'Evolution Rule',
                variant: 'secondary',
                body: `\\[
  X_{t+1} = 
  \\begin{cases}
    1 &\\text{if } (X_t = 0 \\land N_Y \\in \\{2,3\\}) \\lor (X_t = 1 \\land N_Y \\in \\{2,4\\}) \\\\
    0 &\\text{otherwise}
  \\end{cases}
\\]`,
            },
        ],
        breakdown: {
            title: 'Rule Components',
            items: [
                { title: 'Birth Condition', body: 'Dead cell (X=0) becomes alive if exactly 2 or 3 of the 4 Y-neighbors are alive.' },
                { title: 'Survival Condition', body: 'Living cell (X=1) stays alive if exactly 2 or 4 of the 4 Y-neighbors are alive.' },
                { title: 'Death Condition', body: 'Cell dies if neighbor count is 0, 1, or when alive with 3 neighbors.' },
                { title: 'Wolfram Classification', body: 'This is outer totalistic code 624, resembling Wolfram\'s code 20 behavior.' },
            ],
        },
        notes: {
            title: 'Notes',
            body: 'Based on the BYTE article and Wolfram\'s classification. Unlike 2D Life, this has no "still lifes" but can have gliders and cycles. Garden of Eden configurations exist (101 is the simplest). Reference: Wolfram (2002), "A New Kind of Science".',
        },
    },
    sk: {
        overview: {
            title: 'Prehľad',
            body: 'Toto je jednorozmerný celulárny automat s päťbunným susedstvom YYXYY, kde X je stredová bunka a Y sú jej susedia. Evolúcia nasleduje vonkajšie totálne pravidlá klasifikované Stephenom Wolframom v "A New Kind of Science" (2002).',
        },
        sections: [
            {
                title: 'Štruktúra susedstva',
                variant: 'secondary',
                body: 'Susedstvo pozostáva z 5 buniek: \\( Y_{-2}, Y_{-1}, X, Y_{+1}, Y_{+2} \\). Stredová bunka X závisí od vlastného stavu a štyroch Y susedov.',
            },
            {
                title: 'Vonkajšie Totálne Pravidlo 624',
                variant: 'secondary',
                body: 'S k=2 (binárne stavy) a r=2 (polomer 2), pravidlo 624 špecifikuje: (1) Zrod ak 2 alebo 3 Y-susedia sú živé, (2) Prežitie ak 2 alebo 4 Y-susedia sú živé.',
            },
            {
                title: 'Pravidlo Evolúcie',
                variant: 'secondary',
                body: `\\[
  X_{t+1} = 
  \\begin{cases}
    1 &\\text{ak } (X_t = 0 \\land N_Y \\in \\{2,3\\}) \\lor (X_t = 1 \\land N_Y \\in \\{2,4\\}) \\\\
    0 &\\text{inak}
  \\end{cases}
\\]`,
            },
        ],
        breakdown: {
            title: 'Komponenty Pravidla',
            items: [
                { title: 'Podmienka Zrodu', body: 'Mŕtva bunka (X=0) ožije ak presne 2 alebo 3 z 4 Y-susedov sú živé.' },
                { title: 'Podmienka Prežitia', body: 'Živá bunka (X=1) zostane živá ak presne 2 alebo 4 z 4 Y-susedov sú živé.' },
                { title: 'Podmienka Smrti', body: 'Bunka zomrie ak počet susedov je 0, 1, alebo keď je živá s 3 susedmi.' },
                { title: 'Wolframova Klasifikácia', body: 'Toto je vonkajší totálny kód 624, podobný Wolframovmu správaniu kódu 20.' },
            ],
        },
        notes: {
            title: 'Poznámky',
            body: 'Založené na článku BYTE a Wolframovej klasifikácii. Na rozdiel od 2D Life, toto nemá "still lifes" ale môže mať klzáky a cykly. Garden of Eden konfigurácie existujú (101 je najjednoduchšia). Referencia: Wolfram (2002), "A New Kind of Science".',
        },
    },
};

const rulesHtml = buildRulesByLocale(rulesContent);

class Mode1D extends LifeMode {
    constructor() {
        super({
            id: '1d',
            label: '1D',
            description: 'One-dimensional cellular automaton with YYXYY neighborhood (outer totalistic rule 624, k=2, r=2).',
            defaultParams: { rule: 624 },
            parameterHelp: {
                rule: 'Outer totalistic rule code (0-1023). Default 624.',
            },
            rulesHtml,
            translations,
        });
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        const rule = params.rule || 624;
        
        // For 1D automaton, only compute the top row (row 0)
        if (row === 0) {
            // Count Y-neighbors (excluding the center cell X)
            let yNeighbors = 0;
            const positions = [-2, -1, 1, 2]; // Y positions in YYXYY
            
            for (const offset of positions) {
                const nc = col + offset;
                if (nc >= 0 && nc < GRID_SIZE && grid[0][nc] >= 0.5) {
                    yNeighbors++;
                }
            }
            
            const isAlive = grid[0][col] >= 0.5;
            
            // Apply rule 624: Birth if 2-3 Y-neighbors, Survival if 2-4 Y-neighbors
            if (!isAlive && (yNeighbors === 2 || yNeighbors === 3)) return 1;
            if (isAlive && (yNeighbors === 2 || yNeighbors === 4)) return 1;
        }
        
        // For 1D mode, all other rows should remain 0
        return 0;
    }

    renderCell(ctx, x, y, val, cellSize, generation = 0) {
        const currentRow = Math.floor(y / cellSize);
        
        // Only render cells on the top row (current generation)
        if (val >= 0.5 && currentRow === 0) {
            // Current generation - render as filled rectangles
            ctx.fillStyle = "black";
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
        
        // Draw grid lines for the 1D area
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
    }

    serializeCells(grid, includeZeros = false) {
        const cells = [];
        // Only serialize the top row for 1D automaton
        grid[0].forEach((cell, colIndex) => {
            if (cell >= 0.5 || (includeZeros && cell === 0)) {
                cells.push([0, colIndex]);
            }
        });
        return cells;
    }

    parseCells(cells) {
        return cells.map(cell => {
            if (Array.isArray(cell)) {
                const [row, col] = cell;
                return [0, col, 1.0]; // Force to top row for 1D
            }
            // Support object format
            if (cell && typeof cell === 'object') {
                const row = cell.r !== undefined ? cell.r : cell.row;
                const col = cell.c !== undefined ? cell.c : cell.col;
                return [0, col, 1.0]; // Force to top row for 1D
            }
            return null;
        }).filter(Boolean);
    }
}

export const mode1D = new Mode1D();
export default mode1D;
