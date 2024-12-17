import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Info from "./components/Info";
import { GRID_SIZE } from "./config";

const App = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [grid, setGrid] = useState(
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
    );

    const [speed, setSpeed] = useState(500);
    const [generation, setGeneration] = useState(0);

    const changeSpeed = (newSpeed) => {
        setSpeed(newSpeed);
    };

    const toggleRun = () => {
        const wasRunning = isRunning;
        setIsRunning(prev => !prev);
        return wasRunning;
    };


    const clearGrid = () => {
        setGrid(grid.map(() => Array(grid[0].length).fill(false)));
        setIsRunning(false)
    };

    const nextGeneration = () => {
        console.log(grid.length)
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

                if (cell && (liveNeighbors < 2 || liveNeighbors > 3)) {
                    return false; // Dies due to underpopulation or overpopulation
                } else if (!cell && liveNeighbors === 3) {
                    return true; // Reproduces if exactly 3 neighbors
                }
                return cell; // Stays the same
            })
        );
        setGrid(newGrid);

        setGeneration(prevState => prevState + 1);
    };

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                nextGeneration();
            }, speed);
        } else if (!isRunning && interval) {
            clearInterval(interval);
        }

        return () => clearInterval(interval); // Cleanup on component unmount or when isRunning changes
    }, [isRunning, speed, grid]);

    return (
        <div>
            <Grid
                grid={grid}
                setGrid={setGrid}
                isRunning={isRunning}
                speed={speed}
                nextGeneration={nextGeneration}
            />
            <div className="flex flex-row">
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
    );
};

export default App;