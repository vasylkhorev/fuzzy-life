import React, { useState, useEffect, useRef } from "react";
import "./Grid.css";

const Grid = ({ grid, setGrid}) => {
    const canvasRef = useRef(null); // Ref for the canvas
    const [offset, setOffset] = useState({ x: 0, y: 0 }); // Viewport offset
    const [dragging, setDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);

    const cellSize = 20;

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);


    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            drawGrid(ctx);
        }
    }, [grid, offset, canvasWidth, canvasHeight]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const canvasContainer = canvas.parentElement;
            setCanvasWidth(canvasContainer.offsetWidth);
            setCanvasHeight(canvasContainer.offsetHeight);
        }
    }, [])

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvasWidth; // Set canvas width
            canvas.height = canvasHeight; // Set canvas height
        }
        setGrid(createEmptyGrid(canvasWidth, canvasHeight));
    }, [canvasWidth, canvasHeight]);

    function createEmptyGrid() {
        const cols = Math.ceil(canvasWidth / cellSize);
        const rows = Math.ceil(canvasHeight / cellSize);
        return Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    const drawGrid = (ctx) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas
        ctx.beginPath();

        // Calculate the first visible cell position
        const startCol = Math.floor(offset.x / cellSize);
        const startRow = Math.floor(offset.y / cellSize);

        // Draw only the visible cells based on the offset
        for (let x = startCol; x < startCol + Math.ceil(canvasWidth / cellSize); x++) {
            const xPos = x * cellSize - offset.x;
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvasHeight);
        }
        for (let y = startRow; y < startRow + Math.ceil(canvasHeight / cellSize); y++) {
            const yPos = y * cellSize - offset.y;
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvasWidth, yPos);
        }
        ctx.strokeStyle = "#888";
        ctx.stroke();

        // Draw live cells within the visible area
        for (let row = startRow; row < startRow + Math.ceil(canvasHeight / cellSize); row++) {
            for (let col = startCol; col < startCol + Math.ceil(canvasWidth / cellSize); col++) {
                if (grid[row] && grid[row][col] && grid[row][col]) { // Check if grid[row] is defined
                    ctx.fillStyle = "black";
                    ctx.fillRect(
                        col * cellSize - offset.x,
                        row * cellSize - offset.y,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    };

    const handleMouseDown = (e) => {
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!lastMousePos) return;

        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance > 5 || dragging) {
            setDragging(true);

            setOffset((prev) => ({
                x: prev.x - deltaX,
                y: prev.y - deltaY,
            }));

            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };


    const handleMouseUp = (e) => {
        if (!dragging) {
            toggleCell(e);
        }
        setDragging(false);
        setLastMousePos(null);

    };

    const toggleCell = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor((x + offset.x) / cellSize); // Add offset.x to the position
        const row = Math.floor((y + offset.y) / cellSize); // Add offset.y to the position

        if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
            const newGrid = [...grid];
            newGrid[row][col] = !newGrid[row][col];
            setGrid(newGrid);
        }
    };

    return (
        <div className="app">
            <div className="p-6 bg-gray-800 text-white text-3xl">
                <h1>Conway's Game of Life</h1>
            </div>
            <div className="main-panel">
                <div className="canvas-container">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{
                            cursor: dragging ? "grabbing" : "pointer",
                        }}
                    />
                </div>
            </div>

        </div>
    );
};

export default Grid;
