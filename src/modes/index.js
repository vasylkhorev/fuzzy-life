// src/modes/index.js
import { computeNextStateClassic, defaultParams as classicParams, renderCellClassic, modeInfo as classicInfo, rulesHtml as classicRules } from './classic';
import { computeNextStateContinuous, defaultParams as continuousParams, renderCellContinuous, modeInfo as continuousInfo, rulesHtml as continuousRules } from './continous';

// Wrapper to standardize API: (grid, row, col, params = modeDefault, generation = 0)
const classicFn = (grid, row, col, params = classicParams, generation = 0) => computeNextStateClassic(grid, row, col, params, generation);
const continuousFn = (grid, row, col, params = continuousParams, generation = 0) => computeNextStateContinuous(grid, row, col, params, generation);

// Registry: Map model key to compute function
export const modes = {
    classic: classicFn,
    continuous: continuousFn,
    // Add new modes here, e.g.:
    // lenia: leniaFn,
};

// Render functions map
export const renderCellMap = {
    classic: renderCellClassic,
    continuous: renderCellContinuous,
    // Add new modes here, e.g.:
    // lenia: renderCellLenia,
};

// Default params per mode (imported from mode files)
export const defaultParams = {
    classic: classicParams,
    continuous: continuousParams,
    // Add new entries here, e.g.:
    // lenia: leniaParams,
};

// For UI: Array of {value, label, description} for dropdown and menu options (dynamically from mode files)
export const availableModes = [
    {
        value: 'classic',
        ...classicInfo
    },
    {
        value: 'continuous',
        ...continuousInfo
    },
    // Add new modes here by importing and spreading modeInfo, e.g.:
    // { value: 'lenia', ...leniaInfo },
];

// Rules HTML map per mode
export const rulesHtmlMap = {
    classic: classicRules,
    continuous: continuousRules,
    // Add new modes here, e.g.:
    // lenia: leniaRules,
};