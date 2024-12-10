import React, { useRef, useState, useEffect } from "react";
import './Grid.css';  // Assuming you have this CSS for the layout and styling

const Grid = ({ initialCellSize = 20, zoomFactor = 1.1 }) => {
    const gridRef = useRef(new Map()); // Store active cells
    const offsetX = useRef(0);
    const offsetY = useRef(0);
    const dragStart = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const previousDrag = useRef({ x: 0, y: 0 });

    const canvasRef = useRef();
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [cellSize, setCellSize] = useState(initialCellSize);

    // Resize handler for dynamic viewport size
    useEffect(() => {
        const resizeHandler = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener("resize", resizeHandler);
        resizeHandler(); // Initialize viewport size on load

        return () => window.removeEventListener("resize", resizeHandler);
    }, []);

    // Redraw grid after viewport or cell size change
    useEffect(() => {
        drawGrid();
    }, [viewport, cellSize]);

    // Drawing grid and active cells
    const drawGrid = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const rows = Math.ceil(viewport.height / cellSize);
        const cols = Math.ceil(viewport.width / cellSize);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render gridlines
        ctx.strokeStyle = "gray";
        for (let row = 0; row <= rows; row++) {
            const y = row * cellSize - offsetY.current % cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        for (let col = 0; col <= cols; col++) {
            const x = col * cellSize - offsetX.current % cellSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Render active cells
        const visibleCells = getVisibleCells(rows, cols);
        ctx.fillStyle = "black";
        visibleCells.forEach(([x, y]) => {
            const canvasX = (x - offsetX.current) * cellSize;
            const canvasY = (y - offsetY.current) * cellSize;
            ctx.fillRect(canvasX, canvasY, cellSize, cellSize);
        });
    };

    // Get list of visible cells that are alive
    const getVisibleCells = (rows, cols) => {
        const visibleCells = [];
        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const cellX = col + offsetX.current;
                const cellY = row + offsetY.current;
                if (gridRef.current.has(`${cellX},${cellY}`)) {
                    visibleCells.push([cellX, cellY]);
                }
            }
        }
        return visibleCells;
    };

    // Toggle cell alive/dead on click
    const toggleCell = (x, y) => {
        const key = `${x},${y}`;
        if (gridRef.current.has(key)) {
            gridRef.current.delete(key);
        } else {
            gridRef.current.set(key, 1);
        }
        drawGrid();
    };

    // Handle canvas click to toggle cell
    const handleCanvasClick = (e) => {
        if (isDragging.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize) + offsetX.current;
        const y = Math.floor((e.clientY - rect.top) / cellSize) + offsetY.current;
        toggleCell(x, y);
    };

    // Start dragging the grid
    const startDrag = (e) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        previousDrag.current = { x: e.clientX, y: e.clientY };
    };

    // Handle grid dragging
    const handleDrag = (e) => {
        if (!isDragging.current) return;

        const dx = e.clientX - previousDrag.current.x;
        const dy = e.clientY - previousDrag.current.y;

        offsetX.current -= dx;
        offsetY.current -= dy;

        previousDrag.current = { x: e.clientX, y: e.clientY };

        drawGrid();
    };

    // End dragging
    const endDrag = () => {
        isDragging.current = false;
    };

    // Handle zooming in and out
    const handleZoom = (e) => {
        e.preventDefault();
        const newCellSize =
            e.deltaY < 0
                ? Math.min(cellSize * zoomFactor, 100)
                : Math.max(cellSize / zoomFactor, 5);
        setCellSize(newCellSize);
    };

    // Reset grid
    const resetGrid = () => {
        gridRef.current.clear();
        drawGrid();
    };

    return (
        <div className="grid-container">
            <div className="button-bar">
                <span className="title">Fuzzy Life Grid</span>
                <button onClick={resetGrid}>Reset Grid</button>
            </div>
            <canvas
                ref={canvasRef}
                className="canvas"
                onMouseDown={startDrag}
                onMouseMove={handleDrag}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onClick={handleCanvasClick}
                onWheel={handleZoom}
            />
        </div>
    );
};

export default Grid;