// src/components/Menu.js
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineDownload, AiOutlineUpload, AiOutlineDelete, AiOutlineEdit, AiOutlineClose } from "react-icons/ai";
import { CELL_PIXEL_SIZE } from '../config';

const Menu = ({ isOpen, setIsOpen, patterns, grid, loadPattern, loadConfiguration, loadConfigurationFromFile, cellPixelSize = CELL_PIXEL_SIZE }) => {
    const [customPatterns, setCustomPatterns] = useState({});
    const [customConfigurations, setCustomConfigurations] = useState({});
    const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' or 'configurations'
    const menuRef = useRef(null);

    useEffect(() => {
        const storedCustomPatterns = JSON.parse(localStorage.getItem('customPatterns')) || {};
        const storedCustomConfigurations = JSON.parse(localStorage.getItem('customConfigurations')) || {};
        setCustomPatterns(storedCustomPatterns);
        setCustomConfigurations(storedCustomConfigurations);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setIsOpen]);

    const handleLoadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => loadConfigurationFromFile(e);
        input.click();
    };

    const handleSavePattern = () => {
        const liveCells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell >= 0.5) liveCells.push([rowIndex, colIndex]);
            });
        });

        if (liveCells.length === 0) {
            console.log('No live cells to save as a pattern.');
            return;
        }

        const minRow = Math.min(...liveCells.map(([row]) => row));
        const minCol = Math.min(...liveCells.map(([, col]) => col));
        const zeroedCells = liveCells.map(([row, col]) => [row - minRow, col - minCol]);

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const newName = `Pattern ${day}.${month}.${year} ${hours}:${minutes}`;

        const pattern = {
            name: newName,
            cells: zeroedCells,
            description: `Pattern saved at ${new Date().toLocaleString()}`
        };
        const updatedCustomPatterns = { ...customPatterns, [newName]: pattern };
        setCustomPatterns(updatedCustomPatterns);
        localStorage.setItem('customPatterns', JSON.stringify(updatedCustomPatterns));
        console.log(`Saved zeroed pattern to localStorage: ${newName}`, pattern);
    };

    const handleSaveConfiguration = () => {
        const liveCells = [];
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell >= 0.5) liveCells.push([rowIndex, colIndex]);
            });
        });
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const newName = `Config ${day}.${month}.${year} ${hours}:${minutes}`;

        const configuration = {
            name: newName,
            cells: liveCells,
            description: `Configuration saved at ${new Date().toLocaleString()}`
        };
        const updatedCustomConfigurations = { ...customConfigurations, [newName]: configuration };
        setCustomConfigurations(updatedCustomConfigurations);
        localStorage.setItem('customConfigurations', JSON.stringify(updatedCustomConfigurations));
        console.log(`Saved configuration to localStorage: ${newName}`);
    };

    const handleLoadCustomPattern = (name) => {
        const pattern = customPatterns[name];
        if (pattern) {
            loadPattern(pattern, 0, 0);
        }
    };

    const handleLoadConfiguration = (name) => {
        const config = customConfigurations[name];
        if (config) {
            loadConfiguration(config);
        }
    };

    const handleRemove = (name, isConfiguration = false) => {
        const confirmRemove = window.confirm(`Are you sure you want to remove "${name}"?`);
        if (confirmRemove) {
            if (isConfiguration) {
                const updatedCustomConfigurations = { ...customConfigurations };
                delete updatedCustomConfigurations[name];
                setCustomConfigurations(updatedCustomConfigurations);
                localStorage.setItem('customConfigurations', JSON.stringify(updatedCustomConfigurations));
                console.log(`Removed configuration from localStorage: ${name}`);
            } else {
                const updatedCustomPatterns = { ...customPatterns };
                delete updatedCustomPatterns[name];
                setCustomPatterns(updatedCustomPatterns);
                localStorage.setItem('customPatterns', JSON.stringify(updatedCustomPatterns));
                console.log(`Removed pattern from localStorage: ${name}`);
            }
        } else {
            console.log(`Removal of ${name} cancelled`);
        }
    };

    const handleRename = (oldName, isConfiguration = false) => {
        const newName = prompt('Enter new name:', oldName);
        const source = isConfiguration ? customConfigurations : customPatterns;
        const setSource = isConfiguration ? setCustomConfigurations : setCustomPatterns;
        const storageKey = isConfiguration ? 'customConfigurations' : 'customPatterns';

        if (newName && newName !== oldName && !source[newName] && !patterns[newName]) {
            const entries = Object.entries(source);
            const index = entries.findIndex(([name]) => name === oldName);

            if (index !== -1) {
                const config = entries[index][1];
                const updatedEntries = [
                    ...entries.slice(0, index),
                    [newName, { ...config, name: newName }],
                    ...entries.slice(index + 1)
                ];
                const updatedSource = Object.fromEntries(updatedEntries);
                setSource(updatedSource);
                localStorage.setItem(storageKey, JSON.stringify(updatedSource));
                console.log(`Renamed ${oldName} to ${newName} in ${storageKey}`);
            }
        } else if (newName && (source[newName] || patterns[newName])) {
            alert('A name with this value already exists.');
        }
    };

    const handleDragStart = (e, name, isCustom = false, isConfiguration = false) => {
        const pattern = isConfiguration ? customConfigurations[name] : (isCustom ? customPatterns[name] : patterns[name]);
        if (pattern) {
            e.dataTransfer.setData('application/json', JSON.stringify(pattern));
            e.dataTransfer.effectAllowed = 'move';

            const emptyImage = new Image();
            e.dataTransfer.setDragImage(emptyImage, 0, 0);

            const cellSize = Math.max(1, cellPixelSize || CELL_PIXEL_SIZE);
            const preview = document.createElement('canvas');
            preview.className = 'drag-preview';

            const rows = Math.max(...pattern.cells.map(([row]) => row)) + 1;
            const cols = Math.max(...pattern.cells.map(([, col]) => col)) + 1;

            if (rows <= 0 || cols <= 0) {
                return;
            }

            const cssWidth = cols * cellSize;
            const cssHeight = rows * cellSize;
            const deviceRatio = window.devicePixelRatio || 1;

            preview.width = Math.max(1, Math.round(cssWidth * deviceRatio));
            preview.height = Math.max(1, Math.round(cssHeight * deviceRatio));
            preview.style.width = `${cssWidth}px`;
            preview.style.height = `${cssHeight}px`;
            preview.style.position = 'absolute';
            preview.style.pointerEvents = 'none';
            preview.style.zIndex = '1000';

            const ctx = preview.getContext('2d');
            ctx.scale(deviceRatio, deviceRatio);

            const centerX = cssWidth / 2;
            const centerY = cssHeight / 2;
            preview.dataset.centerX = centerX;
            preview.dataset.centerY = centerY;

            preview.style.left = `${e.pageX - centerX}px`;
            preview.style.top = `${e.pageY - centerY}px`;

            ctx.fillStyle = 'rgba(156, 163, 175, 0.45)';
            ctx.strokeStyle = 'rgba(75, 85, 99, 0.35)';
            pattern.cells.forEach(([row, col]) => {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            });

            document.body.appendChild(preview);
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto shadow-xl border-r border-slate-800" ref={menuRef}>
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                                Library
                            </p>
                            <h2 className="text-lg font-semibold text-white">Patterns & Configurations</h2>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-md border border-slate-700 p-1 text-slate-300 transition hover:border-slate-500 hover:text-white"
                            title="Close"
                        >
                            <AiOutlineClose size={16} />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="flex space-x-2 mb-4">
                            <button
                                onClick={() => setActiveTab('patterns')}
                                className={`flex-1 p-2 rounded ${activeTab === 'patterns' ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                Patterns
                            </button>
                            <button
                                onClick={() => setActiveTab('configurations')}
                                className={`flex-1 p-2 rounded ${activeTab === 'configurations' ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                Configurations
                            </button>
                        </div>

                        {activeTab === 'patterns' && (
                            <div>
                                <div className="flex items-center justify-between w-full mb-4">
                                    <h2 className="text-lg font-bold">Patterns:</h2>
                                    <button
                                        onClick={handleSavePattern}
                                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center"
                                        title="Save Pattern to Local Storage"
                                    >
                                        <AiOutlineDownload size={16} />
                                    </button>
                                </div>
                                <ul>
                                    {Object.entries(patterns).map(([name, { description }]) => (
                                        <li key={name} className="mb-2">
                                            <button
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, name, false, false)}
                                                onClick={() => loadPattern(patterns[name], 0, 0)}
                                                className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-move"
                                                title="Drag to place on grid or click to load at origin"
                                            >
                                                {name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="">
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-b border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-slate-900 px-4 text-sm">Custom</span>
                                        </div>
                                    </div>
                                    <ul>
                                        {Object.entries(customPatterns).map(([name, {description}]) => (
                                            <li key={name} className="mb-2 flex items-center space-x-2">
                                                <button
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, name, true, false)}
                                                    onClick={() => handleLoadCustomPattern(name)}
                                                    className="flex-1 text-left whitespace-normal break-all pr-2 bg-gray-700 hover:bg-gray-600 rounded p-2 cursor-move"
                                                    title="Drag to place on grid or click to load at origin"
                                                >
                                                    {name}
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRemove(name, false)}
                                                        className="p-1 bg-red-600 hover:bg-red-500 rounded"
                                                        title="Remove"
                                                    >
                                                        <AiOutlineDelete size={16}/>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRename(name, false)}
                                                        className="p-1 bg-yellow-600 hover:bg-yellow-500 rounded"
                                                        title="Rename"
                                                    >
                                                        <AiOutlineEdit size={16}/>
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'configurations' && (
                            <div>
                                <div className="flex items-center justify-between w-full">
                                    <h2 className="text-lg flex-shrink-0 font-bold">Configurations:</h2>
                                    <div className="flex space-x-2 p-2">
                                        <button
                                            onClick={handleSaveConfiguration}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center"
                                            title="Save Configuration to Local Storage"
                                        >
                                            <AiOutlineDownload size={16} />
                                        </button>
                                        <button
                                            onClick={handleLoadClick}
                                            className="p-2 bg-green-600 hover:bg-green-500 rounded flex items-center justify-center"
                                            title="Load Configuration from File"
                                        >
                                            <AiOutlineUpload size={16} />
                                        </button>
                                    </div>
                                </div>
                                <ul>
                                    {Object.entries(customConfigurations).map(([name, { description }]) => (
                                        <li key={name} className="mb-2 flex items-center space-x-2 ">
                                            <button
                                                onClick={() => handleLoadConfiguration(name)}
                                                className="flex-1 text-left whitespace-normal break-all pr-2 bg-gray-700 hover:bg-gray-600 rounded p-2 cursor-pointer"
                                                title="Click to load full grid"
                                            >
                                                {name}
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRemove(name, true)}
                                                    className="p-1 bg-red-600 hover:bg-red-500 rounded"
                                                    title="Remove"
                                                >
                                                    <AiOutlineDelete size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRename(name, true)}
                                                    className="p-1 bg-yellow-600 hover:bg-yellow-500 rounded"
                                                    title="Rename"
                                                >
                                                    <AiOutlineEdit size={16} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Menu;
