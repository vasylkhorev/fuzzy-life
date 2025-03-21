// generate-patterns.js
const fs = require('fs').promises;
const path = require('path');

async function generatePatternsModule() {
    const patternsDir = path.join(__dirname, 'src/patterns');
    try {
        const files = await fs.readdir(patternsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        // Use relative imports from src/patterns/
        const imports = jsonFiles.map(file => `import ${file.replace('.json', '')} from './patterns/${file}';`).join('\n');
        const patternsObject = `const patterns = {\n${jsonFiles.map(file => `  [${file.replace('.json', '')}.name]: ${file.replace('.json', '')}`).join(',\n')}\n};`;
        const content = `${imports}\n\n${patternsObject}\n\nexport default patterns;`;

        await fs.writeFile(
            path.join(__dirname, 'src/generated-patterns.js'),
            content,
            'utf8'
        );
        console.log('Generated patterns module with files:', jsonFiles);
    } catch (error) {
        console.error('Error generating patterns module:', error);
        process.exit(1);
    }
}

generatePatternsModule();