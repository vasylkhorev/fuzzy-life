// src/components/PatternSearchModal.js
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineClose, AiOutlinePlayCircle, AiOutlineStop, AiOutlineDownload, AiOutlineDelete } from "react-icons/ai";
import { useTranslation } from '../i18n';
import { GRID_SIZE } from '../config';
import { modes } from '../modes';

const PatternSearchModal = ({ isOpen, onClose, mode, modeParams, onLoadPattern, setModeParams }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'explore'
    const [searchWidth, setSearchWidth] = useState(6);
    const [explorationWidth, setExplorationWidth] = useState(6);
    const [maxGenerations, setMaxGenerations] = useState(200);
    const [isSearching, setIsSearching] = useState(false);
    const [strategy, setStrategy] = useState('random');
    const [explorationStrategy, setExplorationStrategy] = useState('random');
    const [explorationIndex, setExplorationIndex] = useState(0);
    const [foundPatterns, setFoundPatterns] = useState([]);
    const [progress, setProgress] = useState({ trials: 0, found: 0 });
    const [exploredRules, setExploredRules] = useState([]);
    const [explorationProgress, setExplorationProgress] = useState({ rulesTried: 0, currentBest: 0 });

    const [filters, setFilters] = useState({
        type: 'all',
        minPeriod: '',
        maxPeriod: '',
        shift: ''
    });

    const stopSearchRef = useRef(false);
    const searchTimeoutRef = useRef(null);

    const getRuleIntensity = (rule) => {
        const nSize = modeParams.neighborhoodSize || 2;
        const totalPossibleSums = nSize * 2 + 1;

        const countActive = (ruleStr) => {
            if (!ruleStr) return 0;
            const parts = ruleStr.split(',');
            let count = 0;
            parts.forEach(p => {
                if (p.includes('-')) {
                    const [min, max] = p.split('-').map(Number);
                    count += (max - min + 1);
                } else {
                    count += 1;
                }
            });
            return count;
        };

        const activeBirth = countActive(rule.birthRules);
        const activeSurvival = countActive(rule.survivalRules);
        return Math.round(((activeBirth + activeSurvival) / (totalPossibleSums * 2)) * 100);
    };

    const WeightDisplay = ({ params, nSize, small = false }) => {
        const cells = [];
        const getWeightColor = (w) => {
            const val = parseFloat(w) || 0;
            if (val === 0) return 'bg-gray-700';
            if (val < 0.5) return 'bg-blue-900/60';
            if (val < 1.0) return 'bg-blue-800/80';
            if (val < 1.5) return 'bg-blue-600';
            if (val < 2.0) return 'bg-blue-500';
            return 'bg-blue-400';
        };

        const sizeClass = small ? "w-1.5 h-1.5" : "w-2.5 h-2.5";
        const gapClass = small ? "gap-px" : "gap-0.5";

        for (let i = nSize; i >= 1; i--) {
            const val = params[`weightMinus${i}`] !== undefined ? params[`weightMinus${i}`] : 1.0;
            cells.push(<div key={`m${i}`} className={`${sizeClass} rounded-sm ${getWeightColor(val)} border border-white/5`} title={`Y-${i}: ${val}`} />);
        }
        cells.push(<div key="x" className={`${sizeClass} rounded-sm bg-gray-500 border border-white/10 flex items-center justify-center`}><div className={`${small ? 'w-px h-px' : 'w-0.5 h-0.5'} bg-black rounded-full`} /></div>);
        for (let i = 1; i <= nSize; i++) {
            const val = params[`weightPlus${i}`] !== undefined ? params[`weightPlus${i}`] : 1.0;
            cells.push(<div key={`p${i}`} className={`${sizeClass} rounded-sm ${getWeightColor(val)} border border-white/5`} title={`Y+${i}: ${val}`} />);
        }
        return <div className={`flex ${gapClass} items-center`}>{cells}</div>;
    };

    const RulePreview = React.memo(({ rule, modeParams, width = 60, height = 40 }) => {
        const canvasRef = useRef(null);
        const currentMode = modes[mode] || modes.classic;

        useEffect(() => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            const testParams = { ...modeParams, ...rule };
            const nSize = testParams.neighborhoodSize || 2;

            // Simulation setup
            let simulationGrid = [new Array(width).fill(0)];
            // Random seed in middle
            const seedWidth = Math.min(width, 10);
            const start = Math.floor((width - seedWidth) / 2);
            for (let i = 0; i < seedWidth; i++) {
                if (Math.random() > 0.4) simulationGrid[0][start + i] = 1;
            }

            // Draw generations
            ctx.fillStyle = '#0f172a'; // tailwind gray-900
            ctx.fillRect(0, 0, width, height);

            const cellPixel = 1;

            for (let gen = 0; gen < height; gen++) {
                // Draw current row
                ctx.fillStyle = 'rgba(147, 51, 234, 0.8)'; // purple-600
                simulationGrid[0].forEach((cell, x) => {
                    if (cell === 1) {
                        ctx.fillRect(x * cellPixel, gen * cellPixel, cellPixel, cellPixel);
                    }
                });

                // Compute next row
                const nextRow = new Array(width).fill(0);
                for (let i = 0; i < width; i++) {
                    nextRow[i] = currentMode.computeNextState(simulationGrid, 0, i, testParams, gen);
                }
                simulationGrid[0] = nextRow;
            }
        }, [rule, modeParams, width, height]);

        return (
            <div className="bg-black/40 rounded border border-white/5 overflow-hidden flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full h-auto image-pixelated pointer-events-none"
                    style={{ aspectRatio: `${width}/${height}` }}
                />
            </div>
        );
    });

    const getTrimmedString = (row) => {
        const first = row.indexOf(1);
        if (first === -1) return { s: '', offset: 0 };
        const last = row.lastIndexOf(1);
        return {
            s: row.slice(first, last + 1).join(''),
            offset: first
        };
    };

    const runOneTrial = (initialRow, currentParams = modeParams) => {
        const currentMode = modes[mode] || modes.classic;
        let currentRow = [...initialRow];
        const history = new Map();

        const simulationGrid = [new Array(GRID_SIZE).fill(0)];
        const startOffset = Math.floor((GRID_SIZE - initialRow.length) / 2);
        initialRow.forEach((val, i) => {
            simulationGrid[0][startOffset + i] = val;
        });

        for (let gen = 0; gen < maxGenerations; gen++) {
            const { s, offset } = getTrimmedString(simulationGrid[0]);
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
                    gen
                };
            }

            history.set(s, { gen, offset });

            const nextGrid = [new Array(GRID_SIZE).fill(0)];
            for (let i = 0; i < GRID_SIZE; i++) {
                nextGrid[0][i] = currentMode.computeNextState(simulationGrid, 0, i, currentParams, gen);
            }
            simulationGrid[0] = nextGrid[0];
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

            for (let i = 0; i < 20; i++) {
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

                const result = runOneTrial(initial);
                if (result) {
                    const signature = `${result.type}-${result.period}-${result.shift}-${result.canonicalRow.join('')}`;

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

    const generateRandomRule = () => {
        const nSize = modeParams.neighborhoodSize || 2;
        const totalCount = nSize * 2;

        const randomRuleString = () => {
            const parts = [];
            if (Math.random() > 0.3) {
                for (let i = 0; i <= totalCount; i++) {
                    if (Math.random() > 0.7) parts.push(i);
                }
            } else {
                const numIntervals = Math.random() > 0.8 ? 2 : 1;
                for (let i = 0; i < numIntervals; i++) {
                    const a = Math.floor(Math.random() * (totalCount + 1));
                    const b = Math.floor(Math.random() * (totalCount + 1));
                    const min = Math.min(a, b);
                    const max = Math.max(min + 1, Math.max(a, b));
                    if (min === max) parts.push(min);
                    else parts.push(`${min}-${max}`);
                }
            }
            if (parts.length === 0) return String(Math.floor(Math.random() * totalCount) + 1);
            return parts.join(',');
        };

        return {
            birthRules: randomRuleString(),
            survivalRules: randomRuleString()
        };
    };

    const generateBruteForceRule = (index) => {
        const nSize = modeParams.neighborhoodSize || 2;
        const totalPossibleSums = nSize * 2 + 1;

        // Lower bits for birth, high bits for survival
        const birthBits = index % Math.pow(2, totalPossibleSums);
        const survivalBits = Math.floor(index / Math.pow(2, totalPossibleSums));

        const getRuleString = (bits) => {
            const active = [];
            for (let i = 0; i < totalPossibleSums; i++) {
                if ((bits >> i) & 1) active.push(i);
            }
            return active.length > 0 ? active.join(',') : '';
        };

        return {
            birthRules: getRuleString(birthBits),
            survivalRules: getRuleString(survivalBits)
        };
    };

    const exploreRules = async () => {
        setIsSearching(true);
        stopSearchRef.current = false;
        let ruleCount = explorationProgress.rulesTried;
        let currentIndex = explorationIndex;

        const nSize = modeParams.neighborhoodSize || 2;
        const maxRules = Math.pow(2, 2 * (nSize * 2 + 1));

        const exploreBatch = () => {
            if (stopSearchRef.current) {
                setIsSearching(false);
                setExplorationIndex(currentIndex);
                return;
            }

            let testRule;
            if (explorationStrategy === 'random') {
                testRule = generateRandomRule();
            } else {
                if (currentIndex >= maxRules) {
                    stopSearchRef.current = true;
                    setIsSearching(false);
                    return;
                }
                testRule = generateBruteForceRule(currentIndex);
                currentIndex++;
            }

            const testParams = { ...modeParams, ...testRule };
            let ruleFoundPatterns = 0;
            let ruleGliders = 0;
            const uniqueTypes = new Set();
            const seenResults = new Set();

            for (let t = 0; t < 50; t++) {
                const initial = Array.from({ length: explorationWidth }, () => Math.random() > 0.5 ? 1 : 0);
                if (!initial.includes(1)) continue;

                const result = runOneTrial(initial, testParams);
                if (result) {
                    const signature = `${result.type}-${result.period}-${result.shift}`;
                    if (!seenResults.has(signature)) {
                        seenResults.add(signature);
                        ruleFoundPatterns++;
                        if (result.type === 'glider') ruleGliders++;
                        uniqueTypes.add(signature);
                    }
                }
            }

            const ruleScore = (ruleFoundPatterns * 2) + (ruleGliders * 15) + (uniqueTypes.size * 5);
            const resultEntry = { ...testRule, score: ruleScore, stats: { found: ruleFoundPatterns, gliders: ruleGliders } };

            if (ruleScore > 0) {
                setExploredRules(prev => {
                    const updated = [...prev, resultEntry];
                    return updated.sort((a, b) => b.score - a.score).slice(0, 30);
                });
            }

            ruleCount++;
            setExplorationProgress(prev => ({
                rulesTried: ruleCount,
                currentBest: Math.max(prev.currentBest, ruleScore)
            }));

            searchTimeoutRef.current = setTimeout(exploreBatch, 5);
        };

        exploreBatch();
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
        const cells = pattern.initialRow.map((val, i) => val === 1 ? [0, i, 1.0] : null).filter(Boolean);
        onLoadPattern({ cells }, 0, Math.floor((GRID_SIZE - pattern.initialRow.length) / 2), { clearBefore: true });
        onClose();
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
                    <div className="flex border-b border-gray-800 bg-gray-950/20">
                        <button
                            onClick={() => { setActiveTab('search'); stopSearch(); }}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'search' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t('patternSearch.tabs.search')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('explore'); stopSearch(); }}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'explore' ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t('patternSearch.tabs.explore')}
                        </button>
                    </div>



                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeTab === 'search' ? (
                            <>
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
                                            onChange={(e) => setMaxGenerations(Math.max(10, Math.min(2000, parseInt(e.target.value) || 10)))}
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
                                                    <div className="flex gap-px bg-black p-1 rounded">
                                                        {(p.canonicalRow || p.initialRow).map((v, i) => (
                                                            <div key={i} className={`w-2 h-2 ${v === 1 ? 'bg-white' : 'bg-gray-900'}`}></div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${p.type === 'glider' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{t(`patternSearch.filters.${p.type}s`)}</span>
                                                            <span className="text-xs text-gray-400">P{p.period}{p.shift !== 0 ? ` S${p.shift}` : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleLoad(p)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs font-semibold rounded opacity-0 group-hover:opacity-100 transition">{t('patternSearch.results.load')}</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Left: Current Settings */}
                                    <div>
                                        <div className="p-4 bg-gray-800/40 border border-white/5 rounded-xl ring-1 ring-white/5 h-full flex flex-col gap-4">

                                            {/* Weights row */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2 px-0.5">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">{t('patternSearch.weights')}</span>
                                                </div>
                                                <div className="flex flex-wrap items-end gap-1 px-0.5">
                                                    {(() => {
                                                        const nSize = modeParams.neighborhoodSize || 2;
                                                        const weightBoxes = [];

                                                        const getIntensityColor = (w) => {
                                                            const val = parseFloat(w) || 0;
                                                            if (val === 0) return 'bg-gray-800 border-gray-700 text-gray-600';
                                                            if (val < 0.5) return 'bg-blue-900/40 border-blue-800/50 text-blue-300';
                                                            if (val < 1.0) return 'bg-blue-800/60 border-blue-700/50 text-blue-200';
                                                            if (val < 1.5) return 'bg-blue-600/80 border-blue-500/50 text-white';
                                                            if (val < 2.0) return 'bg-blue-500 border-blue-400/50 text-white';
                                                            return 'bg-blue-400 border-blue-300/50 text-white';
                                                        };

                                                        for (let i = nSize; i >= 1; i--) {
                                                            const key = `weightMinus${i}`;
                                                            const val = modeParams[key] !== undefined ? modeParams[key] : 1.0;
                                                            weightBoxes.push(
                                                                <div key={key} className="flex flex-col items-center gap-1">
                                                                    <div className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono font-bold ${getIntensityColor(val)}`}>
                                                                        {val}
                                                                    </div>
                                                                    <span className="text-[8px] text-gray-600 font-mono">Y-{i}</span>
                                                                </div>
                                                            );
                                                        }

                                                        weightBoxes.push(
                                                            <div key="center" className="flex flex-col items-center gap-1">
                                                                <div className="w-8 h-8 rounded border border-gray-700 bg-gray-900 flex items-center justify-center text-[10px] font-mono font-bold text-gray-500">
                                                                    X
                                                                </div>
                                                                <span className="text-[8px] text-gray-600 font-mono">CTR</span>
                                                            </div>
                                                        );

                                                        for (let i = 1; i <= nSize; i++) {
                                                            const key = `weightPlus${i}`;
                                                            const val = modeParams[key] !== undefined ? modeParams[key] : 1.0;
                                                            weightBoxes.push(
                                                                <div key={key} className="flex flex-col items-center gap-1">
                                                                    <div className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono font-bold ${getIntensityColor(val)}`}>
                                                                        {val}
                                                                    </div>
                                                                    <span className="text-[8px] text-gray-600 font-mono">Y+{i}</span>
                                                                </div>
                                                            );
                                                        }

                                                        return weightBoxes;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Exploration Controls */}
                                    <div className="flex flex-col">
                                        <div className="p-4 bg-gray-800/40 border border-white/5 rounded-xl ring-1 ring-white/5 h-full flex flex-col gap-3 justify-between">
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-500 uppercase font-bold px-0.5">{t('patternSearch.config.strategy')}</label>
                                                    <select
                                                        value={explorationStrategy}
                                                        onChange={(e) => {
                                                            setExplorationStrategy(e.target.value);
                                                            setExplorationIndex(0);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-purple-500 transition-colors"
                                                    >
                                                        <option value="random">{t('patternSearch.config.strategies.random')}</option>
                                                        <option value="brute-force">{t('patternSearch.config.strategies.bruteForce')}</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-gray-500 uppercase font-bold px-0.5">{t('patternSearch.config.explorationWidth')}</label>
                                                    <input
                                                        type="number"
                                                        value={explorationWidth}
                                                        onChange={(e) => setExplorationWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-purple-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!isSearching ? (
                                                    <button
                                                        onClick={exploreRules}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition text-xs"
                                                    >
                                                        <AiOutlinePlayCircle size={16} />
                                                        {t('patternSearch.config.startExploration')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={stopSearch}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition text-xs"
                                                    >
                                                        <AiOutlineStop size={16} />
                                                        {t('patternSearch.config.stopExploration')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setExploredRules([]);
                                                        setExplorationProgress({ rulesTried: 0, currentBest: 0 });
                                                        setExplorationIndex(0);
                                                    }}
                                                    className="p-2.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition"
                                                >
                                                    <AiOutlineDelete size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center text-sm">
                                    <div className="flex gap-4">
                                        <span className="text-gray-400">{t('patternSearch.progress.rulesExplored')}: <span className="text-white font-mono">{explorationProgress.rulesTried}</span></span>
                                        <span className="text-gray-400">{t('patternSearch.progress.bestScore')}: <span className="text-purple-400 font-mono">{explorationProgress.currentBest}</span></span>
                                    </div>
                                    {isSearching && <span className="text-purple-400 animate-pulse">{t('patternSearch.progress.exploring')}</span>}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1 pt-2 border-t border-gray-800/50">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('patternSearch.results.topRules')}</h4>
                                            <div className="text-[9px] text-gray-600 italic">Showing up to 30 best candidates</div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {exploredRules.length === 0 ? (
                                                <div className="md:col-span-2 text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-gray-900/10">
                                                    <div className="mb-2 text-gray-600">
                                                        <AiOutlinePlayCircle size={32} className="mx-auto opacity-20" />
                                                    </div>
                                                    {t('patternSearch.results.noRules')}
                                                </div>
                                            ) : (
                                                exploredRules.map((rule, idx) => (
                                                    <div key={idx} className="group flex items-center gap-3 bg-gray-800/80 border border-gray-700/50 rounded-lg px-3 py-2 hover:border-purple-500/50 hover:bg-gray-800 transition-all duration-300">
                                                        <div className="text-[10px] font-bold text-purple-400 font-mono whitespace-nowrap flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                                                            {rule.score}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 whitespace-nowrap">
                                                            {t('patternSearch.results.gliders')}: <span className="text-purple-300">{rule.stats.gliders}</span>
                                                            <span className="mx-1 text-gray-700">•</span>
                                                            {t('patternSearch.results.found')}: <span className="text-green-400">{rule.stats.found}</span>
                                                        </div>
                                                        <div className="flex gap-1.5 text-[9px] font-mono">
                                                            <span className="px-1.5 py-0.5 bg-black/30 rounded border border-white/5 text-blue-300" title={rule.birthRules}>B:{rule.birthRules || '∅'}</span>
                                                            <span className="px-1.5 py-0.5 bg-black/30 rounded border border-white/5 text-green-300" title={rule.survivalRules}>S:{rule.survivalRules || '∅'}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setModeParams(prev => ({ ...prev, ...rule }));
                                                                onClose();
                                                            }}
                                                            className="ml-auto px-2.5 py-1 bg-purple-600/90 hover:bg-purple-600 text-white text-[9px] font-bold rounded transition-colors shrink-0"
                                                        >
                                                            {t('patternSearch.results.apply')}
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <footer className="px-6 py-4 bg-gray-950 border-t border-gray-800 text-[10px] text-gray-500 text-center">
                    {activeTab === 'search'
                        ? t('patternSearch.info.searchFooter')
                        : t('patternSearch.info.exploreFooter')}
                </footer>
            </div>
        </div>
    );
};

export default PatternSearchModal;
