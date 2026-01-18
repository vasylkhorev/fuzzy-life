// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Menu from './components/Menu';
import ModeMenu from './components/ModeMenu';
import { GRID_SIZE, DEFAULT_DEBUG_CONFIG, CELL_PIXEL_SIZE } from "./config";
import { getPatternsForMode } from './generated-patterns';
import { modes, availableModes } from './modes';
import { useTranslation } from './i18n';

const gridsEqual = (gridA, gridB) => {
    if (gridA === gridB) {
        return true;
    }
    if (!gridA || !gridB || gridA.length !== gridB.length) {
        return false;
    }
    for (let row = 0; row < gridA.length; row++) {
        const rowA = gridA[row];
        const rowB = gridB[row];
        if (!rowA || !rowB || rowA.length !== rowB.length) {
            return false;
        }
        for (let col = 0; col < rowA.length; col++) {
            if (rowA[col] !== rowB[col]) {
                return false;
            }
        }
    }
    return true;
};

const App = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [grid, setGridState] = useState(
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
    );
    const gridRef = useRef(grid);
    const [speed, setSpeed] = useState(500);
    const [generation, setGeneration] = useState(0);
    const [model, setModel] = useState('classic');
    const [modeParams, setModeParams] = useState(() => modes.classic.getDefaultParams());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [controlAnchor, setControlAnchor] = useState('bottom-right');
    const [controlFreePosition, setControlFreePosition] = useState({ x: 0, y: 0 });
    const [isDraggingControls, setIsDraggingControls] = useState(false);
    const [controlDragCoords, setControlDragCoords] = useState({ x: 0, y: 0 });
    const [cellPixelSize, setCellPixelSize] = useState(CELL_PIXEL_SIZE);
    const [isTestingPeriodicity, setIsTestingPeriodicity] = useState(false);
    const [detectedPeriod, setDetectedPeriod] = useState(null);
    const controlsRef = useRef(null);
    const playAreaRef = useRef(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const testingHistoryRef = useRef([]);
    const testingIntervalRef = useRef(null);
    const testGenerationRef = useRef(0);
    const maxTestingHistorySize = 2000;
    const debugConfig = DEFAULT_DEBUG_CONFIG;
    const { t } = useTranslation();

    useEffect(() => {
        const nextMode = modes[model] || modes.classic;
        setModeParams(nextMode.getDefaultParams());
    }, [model]);
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    const cloneGrid = useCallback((sourceGrid) => sourceGrid.map((row) => [...row]), []);
    const historyRef = useRef([]);
    const maxHistorySize = 100;

    const applyGridChange = useCallback((updater, { skipHistory = false } = {}) => {
        setGridState((prev) => {
            const nextGrid = typeof updater === 'function' ? updater(prev) : updater;
            if (gridsEqual(prev, nextGrid)) {
                return prev;
            }
            if (!skipHistory) {
                historyRef.current.push(cloneGrid(prev));
                if (historyRef.current.length > maxHistorySize) {
                    historyRef.current.shift();
                }
            }
            return nextGrid;
        });
    }, [cloneGrid]);

    const undo = useCallback(() => {
        while (historyRef.current.length) {
            const previous = historyRef.current.pop();
            if (previous && !gridsEqual(previous, gridRef.current)) {
                setGridState(previous);
                setIsRunning(false);
                return;
            }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'z';
            if (isUndo) {
                event.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo]);

    const changeSpeed = (newSpeed) => setSpeed(newSpeed);
    const toggleRun = () => setIsRunning(prev => !prev);
    const clearGrid = () => {
        applyGridChange(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
        setIsRunning(false);
        setIsTestingPeriodicity(false);
        setGeneration(0);
        setDetectedPeriod(null);
        testingHistoryRef.current = [];
        if (testingIntervalRef.current) {
            clearInterval(testingIntervalRef.current);
            testingIntervalRef.current = null;
        }
    };
    const nextGeneration = () => {
        const mode = modes[model] || modes.classic;
        applyGridChange((prevGrid) =>
            prevGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) =>
                    mode.computeNextState(prevGrid, rowIndex, colIndex, modeParams, generation)
                )
            )
        );
        setGeneration(prev => prev + 1);
    };

    const testPeriodicity = useCallback(() => {
        if (isTestingPeriodicity) {
            // Stop testing
            setIsTestingPeriodicity(false);
            if (testingIntervalRef.current) {
                clearInterval(testingIntervalRef.current);
                testingIntervalRef.current = null;
            }
            return;
        }

        // Start testing
        setIsTestingPeriodicity(true);
        setIsRunning(false); // Stop normal simulation if running
        setDetectedPeriod(null);
        testingHistoryRef.current = [];
        testGenerationRef.current = generation;
        
        const initialGrid = cloneGrid(grid);
        testingHistoryRef.current.push({ grid: initialGrid, generation: testGenerationRef.current });

        const testNextGeneration = () => {
            const mode = modes[model] || modes.classic;
            const currentGrid = gridRef.current;
            
            // Compute next generation
            const nextGrid = currentGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) =>
                    mode.computeNextState(currentGrid, rowIndex, colIndex, modeParams, testGenerationRef.current)
                )
            );

            testGenerationRef.current += 1;
            const nextGridSnapshot = cloneGrid(nextGrid);

            // Check for periodicity
            for (let i = testingHistoryRef.current.length - 1; i >= 0; i--) {
                const { grid: savedGrid, generation: savedGen } = testingHistoryRef.current[i];
                if (gridsEqual(nextGridSnapshot, savedGrid)) {
                    const period = testGenerationRef.current - savedGen;
                    setDetectedPeriod(period);
                    setIsTestingPeriodicity(false);
                    if (testingIntervalRef.current) {
                        clearInterval(testingIntervalRef.current);
                        testingIntervalRef.current = null;
                    }
                    return;
                }
            }

            // Store snapshot
            testingHistoryRef.current.push({ grid: nextGridSnapshot, generation: testGenerationRef.current });
            if (testingHistoryRef.current.length > maxTestingHistorySize) {
                testingHistoryRef.current.shift();
            }

            // Update grid visually (but don't update generation counter)
            setGridState(nextGrid);

            // Check if we've exceeded a reasonable limit
            if (testGenerationRef.current > maxTestingHistorySize) {
                setIsTestingPeriodicity(false);
                if (testingIntervalRef.current) {
                    clearInterval(testingIntervalRef.current);
                    testingIntervalRef.current = null;
                }
                setDetectedPeriod(null);
            }
        };

        testingIntervalRef.current = setInterval(testNextGeneration, 10); // Fast testing
    }, [isTestingPeriodicity, generation, grid, model, modeParams, cloneGrid]);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => nextGeneration(), speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, speed, grid, model, modeParams]);

    useEffect(() => {
        return () => {
            if (testingIntervalRef.current) {
                clearInterval(testingIntervalRef.current);
            }
        };
    }, []);

    const loadPattern = (pattern, rowOffset, colOffset) => {
        console.log('Loading pattern at:', { rowOffset, colOffset }, pattern);
        if (!pattern || !pattern.cells) {
            console.error('Invalid pattern data:', pattern);
            return;
        }

        const shiftedCells = pattern.cells.map(([row, col]) => [row + rowOffset, col + colOffset]);
        applyGridChange((prevGrid) => {
            const newGrid = prevGrid.map(row => [...row]);
            shiftedCells.forEach(([row, col]) => {
                if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                    newGrid[row][col] = 1;
                }
            });
            return newGrid;
        });
        setGeneration(0);
        setIsRunning(false);
    };

    const loadConfiguration = (config) => {
        console.log('Loading configuration:', config);
        if (!config || !config.cells) {
            console.error('Invalid configuration data:', config);
            return;
        }
        applyGridChange(() => {
            const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
            config.cells.forEach(([row, col]) => {
                if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                    newGrid[row][col] = 1;
                }
            });
            return newGrid;
        });
        setGeneration(0);
        setIsRunning(false);
    };

    const handleLoadConfigurationFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                loadConfiguration(config);
            } catch (error) {
                console.error('Error loading configuration:', error);
                alert(t('alerts.invalidConfigurationFile'));
            }
        };
        reader.readAsText(file);
    };

    const handleControlDragStart = (event) => {
        if (!controlsRef.current || !playAreaRef.current) return;
        const controlRect = controlsRef.current.getBoundingClientRect();
        const parentRect = playAreaRef.current.getBoundingClientRect();
        dragOffsetRef.current = {
            x: event.clientX - controlRect.left,
            y: event.clientY - controlRect.top,
        };
        setControlDragCoords({
            x: controlRect.left - parentRect.left,
            y: controlRect.top - parentRect.top,
        });
        setIsDraggingControls(true);
        document.body.style.userSelect = 'none';
        event.preventDefault();
    };

    useEffect(() => {
        if (!isDraggingControls) {
            document.body.style.userSelect = '';
            return;
        }

        const handleMouseMove = (event) => {
            if (!controlsRef.current || !playAreaRef.current) return;
            const parentRect = playAreaRef.current.getBoundingClientRect();
            const controlRect = controlsRef.current.getBoundingClientRect();

            const maxX = Math.max(0, parentRect.width - controlRect.width);
            const maxY = Math.max(0, parentRect.height - controlRect.height);

            let x = event.clientX - parentRect.left - dragOffsetRef.current.x;
            let y = event.clientY - parentRect.top - dragOffsetRef.current.y;

            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));

            setControlDragCoords({ x, y });
        };

        const handleMouseUp = () => {
            if (controlsRef.current && playAreaRef.current) {
                const parentRect = playAreaRef.current.getBoundingClientRect();
                const controlRect = controlsRef.current.getBoundingClientRect();
                const relativeLeft = controlRect.left - parentRect.left;
                const relativeTop = controlRect.top - parentRect.top;

                const horizontalLimit = Math.max(0, parentRect.width - controlRect.width);
                const verticalLimit = Math.max(0, parentRect.height - controlRect.height);

                const margin = 24;
                const headerOffset = 96;
                const leftX = Math.min(margin, horizontalLimit);
                const rightX = Math.max(horizontalLimit - margin, leftX);
                const topY = Math.min(headerOffset, verticalLimit);
                const bottomY = Math.max(verticalLimit - margin, topY);

                const anchorPoints = {
                    'top-left': { x: leftX, y: topY },
                    'top-right': { x: rightX, y: topY },
                    'bottom-left': { x: leftX, y: bottomY },
                    'bottom-right': { x: rightX, y: bottomY },
                };

                const nearest = Object.entries(anchorPoints).reduce((closest, [key, point]) => {
                    const distance = Math.hypot(relativeLeft - point.x, relativeTop - point.y);
                    if (!closest || distance < closest.distance) {
                        return { key, distance };
                    }
                    return closest;
                }, null);

                const threshold = 80;
                if (nearest && nearest.distance <= threshold) {
                    setControlAnchor(nearest.key);
                    setControlFreePosition(anchorPoints[nearest.key]);
                } else {
                    const clampedX = Math.max(0, Math.min(relativeLeft, horizontalLimit));
                    const clampedY = Math.max(0, Math.min(relativeTop, verticalLimit));
                    setControlAnchor('free');
                    setControlFreePosition({ x: clampedX, y: clampedY });
                    setControlDragCoords({ x: clampedX, y: clampedY });
                }
            }

            setIsDraggingControls(false);
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingControls]);

    const anchorStyles = {
        'top-left': { top: '6rem', left: '1.5rem' },
        'top-right': { top: '6rem', right: '1.5rem' },
        'bottom-left': { bottom: '1.5rem', left: '1.5rem' },
        'bottom-right': { bottom: '1.5rem', right: '1.5rem' },
    };

    const controlContainerStyle = isDraggingControls
        ? { top: `${controlDragCoords.y}px`, left: `${controlDragCoords.x}px`, right: 'auto', bottom: 'auto' }
        : controlAnchor !== 'free'
            ? anchorStyles[controlAnchor]
            : { top: `${controlFreePosition.y}px`, left: `${controlFreePosition.x}px` };

    const patternsForMode = getPatternsForMode(model);

    return (
        <div className="flex h-screen">
            <Menu
                isOpen={isMenuOpen}
                setIsOpen={setIsMenuOpen}
                mode={model}
                patterns={patternsForMode}
                grid={grid}
                loadPattern={loadPattern}
                loadConfiguration={loadConfiguration}
                loadConfigurationFromFile={handleLoadConfigurationFromFile}
                cellPixelSize={cellPixelSize}
            />
            <div className="relative flex flex-1 flex-col bg-gray-900" ref={playAreaRef}>
                <Grid
                    grid={grid}
                        setGrid={applyGridChange}
                    isRunning={isRunning}
                    speed={speed}
                    nextGeneration={nextGeneration}
                    onOffsetChange={setCanvasOffset}
                    onDimensionsChange={setCanvasDimensions}
                    loadPattern={loadPattern}
                    model={model}
                    setModel={setModel}
                    availableModes={availableModes}
                    setIsModeMenuOpen={setIsModeMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    renderCell={modes[model]?.renderCell || modes.classic.renderCell}
                    cellPixelSize={cellPixelSize}
                    onCellPixelSizeChange={setCellPixelSize}
                    generation={generation}
                    debugConfig={debugConfig}
                />
                <div
                    className="pointer-events-none absolute z-30"
                    style={controlContainerStyle}
                >
                    <div ref={controlsRef} className="pointer-events-auto">
                        <Controls
                            isRunning={isRunning}
                            runOrStop={toggleRun}
                            onReset={clearGrid}
                            changeSpeed={changeSpeed}
                            speed={speed}
                            nextGeneration={nextGeneration}
                            generation={generation}
                            onDragHandleMouseDown={handleControlDragStart}
                            isDragging={isDraggingControls}
                            testPeriodicity={testPeriodicity}
                            isTestingPeriodicity={isTestingPeriodicity}
                            detectedPeriod={detectedPeriod}
                        />
                    </div>
                </div>
            </div>
            <ModeMenu
                isOpen={isModeMenuOpen}
                setIsOpen={setIsModeMenuOpen}
                model={model}
                setModel={setModel}
                modeParams={modeParams}
                setModeParams={setModeParams}
            />
        </div>
    );
};

export default App;
