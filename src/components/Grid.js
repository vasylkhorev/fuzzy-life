// src/components/Grid.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Grid.css";
import { GRID_SIZE, CELL_PIXEL_MAX, CELL_PIXEL_SIZE } from "../config";
import { AiOutlineInfoCircle, AiOutlineSliders, AiOutlineBars } from "react-icons/ai";
import HelpDialog from './HelpDialog';
import Popover from './Popover';

const Grid = ({ grid, setGrid, onOffsetChange, onDimensionsChange, loadPattern, model, setModel, availableModes, setIsModeMenuOpen, setIsMenuOpen, patterns, renderCell, generation, debugConfig, cellPixelSize, onCellPixelSizeChange }) => {
    const canvasRef = useRef(null);
    const initialCellSizeRef = useRef(cellPixelSize);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const cellSize = cellPixelSize;

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            drawGrid(ctx);
        }
    }, [grid, offset, canvasWidth, canvasHeight, renderCell, generation, debugConfig, cellSize]);

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

            const baseCellSize = initialCellSizeRef.current || cellSize;
            const centerGridX = (GRID_SIZE / 2) * baseCellSize;
            const centerGridY = (GRID_SIZE / 2) * baseCellSize;
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

    const resetZoomToDefault = useCallback(() => {
        if (!onCellPixelSizeChange) {
            return;
        }
        const baseCellSize = initialCellSizeRef.current || CELL_PIXEL_SIZE;
        const width = canvasWidth;
        const height = canvasHeight;

        if (width && height) {
            const centerGridX = (GRID_SIZE / 2) * baseCellSize;
            const centerGridY = (GRID_SIZE / 2) * baseCellSize;
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

        onCellPixelSizeChange(baseCellSize);
    }, [canvasWidth, canvasHeight, onCellPixelSizeChange, onOffsetChange]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Alt") {
                event.preventDefault();
            }

            if (!event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            const isZeroKey = event.key === "0" || event.code === "Digit0" || event.keyCode === 48;
            if (isZeroKey) {
                event.preventDefault();
                resetZoomToDefault();
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === "Alt") {
                event.preventDefault();
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keyup", handleKeyUp, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keyup", handleKeyUp, true);
        };
    }, [resetZoomToDefault]);

    const drawGrid = (ctx) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        const showCoordinates = Boolean(debugConfig?.enabled && debugConfig?.overlays?.showCellCoordinates);

        const rawStartCol = Math.floor(offset.x / cellSize);
        const rawStartRow = Math.floor(offset.y / cellSize);
        const visibleCols = Math.ceil(canvasWidth / cellSize) + 2;
        const visibleRows = Math.ceil(canvasHeight / cellSize) + 2;

        const colStart = Math.max(0, rawStartCol);
        const rowStart = Math.max(0, rawStartRow);
        const colEnd = Math.min(GRID_SIZE, Math.max(0, rawStartCol + visibleCols));
        const rowEnd = Math.min(GRID_SIZE, Math.max(0, rawStartRow + visibleRows));
        // Skip rendering work for cells outside the finite board.

        const boardPixelWidth = GRID_SIZE * cellSize;
        const boardPixelHeight = GRID_SIZE * cellSize;
        const boardOriginX = -offset.x;
        const boardOriginY = -offset.y;

        ctx.save();

        const drawCells = () => {
            if (rowStart >= rowEnd || colStart >= colEnd) {
                return;
            }

            if (showCoordinates) {
                ctx.font = "8px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
            }

            for (let row = rowStart; row < rowEnd; row++) {
                const rowData = grid[row];
                if (!rowData) {
                    continue;
                }
                const cellY = row * cellSize - offset.y;

                for (let col = colStart; col < colEnd; col++) {
                    const cellX = col * cellSize - offset.x;
                    const val = rowData[col] ?? 0;

                    renderCell(ctx, cellX, cellY, val, cellSize, generation);

                    if (showCoordinates) {
                        ctx.fillStyle = "#4b5563";
                        const xPos = cellX + cellSize / 2;
                        const yPosTop = cellY + cellSize / 3;
                        const yPosBottom = cellY + (2 * cellSize) / 3;

                        ctx.fillText(`${row}`, xPos, yPosTop);
                        ctx.fillText(`${col}`, xPos, yPosBottom);
                    }
                }
            }
        };

        const drawLines = () => {
            ctx.beginPath();
            for (let col = colStart; col <= colEnd; col++) {
                const xPos = col * cellSize - offset.x;
                ctx.moveTo(xPos, boardOriginY);
                ctx.lineTo(xPos, boardOriginY + boardPixelHeight);
            }
            for (let row = rowStart; row <= rowEnd; row++) {
                const yPos = row * cellSize - offset.y;
                ctx.moveTo(boardOriginX, yPos);
                ctx.lineTo(boardOriginX + boardPixelWidth, yPos);
            }
            ctx.strokeStyle = "#e5e7eb";
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const drawOutline = () => {
            ctx.strokeStyle = "rgba(71, 85, 105, 0.6)";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                boardOriginX,
                boardOriginY,
                boardPixelWidth,
                boardPixelHeight
            );
            ctx.lineWidth = 1;
        };

        ctx.save();
        ctx.save();
        ctx.beginPath();
        ctx.rect(boardOriginX, boardOriginY, boardPixelWidth, boardPixelHeight);
        ctx.clip();

        drawCells();
        drawLines();
        ctx.restore();
        drawOutline();
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

    const handleWheel = (e) => {
        if (!e.altKey) {
            return;
        }

        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas || !onCellPixelSizeChange) {
            return;
        }

        const delta = e.deltaY;
        const zoomFactor = delta > 0 ? 0.9 : 1.1;
        const zoomedSize = cellSize * zoomFactor;

        const minCellSize = 0.25;
        let newSize = Math.max(minCellSize, Math.min(CELL_PIXEL_MAX, zoomedSize));

        if (newSize === cellSize) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;

        const worldCellX = (offset.x + pointerX) / cellSize;
        const worldCellY = (offset.y + pointerY) / cellSize;

        const newOffset = {
            x: worldCellX * newSize - pointerX,
            y: worldCellY * newSize - pointerY,
        };

        setOffset(newOffset);
        if (onOffsetChange) {
            onOffsetChange(newOffset);
        }
        onCellPixelSizeChange(newSize);
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
            const centerX = parseFloat(preview.dataset.centerX) || 0;
            const centerY = parseFloat(preview.dataset.centerY) || 0;
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
        <div className="app h-full bg-gray-900 text-white">
            <div className="relative flex items-center justify-center border-b border-gray-700 bg-gray-800/95 px-6 py-4 text-2xl font-semibold">
                <div className="absolute left-4 flex items-center space-x-2">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium"
                        title="Patterns & Configurations"
                    >
                        <AiOutlineBars size={16} />
                        <span className="hidden sm:inline">Library</span>
                    </button>
                </div>
                <h1 className="text-center uppercase text-gray-100">Conway's Game of Life</h1>
                <div className="absolute right-4 flex items-center space-x-2">
                    {/* Modes menu toggle */}
                    <button
                        onClick={() => setIsModeMenuOpen(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium"
                        title="Modes Panel"
                    >
                        <AiOutlineSliders size={16} />
                        <span className="hidden sm:inline">Modes</span>
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
                        onWheel={handleWheel}
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
