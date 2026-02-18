// src/components/PatternSearchModal.js
import React, { useState, useRef } from 'react';
import { AiOutlineClose, AiOutlinePlayCircle, AiOutlineStop, AiOutlineDelete } from "react-icons/ai";
import { useTranslation } from '../i18n';
import { GRID_SIZE } from '../config';
import { modes } from '../modes';

const PatternSearchModal = ({ isOpen, onClose, mode, modeParams, onLoadPattern }) => {
    const { t } = useTranslation();
    const [searchWidth, setSearchWidth] = useState(6);
    const [maxGenerations, setMaxGenerations] = useState(50);
    const [isSearching, setIsSearching] = useState(false);
    const [strategy, setStrategy] = useState('random');
    const [foundPatterns, setFoundPatterns] = useState([]);
    const [progress, setProgress] = useState({ trials: 0, found: 0 });

    const stopSearchRef = useRef(false);
    const searchTimeoutRef = useRef(null);

    const is1D = mode === '1d';

    // ─── 1D helpers ──────────────────────────────────────────────

    const getTrimmedString1D = (row) => {
        const first = row.indexOf(1);
        if (first === -1) return { s: '', offset: 0 };
        const last = row.lastIndexOf(1);
        return {
            s: row.slice(first, last + 1).join(''),
            offset: first
        };
    };

    const runOneTrial1D = (initialRow) => {
        const currentMode = modes[mode] || modes.classic;
        const history = new Map();

        const simulationGrid = [new Array(GRID_SIZE).fill(0)];
        const startOffset = Math.floor((GRID_SIZE - initialRow.length) / 2);
        initialRow.forEach((val, i) => {
            simulationGrid[0][startOffset + i] = val;
        });

        for (let gen = 0; gen < maxGenerations; gen++) {
            const { s, offset } = getTrimmedString1D(simulationGrid[0]);
            if (!s) break;

            if (history.has(s)) {
                const prev = history.get(s);
                const period = gen - prev.gen;
                const shift = offset - prev.offset;
                const canonicalRow = s.split('').map(Number);

                return {
                    type: shift === 0 ? 'oscillator' : 'glider',
                    period,
                    shift,
                    initialRow,
                    canonicalRow,
                    gen,
                    is1D: true,
                };
            }

            history.set(s, { gen, offset });

            const nextGrid = [new Array(GRID_SIZE).fill(0)];
            for (let i = 0; i < GRID_SIZE; i++) {
                nextGrid[0][i] = currentMode.computeNextState(simulationGrid, 0, i, modeParams, gen);
            }
            simulationGrid[0] = nextGrid[0];
        }
        return null;
    };

    // ─── 2D helpers ──────────────────────────────────────────────

    const getBoundingBox = (grid) => {
        let minR = GRID_SIZE, maxR = -1, minC = GRID_SIZE, maxC = -1;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] >= 0.5) {
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
                row.push(grid[r][c] >= 0.5 ? 1 : 0);
            }
            rows.push(row.join(''));
        }
        return rows.join('|');
    };

    const runOneTrial2D = (initialCells) => {
        const currentMode = modes[mode] || modes.classic;
        const history = new Map();

        // Create grid and place pattern
        let grid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
        const centerR = Math.floor(GRID_SIZE / 2);
        const centerC = Math.floor(GRID_SIZE / 2);
        const halfW = Math.floor(searchWidth / 2);

        initialCells.forEach(([dr, dc]) => {
            const r = centerR - halfW + dr;
            const c = centerC - halfW + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                grid[r][c] = 1;
            }
        });

        // Save initial pattern for result
        const initialBBox = getBoundingBox(grid);
        const initialPattern = [];
        if (initialBBox) {
            for (let r = initialBBox.minR; r <= initialBBox.maxR; r++) {
                const row = [];
                for (let c = initialBBox.minC; c <= initialBBox.maxC; c++) {
                    row.push(grid[r][c] >= 0.5 ? 1 : 0);
                }
                initialPattern.push(row);
            }
        }

        for (let gen = 0; gen < maxGenerations; gen++) {
            const bbox = getBoundingBox(grid);
            if (!bbox) break;

            // Check if pattern is expanding too much (likely chaos)
            const bboxW = bbox.maxC - bbox.minC + 1;
            const bboxH = bbox.maxR - bbox.minR + 1;
            if (bboxW > searchWidth * 4 || bboxH > searchWidth * 4) break;

            // Check if pattern hit boundary
            if (bbox.minR <= 1 || bbox.minC <= 1 || bbox.maxR >= GRID_SIZE - 2 || bbox.maxC >= GRID_SIZE - 2) break;

            const s = serializeBBox(grid, bbox);
            if (history.has(s)) {
                const prev = history.get(s);
                const period = gen - prev.gen;
                const shiftR = bbox.minR - prev.minR;
                const shiftC = bbox.minC - prev.minC;

                // Extract canonical pattern
                const canonicalPattern = [];
                for (let r = bbox.minR; r <= bbox.maxR; r++) {
                    const row = [];
                    for (let c = bbox.minC; c <= bbox.maxC; c++) {
                        row.push(grid[r][c] >= 0.5 ? 1 : 0);
                    }
                    canonicalPattern.push(row);
                }

                return {
                    type: (shiftR === 0 && shiftC === 0) ? 'oscillator' : 'glider',
                    period,
                    shift: Math.abs(shiftR) + Math.abs(shiftC),
                    shiftR,
                    shiftC,
                    initialPattern,
                    canonicalPattern,
                    gen,
                    is1D: false,
                };
            }

            history.set(s, { gen, minR: bbox.minR, minC: bbox.minC });

            // Compute next generation
            const nextGrid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    nextGrid[r][c] = currentMode.computeNextState(grid, r, c, modeParams, gen);
                }
            }
            grid = nextGrid;
        }
        return null;
    };

    // ─── Search ──────────────────────────────────────────────────

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

                if (is1D) {
                    // ── 1D search ──
                    let initial;
                    if (strategy === 'random') {
                        initial = Array.from({ length: searchWidth }, () => Math.random() > 0.5 ? 1 : 0);
                        if (!initial.includes(1)) continue;
                    } else {
                        const max = Math.pow(2, searchWidth);
                        if (trialsCount >= max) {
                            stopSearchRef.current = true;
                            break;
                        }
                        initial = trialsCount.toString(2).padStart(searchWidth, '0').split('').map(Number);
                    }

                    const key = initial.join('');
                    if (seenInitial.has(key)) continue;
                    seenInitial.add(key);
                    trialsCount++;

                    result = runOneTrial1D(initial);
                } else {
                    // ── 2D search ──
                    const cells = [];
                    if (strategy === 'random') {
                        for (let r = 0; r < searchWidth; r++) {
                            for (let c = 0; c < searchWidth; c++) {
                                if (Math.random() > 0.5) cells.push([r, c]);
                            }
                        }
                        if (cells.length === 0) continue;
                    } else {
                        const totalCells = searchWidth * searchWidth;
                        const max = Math.pow(2, totalCells);
                        if (trialsCount >= max) {
                            stopSearchRef.current = true;
                            break;
                        }
                        const bits = trialsCount.toString(2).padStart(totalCells, '0');
                        for (let idx = 0; idx < totalCells; idx++) {
                            if (bits[idx] === '1') {
                                cells.push([Math.floor(idx / searchWidth), idx % searchWidth]);
                            }
                        }
                    }

                    const key = cells.map(([r, c]) => `${r},${c}`).join(';');
                    if (seenInitial.has(key)) continue;
                    seenInitial.add(key);
                    trialsCount++;

                    result = runOneTrial2D(cells);
                }

                if (result) {
                    const signature = is1D
                        ? `${result.type}-${result.period}-${result.shift}-${result.canonicalRow.join('')}`
                        : `${result.type}-${result.period}-${result.shiftR}-${result.shiftC}-${result.canonicalPattern.map(r => r.join('')).join('|')}`;

                    setFoundPatterns(prev => {
                        const alreadyFound = prev.some(p => p.signature === signature);
                        if (alreadyFound) return prev;
                        foundCount++;
                        return [...prev, { ...result, signature, id: Date.now() + Math.random() }].slice(-100);
                    });
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

    const clearResults = () => {
        setFoundPatterns([]);
        setProgress({ trials: 0, found: 0 });
    };

    const filteredPatterns = foundPatterns;

    const handleLoad = (pattern) => {
        if (pattern.is1D) {
            const cells = pattern.initialRow.map((val, i) => val === 1 ? [0, i, 1.0] : null).filter(Boolean);
            onLoadPattern({ cells }, 0, Math.floor((GRID_SIZE - pattern.initialRow.length) / 2), { clearBefore: true });
        } else {
            const cells = [];
            pattern.initialPattern.forEach((row, r) => {
                row.forEach((val, c) => {
                    if (val === 1) cells.push([r, c, 1.0]);
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

    // ─── Mini preview for 2D patterns ────────────────────────────

    const PatternGrid = ({ pattern2D, size = 60 }) => {
        if (!pattern2D || pattern2D.length === 0) return null;
        const rows = pattern2D.length;
        const cols = pattern2D[0].length;
        const cellSize = Math.max(2, Math.min(6, Math.floor(size / Math.max(rows, cols))));
        return (
            <div className="inline-flex flex-col gap-px bg-black p-1 rounded" style={{ lineHeight: 0 }}>
                {pattern2D.map((row, r) => (
                    <div key={r} className="flex gap-px">
                        {row.map((v, c) => (
                            <div key={c} style={{ width: cellSize, height: cellSize }} className={`${v === 1 ? 'bg-white' : 'bg-gray-900'}`} />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-200">
            <div className="w-full max-w-4xl bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {t('patternSearch.title')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition">
                        <AiOutlineClose size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('patternSearch.config.patternWidth')}</label>
                                <input
                                    type="number"
                                    value={searchWidth}
                                    onChange={(e) => setSearchWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('patternSearch.config.maxGen')}</label>
                                <input
                                    type="number"
                                    value={maxGenerations}
                                    onChange={(e) => setMaxGenerations(parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('patternSearch.config.strategy')}</label>
                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                >
                                    <option value="random">{t('patternSearch.config.strategies.random')}</option>
                                    <option value="brute-force">{t('patternSearch.config.strategies.bruteForce')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-gray-800 pt-6">
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
                                onClick={clearResults}
                                className="p-3 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition"
                                title={t('patternSearch.config.clearResults')}
                            >
                                <AiOutlineDelete size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center text-sm">
                            <div className="flex gap-4">
                                <span className="text-gray-400">{t('patternSearch.progress.trials')}: <span className="text-white font-mono">{progress.trials}</span></span>
                                <span className="text-gray-400">{t('patternSearch.progress.found')}: <span className="text-green-400 font-mono">{progress.found}</span></span>
                            </div>
                            {isSearching && <span className="text-blue-400 animate-pulse">{t('patternSearch.progress.searching')}</span>}
                        </div>

                        <div className="grid gap-2">
                            {filteredPatterns.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-lg text-sm">
                                    {foundPatterns.length === 0 ? t('patternSearch.results.noPatternsYet') : t('patternSearch.results.noPatternsFound')}
                                </div>
                            ) : (
                                [...filteredPatterns].reverse().map((p) => (
                                    <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                                {p.is1D ? (
                                                    <div className="flex gap-px bg-black p-1 rounded">
                                                        {(p.canonicalRow || p.initialRow).map((v, i) => (
                                                            <div key={i} className={`w-2 h-2 ${v === 1 ? 'bg-white' : 'bg-gray-900'}`}></div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <PatternGrid pattern2D={p.canonicalPattern} size={48} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${p.type === 'glider' ? 'bg-purple-500/20 text-purple-400' : (p.type === 'oscillator' && p.period === 1) ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{t(`patternSearch.filters.${p.type === 'oscillator' && p.period === 1 ? 'stillLifes' : p.type + 's'}`)}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {!(p.type === 'oscillator' && p.period === 1) && `P${p.period}`}
                                                        {p.is1D && p.shift !== 0 ? ` S${p.shift}` : ''}
                                                        {!p.is1D && p.type === 'glider' ? ` (${p.shiftR},${p.shiftC})` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleLoad(p)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs font-semibold rounded opacity-0 group-hover:opacity-100 transition">{t('patternSearch.results.load')}</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <footer className="px-6 py-4 bg-gray-950 border-t border-gray-800 text-[10px] text-gray-500 text-center">
                    {t('patternSearch.info.searchFooter')}
                </footer>
            </div>
        </div>
    );
};

export default PatternSearchModal;
