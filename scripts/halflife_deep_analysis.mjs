// scripts/halflife_deep_analysis.js
import fs from 'fs';
import path from 'path';

/**
 * Minimal RLE Parser for analysis
 */
function parseRLE(rle) {
    const lines = rle.split('\n');
    let width = 0, height = 0;
    let body = '';
    for (const line of lines) {
        if (line.startsWith('x =')) {
            const xMatch = line.match(/x\s*=\s*(\d+)/);
            const yMatch = line.match(/y\s*=\s*(\d+)/);
            if (xMatch) width = parseInt(xMatch[1]);
            if (yMatch) height = parseInt(yMatch[1]);
        } else if (!line.startsWith('#')) {
            body += line.trim();
        }
    }

    const cells = [];
    let row = 0, col = 0;
    let run = '';
    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (char === '!') break;
        if (char >= '0' && char <= '9') {
            run += char;
        } else if (char === '$') {
            row += run ? parseInt(run) : 1;
            col = 0;
            run = '';
        } else {
            const count = run ? parseInt(run) : 1;
            run = '';
            if (char === 'o' || char === 'A' || char === 'B') {
                const state = (char === 'B') ? 2 : 1;
                for (let j = 0; j < count; j++) {
                    cells.push({ r: row, c: col + j, v: state });
                }
            }
            col += count;
        }
    }
    return { width, height, cells };
}

function parseDescription(desc) {
    // Examples:
    // Glider, speed c/3 (period 6, displacement 2)
    // Period 60 oscillator (smallest)
    // Period 1 oscillator (smallest)
    let period = 1;
    let displacement = 0;
    let speedStr = "0";

    const periodMatch = desc.match(/period (\d+)/i) || desc.match(/Period (\d+)/);
    if (periodMatch) period = parseInt(periodMatch[1]);

    const dispMatch = desc.match(/displacement (\d+)/i);
    if (dispMatch) displacement = parseInt(dispMatch[1]);

    const speedMatch = desc.match(/speed (c\/\d+|c|\d+c\/\d+)/i);
    if (speedMatch) speedStr = speedMatch[1];

    return { period, displacement, speedStr };
}

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function isFibonacci(n) {
    const isSquare = (x) => {
        const s = Math.round(Math.sqrt(x));
        return s * s === x;
    };
    return isSquare(5 * n * n + 4) || isSquare(5 * n * n - 4);
}

function getSymmetry(cells, w, h) {
    const grid = Array.from({ length: h }, () => Array(w).fill(0));
    cells.forEach(c => { if (c.r < h && c.c < w) grid[c.r][c.c] = c.v; });

    const check = (transform) => {
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const [tr, tc] = transform(r, c);
                if (tr < 0 || tr >= h || tc < 0 || tc >= w) {
                    if (grid[r][c] !== 0) return false;
                } else if (grid[r][c] !== grid[tr][tc]) {
                    return false;
                }
            }
        }
        return true;
    };

    let bits = 0;
    if (check((r, c) => [r, w - 1 - c])) bits |= 1; // H
    if (check((r, c) => [h - 1 - r, c])) bits |= 2; // V
    if (w === h) {
        if (check((r, c) => [c, r])) bits |= 4; // D1
        if (check((r, c) => [h - 1 - c, w - 1 - r])) bits |= 8; // D2
    }
    if (check((r, c) => [h - 1 - r, w - 1 - c])) bits |= 16; // R180

    return bits;
}

function analyzePattern(rule, name, data) {
    const { width, height, cells } = parseRLE(data.rle);
    const pop = cells.length;
    if (pop === 0) return null;

    const { period, displacement, speedStr } = parseDescription(data.description);
    const type = name.toLowerCase().includes('glider') ? 'Glider' : 'Oscillator';

    // c-speed value
    let cSpeed = 0;
    if (type === 'Glider') {
        if (speedStr === 'c') cSpeed = 1;
        else {
            const match = speedStr.match(/(\d*)c\/(\d+)/);
            if (match) {
                const num = match[1] === "" ? 1 : parseInt(match[1]);
                const den = parseInt(match[2]);
                cSpeed = num / den;
            }
        }
    }

    const mass = cells.reduce((sum, c) => sum + c.v, 0);
    const area = width * height;
    const avgR = cells.reduce((sum, c) => sum + c.r, 0) / pop;
    const avgC = cells.reduce((sum, c) => sum + c.c, 0) / pop;

    const moi = cells.reduce((sum, c) => sum + c.v * ((c.r - avgR) ** 2 + (c.c - avgC) ** 2), 0);
    const rog = Math.sqrt(moi / mass);

    const aspectRatio = width / height;
    const phi = (1 + Math.sqrt(5)) / 2;
    const goldenDist = Math.abs(aspectRatio - phi);

    const symmetry = getSymmetry(cells, width, height);
    const density = pop / area;

    return {
        rule, name, type, width, height, area, pop, mass,
        period, displacement, speedStr, cSpeed,
        rog: parseFloat(rog.toFixed(3)),
        moi: parseFloat(moi.toFixed(3)),
        aspectRatio: parseFloat(aspectRatio.toFixed(3)),
        goldenDist: parseFloat(goldenDist.toFixed(3)),
        symmetry,
        density: parseFloat(density.toFixed(3)),
        isPrimePop: isPrime(pop),
        isFibPop: isFibonacci(pop),
        isFibDim: isFibonacci(width) || isFibonacci(height),
        rle: data.rle,
        desc: data.description
    };
}

