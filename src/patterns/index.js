// src/patterns/index.js
// Imports RLE-based pattern modules and decodes them to cell arrays for use by the app.
import { decodeRle } from '../utils/rle';
import { modes } from '../modes';

import _1dRle from './1d.js';
import classicRle from './classic.js';
import continuousRle from './continuous.js';
import continuousQuartilesRle from './continuousQuartiles.js';
import finiteTemperatureRle from './finiteTemperature.js';
import halfLifeRle from './halfLife.js';

/**
 * Convert an RLE-based pattern library to cells-based pattern library.
 * Decodes each pattern's `rle` string to a `cells` array using the mode's stateMap.
 */
function decodePatternLibrary(rlePatterns, modeKey) {
    const mode = modes[modeKey];
    const stateMap = mode ? mode.rleStateMap : null;
    const decoded = {};

    for (const [ruleKey, patterns] of Object.entries(rlePatterns)) {
        decoded[ruleKey] = {};
        for (const [patternName, pattern] of Object.entries(patterns)) {
            const result = decodeRle(pattern.rle, stateMap);
            decoded[ruleKey][patternName] = {
                name: pattern.name || patternName,
                cells: result.cells,
                description: pattern.description,
            };
        }
    }

    return decoded;
}

export const patternLibrary = {
    '1d': decodePatternLibrary(_1dRle, '1d'),
    classic: decodePatternLibrary(classicRle, 'classic'),
    continuous: decodePatternLibrary(continuousRle, 'continuous'),
    continuousQuartiles: decodePatternLibrary(continuousQuartilesRle, 'continuousQuartiles'),
    finiteTemperature: decodePatternLibrary(finiteTemperatureRle, 'finiteTemperature'),
    halfLife: decodePatternLibrary(halfLifeRle, 'halfLife'),
};
