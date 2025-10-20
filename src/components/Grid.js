// src/components/Grid.js
import React, { useState, useEffect, useRef } from "react";
import "./Grid.css";
import { GRID_SIZE } from "../config";
import { AiOutlineInfoCircle, AiOutlineBars } from "react-icons/ai";
import HelpDialog from './HelpDialog';
import Popover from './Popover';

const Grid = ({ grid, setGrid, onOffsetChange, onDimensionsChange, loadPattern, model, setModel, availableModes, setIsModeMenuOpen, patterns, renderCell, generation }) => {
    const canvasRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const cellSize = 20;

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            drawGrid(ctx);
        }
    }, [grid, offset, canvasWidth, canvasHeight, renderCell, generation]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const canvasContainer = canvas.parentElement;
            const width = canvasContainer.offsetWidth;
            const height = canvasContainer.offsetHeight;
            setCanvasWidth(width);
            setCanvasHeight(height);
            canvas.width = width;
            canvas.height = height;
            if (onDimensionsChange) {
                onDimensionsChange({ width, height });
            }
            console.log("Canvas dimensions set:", { width, height });

            const centerGridX = (GRID_SIZE / 2) * cellSize;
            const centerGridY = (GRID_SIZE / 2) * cellSize;
            const centerCanvasX = width / 2;
            const centerCanvasY = height / 2;

            const newOffset = {
                x: centerGridX - centerCanvasX,
                y: centerGridY - centerCanvasY,
            };
            setOffset(newOffset);
            if (onOffsetChange) {
                onOffsetChange(newOffset);
            }
        }
    }, [onDimensionsChange, onOffsetChange]);

    const drawGrid = (ctx) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.beginPath();

        const startCol = Math.floor(offset.x / cellSize);
        const startRow = Math.floor(offset.y / cellSize);

        for (let x = startCol; x < startCol + Math.ceil(canvasWidth / cellSize) + 1; x++) {
            const xPos = x * cellSize - offset.x;
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvasHeight);
        }
        for (let y = startRow; y < startRow + Math.ceil(canvasHeight / cellSize) + 1; y++) {
            const yPos = y * cellSize - offset.y;
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvasWidth, yPos);
        }
        ctx.strokeStyle = "#888";
        ctx.stroke();

        for (let row = startRow; row < startRow + Math.ceil(canvasHeight / cellSize) + 1; row++) {
            for (let col = startCol; col < startCol + Math.ceil(canvasWidth / cellSize) + 1; col++) {
                if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && grid[row]) {
                    const val = grid[row][col];
                    const x = col * cellSize - offset.x;
                    const y = row * cellSize - offset.y;
                    renderCell(ctx, x, y, val, cellSize, generation);
                }

                // Always stroke the grid line
                ctx.strokeStyle = "gray";
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    col * cellSize - offset.x,
                    row * cellSize - offset.y,
                    cellSize,
                    cellSize
                );

                // Coordinates text (always white on black/gray)
                ctx.fillStyle = "white";
                ctx.font = "8px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const xPos = col * cellSize - offset.x + cellSize / 2;
                const yPosTop = row * cellSize - offset.y + cellSize / 3;
                const yPosBottom = row * cellSize - offset.y + (2 * cellSize) / 3;

                ctx.fillText(`${row}`, xPos, yPosTop);
                ctx.fillText(`${col}`, xPos, yPosBottom);
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
            setOffset((prev) => {
                const newOffset = {
                    x: prev.x - deltaX,
                    y: prev.y - deltaY,
                };
                if (onOffsetChange) {
                    onOffsetChange(newOffset);
                }
                return newOffset;
            });
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

        const col = Math.floor((x + offset.x) / cellSize);
        const row = Math.floor((y + offset.y) / cellSize);
        console.log("Clicked cell: ", `[${row}, ${col}]`);
        if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
            const currentVal = grid[row][col];
            let newVal = 0;
            if (model === 'classic') {
                newVal = currentVal >= 0.5 ? 0 : 1;
            } else {
                newVal = currentVal > 0 ? 0 : 0.875; // Toggle to/from high quartile
            }
            const newGrid = grid.map((rowArray, rIdx) =>
                rowArray.map((cell, cIdx) => (rIdx === row && cIdx === col ? newVal : cell))
            );
            setGrid(newGrid);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const preview = document.querySelector('.drag-preview');
        if (preview) {
            const centerX = parseFloat(preview.dataset.centerX);
            const centerY = parseFloat(preview.dataset.centerY);
            preview.style.left = `${e.pageX - centerX}px`;
            preview.style.top = `${e.pageY - centerY}px`;
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const patternData = e.dataTransfer.getData('application/json');
        if (patternData) {
            const pattern = JSON.parse(patternData);
            const rect = canvasRef.current.getBoundingClientRect();
            const preview = document.querySelector('.drag-preview');

            const rows = Math.max(...pattern.cells.map(([row]) => row)) + 1;
            const cols = Math.max(...pattern.cells.map(([, col]) => col)) + 1;

            const centerX = (cols * cellSize) / 2;
            const centerY = (rows * cellSize) / 2;

            const x = e.clientX - rect.left - centerX;
            const y = e.clientY - rect.top - centerY;

            const colOffset = Math.round((x + offset.x) / cellSize);
            const rowOffset = Math.round((y + offset.y) / cellSize);

            loadPattern(pattern, rowOffset, colOffset);

            if (preview) {
                document.body.removeChild(preview);
            }
        }
    };

    const handleDragEnd = () => {
        const preview = document.querySelector('.drag-preview');
        if (preview) {
            document.body.removeChild(preview);
        }
        console.log("Drag ended");
    };

    return (
        <div className="app">
            <div className="p-6 bg-gray-800 text-white text-3xl flex items-center justify-center relative">
                <h1 className="text-center">Conway's Game of Life</h1>
                <div className="absolute right-4 flex items-center space-x-2">
                    {/* Modes Ham Menu Toggle */}
                    <button
                        onClick={() => setIsModeMenuOpen(true)}
                        className="p-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center justify-center"
                        title="Modes Panel"
                    >
                        <AiOutlineBars size={16} />
                    </button>
                    {/* Help */}
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="p-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center justify-center"
                        title="How to Use"
                    >
                        <AiOutlineInfoCircle size={20} />
                    </button>
                </div>
            </div>
            <div className="main-panel">
                <div
                    className="canvas-container"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                >
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
            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
};

export default Grid;