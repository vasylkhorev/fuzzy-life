// src/modes/index.js
const modeContext = require.context('./', false, /^(?!.*(index|LifeMode)\.js$).*\.js$/);

const modeInstances = modeContext.keys().map((key) => {
    const module = modeContext(key);
    return module.default || null;
}).filter(Boolean);

export const modes = modeInstances.reduce((acc, mode) => {
    acc[mode.id] = mode;
    return acc;
}, {});

export const availableModes = modeInstances.map((mode) => ({
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
