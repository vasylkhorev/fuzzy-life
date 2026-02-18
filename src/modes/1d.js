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
                help: 'Outer totalistic rule code (0-1023). Format: BBBBBBBBBB_SSSSSSSSSS where B=birth bits, S=survival bits. Try different codes for varied behaviors.',
            },
            birthRules: {
                label: 'Birth Rules',
                help: 'Number of Y-neighbors required for birth (comma-separated, e.g., "2,3").',
            },
            survivalRules: {
                label: 'Survival Rules',
                help: 'Number of Y-neighbors required for survival (comma-separated, e.g., "2,4").',
            },
            neighborhoodSize: {
                label: 'Neighborhood Size',
                help: 'Number of neighbors on each side of center cell. Size 2 = YYXYY (5 cells total), size 3 = YYYXYYY (7 cells total), etc.',
            },
            useWeights: {
                label: 'Use Weights',
                help: 'Enable weighted neighbor calculation instead of simple counting.',
            },
            symmetric: {
                label: 'Symmetric',
                help: 'Keep left and right weights equal (mirror symmetry).',
            },
            weightThreshold: {
                label: 'Weight Threshold',
                help: 'Minimum weighted sum for birth/survival when using weights.',
            },
        },
    },
    sk: {
        label: '1D',
        description: 'Jednorozmerný celulárny automat so susedstvom YYXYY (vonkajší totálny pravidlo 624, k=2, r=2).',
        params: {
            rule: {
                label: 'Kód pravidla',
                help: 'Kód vonkajšieho totálneho pravidla (0-1023). Formát: BBBBBBBBBB_SSSSSSSSSS kde B=bity zrodu, S=bity prežitia. Skúste rôzne kódy pre rozmanité správanie.',
            },
            birthRules: {
                label: 'Pravidlá zrodu',
                help: 'Počet Y-susedov potrebných pre zrod (oddelené čiarkou, napr. "2,3").',
            },
            survivalRules: {
                label: 'Pravidlá prežitia',
                help: 'Počet Y-susedov potrebných pre prežitie (oddelené čiarkou, napr. "2,4").',
            },
            neighborhoodSize: {
                label: 'Veľkosť Susedstva',
                help: 'Počet susedov na každej strane stredovej bunky. Veľkosť 2 = YYXYY (5 buniek celkovo), veľkosť 3 = YYYXYYY (7 buniek celkovo), atď.',
            },
            useWeights: {
                label: 'Použiť Váhy',
                help: 'Povoliť vážený výpočet susedov namiesto jednoduchého počítania.',
            },
            symmetric: {
                label: 'Symetrické',
                help: 'Udržiavať ľavé a pravé váhy rovnaké (zrkadlová symetria).',
            },
            weightThreshold: {
                label: 'Prah Váhy',
                help: 'Minimálny vážený súčet pre zrod/prežitie pri použití váh.',
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
                { title: 'Birth condition', body: 'Dead cell (X=0) becomes alive if exactly 2 or 3 of the 4 Y-neighbors are alive.' },
                { title: 'Survival condition', body: 'Living cell (X=1) stays alive if exactly 2 or 4 of the 4 Y-neighbors are alive.' },
                { title: 'Death condition', body: 'Cell dies if neighbor count is 0, 1, or when alive with 3 neighbors.' },
                { title: 'Wolfram classification', body: 'This is outer totalistic code 624, resembling Wolfram\'s code 20 behavior.' },
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
                { title: 'Podmienka zrodu', body: 'Mŕtva bunka (X=0) ožije ak presne 2 alebo 3 z 4 Y-susedov sú živé.' },
                { title: 'Podmienka prežitia', body: 'Živá bunka (X=1) zostane živá ak presne 2 alebo 4 z 4 Y-susedov sú živé.' },
                { title: 'Podmienka smrti', body: 'Bunka zomrie ak počet susedov je 0, 1, alebo keď je živá s 3 susedmi.' },
                { title: 'Wolframova klasifikácia', body: 'Toto je vonkajší totálny kód 624, podobný Wolframovmu správaniu kódu 20.' },
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
            description: 'One-dimensional cellular automaton with configurable neighborhood size.',
            defaultParams: {
                rule: 624,
                birthRules: "2,3",
                survivalRules: "2,4",
                neighborhoodSize: 2,
                symmetric: true
            },
            parameterHelp: {
                rule: 'Outer totalistic rule code (0-1023). Format: BBBBBBBBBB_SSSSSSSSSS where B=birth bits, S=survival bits. Default 624 (birth: 0001001100, survival: 0010011100).',
                birthRules: 'Number of Y-neighbors required for birth (comma-separated). Default "2,3" means birth with 2 or 3 neighbors.',
                survivalRules: 'Number of Y-neighbors required for survival (comma-separated). Default "2,4" means survival with 2 or 4 neighbors.',
                neighborhoodSize: 'Number of neighbors on each side. Size 2 = YYXYY, size 3 = YYYXYYY, etc.',
                useWeights: 'Enable weighted neighbor calculation instead of simple counting.',
                symmetric: 'Keep left and right weights equal (mirror symmetry).',
                weightThreshold: 'Minimum weighted sum for birth/survival when using weights.',
            },
            rulesHtml,
            translations,
        });
        this.cache = {};
    }

    _getEffectiveParams(params) {
        const key = `${params.birthRules}|${params.survivalRules}|${params.neighborhoodSize}|${params.symmetric}|${params.w || ''}`;
        if (this.cache[key]) return this.cache[key];

        const neighborhoodSize = params.neighborhoodSize || 2;

        const parseRules = (str) => {
            if (!str) return [];
            return str.split(',').map(part => {
                if (part.includes('-')) {
                    const [min, max] = part.split('-').map(s => parseFloat(s.trim()));
                    if (!isNaN(min) && !isNaN(max)) return { min, max };
                }
                const val = parseFloat(part.trim());
                if (!isNaN(val)) return { min: val, max: val };
                return null;
            }).filter(Boolean);
        };

        const birthRanges = parseRules(params.birthRules || "2,3");
        const survivalRanges = parseRules(params.survivalRules || "2,4");

        const weights = [];
        let allWeightsOne = true;
        for (let offset = -neighborhoodSize; offset <= neighborhoodSize; offset++) {
            if (offset === 0) continue;
            const weightKey = `weight${offset > 0 ? 'Plus' : 'Minus'}${Math.abs(offset)}`;
            const w = params[weightKey] !== undefined ? params[weightKey] : 1.0;
            weights.push({ offset, w });
            if (Math.abs(w - 1.0) > 0.0001) allWeightsOne = false;
        }

        const effective = {
            birthRanges,
            survivalRanges,
            weights,
            allWeightsOne,
            neighborhoodSize,
            // Check if all rules are integers for further optimization
            allRulesIntegers: [...birthRanges, ...survivalRanges].every(r => Number.isInteger(r.min) && Number.isInteger(r.max))
        };

        this.cache[key] = effective;
        return effective;
    }

    _checkRules(val, ranges) {
        for (let i = 0; i < ranges.length; i++) {
            const r = ranges[i];
            // Use small epsilon for precision if needed, but here exact range is better
            if (val >= r.min && val <= r.max) return true;
        }
        return false;
    }

    computeNextState(grid, row, col, params = this.defaultParams) {
        if (row !== 0) return 0;

        const ep = this._getEffectiveParams(params);
        const gridRow = grid[0];
        const rowLen = gridRow.length;
        const isAlive = gridRow[col] >= 0.5;

        // Neighbor count/sum
        let weightedSum = 0;
        if (ep.allWeightsOne) {
            // Fast neighbor counting
            const r = ep.neighborhoodSize;
            for (let i = -r; i <= r; i++) {
                if (i === 0) continue;
                const nc = col + i;
                if (nc >= 0 && nc < rowLen && gridRow[nc] >= 0.5) {
                    weightedSum++;
                }
            }
        } else {
            // Full weighted sum
            for (let i = 0; i < ep.weights.length; i++) {
                const weight = ep.weights[i];
                const nc = col + weight.offset;
                if (nc >= 0 && nc < rowLen && gridRow[nc] >= 0.5) {
                    weightedSum += weight.w;
                }
            }
        }

        // Apply rules
        if (!isAlive) {
            return this._checkRules(weightedSum, ep.birthRanges) ? 1 : 0;
        } else {
            return this._checkRules(weightedSum, ep.survivalRanges) ? 1 : 0;
        }
    }

    // Helper method to decode rule into human-readable format
    decodeRule(rule = 624) {
        rule = Math.max(0, Math.min(1023, Math.floor(rule)));
        const birthBits = (rule >> 10) & 0x3FF;
        const survivalBits = rule & 0x3FF;

        const birthConditions = [];
        const survivalConditions = [];

        for (let i = 0; i <= 4; i++) {
            if (birthBits & (1 << i)) {
                birthConditions.push(i);
            }
            if (survivalBits & (1 << i)) {
                survivalConditions.push(i);
            }
        }

        return {
            rule,
            birth: birthConditions,
            survival: survivalConditions,
            description: `B${birthConditions.join('')}/S${survivalConditions.join('')}`
        };
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
