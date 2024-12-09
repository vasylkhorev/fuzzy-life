import React, { useState, useEffect, useRef } from "react";
import "../App.css";

const App = () => {
    const canvasRef = useRef(null); // Ref for the canvas
    const [isRunning, setIsRunning] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [speed, setSpeed] = useState(500); // Speed of the game
    const gridSize = { rows: 100, cols: 100 }; // Grid size
    const cellSize = 20; // Size of each cell in the canvas

    // Canvas viewport size (80% of screen width)
    const canvasWidth = window.innerWidth * 0.8;
    const canvasHeight = window.innerHeight * 0.5;

    // Create the initial grid state (2D array of false values)
    const createGrid = () => {
        const grid = [];
        for (let r = 0; r < gridSize.rows; r++) {
            const row = [];
            for (let c = 0; c < gridSize.cols; c++) {
                row.push(false); // Each cell is dead initially
            }
            grid.push(row);
        }
        return grid;
    };

    const [grid, setGrid] = useState(createGrid());
    const [offset, setOffset] = useState({ x: 0, y: 0 }); // To track the viewport offset
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Draw the grid on the canvas
    const drawGrid = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        for (let r = 0; r < gridSize.rows; r++) {
            for (let c = 0; c < gridSize.cols; c++) {
                const x = (c * cellSize) + offset.x;
                const y = (r * cellSize) + offset.y;
                ctx.beginPath();
                ctx.rect(x, y, cellSize, cellSize);
                ctx.fillStyle = grid[r][c] ? "yellow" : "white"; // Alive cells are yellow
                ctx.fill();
                ctx.strokeStyle = "gray";
                ctx.stroke();
            }
        }
    };

    // Toggle cell state on click
    const toggleCell = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + offset.x;
        const y = e.clientY - rect.top + offset.y;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        const newGrid = grid.map((r, rIdx) =>
            rIdx === row
                ? r.map((c, cIdx) => (cIdx === col ? !c : c))
                : r
        );
        setGrid(newGrid);
    };

    // Run the game logic
    const runGame = () => {
        if (isRunning) {
            clearInterval(intervalId);
        }

        const newIntervalId = setInterval(() => {
            setGrid((prevGrid) => {
                const newGrid = prevGrid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                        // Count live neighbors
                        let liveNeighbors = 0;
                        for (let i = -1; i <= 1; i++) {
                            for (let j = -1; j <= 1; j++) {
                                if (i === 0 && j === 0) continue;
                                const ni = rIdx + i;
                                const nj = cIdx + j;
                                if (ni >= 0 && nj >= 0 && ni < gridSize.rows && nj < gridSize.cols) {
                                    liveNeighbors += prevGrid[ni][nj] ? 1 : 0;
                                }
                            }
                        }

                        // Apply Conway's rules
                        if (cell && (liveNeighbors < 2 || liveNeighbors > 3)) return false;
                        if (!cell && liveNeighbors === 3) return true;
                        return cell;
                    })
                );
                return newGrid;
            });
        }, speed);

        setIsRunning(true);
        setIntervalId(newIntervalId);
    };

    // Stop the game
    const stopGame = () => {
        clearInterval(intervalId);
        setIsRunning(false);
    };

    // Adjust the speed of the game
    const changeSpeed = (e) => {
        setSpeed(e.target.value);
        if (isRunning) {
            clearInterval(intervalId);
            runGame();
        }
    };

    // Handle drag start and move
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setOffset((prevOffset) => ({
                x: prevOffset.x + dx,
                y: prevOffset.y + dy,
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Run the draw function after grid update
    useEffect(() => {
        drawGrid();
    }, [grid, offset]);

    return (
        <div className="app">
            <div className="header">
                <h1>Conway's Game of Life</h1>
            </div>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onClick={toggleCell}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ cursor: "move" }}
            />
            <div className="controls">
                <button onClick={isRunning ? stopGame : runGame}>
                    {isRunning ? "Stop" : "Start"}
                </button>
                <button onClick={() => setGrid(createGrid())}>Clear</button>
                <label>
                    Speed:
                    <input
                        type="range"
                        min="100"
                        max="1000"
                        value={speed}
                        onChange={changeSpeed}
                    />
                </label>
            </div>
        </div>
    );
};

export default App;
