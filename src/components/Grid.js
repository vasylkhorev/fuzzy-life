// src/components/Grid.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Grid.css";
import { GRID_SIZE, CELL_PIXEL_MAX, CELL_PIXEL_SIZE } from "../config";
import { AiOutlineInfoCircle, AiOutlineSliders, AiOutlineBars, AiOutlineExperiment } from "react-icons/ai";
import HelpDialog from './HelpDialog';
import { useTranslation } from '../i18n';
import { modes } from '../modes';

const Grid = ({ grid, setGrid, onOffsetChange, onDimensionsChange, loadPattern, model, setModel, availableModes, setIsModeMenuOpen, setIsMenuOpen, onOpenPatternSearch, renderCell, generation, debugConfig, cellPixelSize, onCellPixelSizeChange, pasteGhost, clearPasteGhost }) => {
    const canvasRef = useRef(null);
    const initialCellSizeRef = useRef(cellPixelSize);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSelectingRegion, setIsSelectingRegion] = useState(false);
    const [selectionRect, setSelectionRect] = useState(null);

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

    // Handle paste ghost preview rendering
    useEffect(() => {
        if (!pasteGhost) {
            const existing = document.querySelector('.paste-preview');
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
            return;
        }

        const currentMode = modes[model] || modes.classic;
        let parsedCells = [];

        // Support both raw configuration coordinates and canonical matrix shapes
        if (pasteGhost.cells) {
            parsedCells = currentMode.parseCells(pasteGhost.cells);
        } else if (pasteGhost.canonicalPattern || pasteGhost.initialPattern) {
            const pat2D = pasteGhost.canonicalPattern || pasteGhost.initialPattern;
            for (let r = 0; r < pat2D.length; r++) {
                for (let c = 0; c < (pat2D[r]?.length || 0); c++) {
                    if (pat2D[r][c] > 0) {
                        parsedCells.push([r, c, pat2D[r][c]]);
                    }
                }
            }
        } else if (pasteGhost.is1D && (pasteGhost.initialRow || pasteGhost.canonicalRow)) {
            const pat1D = pasteGhost.initialRow || pasteGhost.canonicalRow;
            for (let c = 0; c < pat1D.length; c++) {
                if (pat1D[c] > 0) {
                    parsedCells.push([0, c, pat1D[c]]);
                }
            }
        }

        if (parsedCells.length > 0) {
            const minRow = Math.min(...parsedCells.map(c => c[0]));
            const minCol = Math.min(...parsedCells.map(c => c[1]));
            parsedCells = parsedCells.map(c => [c[0] - minRow, c[1] - minCol, c[2]]);
        }

        if (parsedCells.length === 0) return;

        // Clean up any existing ghosts
        const existing = document.querySelector('.paste-preview');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        const previewSize = Math.max(1, cellPixelSize || CELL_PIXEL_SIZE);
        const preview = document.createElement('canvas');
        preview.className = 'paste-preview drag-preview';

        const rows = Math.max(...parsedCells.map(cell => cell[0])) + 1;
        const cols = Math.max(...parsedCells.map(cell => cell[1])) + 1;

        if (rows <= 0 || cols <= 0) return;

        const cssWidth = cols * previewSize;
        const cssHeight = rows * previewSize;
        const deviceRatio = window.devicePixelRatio || 1;

        preview.width = Math.max(1, Math.round(cssWidth * deviceRatio));
        preview.height = Math.max(1, Math.round(cssHeight * deviceRatio));
        preview.style.width = `${cssWidth}px`;
        preview.style.height = `${cssHeight}px`;
        preview.style.position = 'fixed'; // Use fixed so it tracks window mouse coords natively
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '1000';

        const ctx = preview.getContext('2d');
        ctx.scale(deviceRatio, deviceRatio);

        const centerX = cssWidth / 2;
        const centerY = cssHeight / 2;
        preview.dataset.centerX = centerX;
        preview.dataset.centerY = centerY;

        preview.style.transform = 'translate(-50%, -50%)';

        parsedCells.forEach(([row, col, val]) => {
            if (currentMode.renderCell) {
                currentMode.renderCell(ctx, col * previewSize, row * previewSize, val, previewSize);
            } else {
                ctx.fillStyle = 'rgba(156, 163, 175, 0.45)';
                ctx.fillRect(col * previewSize, row * previewSize, previewSize, previewSize);
            }
            ctx.strokeStyle = 'rgba(75, 85, 99, 0.35)';
            ctx.strokeRect(col * previewSize, row * previewSize, previewSize, previewSize);
        });

        document.body.appendChild(preview);

        const handleMouseMove = (e) => {
            preview.style.transform = 'none';
            preview.style.left = `${e.clientX - centerX}px`;
            preview.style.top = `${e.clientY - centerY}px`;
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (clearPasteGhost) clearPasteGhost();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleEscape);
            if (preview.parentNode) {
                preview.parentNode.removeChild(preview);
            }
        };
    }, [pasteGhost, cellPixelSize, model, clearPasteGhost]);

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
            row: Math.floor((relY + offset.y) / cellSize),
        };
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const drawGrid = (ctx) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        const overlayMode = debugConfig?.cellOverlayMode || 'none';
        const showCoordinates = overlayMode === 'coordinates';
        const showIntensity = overlayMode === 'intensity';

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

            if (showCoordinates || showIntensity) {
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

                    const textColor = val >= 0.5 ? "#f9fafb" : "#111827";

                    if (showCoordinates) {
                        ctx.fillStyle = textColor;
                        const xPos = cellX + cellSize / 2;
                        const yPosTop = cellY + cellSize / 3;
                        const yPosBottom = cellY + (2 * cellSize) / 3;

                        ctx.fillText(`${row}`, xPos, yPosTop);
                        ctx.fillText(`${col}`, xPos, yPosBottom);
                    }

                    if (showIntensity) {
                        ctx.fillStyle = textColor;
                        const xPos = cellX + cellSize / 2;
                        const yPos = cellY + cellSize / 2;
                        ctx.fillText(val.toFixed(2), xPos, yPos);
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

    const startRegionSelection = (event) => {
        const relative = getCanvasRelativePosition(event);
        if (!relative) {
            return;
        }
        setIsSelectingRegion(true);
        setSelectionRect({
            start: relative,
            current: relative,
        });
        setDragging(false);
        setLastMousePos(null);
    };

    const updateRegionSelection = (event) => {
        if (!selectionRect) {
            return;
        }
        const relative = getCanvasRelativePosition(event);
        if (!relative) {
            return;
        }
        setSelectionRect((prev) => (prev ? { ...prev, current: relative } : prev));
    };

    const finalizeRegionSelection = () => {
        if (!selectionRect) {
            setIsSelectingRegion(false);
            setSelectionRect(null);
            return;
        }
        const { start, current } = selectionRect;
        const minX = Math.min(start.x, current.x);
        const minY = Math.min(start.y, current.y);
        const maxX = Math.max(start.x, current.x);
        const maxY = Math.max(start.y, current.y);

        const startCell = relativeToCellCoords(minX, minY);
        const endCell = relativeToCellCoords(maxX, maxY);

        const rowStart = clamp(Math.min(startCell.row, endCell.row), 0, GRID_SIZE - 1);
        const rowEnd = clamp(Math.max(startCell.row, endCell.row), 0, GRID_SIZE - 1);
        const colStart = clamp(Math.min(startCell.col, endCell.col), 0, GRID_SIZE - 1);
        const colEnd = clamp(Math.max(startCell.col, endCell.col), 0, GRID_SIZE - 1);

        if (rowEnd < rowStart || colEnd < colStart) {
            setIsSelectingRegion(false);
            setSelectionRect(null);
            return;
        }

        const newGrid = grid.map((rowData, rowIndex) => {
            if (rowIndex < rowStart || rowIndex > rowEnd) {
                return rowData;
            }
            return rowData.map((cell, colIndex) =>
                colIndex >= colStart && colIndex <= colEnd ? 0 : cell
            );
        });

        setGrid(newGrid);
        setIsSelectingRegion(false);
        setSelectionRect(null);
    };

    const handleMouseDown = (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            startRegionSelection(e);
            return;
        }
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (isSelectingRegion) {
            updateRegionSelection(e);
            return;
        }
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
        if (isSelectingRegion) {
            finalizeRegionSelection();
            return;
        }
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

        // Handle Paste Ghost Click Instantiation
        if (pasteGhost) {
            // Re-parse the cells logic to figure out bounding box (similar to dragDrop)
            const currentMode = modes[model] || modes.classic;
            let parsedCells = [];
            if (pasteGhost.cells) {
                parsedCells = currentMode.parseCells(pasteGhost.cells);
            } else if (pasteGhost.canonicalPattern || pasteGhost.initialPattern) {
                const pat2D = pasteGhost.canonicalPattern || pasteGhost.initialPattern;
                for (let r = 0; r < pat2D.length; r++) {
                    for (let c = 0; c < (pat2D[r]?.length || 0); c++) {
                        if (pat2D[r][c] > 0) parsedCells.push([r, c, pat2D[r][c]]);
                    }
                }
            } else if (pasteGhost.is1D && (pasteGhost.initialRow || pasteGhost.canonicalRow)) {
                const pat1D = pasteGhost.initialRow || pasteGhost.canonicalRow;
                for (let c = 0; c < pat1D.length; c++) {
                    if (pat1D[c] > 0) parsedCells.push([0, c, pat1D[c]]);
                }
            }

            if (parsedCells.length > 0) {
                const minRow = Math.min(...parsedCells.map(c => c[0]));
                const minCol = Math.min(...parsedCells.map(c => c[1]));
                parsedCells = parsedCells.map(c => [c[0] - minRow, c[1] - minCol, c[2]]);

                const rows = Math.max(...parsedCells.map(c => c[0])) + 1;
                const cols = Math.max(...parsedCells.map(c => c[1])) + 1;
                const centerX = (cols * cellSize) / 2;
                const centerY = (rows * cellSize) / 2;

                const pasteX = e.clientX - rect.left - centerX;
                const pasteY = e.clientY - rect.top - centerY;

                const colOffset = Math.round((pasteX + offset.x) / cellSize);
                const rowOffset = Math.round((pasteY + offset.y) / cellSize);

                // Construct a standardized pattern wrapper so loadPattern treats it universally
                const normalizedPattern = {
                    cells: parsedCells.map(c => [c[0], c[1], c[2]])
                };

                loadPattern(normalizedPattern, rowOffset, colOffset);
            }

            if (clearPasteGhost) clearPasteGhost();
            return;
        }

        console.log("Clicked cell: ", `[${row}, ${col}]`);
        if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
            const currentVal = grid[row][col];
            let newVal;

            // Mode-specific toggling:
            // - default: binary toggle 0 <-> 1 (threshold at 0.5)
            // - halfLife: cycle 0 -> 0.5 -> 1 -> 0
            if (model === 'halfLife') {
                // Snap-ish to one of {0, 0.5, 1} then advance.
                const snapped =
                    currentVal < 0.25 ? 0
                        : currentVal < 0.75 ? 0.5
                            : 1;

                if (snapped === 0) newVal = 0.5;
                else if (snapped === 0.5) newVal = 1;
                else newVal = 0;
            } else {
                newVal = currentVal >= 0.5 ? 0 : 1;
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

            const currentMode = modes[model] || modes.classic;
            let parsedCells = currentMode.parseCells(pattern.cells);

            if (parsedCells.length > 0) {
                // Normalize coordinates so the bounding box starts at (0,0)
                const minRow = Math.min(...parsedCells.map(c => c[0]));
                const minCol = Math.min(...parsedCells.map(c => c[1]));
                parsedCells = parsedCells.map(c => [c[0] - minRow, c[1] - minCol, c[2]]);

                const rows = Math.max(...parsedCells.map(c => c[0])) + 1;
                const cols = Math.max(...parsedCells.map(c => c[1])) + 1;

                const centerX = (cols * cellSize) / 2;
                const centerY = (rows * cellSize) / 2;

                const x = e.clientX - rect.left - centerX;
                const y = e.clientY - rect.top - centerY;

                const colOffset = Math.round((x + offset.x) / cellSize);
                const rowOffset = Math.round((y + offset.y) / cellSize);

                const normalizedPattern = {
                    ...pattern,
                    cells: parsedCells
                };

                loadPattern(normalizedPattern, rowOffset, colOffset);
            }

            const preview = document.querySelector('.drag-preview');
            if (preview && preview.parentNode) {
                preview.parentNode.removeChild(preview);
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
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(true);
                        }}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium"
                        title={t('grid.libraryButtonTitle')}
                        aria-label={t('grid.libraryButtonTitle')}
                    >
                        <AiOutlineBars size={16} />
                        <span className="hidden sm:inline">{t('grid.libraryButton')}</span>
                    </button>
                </div>
                <div className="flex flex-col items-center text-sm sm:text-base leading-tight space-y-1">
                    <h1 className="text-gray-100 text-lg sm:text-xl font-semibold leading-none">{t('grid.title')}</h1>
                </div>
                <div className="absolute right-4 flex items-center space-x-2">
                    <div className="flex items-center space-x-2 rounded-full bg-gray-700/90 px-3 py-1 text-[11px] sm:text-xs font-semibold text-gray-100 shadow">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                        <span className="whitespace-nowrap">{t('grid.activeMode', { mode: activeModeLabel })}</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModeMenuOpen(true);
                        }}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-500 rounded flex items-center space-x-2 text-sm font-medium transition"
                        title={t('grid.modesButtonTitle')}
                        aria-label={t('grid.modesButtonTitle')}
                    >
                        <AiOutlineSliders size={16} />
                        <span className="hidden sm:inline">{t('grid.modesButton')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenPatternSearch();
                        }}
                        className="p-2 rounded bg-gray-700 hover:bg-gray-500 transition flex items-center justify-center"
                        title={t('grid.patternSearchButtonTitle')}
                        aria-label={t('grid.patternSearchButtonTitle')}
                    >
                        <AiOutlineExperiment size={20} />
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
                    {selectionRect && (
                        <div
                            className="absolute pointer-events-none border-2 border-blue-400/80 bg-blue-400/20"
                            style={{
                                left: Math.min(selectionRect.start.x, selectionRect.current.x),
                                top: Math.min(selectionRect.start.y, selectionRect.current.y),
                                width: Math.abs(selectionRect.start.x - selectionRect.current.x),
                                height: Math.abs(selectionRect.start.y - selectionRect.current.y),
                            }}
                        />
                    )}
                </div>
            </div>
            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
};

export default Grid;
