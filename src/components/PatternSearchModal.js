import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AiOutlineClose, AiOutlinePlayCircle, AiOutlineStop, AiOutlineDelete, AiOutlineDownload, AiOutlineCopy } from "react-icons/ai";
import { useTranslation } from '../i18n';
import { db } from '../db';
import { GRID_SIZE } from '../config';
import { modes, getRuleKey } from '../modes';
import { encodeRle } from '../utils/rle';

const PatternSearchModal = ({ isOpen, onClose, mode, modeParams, onLoadPattern }) => {
    const { t } = useTranslation();
    const [searchWidth, setSearchWidth] = useState(6);
    const [searchSmaller, setSearchSmaller] = useState(true);
    const [maxGenerations, setMaxGenerations] = useState(100);
    const [minSeedDensity, setMinSeedDensity] = useState(0.1);
    const [maxSeedDensity, setMaxSeedDensity] = useState(0.5);
    const [filterGliders, setFilterGliders] = useState(true);
    const [filterOscillators, setFilterOscillators] = useState(true);
    const [filterStillLifes, setFilterStillLifes] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [strategy, setStrategy] = useState('random');
    const [foundPatterns, setFoundPatterns] = useState([]);
    const [progress, setProgress] = useState({ trials: 0, found: 0 });

    const stopSearchRef = useRef(false);
    const searchTimeoutRef = useRef(null);

    const is1D = mode === '1d';

    const loadPatternsFromDB = useCallback(async () => {
        try {
            const stored = await db.patterns.toArray();
            const currentRuleKey = getRuleKey(mode, modeParams);

            const filteredStored = stored.filter(p => {
                if (p.mode !== mode) return false;
                const pRuleKey = getRuleKey(p.mode, p.modeParams);
                return pRuleKey === currentRuleKey;
            });

            setFoundPatterns(filteredStored.reverse());
        } catch (err) {
            console.error("Failed to load patterns from db:", err);
        }
    }, [mode, modeParams]);

    useEffect(() => {
        if (isOpen) {
            loadPatternsFromDB();
        }
    }, [isOpen, loadPatternsFromDB]);

    const getTrimmedString1D = (row) => {
        const first = row.findIndex(v => v > 0);
        if (first === -1) return { s: '', offset: 0 };
        let last = -1;
        for (let i = row.length - 1; i >= 0; i--) {
            if (row[i] > 0) { last = i; break; }
        }
        return {
            s: row.slice(first, last + 1).map(v => v.toFixed(3)).join(','),
            offset: first
        };
    };

    const runOneTrial1D = (initialRow) => {
        const currentMode = modes[mode] || modes.classic;
        const history = new Map();
        const historyKeys = [];
        const MAX_HISTORY_WINDOW = 100;

        let currentGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
        let currentRow = Array(GRID_SIZE).fill(0);
        const offset = Math.floor((GRID_SIZE - initialRow.length) / 2);

        initialRow.forEach((val, i) => {
            if (offset + i >= 0 && offset + i < GRID_SIZE) {
                currentRow[offset + i] = val;
            }
        });
        currentGrid[0] = currentRow;

        const initB = getTrimmedString1D(currentRow);
        if (initB.s) {
            history.set(initB.s, { gen: -1, minC: initB.offset });
            historyKeys.push(initB.s);
        }

        for (let gen = 0; gen < maxGenerations; gen++) {
            const nextRow = Array(GRID_SIZE).fill(0);
            for (let c = 0; c < GRID_SIZE; c++) {
                nextRow[c] = currentMode.computeNextState(currentGrid, 0, c, modeParams, gen);
            }

            let minC = GRID_SIZE, maxC = -1;
            for (let c = 0; c < GRID_SIZE; c++) {
                if (nextRow[c] > 0) {
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }

            if (maxC === -1) return null;
            if (maxC - minC > searchWidth * 2) return null;
            if (minC <= 1 || maxC >= GRID_SIZE - 2) return null;

            const s = nextRow.slice(minC, maxC + 1).map(v => v.toFixed(3)).join(',');

            if (history.has(s)) {
                const prev = history.get(s);
                const period = gen - prev.gen;
                const shiftC = minC - prev.minC;

                const canonicalPattern = [];
                const trimmedRow = nextRow.slice(minC, maxC + 1);
                canonicalPattern.push(trimmedRow);

                return {
                    type: shiftC === 0 ? 'oscillator' : 'glider',
                    period,
                    shift: Math.abs(shiftC),
                    shiftR: 0,
                    shiftC,
                    canonicalRow: trimmedRow,
                    canonicalPattern,
                    initialRow: initialRow,
                    initialPattern: [initialRow],
                    is1D: true
                };
            }

            history.set(s, { gen, minC });
            historyKeys.push(s);
            if (historyKeys.length > MAX_HISTORY_WINDOW) {
                const oldestKey = historyKeys.shift();
                history.delete(oldestKey);
            }

            currentGrid[0] = nextRow;
        }
        return null;
    };

    const getBoundingBox = (grid) => {
        let minR = GRID_SIZE, maxR = -1, minC = GRID_SIZE, maxC = -1;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] > 0) {
                    if (r < minR) minR = r;
                    if (r > maxR) maxR = r;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }
        if (maxR === -1) return null;
        return { minR, maxR, minC, maxC };
    };

    const serializeBBox = (grid, bbox) => {
        if (!bbox) return '';
        const rows = [];
        for (let r = bbox.minR; r <= bbox.maxR; r++) {
            const row = [];
            for (let c = bbox.minC; c <= bbox.maxC; c++) {
                row.push(grid[r][c].toFixed(3));
            }
            rows.push(row.join(','));
        }
        return rows.join('|');
    };

    const runOneTrial2D = (initialCells) => {
        const currentMode = modes[mode] || modes.classic;

        let grid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
        const centerR = Math.floor(GRID_SIZE / 2);
        const centerC = Math.floor(GRID_SIZE / 2);
        const halfW = Math.floor(searchWidth / 2);

        initialCells.forEach((cellData) => {
            const dr = cellData[0];
            const dc = cellData[1];
            const val = cellData[2] !== undefined ? cellData[2] : 1;
            const r = centerR - halfW + dr;
            const c = centerC - halfW + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                grid[r][c] = val;
            }
        });

        for (let gen = 0; gen < maxGenerations; gen++) {
            const nextGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    nextGrid[r][c] = currentMode.computeNextState(grid, r, c, modeParams, gen);
                }
            }
            grid = nextGrid;

            if (!getBoundingBox(grid)) return null;
        }

        const extractIslands = (sourceGrid) => {
            const visited = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(false));
            const islands = [];

            const getNeighbors = (r, c) => [
                [r - 1, c - 1], [r - 1, c], [r - 1, c + 1],
                [r, c - 1], [r, c + 1],
                [r + 1, c - 1], [r + 1, c], [r + 1, c + 1]
            ];

            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (sourceGrid[r][c] > 0 && !visited[r][c]) {
                        const currentIslandCells = [];
                        const queue = [[r, c]];
                        visited[r][c] = true;

                        while (queue.length > 0) {
                            const [currR, currC] = queue.shift();
                            currentIslandCells.push([currR, currC, sourceGrid[currR][currC]]);

                            for (const [nr, nc] of getNeighbors(currR, currC)) {
                                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                                    if (sourceGrid[nr][nc] > 0 && !visited[nr][nc]) {
                                        visited[nr][nc] = true;
                                        queue.push([nr, nc]);
                                    }
                                }
                            }
                        }
                        islands.push(currentIslandCells);
                    }
                }
            }
            return islands;
        };

        const islands = extractIslands(grid);
        const validResults = [];

        for (const islandCells of islands) {
            let isolatedGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
            islandCells.forEach(([r, c, v]) => {
                isolatedGrid[r][c] = v;
            });

            const islandInitialBBox = getBoundingBox(isolatedGrid);
            if (!islandInitialBBox) continue;

            const islandInitialPattern = [];
            for (let r = islandInitialBBox.minR; r <= islandInitialBBox.maxR; r++) {
                const row = [];
                for (let c = islandInitialBBox.minC; c <= islandInitialBBox.maxC; c++) {
                    row.push(isolatedGrid[r][c]);
                }
                islandInitialPattern.push(row);
            }

            const islandHistory = new Map();
            const islandHistoryKeys = [];
            const MAX_HISTORY_WINDOW = 25;
            let islandResult = null;

            for (let gen = 0; gen < maxGenerations; gen++) {
                const bbox = getBoundingBox(isolatedGrid);
                if (!bbox) break;

                const bboxW = bbox.maxC - bbox.minC + 1;
                const bboxH = bbox.maxR - bbox.minR + 1;
                if (bboxW > searchWidth * 2 || bboxH > searchWidth * 2) break;

                if (bbox.minR <= 1 || bbox.minC <= 1 || bbox.maxR >= GRID_SIZE - 2 || bbox.maxC >= GRID_SIZE - 2) break;

                const s = serializeBBox(isolatedGrid, bbox);
                if (islandHistory.has(s)) {
                    const prev = islandHistory.get(s);
                    const period = gen - prev.gen;
                    const shiftR = bbox.minR - prev.minR;
                    const shiftC = bbox.minC - prev.minC;

                    const canonicalPattern = [];
                    for (let r = bbox.minR; r <= bbox.maxR; r++) {
                        const row = [];
                        for (let c = bbox.minC; c <= bbox.minC + (bbox.maxC - bbox.minC); c++) {
                            row.push(isolatedGrid[r][c]);
                        }
                        canonicalPattern.push(row);
                    }

                    islandResult = {
                        type: (shiftR === 0 && shiftC === 0) ? 'oscillator' : 'glider',
                        period,
                        shift: Math.abs(shiftR) + Math.abs(shiftC),
                        shiftR,
                        shiftC,
                        canonicalPattern,
                        initialPattern: islandInitialPattern,
                        is1D: false,
                        islandCellsOrigin: islandCells
                    };
                    break;
                }

                islandHistory.set(s, { gen, minR: bbox.minR, minC: bbox.minC });
                islandHistoryKeys.push(s);
                if (islandHistoryKeys.length > MAX_HISTORY_WINDOW) {
                    const oldestKey = islandHistoryKeys.shift();
                    islandHistory.delete(oldestKey);
                }

                const nextIsolatedGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        nextIsolatedGrid[r][c] = currentMode.computeNextState(isolatedGrid, r, c, modeParams, gen);
                    }
                }
                isolatedGrid = nextIsolatedGrid;
            }

            if (islandResult) {
                validResults.push(islandResult);
            }
        }

        if (validResults.length > 0) {
            return validResults[0];
        }

        return null;
    };

    const startSearch = async () => {
        setIsSearching(true);
        stopSearchRef.current = false;
        let trialsCount = 0;
        let foundCount = 0;
        const seenInitial = new Set();

        const searchBatch = () => {
            if (stopSearchRef.current) {
                setIsSearching(false);
                return;
            }

            for (let i = 0; i < (is1D ? 20 : 5); i++) {
                let result;
                const currentDensity = minSeedDensity + Math.random() * (maxSeedDensity - minSeedDensity);

                if (is1D) {
                    let initial;
                    const isThreeState = mode === 'testMode' || mode === 'halfLife';

                    if (strategy === 'random') {
                        const currentWidth = searchSmaller ? Math.floor(Math.random() * searchWidth) + 1 : searchWidth;
                        initial = Array(currentWidth).fill(0).map(() => (Math.random() < currentDensity ? (isThreeState ? (Math.random() > 0.5 ? 2 : 1) : 1) : 0));
                        if (!initial.some(v => v > 0)) continue;
                    } else {
                        const base = isThreeState ? 3 : 2;
                        const max = Math.pow(base, searchWidth);
                        if (trialsCount >= max) {
                            stopSearchRef.current = true;
                            break;
                        }
                        initial = trialsCount.toString(base).padStart(searchWidth, '0').split('').map(Number);
                    }

                    const key = initial.join('');
                    if (seenInitial.has(key)) continue;
                    seenInitial.add(key);
                    trialsCount++;

                    result = runOneTrial1D(initial);
                } else {
                    const cells = [];
                    if (strategy === 'random') {
                        const currentWidth = searchSmaller ? Math.floor(Math.random() * searchWidth) + 1 : searchWidth;
                        for (let r = 0; r < currentWidth; r++) {
                            for (let c = 0; c < currentWidth; c++) {
                                if (Math.random() < currentDensity) {
                                    let val = 1;
                                    if (mode === 'testMode' || mode === 'halfLife') {
                                        val = (Math.random() > 0.33) ? 2 : 1;
                                    }
                                    cells.push([r, c, val]);
                                }
                            }
                        }
                        if (cells.length === 0) continue;
                    } else {
                        const isThreeState = mode === 'testMode' || mode === 'halfLife';
                        const base = isThreeState ? 3 : 2;
                        const totalCells = searchWidth * searchWidth;
                        const max = Math.pow(base, totalCells);

                        if (trialsCount >= max) {
                            stopSearchRef.current = true;
                            break;
                        }
                        const bits = trialsCount.toString(base).padStart(totalCells, '0');
                        for (let idx = 0; idx < totalCells; idx++) {
                            const val = Number(bits[idx]);
                            if (val > 0) {
                                cells.push([Math.floor(idx / searchWidth), idx % searchWidth, val]);
                            }
                        }
                    }

                    const key = cells.map((cellData) => `${cellData[0]},${cellData[1]},${cellData[2] || 1} `).join(';');
                    if (seenInitial.has(key)) continue;
                    seenInitial.add(key);
                    trialsCount++;

                    result = runOneTrial2D(cells);
                }

                if (result) {
                    const isStillLife = result.type === 'oscillator' && result.period === 1;
                    const isOscillator = result.type === 'oscillator' && result.period > 1;
                    const isGlider = result.type === 'glider';

                    if (
                        (isStillLife && filterStillLifes) ||
                        (isOscillator && filterOscillators) ||
                        (isGlider && filterGliders)
                    ) {
                        const canonicalShape = result.is1D
                            ? result.canonicalPattern[0].map(v => v.toFixed(3)).join(',')
                            : result.canonicalPattern.map(r => r.map(v => v.toFixed(3)).join(',')).join('|');

                        const hash = JSON.stringify({
                            canon: canonicalShape,
                            shiftR: result.shiftR,
                            shiftC: result.shiftC,
                            period: result.period,
                            mode: mode,
                            modeParams: modeParams
                        });

                        const newItem = {
                            ...result,
                            hash,
                            mode,
                            timestamp: Date.now()
                        };

                        setFoundPatterns(prev => {
                            const isNew = !prev.some(p => p.hash === hash);
                            if (isNew) {
                                foundCount++;
                                db.patterns.put({ ...newItem }).catch(e => console.error("Failed to save pattern to DB:", e));
                                return [newItem, ...prev];
                            }
                            return prev;
                        });
                    }
                }
            }

            setProgress({ trials: trialsCount, found: foundCount });
            searchTimeoutRef.current = setTimeout(searchBatch, 5);
        };

        searchBatch();
    };

    const stopSearch = () => {
        stopSearchRef.current = true;
    };

    const handleClear = async () => {
        try {
            await db.patterns.clear();
        } catch (e) {
            console.error("Error clearing IndexedDB", e);
        }
        setFoundPatterns([]);
        setProgress({ trials: 0, found: 0 });
    };

    const filteredPatterns = foundPatterns;

    const exportResults = () => {
        if (filteredPatterns.length === 0) return;
        const dataStr = JSON.stringify(filteredPatterns, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `fuzzy-life-patterns-${Date.now()}.json`;

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleLoad = (pattern) => {
        if (pattern.is1D) {
            const cells = pattern.initialRow.map((val, i) => val > 0 ? [0, i, val] : null).filter(Boolean);
            onLoadPattern({ cells }, 0, Math.floor((GRID_SIZE - pattern.initialRow.length) / 2), { clearBefore: true });
        } else {
            const cells = [];
            pattern.initialPattern.forEach((row, r) => {
                row.forEach((val, c) => {
                    if (val > 0) cells.push([r, c, val]);
                });
            });
            const halfW = Math.floor(pattern.initialPattern[0].length / 2);
            const halfH = Math.floor(pattern.initialPattern.length / 2);
            const startR = Math.floor(GRID_SIZE / 2) - halfH;
            const startC = Math.floor(GRID_SIZE / 2) - halfW;
            onLoadPattern({ cells }, startR, startC, { clearBefore: true });
        }
        onClose();
    };

    const PatternGrid = ({ pattern2D, size = 60 }) => {
        if (!pattern2D || pattern2D.length === 0) return null;
        const rows = pattern2D.length;
        const cols = pattern2D[0].length;
        const cellSize = Math.max(2, Math.min(6, Math.floor(size / Math.max(rows, cols))));
        return (
            <div className="inline-flex flex-col gap-px bg-black p-1 rounded" style={{ lineHeight: 0 }}>
                {pattern2D.map((row, r) => (
                    <div key={r} className="flex gap-px">
                        {row.map((v, c) => {
                            let bgClass = 'bg-gray-900';
                            if (v === 2) bgClass = 'bg-yellow-500';
                            else if (v === 1) bgClass = 'bg-purple-500';
                            else if (v > 0) bgClass = 'bg-white';
                            return <div key={c} style={{ width: cellSize, height: cellSize }} className={bgClass} />;
                        })}
                    </div>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-slate-800">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {t('patternSearch.title')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 transition">
                        <AiOutlineClose size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('patternSearch.config.patternWidth')}</label>
                                <input
                                    type="number"
                                    value={searchWidth}
                                    onChange={(e) => setSearchWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('patternSearch.config.maxGen')}</label>
                                <input
                                    type="number"
                                    min="10"
                                    max="1000"
                                    value={maxGenerations}
                                    onChange={(e) => setMaxGenerations(parseInt(e.target.value) || 0)}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('patternSearch.config.minSeedDensity')}</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.01"
                                    max="0.99"
                                    value={minSeedDensity}
                                    onChange={(e) => setMinSeedDensity(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('patternSearch.config.maxSeedDensity')}</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.01"
                                    max="0.99"
                                    value={maxSeedDensity}
                                    onChange={(e) => setMaxSeedDensity(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                            <div className="flex items-center gap-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{t('patternSearch.config.strategy')}</label>
                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[120px]"
                                >
                                    <option value="random">{t('patternSearch.config.strategies.random')}</option>
                                    <option value="brute-force">{t('patternSearch.config.strategies.bruteForce')}</option>
                                </select>
                            </div>

                            {strategy === 'random' && (
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={searchSmaller}
                                        onChange={(e) => setSearchSmaller(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <span className="whitespace-nowrap">{t('patternSearch.config.searchSmaller')}</span>
                                </label>
                            )}

                            <div className="h-4 w-px bg-slate-300 mx-2 hidden md:block"></div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filterGliders}
                                        onChange={(e) => setFilterGliders(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 bg-white"
                                    />
                                    <span className="whitespace-nowrap">{t('patternSearch.filters.gliders')}</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filterOscillators}
                                        onChange={(e) => setFilterOscillators(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                                    />
                                    <span className="whitespace-nowrap">{t('patternSearch.filters.oscillators')}</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filterStillLifes}
                                        onChange={(e) => setFilterStillLifes(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 bg-white"
                                    />
                                    <span className="whitespace-nowrap">{t('patternSearch.filters.stillLifes')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                            {!isSearching ? (
                                <button
                                    onClick={startSearch}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                                >
                                    <AiOutlinePlayCircle size={20} />
                                    {t('patternSearch.config.startSearch')}
                                </button>
                            ) : (
                                <button
                                    onClick={stopSearch}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                                >
                                    <AiOutlineStop size={20} />
                                    {t('patternSearch.config.stopSearch')}
                                </button>
                            )}
                            <button
                                onClick={exportResults}
                                disabled={filteredPatterns.length === 0}
                                className={`p-3 rounded-lg transition border ${filteredPatterns.length === 0 ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50' : 'border-slate-300 text-green-600 hover:text-white hover:bg-green-600'}`}
                                title={t('patternSearch.config.exportResults') || 'Export Results to JSON'}
                            >
                                <AiOutlineDownload size={20} />
                            </button>
                            <button
                                onClick={handleClear}
                                className="p-3 text-slate-500 hover:text-slate-900 border border-slate-300 rounded-lg transition hover:bg-slate-50"
                                title={t('patternSearch.config.clearResults')}
                            >
                                <AiOutlineDelete size={20} />
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 flex justify-between items-center text-sm border border-slate-200">
                            <div className="flex gap-4">
                                <span className="text-slate-600">{t('patternSearch.progress.trials')}: <span className="text-slate-900 font-mono">{progress.trials}</span></span>
                                <span className="text-slate-600">{t('patternSearch.progress.found')}: <span className="text-green-600 font-mono">{progress.found}</span></span>
                            </div>
                            {isSearching && <span className="text-blue-600 animate-pulse">{t('patternSearch.progress.searching')}</span>}
                        </div>

                        <div className="grid gap-2">
                            {filteredPatterns.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-300 rounded-lg text-sm bg-slate-50">
                                    {foundPatterns.length === 0 ? t('patternSearch.results.noPatternsYet') : t('patternSearch.results.noPatternsFound')}
                                </div>
                            ) : (
                                [...filteredPatterns].reverse().map((p) => (
                                    <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between group shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                                {p.is1D ? (
                                                    <div className="flex gap-px bg-black p-1 rounded">
                                                        {(p.canonicalRow || p.initialRow).map((v, i) => {
                                                            let bgClass = 'bg-gray-900';
                                                            if (v === 2) bgClass = 'bg-yellow-500';
                                                            else if (v === 1) bgClass = 'bg-purple-500';
                                                            else if (v > 0) bgClass = 'bg-white';
                                                            return <div key={i} className={`w-2 h-2 ${bgClass}`}></div>;
                                                        })}
                                                    </div>
                                                ) : (
                                                    <PatternGrid pattern2D={p.canonicalPattern} size={48} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${p.type === 'glider' ? 'bg-purple-100 text-purple-700' : (p.type === 'oscillator' && p.period === 1) ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {t(`patternSearch.filters.${p.type === 'oscillator' && p.period === 1 ? 'stillLifes' : p.type + 's'}`)}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {!(p.type === 'oscillator' && p.period === 1) && `P${p.period}`}
                                                        {p.is1D && p.shift !== 0 ? ` S${p.shift}` : ''}
                                                        {!p.is1D && p.type === 'glider' ? ` (${p.shiftR}, ${p.shiftC})` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => {
                                                    const currentMode = modes[mode] || modes.classic;
                                                    const pat = p.canonicalPattern || p.initialPattern;
                                                    if (!pat) return;
                                                    const cells = [];
                                                    if (p.is1D) {
                                                        const row = p.canonicalRow || p.initialRow;
                                                        row.forEach((v, c) => { if (v > 0) cells.push({ r: 0, c, v }); });
                                                    } else {
                                                        pat.forEach((row, r) => row.forEach((v, c) => { if (v > 0) cells.push({ r, c, v }); }));
                                                    }
                                                    const rle = encodeRle(cells, { stateMap: currentMode.rleStateMap });
                                                    navigator.clipboard.writeText(rle);
                                                }}
                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                                                title="Copy RLE to clipboard"
                                            >
                                                <AiOutlineCopy size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleLoad(p)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded text-slate-800"
                                            >
                                                {t('patternSearch.results.load')}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-center">
                    {t('patternSearch.info.searchFooter')}
                </footer>
            </div>
        </div>
    );
};

export default PatternSearchModal;