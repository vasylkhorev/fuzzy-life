import React, { useState, useEffect, useRef } from "react";
import "./Grid.css";

const Grid = () => {
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
    const [dragDistance, setDragDistance] = useState(0); // Track drag distance to distinguish from clicks

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
                ctx.fillStyle = grid[r][c] ? "black" : "white"; // Alive cells are black
                ctx.fill();
                ctx.strokeStyle = "gray";
                ctx.stroke();
            }
        }
    };

    // Toggle cell state on click
    const toggleCell = (e) => {
        // Only toggle if not dragging and the mouse didn't move significantly
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Get mouse position relative to the canvas (without offset)
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Now, use the cell size and offset to calculate the clicked cell
        const col = Math.floor((x - offset.x) / cellSize);
        const row = Math.floor((y - offset.y) / cellSize);

        // Toggle the cell state
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
        setDragDistance(0); // Reset drag distance on mouse down
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            // Calculate the difference between the current mouse position and the previous dragStart position
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            // Update the offset based on the difference
            setOffset((prevOffset) => ({
                x: prevOffset.x + dx,
                y: prevOffset.y + dy,
            }));

            // Update dragStart to the new mouse position (for the next move)
            setDragStart({ x: e.clientX, y: e.clientY });

            // Calculate the distance moved from the last dragStart
            const distance = Math.sqrt(dx * dx + dy * dy);
            setDragDistance(dragDistance + distance);
        }
    };


    const handleMouseUp = (e) => {
        // Only toggle cell if not dragging

        if (dragDistance < 5) {
            toggleCell(e);
        }
        setIsDragging(false);
        setDragDistance(0);
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
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    style={{ cursor: isDragging ? "move" : "pointer" }} // Move cursor for dragging, pointer for clicking
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

export default Grid;