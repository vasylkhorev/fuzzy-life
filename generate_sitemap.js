/**
 * generate_sitemap.js
 *
 * Build-time script that generates public/sitemap.xml with entries for:
 *  1. The homepage (/)
 *  2. Each visible mode (/?m=<modeId>)
 *  3. Every pattern within each mode (/?m=<modeId>&p=<patternName>)
 *
 * For modes with rule-specific pattern groups (halfLife, 1d), the rule
 * parameters are included in the URL using the same short-key format
 * the app expects (&b=...&s=... and optionally &n=...).
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://fuzzylife.netlify.app';
const HIDDEN_MODES = ['exclusiveHalfLife', 'testMode'];

// ── Discover mode IDs from src/modes/*.js ──────────────────────────────────
function discoverModeIds() {
    const modesDir = path.join(__dirname, 'src', 'modes');
    const skipFiles = ['index.js', 'LifeMode.js', 'rulesTemplate.js'];

    return fs.readdirSync(modesDir)
        .filter(f => f.endsWith('.js') && !skipFiles.includes(f))
        .map(f => {
            const content = fs.readFileSync(path.join(modesDir, f), 'utf-8');
            const match = content.match(/id:\s*['"]([^'"]+)['"]/);
            return match ? match[1] : null;
        })
        .filter(id => id && !HIDDEN_MODES.includes(id));
}

// ── Parse rule key back into URL query params ──────────────────────────────
// Rule keys look like:
//   "default"                       → no extra params
//   "b4-6_s1-3"                     → &b=4-6&s=1-3         (halfLife)
//   "n2_b2,3_s2,4"                 → &n=2&b=2,3&s=2,4     (1d)
//   "n2_b2,3_s2,4_w1,2,1,2"       → &n=2&b=2,3&s=2,4&w=1,2,1,2 (1d + weights)
function ruleKeyToParams(ruleKey) {
    if (ruleKey === 'default') return '';

    const parts = ruleKey.split('_');
    const params = [];

    for (const part of parts) {
        if (part.startsWith('b')) params.push(`b=${part.slice(1)}`);
        else if (part.startsWith('s')) params.push(`s=${part.slice(1)}`);
        else if (part.startsWith('n')) params.push(`n=${part.slice(1)}`);
        else if (part.startsWith('w')) params.push(`w=${part.slice(1)}`);
    }

    return params.length > 0 ? '&' + params.join('&') : '';
}

// ── Build sitemap URLs ─────────────────────────────────────────────────────
function buildUrls() {
    const modeIds = discoverModeIds();
    const urls = [];

    // 1. Homepage
    urls.push({ loc: SITE_URL + '/' });

    // 2. One entry per visible mode
    for (const modeId of modeIds) {
        urls.push({ loc: `${SITE_URL}/?m=${modeId}` });
    }

    return urls;
}

// ── Generate XML ───────────────────────────────────────────────────────────
function generateSitemapXml(urls) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const urlEntries = urls.map(u => {
        const escapedLoc = u.loc.replace(/&/g, '&amp;');
        return `  <url>
    <loc>${escapedLoc}</loc>
    <lastmod>${today}</lastmod>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
    const urls = buildUrls();
    const xml = generateSitemapXml(urls);
    const outputPath = path.join(__dirname, 'public', 'sitemap.xml');

    fs.writeFileSync(outputPath, xml, 'utf-8');
    console.log(`Sitemap generated: ${outputPath} (${urls.length} URLs)`);
}

main();
