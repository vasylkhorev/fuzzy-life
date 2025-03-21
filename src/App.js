import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Info from "./components/Info";
import Menu from './components/Menu';
import { GRID_SIZE } from "./config";
import patterns from './generated-patterns'; // Import patterns from generated module

const App = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [grid, setGrid] = useState(
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
    );
    const [speed, setSpeed] = useState(500);
    const [generation, setGeneration] = useState(0);
    const [isMenuOpen, setIsOpen] = useState(false);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [draggedPattern, setDraggedPattern] = useState(null);

    const changeSpeed = (newSpeed) => setSpeed(newSpeed);
    const toggleRun = () => {
        setIsRunning(prev => !prev);
        return isRunning;
    };
    const clearGrid = () => {
        setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)));
        setIsRunning(false);
        setGeneration(0);
    };

    const nextGeneration = () => {
        const newGrid = grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
                const neighbors = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1], [1, 0], [1, 1]
                ];
                const liveNeighbors = neighbors.reduce((acc, [dx, dy]) => {
                    const neighborRow = rowIndex + dx;
                    const neighborCol = colIndex + dy;
                    if (neighborRow >= 0 && neighborRow < grid.length && neighborCol >= 0 && neighborCol < grid[0].length) {
                        acc += grid[neighborRow][neighborCol] ? 1 : 0;
                    }
                    return acc;
                }, 0);
                if (cell && (liveNeighbors < 2 || liveNeighbors > 3)) return false;
                else if (!cell && liveNeighbors === 3) return true;
                return cell;
            })
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
    }, [isRunning, speed, grid]);

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
                newGrid[row][col] = true;
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
        const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
        config.cells.forEach(([row, col]) => {
            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                newGrid[row][col] = true;
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
                setIsOpen={setIsOpen}
                patterns={patterns}
                grid={grid}
                loadPattern={loadPattern}
                loadConfiguration={loadConfiguration}
                loadConfigurationFromFile={handleLoadConfigurationFromFile}
            />
            <div className="flex-1 flex flex-col">
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
                />
                <div className="flex flex-row p-2">
                    <div className="basis-1/2">
                        <Info
                            isRunning={isRunning}
                            generation={generation}
                            runOrStop={toggleRun}
                            onReset={clearGrid}
                            changeSpeed={changeSpeed}
                            speed={speed}
                            nextGeneration={nextGeneration}
                        />
                    </div>
                    <div className="basis-1/2">
                        <Controls
                            isRunning={isRunning}
                            generation={generation}
                            runOrStop={toggleRun}
                            onReset={clearGrid}
                            changeSpeed={changeSpeed}
                            speed={speed}
                            nextGeneration={nextGeneration}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;