import React, { useState, useEffect, useRef } from 'react';

const Grid = ({ cellSize = 20 }) => {
  const [grid, setGrid] = useState({});
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState('url("/pen-cursor.svg"), auto'); // Custom cursor

  const canvasRef = useRef();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeHandler = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  useEffect(() => {
    drawGrid();
  }, [grid, viewport, offsetX, offsetY]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const rows = Math.ceil(viewport.height / cellSize);
    const cols = Math.ceil(viewport.width / cellSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const cellX = col + offsetX;
        const cellY = row + offsetY;
        const cellState = grid[`${cellX},${cellY}`] || 0;

        ctx.fillStyle = cellState ? 'black' : 'white';
        ctx.fillRect(
          col * cellSize,
          row * cellSize,
          cellSize,
          cellSize
        );
        ctx.strokeStyle = 'gray';
        ctx.strokeRect(
          col * cellSize,
          row * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  };

  const toggleCell = (x, y) => {
    const newGrid = { ...grid };
    const key = `${x},${y}`;
    newGrid[key] = grid[key] ? 0 : 1;
    setGrid(newGrid);
  };

  const handleCanvasClick = (e) => {
    if (isDragging) return; // Ignore clicks during dragging
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize) + offsetX;
    const y = Math.floor((e.clientY - rect.top) / cellSize) + offsetY;
    toggleCell(x, y);
  };

  const startDrag = (e) => {
    setIsDragging(true);
    setCursor('grabbing'); // Update cursor for dragging
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const dx = Math.floor((e.clientX - dragStart.x) / cellSize);
    const dy = Math.floor((e.clientY - dragStart.y) / cellSize);
    setOffsetX(offsetX - dx);
    setOffsetY(offsetY - dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const endDrag = () => {
    setIsDragging(false);
    setCursor('url("/pen-cursor.svg"), auto'); // Reset to pen cursor
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: cursor }} // Custom cursor applied here
      onMouseDown={startDrag}
      onMouseMove={handleDrag}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClick={handleCanvasClick}
    />
  );
};

export default Grid;
