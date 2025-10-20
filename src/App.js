// src/App.js
import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Info from "./components/Info";
import Menu from './components/Menu';
import ModeMenu from './components/ModeMenu';
import { GRID_SIZE } from "./config";
import patterns from './generated-patterns';
import { modes, availableModes, defaultParams, renderCellMap } from './modes';

const App = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [grid, setGrid] = useState(
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
    );
    const [speed, setSpeed] = useState(500);
    const [generation, setGeneration] = useState(0);
    const [model, setModel] = useState('classic');
    const [modeParams, setModeParams] = useState(defaultParams.classic);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setModeParams(defaultParams[model] || {});
    }, [model]);

    const changeSpeed = (newSpeed) => setSpeed(newSpeed);
    const toggleRun = () => setIsRunning(prev => !prev);
    const clearGrid = () => {
        setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
        setIsRunning(false);
        setGeneration(0);
    };

    const nextGeneration = () => {
        const computeNextState = modes[model] || modes.classic;
        const newGrid = grid.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
                computeNextState(grid, rowIndex, colIndex, modeParams, generation)
            )
        );
        setGrid(newGrid);
        setGeneration(prev => prev + 1);
    };

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => nextGeneration(), speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, speed, grid, model, modeParams]);

    const loadPattern = (pattern, rowOffset, colOffset) => {
        console.log('Loading pattern at:', { rowOffset, colOffset }, pattern);
        if (!pattern || !pattern.cells) {
            console.error('Invalid pattern data:', pattern);
            return;
        }

        const shiftedCells = pattern.cells.map(([row, col]) => [row + rowOffset, col + colOffset]);
        const newGrid = grid.map(row => [...row]);
        shiftedCells.forEach(([row, col]) => {
            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                newGrid[row][col] = 1;
            }
        });
        setGrid(newGrid);
        setGeneration(0);
        setIsRunning(false);
    };

    const loadConfiguration = (config) => {
        console.log('Loading configuration:', config);
        if (!config || !config.cells) {
            console.error('Invalid configuration data:', config);
            return;
        }
        const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        config.cells.forEach(([row, col]) => {
            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                newGrid[row][col] = 1;
            }
        });
        setGrid(newGrid);
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
                alert('Invalid configuration file');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex h-screen">
            <Menu
                isOpen={isMenuOpen}
                setIsOpen={setIsMenuOpen}
                patterns={patterns}
                grid={grid}
                loadPattern={loadPattern}
                loadConfiguration={loadConfiguration}
                loadConfigurationFromFile={handleLoadConfigurationFromFile}
            />
            <div className="flex-1 flex flex-col relative">
                <Grid
                    grid={grid}
                    setGrid={setGrid}
                    isRunning={isRunning}
                    speed={speed}
                    nextGeneration={nextGeneration}
                    onOffsetChange={setCanvasOffset}
                    onDimensionsChange={setCanvasDimensions}
                    loadPattern={loadPattern}
                    patterns={patterns}
                    model={model}
                    setModel={setModel}
                    availableModes={availableModes}
                    setIsModeMenuOpen={setIsModeMenuOpen}
                    renderCell={renderCellMap[model]}
                    generation={generation}
                />
                <div className="flex flex-row p-2">
                    <div className="basis-1/2">
                        <Info generation={generation} />
                    </div>
                    <div className="basis-1/2">
                        <Controls
                            isRunning={isRunning}
                            runOrStop={toggleRun}
                            onReset={clearGrid}
                            changeSpeed={changeSpeed}
                            speed={speed}
                            nextGeneration={nextGeneration}
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