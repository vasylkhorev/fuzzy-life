// src/components/Grid1D.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Grid.css";
import { GRID_SIZE, CELL_PIXEL_MAX, CELL_PIXEL_SIZE } from "../config";
import { AiOutlineInfoCircle, AiOutlineSliders, AiOutlineBars } from "react-icons/ai";
import HelpDialog from './HelpDialog';
import { useTranslation } from '../i18n';

const Grid1D = ({ 
    grid, 
    setGrid, 
    isRunning, 
    speed, 
    nextGeneration,
    onOffsetChange, 
    onDimensionsChange, 
    loadPattern, 
    model, 
    setModel, 
    availableModes, 
    setIsModeMenuOpen, 
    setIsMenuOpen, 
    renderCell, 
    generation, 
    debugConfig, 
    cellPixelSize, 
    onCellPixelSizeChange,
    selectedPattern,
    setSelectedPattern
}) => {
    const canvasRef = useRef(null);
    const initialCellSizeRef = useRef(cellPixelSize);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [generationHistory, setGenerationHistory] = useState([]);
    const [startingConfig, setStartingConfig] = useState([]);
    const maxHistoryRows = 100; // Increased for better scrolling experience

    const cellSize = cellPixelSize;
    const { t } = useTranslation();

    const getModeLabel = () => {
        const translationKey = `modes.${model}.label`;
        const translated = t(translationKey);
        if (translated && translated !== translationKey) {
            return translated;
        }
        const fallback = availableModes?.find(({ value }) => value === model)?.label;
        return fallback || model;
    };

    const activeModeLabel = getModeLabel();

    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);

    // Initialize starting configuration and generation history
    useEffect(() => {
        if (startingConfig.length === 0 && grid && grid[0]) {
            setStartingConfig([...grid[0]]);
            setGenerationHistory([]);
        }
    }, []);

    // Update starting configuration when grid changes (only if not running and generation is 0)
    useEffect(() => {
        if (!isRunning && generation === 0 && grid && grid[0]) {
            setStartingConfig([...grid[0]]);
            setGenerationHistory([]);
        }
    }, [grid, isRunning, generation]);

    // Add new generation to history when generation increases
    useEffect(() => {
        if (generation > 0 && grid && grid[0]) {
            setGenerationHistory(prev => {
                const newHistory = [...prev, [...grid[0]]];
                // Keep only the last maxHistoryRows generations
                if (newHistory.length > maxHistoryRows) {
                    return newHistory.slice(-maxHistoryRows);
                }
                return newHistory;
            });
        }
    }, [generation]);

    // Reset when generation is 0 (clear button pressed)
    useEffect(() => {
        if (generation === 0 && grid && grid[0]) {
            setStartingConfig([...grid[0]]);
            setGenerationHistory([]);
        }
    }, [generation]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            console.log("Drawing grid:", { 
                canvasWidth, 
                canvasHeight, 
                generationHistoryLength: generationHistory.length,
                totalRows: generationHistory.length + 2,
                totalHeight: (generationHistory.length + 2) * cellSize,
                offset
            });
            drawGrid1D(ctx);
        }
    }, [grid, offset, canvasWidth, canvasHeight, renderCell, generation, debugConfig, cellSize, generationHistory, startingConfig]);

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

            console.log("Canvas setup:", { width, height, cellSize });

            const baseCellSize = initialCellSizeRef.current || cellSize;
            const sidePanelWidth = 50; // Match the side panel width
            const gridWidth = GRID_SIZE * baseCellSize;
            const totalWidth = sidePanelWidth + gridWidth;
            
            const centerGridX = (GRID_SIZE / 2) * baseCellSize + sidePanelWidth;
            const centerCanvasX = width / 2;

            const newOffset = {
                x: centerGridX - centerCanvasX,
                y: 0, // Start at top for 1D grid
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

        if (width) {
            const sidePanelWidth = 50; // Match the side panel width
            const centerGridX = (GRID_SIZE / 2) * baseCellSize + sidePanelWidth;
            const centerCanvasX = width / 2;

            const newOffset = {
                x: centerGridX - centerCanvasX,
                y: 0, // Reset vertical offset to top
            };
            setOffset(newOffset);
            if (onOffsetChange) {
                onOffsetChange(newOffset);
            }
        }

        onCellPixelSizeChange(baseCellSize);
    }, [canvasWidth, onCellPixelSizeChange, onOffsetChange]);

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

    const getCanvasRelativePosition = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return null;
        }
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const relativeToCellCoords = (relX, relY) => {
        return {
            col: Math.floor((relX + offset.x) / cellSize),
            row: Math.floor(relY / cellSize), // No offset for Y in 1D mode
        };
    };

    const drawGrid1D = (ctx) => {
        // Clear the entire canvas first
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const rawStartCol = Math.floor(offset.x / cellSize);
        const rawStartRow = Math.floor(offset.y / cellSize);
        const visibleCols = Math.ceil(canvasWidth / cellSize) + 2;
        const visibleRows = Math.ceil(canvasHeight / cellSize) + 2;

        const colStart = Math.max(0, rawStartCol);
        const rowStart = Math.max(0, rawStartRow);
        const colEnd = Math.min(GRID_SIZE, Math.max(0, rawStartCol + visibleCols));

        // Define side panel width for row numbers
        const sidePanelWidth = 50;
        const boardPixelWidth = GRID_SIZE * cellSize;
        const boardOriginX = sidePanelWidth - offset.x;
        const boardOriginY = -offset.y;

        ctx.save();

        // Draw side panel background for row numbers (outside clipping region)
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, sidePanelWidth, canvasHeight);
        
        // Draw border between side panel and grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sidePanelWidth, 0);
        ctx.lineTo(sidePanelWidth, canvasHeight);
        ctx.stroke();

        // Create clipping region to prevent grid from rendering over side panel
        ctx.beginPath();
        ctx.rect(sidePanelWidth, 0, canvasWidth - sidePanelWidth, canvasHeight);
        ctx.clip();

        // Simple cell rendering function that matches default style with highlighting
        const drawCell = (x, y, val) => {
            if (val >= 0.5) {
                // Fill black cell
                ctx.fillStyle = "black";
                ctx.fillRect(x, y, cellSize, cellSize);
                
                // Add white highlight/border to make it stand out from grid
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
            }
        };

        // Calculate total rows (config row + generation rows + padding)
        const totalRows = generationHistory.length + 1;
        const totalHeight = totalRows * cellSize;
        const bottomPadding = canvasHeight / 2; // Add half page of padding at bottom

        // Draw background for configuration row only if visible
        if (rowStart <= 0) {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(boardOriginX, boardOriginY, boardPixelWidth, cellSize);
            
            // Draw label for configuration row
            ctx.fillStyle = '#374151';
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText("STARTING CONFIGURATION", boardOriginX + 5, boardOriginY + cellSize/2);
        }

        // Draw all grid lines first (like regular grid)
        ctx.beginPath();
        // Vertical lines - only draw through the content area, not padding
        for (let col = colStart; col <= colEnd; col++) {
            const xPos = col * cellSize - offset.x + sidePanelWidth;
            const startY = Math.max(boardOriginY, 0);
            const endY = Math.min(boardOriginY + totalHeight, canvasHeight);
            ctx.moveTo(xPos, startY);
            ctx.lineTo(xPos, endY);
        }
        // Horizontal lines - only draw for actual content rows, not padding
        for (let row = Math.max(0, rowStart); row <= Math.min(totalRows, rowStart + visibleRows); row++) {
            const yPos = row * cellSize - offset.y;
            if (yPos >= 0 && yPos <= canvasHeight) {
                ctx.moveTo(sidePanelWidth, yPos);
                ctx.lineTo(Math.min(sidePanelWidth + boardPixelWidth, canvasWidth), yPos);
            }
        }
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw cells on top of grid lines (like regular grid)
        // Draw starting configuration cells (static, never changes)
        if (rowStart <= 0) { // Only draw if config row is visible
            for (let col = colStart; col < colEnd; col++) {
                const cellX = col * cellSize - offset.x + sidePanelWidth;
                const val = startingConfig[col] || 0;

                drawCell(cellX, boardOriginY, val);
            }
        }

        // Draw generation history
        generationHistory.forEach((genRow, genIndex) => {
            const currentRow = genIndex + 1; // +1 because: row 0 is config
            const rowY = currentRow * cellSize - offset.y;
            
            // Only draw if this row is visible and within canvas bounds
            if (currentRow >= rowStart && currentRow <= rowStart + visibleRows && rowY >= -cellSize && rowY <= canvasHeight) {
                // Draw generation number at the right edge of visible viewport
                ctx.fillStyle = "#6b7280";
                ctx.font = "10px monospace";
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(`Gen ${genIndex + 1}`, canvasWidth - 5, rowY + cellSize/2);

                // Draw cells for this generation
                for (let col = colStart; col < colEnd; col++) {
                    const cellX = col * cellSize - offset.x + sidePanelWidth;
                    const val = genRow[col];

                    drawCell(cellX, rowY, val);
                }
            }
        });

        // Draw outer border only for the content area, but without bottom line
        if (totalHeight > 0) {
            const borderY = Math.max(boardOriginY, 0);
            const borderHeight = Math.min(totalHeight, canvasHeight - borderY);
            if (borderHeight > 0) {
                ctx.strokeStyle = "rgba(71, 85, 105, 0.6)";
                ctx.lineWidth = 2;
                
                // Draw left, top, and right borders only (no bottom)
                ctx.beginPath();
                // Left border (start of grid area, after side panel)
                ctx.moveTo(sidePanelWidth, borderY);
                ctx.lineTo(sidePanelWidth, borderY + borderHeight);
                // Top border
                ctx.moveTo(sidePanelWidth, borderY);
                ctx.lineTo(Math.min(sidePanelWidth + boardPixelWidth, canvasWidth), borderY);
                // Right border
                ctx.moveTo(Math.min(sidePanelWidth + boardPixelWidth, canvasWidth), borderY);
                ctx.lineTo(Math.min(sidePanelWidth + boardPixelWidth, canvasWidth), borderY + borderHeight);
                
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        }

        ctx.restore();

        // Draw row numbers outside clipping region to ensure they're always visible
        // Draw row number for configuration row
        if (rowStart <= 0) {
            ctx.fillStyle = "#1f2937"; // Darker, more visible color
            ctx.font = "bold 12px monospace"; // Slightly larger and bold
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("0", sidePanelWidth / 2, boardOriginY + cellSize/2);
        }

        // Draw row numbers for generation history
        generationHistory.forEach((genRow, genIndex) => {
            const currentRow = genIndex + 1; // +1 because: row 0 is config
            const rowY = currentRow * cellSize - offset.y;
            
            // Only draw if this row is visible and within canvas bounds
            if (currentRow >= rowStart && currentRow <= rowStart + visibleRows && rowY >= -cellSize && rowY <= canvasHeight) {
                // Draw row number in side panel
                ctx.fillStyle = "#1f2937"; // Darker, more visible color
                ctx.font = "bold 12px monospace"; // Slightly larger and bold
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(currentRow.toString(), sidePanelWidth / 2, rowY + cellSize/2);
            }
        });
    };

    const handleMouseDown = (e) => {
        console.log("Mouse down at:", { x: e.clientX, y: e.clientY });
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!lastMousePos) return;

        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        // Lower the threshold and always allow dragging if there's any movement
        if (distance > 2 || dragging) {
            setDragging(true);
            setOffset((prev) => {
                // Calculate total content height including padding
                const totalRows = generationHistory.length + 2;
                const totalHeight = totalRows * cellSize;
                const bottomPadding = canvasHeight / 2; // Add half page of padding at bottom
                const contentHeight = totalHeight + bottomPadding;
                
                // Allow scrolling if content is taller than canvas
                const maxScrollY = Math.max(0, contentHeight - canvasHeight);

                const newOffset = {
                    x: prev.x - deltaX,
                    y: Math.max(0, Math.min(prev.y - deltaY, maxScrollY)),
                };
                
                console.log("Scrolling:", { 
                    deltaY, 
                    prevY: prev.y, 
                    newY: newOffset.y, 
                    totalHeight, 
                    contentHeight,
                    canvasHeight, 
                    maxScrollY,
                    dragging
                });
                
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
        // Allow regular wheel scrolling for vertical, Alt+wheel for zoom
        if (!e.altKey) {
            // Vertical scrolling
            e.preventDefault();
            
            const delta = e.deltaY;
            const scrollAmount = delta * 0.5; // Adjust scroll speed
            
            setOffset((prev) => {
                // Calculate total content height including padding
                const totalRows = generationHistory.length + 2;
                const totalHeight = totalRows * cellSize;
                const bottomPadding = canvasHeight / 2; // Add half page of padding at bottom
                const contentHeight = totalHeight + bottomPadding;
                
                // Allow scrolling if content is taller than canvas
                const maxScrollY = Math.max(0, contentHeight - canvasHeight);

                const newOffset = {
                    x: prev.x,
                    y: Math.max(0, Math.min(prev.y + scrollAmount, maxScrollY)),
                };
                
                console.log("Wheel scrolling:", { 
                    delta, 
                    scrollAmount, 
                    prevY: prev.y, 
                    newY: newOffset.y, 
                    totalHeight, 
                    contentHeight,
                    canvasHeight, 
                    maxScrollY 
                });
                
                if (onOffsetChange) {
                    onOffsetChange(newOffset);
                }
                return newOffset;
            });
            return;
        }

        // Alt+wheel for zooming (existing functionality)
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

        const sidePanelWidth = 50; // Match the side panel width
        const worldCellX = (offset.x + pointerX - sidePanelWidth) / cellSize;
        const worldCellY = (offset.y + pointerY) / cellSize;

        const newOffset = {
            x: worldCellX * newSize - pointerX + sidePanelWidth,
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

        // Account for side panel width
        const sidePanelWidth = 50;
        if (x < sidePanelWidth) return; // Click was in side panel, not grid

        const col = Math.floor((x + offset.x - sidePanelWidth) / cellSize);
        const row = Math.floor((y + offset.y) / cellSize); // Account for vertical offset
        
        console.log("Click detected:", { x, y, col, row, isRunning });
        
        // Only allow clicking on the configuration row (row 0) when not running
        if (row === 0 && !isRunning && col >= 0 && col < GRID_SIZE) {
            const currentVal = startingConfig[col] || 0;
            const newVal = currentVal >= 0.5 ? 0 : 1;

            console.log("Toggling cell:", { col, currentVal, newVal });

            // Update starting configuration
            const newStartingConfig = [...startingConfig];
            newStartingConfig[col] = newVal;
            setStartingConfig(newStartingConfig);

            // Also update the actual grid to reflect the change
            const newGrid = grid.map((rowArray, rIdx) => {
                if (rIdx === 0) {
                    const newRow = [...rowArray];
                    newRow[col] = newVal;
                    return newRow;
                }
                return rowArray;
            });
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
            const sidePanelWidth = 50;
            
            const rows = Math.max(...pattern.cells.map(cell => {
                if (Array.isArray(cell)) return cell[0];
                return cell.r !== undefined ? cell.r : cell.row;
            })) + 1;
            const cols = Math.max(...pattern.cells.map(cell => {
                if (Array.isArray(cell)) return cell[1];
                return cell.c !== undefined ? cell.c : cell.col;
            })) + 1;

            const centerX = (cols * cellSize) / 2;
            const centerY = (rows * cellSize) / 2;

            // Calculate position relative to canvas, then adjust for side panel visual offset
            const x = e.clientX - rect.left - centerX;
            const y = e.clientY - rect.top - centerY;

            // Adjust for the fact that grid is visually offset by sidePanelWidth
            const colOffset = Math.round((x + offset.x - sidePanelWidth) / cellSize);
            const rowOffset = Math.round((y + offset.y) / cellSize);

            loadPattern(pattern, rowOffset, colOffset);

            const preview = document.querySelector('.drag-preview');
            if (preview) {
                document.body.removeChild(preview);
            }
        }
    };

    const handleDragEnd = () => {
        const preview = document.querySelector('.drag-preview');
        if (preview && preview.parentNode) {
            preview.parentNode.removeChild(preview);
        }
        console.log("Drag ended - preview cleaned up");
    };

    return (
        <div className="app h-full bg-gray-900 text-white">
            <div className="relative flex items-center justify-center border-b border-gray-700 bg-gray-800/95 px-5 py-3 text-lg font-semibold">
                <div className="absolute left-4 flex items-center space-x-2">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium"
                        title={t('grid.libraryButtonTitle')}
                        aria-label={t('grid.libraryButtonTitle')}
                    >
                        <AiOutlineBars size={16} />
                        <span className="hidden sm:inline">{t('grid.libraryButton')}</span>
                    </button>
                </div>
                <div className="flex flex-col items-center text-sm sm:text-base leading-tight space-y-1">
                    <h1 className="text-gray-100 text-lg sm:text-xl font-semibold leading-none">1D Cellular Automaton</h1>
                </div>
                <div className="absolute right-4 flex items-center space-x-2">
                    <div className="flex items-center space-x-2 rounded-full bg-gray-700/90 px-3 py-1 text-[11px] sm:text-xs font-semibold text-gray-100 shadow">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                        <span className="whitespace-nowrap">{t('grid.activeMode', { mode: activeModeLabel })}</span>
                    </div>
                    <button
                        onClick={() => setIsModeMenuOpen(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium transition"
                        title={t('grid.modesButtonTitle')}
                        aria-label={t('grid.modesButtonTitle')}
                    >
                        <AiOutlineSliders size={16} />
                        <span className="hidden sm:inline">{t('grid.modesButton')}</span>
                    </button>
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="p-2 rounded bg-gray-700 hover:bg-gray-500 transition flex items-center justify-center"
                        title={t('grid.helpButtonTitle')}
                        aria-label={t('grid.helpButtonTitle')}
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

export default Grid1D;
