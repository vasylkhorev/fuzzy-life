// generate-patterns.js
const fs = require('fs').promises;
const path = require('path');

const toIdentifier = (() => {
    const used = new Set();
    return (raw, fallbackPrefix = 'pattern') => {
        const sanitized = raw
            .replace(/[^a-zA-Z0-9]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
            .replace(/^[^a-zA-Z_$]+/, '');
        let candidate = sanitized || fallbackPrefix;
        let suffix = 1;
        while (used.has(candidate)) {
            candidate = `${sanitized || fallbackPrefix}${suffix++}`;
        }
        used.add(candidate);
        return candidate;
    };
})();

async function collectPatterns(patternsDir) {
    const entries = await fs.readdir(patternsDir, { withFileTypes: true });
    const patternMap = {};
    const importBlocks = [];

    const addPattern = (mode, file) => {
        const relativePath = mode ? `./patterns/${mode}/${file}` : `./patterns/${file}`;
        const identifier = toIdentifier(`${mode || 'root'}_${file.replace('.json', '')}`);
        importBlocks.push(`import ${identifier} from '${relativePath}';`);
        if (!patternMap[mode || 'classic']) {
            patternMap[mode || 'classic'] = [];
        }
        patternMap[mode || 'classic'].push(identifier);
    };

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const subDir = path.join(patternsDir, entry.name);
            const files = await fs.readdir(subDir);
            files
                .filter(file => file.endsWith('.json'))
                .sort()
                .forEach(file => addPattern(entry.name, file));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            addPattern(null, entry.name);
        }
    }

    return { importBlocks, patternMap };
}

function buildLibrarySource(importBlocks, patternMap) {
    const modeKeys = Object.keys(patternMap).sort();
    const defaultMode = modeKeys.includes('classic')
        ? 'classic'
        : (modeKeys[0] || 'classic');

    const libraryEntries = modeKeys.map(mode => {
        const entries = (patternMap[mode] || [])
            .map(identifier => `        [${identifier}.name]: ${identifier}`)
            .join(',\n');
        return `    '${mode}': {\n${entries}\n    }`;
    }).join(',\n');

    const librarySource = `const patternLibrary = {\n${libraryEntries}\n};`;
    const helper = `export const getPatternsForMode = (modeKey = '${defaultMode}') => patternLibrary[modeKey] || patternLibrary['${defaultMode}'] || {};`;
    const defaultExport = 'export default patternLibrary;';

    return `${importBlocks.join('\n')}\n\n${librarySource}\n\n${helper}\n\n${defaultExport}\n`;
}

async function generatePatternsModule() {
    const patternsDir = path.join(__dirname, 'src/patterns');
    try {
        const { importBlocks, patternMap } = await collectPatterns(patternsDir);
        if (!importBlocks.length) {
            throw new Error('No pattern JSON files found.');
        }
        const content = buildLibrarySource(importBlocks, patternMap);
        await fs.writeFile(
            path.join(__dirname, 'src/generated-patterns.js'),
            content,
            'utf8'
        );
        console.log('Generated patterns module with', importBlocks.length, 'patterns.');
    } catch (error) {
        console.error('Error generating patterns module:', error);
        process.exit(1);
    }
}

generatePatternsModule();
