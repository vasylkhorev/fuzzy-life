import { HIDDEN_MODES } from '../config';

const modeContext = require.context('./', false, /^(?!.*(index|LifeMode|rulesTemplate)\.js$).*\.js$/);

const modeInstances = modeContext.keys().map((key) => {
    const module = modeContext(key);
    return module.default || null;
}).filter(Boolean);

export const modes = modeInstances.reduce((acc, mode) => {
    acc[mode.id] = mode;
    return acc;
}, {});

export const availableModes = modeInstances.filter(m => !HIDDEN_MODES.includes(m.id)).map((mode) => ({
    value: mode.id,
    label: mode.label,
    description: mode.description,
    parameterHelp: mode.parameterHelp,
}));

export const defaultParams = modeInstances.reduce((acc, mode) => {
    acc[mode.id] = mode.getDefaultParams();
    return acc;
}, {});

export const rulesHtmlMap = modeInstances.reduce((acc, mode) => {
    acc[mode.id] = mode.rulesHtml;
    return acc;
}, {});

export const modeTranslations = modeInstances.reduce((acc, mode) => {
    Object.entries(mode.translations || {}).forEach(([lang, strings]) => {
        acc[lang] = acc[lang] || {};
        acc[lang][mode.id] = {
            ...(acc[lang][mode.id] || {}),
            ...strings,
        };
    });
    return acc;
}, {});

export const getRuleKey = (modeId, params) => {
    if (!params) return 'default';

    if (['halfLife', 'exclusiveHalfLife', 'testMode'].includes(modeId)) {
        if (params.birthRules !== undefined && params.survivalRules !== undefined) {
            // e.g. B2-2 S3-5 -> b2-2_s3-5
            return `b${params.birthRules}_s${params.survivalRules}`.toLowerCase().replace(/\s+/g, '');
        }
    } else if (modeId === '1d') {
        const weights = [];
        for (let i = 1; i <= (params.neighborhoodSize || 2); i++) {
            if (params[`weightMinus${i}`] !== undefined) weights.push(params[`weightMinus${i}`]);
            if (params[`weightPlus${i}`] !== undefined) weights.push(params[`weightPlus${i}`]);
        }
        let wStr = weights.length > 0 && !weights.every(w => w === 1) ? `_w${weights.join(',')}` : '';
        return `n${params.neighborhoodSize || 2}_b${params.birthRules}_s${params.survivalRules}${wStr}`.toLowerCase().replace(/\s+/g, '');
    }

    return 'default';
};

export const getPatternsForMode = (patternLibrary, modeKey = 'classic', modeParams = null) => {
    if (!patternLibrary) return {};

    // Use modeKey exactly, no fallback to 'classic' if a mode doesn't have patterns yet.
    const modePatterns = patternLibrary[modeKey] || {};

    const ruleKey = getRuleKey(modeKey, modeParams);

    // 1D patterns are generic seeds (not specific to a rule), so we allow falling back to 'default' if rule-specific patterns don't exist.
    if (modeKey === '1d' && !modePatterns[ruleKey]) {
        return modePatterns['default'] || {};
    }

    // Return patterns exactly for this rule.
    return modePatterns[ruleKey] || {};
};