async function run() {
    const content = fs.readFileSync('src/patterns/halfLife.js', 'utf8');
    const match = content.match(/const patterns = (\{[\s\S]*\});/);
    if (!match) return;

    let patterns;
    try {
        patterns = eval(`(${match[1]})`);
    } catch (e) {
        console.error("Failed to parse patterns:", e);
        return;
    }

    const results = [];
    for (const [rule, rulePatterns] of Object.entries(patterns)) {
        for (const [name, data] of Object.entries(rulePatterns)) {
            const analysis = analyzePattern(rule, name, data);
            if (analysis) results.push(analysis);
        }
    }

    const gliders = results.filter(r => r.type === 'Glider');
    const oscillators = results.filter(r => r.type === 'Oscillator');

    const total = results.length;
    const uniqueSpeeds = [...new Set(gliders.map(g => g.speedStr))].sort();
    const uniquePeriods = [...new Set(oscillators.map(o => o.period))].sort((a, b) => a - b);

    const summary = {
        stats: {
            total,
            gliders: gliders.length,
            oscillators: oscillators.length,
            uniqueSpeedsCount: uniqueSpeeds.length,
            uniquePeriodsCount: uniquePeriods.length
        },
        extremes: {
            fastestGlider: [...gliders].sort((a, b) => b.cSpeed - a.cSpeed)[0],
            slowestGlider: [...gliders].sort((a, b) => a.cSpeed - b.cSpeed).filter(g => g.cSpeed > 0)[0],
            biggestArea: [...results].sort((a, b) => b.area - a.area)[0],
            smallestArea: [...results].sort((a, b) => a.area - b.area)[0],
            biggestPop: [...results].sort((a, b) => b.pop - a.pop)[0],
            smallestPop: [...results].sort((a, b) => a.pop - b.pop)[0],
            maxPeriodOscillator: [...oscillators].sort((a, b) => b.period - a.period)[0],
            maxPeriodGlider: [...gliders].sort((a, b) => b.period - a.period)[0],
        },
        unusual: {
            mostSymmetrical: results.filter(r => r.symmetry > 0).sort((a, b) => b.symmetry - a.symmetry).slice(0, 10),
            mostGolden: [...results].sort((a, b) => a.goldenDist - b.goldenDist).slice(0, 10),
            mostAiry: [...results].sort((a, b) => a.density - b.density).slice(0, 10),
            primePopulations: results.filter(r => r.isPrimePop).length,
            fibPatterns: results.filter(r => r.isFibPop || r.isFibDim).length
        },
        uniqueSpeeds,
        uniquePeriods
    };

    fs.writeFileSync('halflife_extended_analysis.json', JSON.stringify({ summary, all: results }, null, 2));

    // Generate Markdown Report
    let md = "# The Extended and Unusual Analysis of Half-Life Patterns\n\n";
    md += `A deep dive into **${total}** patterns (${gliders.length} gliders, ${oscillators.length} oscillators).\n\n`;

    md += "## 🚀 Speed and Dynamics\n";
    md += `- **Fastest Glider:** ${summary.extremes.fastestGlider.name} (${summary.extremes.fastestGlider.speedStr} in ${summary.extremes.fastestGlider.rule})\n`;
    md += `- **Slowest Glider:** ${summary.extremes.slowestGlider.name} (${summary.extremes.slowestGlider.speedStr} in ${summary.extremes.slowestGlider.rule})\n`;
    md += `- **Max Oscillator Period:** ${summary.extremes.maxPeriodOscillator.period} (${summary.extremes.maxPeriodOscillator.name})\n`;
    md += `- **Max Glider Period:** ${summary.extremes.maxPeriodGlider.period} (${summary.extremes.maxPeriodGlider.name})\n`;
    md += `- **Unique Speeds Found:** ${uniqueSpeeds.join(', ')}\n`;
    md += `- **Unique Periods Found:** ${uniquePeriods.join(', ')}\n\n`;

    md += "## 📐 Geometric Extremes\n";
    md += `- **Largest by Area:** ${summary.extremes.biggestArea.name} (${summary.extremes.biggestArea.width}x${summary.extremes.biggestArea.height} = ${summary.extremes.biggestArea.area})\n`;
    md += `- **Largest by Population:** ${summary.extremes.biggestPop.name} (Pop: ${summary.extremes.biggestPop.pop})\n`;
    md += `- **Smallest by Area:** ${summary.extremes.smallestArea.name} (${summary.extremes.smallestArea.area})\n\n`;

    md += "## ❄️ Symmetries and Aesthetics\n";
    md += "| Pattern | Rule | Symmetry Score | Density |\n| :--- | :--- | :--- | :--- |\n";
    summary.unusual.mostSymmetrical.slice(0, 5).forEach(p => {
        md += `| ${p.name} | ${p.rule} | ${p.symmetry} | ${p.density} |\n`;
    });

    md += "\n## 🏆 The Golden Ratio Award (Aspect Ratio ≈ 1.618)\n";
    summary.unusual.mostGolden.slice(0, 5).forEach(p => {
        md += `- **${p.name}** (${p.rule}): Aspect ${p.aspectRatio} (diff: ${p.goldenDist})\n`;
    });

    md += "\n## 🔢 Numerological Oddities\n";
    md += `- Patterns with Prime Population: **${summary.unusual.primePopulations}**\n`;
    md += `- Patterns with Fibonacci dimensions or population: **${summary.unusual.fibPatterns}**\n`;

    fs.writeFileSync('halflife_unusual_report.md', md);
    console.log("Analysis complete. Results in halflife_extended_analysis.json and halflife_unusual_report.md");
}

run();
