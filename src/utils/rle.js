// src/utils/rle.js
// Run-Length Encoding utility for cellular automaton patterns.
// Supports standard 2-state RLE and multi-state (Golly-compatible) RLE.

/**
 * State characters for multi-state RLE (Golly convention).
 * State 0 = dead (b/.), states 1–24 = A–X.
 * Standard 2-state uses b (dead) and o (alive).
 */
const MULTI_STATE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWX';

/**
 * Check whether a text string looks like RLE content.
 * @param {string} text
 * @returns {boolean}
 */
export function isRleString(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    // RLE files either start with comment lines (#) or the header (x =)
    if (/^#/m.test(trimmed) && /^x\s*=/m.test(trimmed)) return true;
    if (/^x\s*=\s*\d+/m.test(trimmed)) return true;
    return false;
}

/**
 * Find the index of the nearest state in a state map for a given value.
 * Used to quantize continuous float values to discrete RLE states.
 * @param {number} value - The cell value to map
 * @param {number[]} stateMap - Ordered state values, e.g. [0, 0.1, 0.2, ..., 1.0]
 * @returns {number} Index into stateMap of the nearest state
 */
function findNearestState(value, stateMap) {
    let bestIdx = 0;
    let bestDist = Math.abs(value - stateMap[0]);
    for (let i = 1; i < stateMap.length; i++) {
        const dist = Math.abs(value - stateMap[i]);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }
    return bestIdx;
}

/**
 * Encode cells into an RLE string.
 *
 * @param {Array} cells - Cell data from mode.serializeCells().
 *   Binary modes: [[row, col], ...]
 *   Multi-state modes: [{r, c, v}, ...]
 * @param {object} options
 * @param {string} [options.name] - Pattern name (#N line)
 * @param {string} [options.description] - Pattern description (#C line)
 * @param {number[]} [options.stateMap] - Ordered discrete state values,
 *   e.g. [0, 0.5, 1.0]. If null, assumes standard 2-state.
 * @returns {string} RLE-encoded string
 */
export function encodeRle(cells, options = {}) {
    const { name, description, stateMap } = options;

    if (!cells || cells.length === 0) {
        return '';
    }

    const isMultiState = stateMap && stateMap.length > 2;

    // Normalize cells into a [{r, c, v}] format
    const normalized = cells.map(cell => {
        if (Array.isArray(cell)) {
            return { r: cell[0], c: cell[1], v: cell[2] !== undefined ? cell[2] : 1 };
        }
        return { r: cell.r, c: cell.c, v: cell.v !== undefined ? cell.v : 1 };
    });

    // Bounding box
    const minR = Math.min(...normalized.map(c => c.r));
    const minC = Math.min(...normalized.map(c => c.c));
    const maxR = Math.max(...normalized.map(c => c.r));
    const maxC = Math.max(...normalized.map(c => c.c));

    const width = maxC - minC + 1;
    const height = maxR - minR + 1;

    // Build a 2D grid of state indices
    // State index 0 = dead, 1+ = alive states
    const grid = Array.from({ length: height }, () => Array(width).fill(0));

    normalized.forEach(({ r, c, v }) => {
        const row = r - minR;
        const col = c - minC;
        if (isMultiState) {
            // Map the cell value to the nearest state index (1-based, 0 = dead)
            const stateIdx = findNearestState(v, stateMap);
            grid[row][col] = stateIdx >= 1 ? stateIdx : 0;
        } else {
            grid[row][col] = v > 0 ? 1 : 0;
        }
    });

    // Build comment lines
    const lines = [];
    if (name) lines.push(`#N ${name}`);
    if (description) lines.push(`#C ${description}`);

    // If multi-state, add a comment documenting the state mapping
    if (isMultiState) {
        const mapping = stateMap.slice(1).map((val, i) =>
            `${MULTI_STATE_CHARS[i]}=${val}`
        ).join(', ');
        lines.push(`#C States: ${mapping}`);
    }

    // Header line
    const numStates = isMultiState ? stateMap.length : 2;
    let header = `x = ${width}, y = ${height}`;
    if (numStates > 2) {
        header += `, rule = FuzzyLife/${numStates}`;
    }
    lines.push(header);

    // Encode the RLE body
    const rleBody = encodeRleBody(grid, width, height, isMultiState);
    lines.push(rleBody);

    return lines.join('\n');
}

/**
 * Encode a 2D grid of state indices into the RLE body string.
 */
function encodeRleBody(grid, width, height, isMultiState) {
    const parts = [];

    for (let row = 0; row < height; row++) {
        // Run-length encode this row
        let col = 0;
        while (col < width) {
            const state = grid[row][col];
            let runLength = 1;
            while (col + runLength < width && grid[row][col + runLength] === state) {
                runLength++;
            }

            // Get the character for this state
            let ch;
            if (state === 0) {
                ch = 'b';
            } else if (!isMultiState) {
                ch = 'o';
            } else {
                ch = MULTI_STATE_CHARS[state - 1] || 'o';
            }

            // Don't encode trailing dead cells on the last run of a row
            if (state === 0 && col + runLength >= width) {
                // Skip trailing dead cells
            } else {
                if (runLength > 1) {
                    parts.push(`${runLength}${ch}`);
                } else {
                    parts.push(ch);
                }
            }

            col += runLength;
        }

        if (row < height - 1) {
            parts.push('$');
        }
    }

    parts.push('!');

    // Wrap lines at ~70 characters (standard RLE convention)
    let body = parts.join('');
    const wrapped = [];
    while (body.length > 70) {
        wrapped.push(body.substring(0, 70));
        body = body.substring(70);
    }
    if (body.length > 0) {
        wrapped.push(body);
    }

    return wrapped.join('\n');
}

/**
 * Decode an RLE string into pattern data.
 *
 * @param {string} rleString - RLE-encoded pattern
 * @param {number[]} [stateMap] - Optional state mapping for multi-state patterns.
 *   If provided, state indices are mapped back to values.
 *   If the RLE contains a #C States: line, that will be used as fallback.
 * @returns {{ name: string, description: string, cells: Array, width: number, height: number }}
 */
export function decodeRle(rleString, stateMap) {
    if (!rleString || typeof rleString !== 'string') {
        return { name: '', description: '', cells: [], width: 0, height: 0 };
    }

    const lines = rleString.split(/\r?\n/);

    let name = '';
    let description = '';
    let width = 0;
    let height = 0;
    let embeddedStateMap = null;
    let rleBody = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#N ')) {
            name = trimmed.substring(3).trim();
        } else if (trimmed.startsWith('#C ') || trimmed.startsWith('#c ')) {
            const comment = trimmed.substring(3).trim();
            // Check for embedded state map
            if (comment.startsWith('States:')) {
                const statesStr = comment.substring(7).trim();
                const parts = statesStr.split(',').map(s => s.trim());
                const map = [0]; // state 0 is always dead
                for (const part of parts) {
                    const [, val] = part.split('=');
                    if (val !== undefined) {
                        map.push(parseFloat(val));
                    }
                }
                if (map.length > 1) {
                    embeddedStateMap = map;
                }
            } else {
                description += (description ? ' ' : '') + comment;
            }
        } else if (trimmed.startsWith('#')) {
            // Other comment lines, skip
        } else if (/^x\s*=/.test(trimmed)) {
            // Header line: x = N, y = N, rule = ...
            const xMatch = trimmed.match(/x\s*=\s*(\d+)/);
            const yMatch = trimmed.match(/y\s*=\s*(\d+)/);
            if (xMatch) width = parseInt(xMatch[1], 10);
            if (yMatch) height = parseInt(yMatch[1], 10);
        } else {
            // RLE body line
            rleBody += trimmed;
        }
    }

    // Determine which state map to use
    const activeStateMap = stateMap || embeddedStateMap;
    const isMultiState = activeStateMap && activeStateMap.length > 2;

    // Parse the RLE body
    const cells = [];
    let row = 0;
    let col = 0;
    let runCount = '';

    for (let i = 0; i < rleBody.length; i++) {
        const ch = rleBody[i];

        if (ch === '!') {
            break;
        }

        if (ch >= '0' && ch <= '9') {
            runCount += ch;
            continue;
        }

        const count = runCount ? parseInt(runCount, 10) : 1;
        runCount = '';

        if (ch === '$') {
            // End of row(s)
            row += count;
            col = 0;
        } else if (ch === 'b' || ch === '.') {
            // Dead cells
            col += count;
        } else if (ch === 'o') {
            // Standard alive cells (state 1)
            const value = isMultiState && activeStateMap.length >= 2 ? activeStateMap[1] : 1;
            for (let j = 0; j < count; j++) {
                if (isMultiState) {
                    cells.push({ r: row, c: col, v: value });
                } else {
                    cells.push([row, col]);
                }
                col++;
            }
        } else {
            // Multi-state character: A=1, B=2, ... X=24
            const stateIdx = MULTI_STATE_CHARS.indexOf(ch);
            if (stateIdx >= 0) {
                const actualState = stateIdx + 1;
                const value = activeStateMap && activeStateMap[actualState] !== undefined
                    ? activeStateMap[actualState]
                    : actualState;
                for (let j = 0; j < count; j++) {
                    if (isMultiState) {
                        cells.push({ r: row, c: col, v: value });
                    } else {
                        cells.push([row, col]);
                    }
                    col++;
                }
            }
            // else: unknown character, skip
        }
    }

    return { name, description, cells, width, height };
}
