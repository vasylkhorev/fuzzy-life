// src/components/Menu.js
import React, { useState, useEffect } from 'react';
import {
    AiOutlineBars,
    AiOutlineDownload,
    AiOutlineUpload,
    AiOutlineDelete,
    AiOutlineEdit,
    AiOutlineClose
} from "react-icons/ai";
import { CELL_PIXEL_SIZE } from '../config';

const Menu = ({ isOpen, setIsOpen, patterns, grid, loadPattern, loadConfiguration, loadConfigurationFromFile }) => {
    const [customPatterns, setCustomPatterns] = useState({});
    const [customConfigurations, setCustomConfigurations] = useState({});
    const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' or 'configurations'

    useEffect(() => {
        const storedCustomPatterns = JSON.parse(localStorage.getItem('customPatterns')) || {};
        const storedCustomConfigurations = JSON.parse(localStorage.getItem('customConfigurations')) || {};
        setCustomPatterns(storedCustomPatterns);
        setCustomConfigurations(storedCustomConfigurations);
    }, []);

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

            const cellSize = CELL_PIXEL_SIZE;
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 rounded-md bg-slate-700 p-2 text-white shadow hover:bg-slate-600"
                title="Open Menu"
            >
                <AiOutlineBars size={24} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <aside className="absolute inset-y-0 left-0 flex w-full max-w-md flex-col overflow-hidden border-r border-slate-800 bg-slate-900 text-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                                    Library
                                </p>
                                <h2 className="text-lg font-semibold text-white">Patterns & Configurations</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-md border border-slate-700 p-1.5 text-slate-300 transition hover:border-slate-500 hover:text-white"
                            >
                                <AiOutlineClose size={16} />
                            </button>
                        </div>

                        <div className="border-b border-slate-800/80 bg-slate-900 px-6 py-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('patterns')}
                                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                                        activeTab === 'patterns'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-500 hover:text-white'
                                    }`}
                                >
                                    Patterns
                                </button>
                                <button
                                    onClick={() => setActiveTab('configurations')}
                                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                                        activeTab === 'configurations'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-500 hover:text-white'
                                    }`}
                                >
                                    Configurations
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {activeTab === 'patterns' && (
                                <div className="space-y-6">
                                    <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                                                Core patterns
                                            </h3>
                                            <button
                                                onClick={handleSavePattern}
                                                className="rounded-md border border-blue-500/60 bg-blue-500/10 p-2 text-blue-100 transition hover:border-blue-400 hover:text-white"
                                                title="Save current live cells as a reusable pattern"
                                            >
                                                <AiOutlineDownload size={16} />
                                            </button>
                                        </div>
                                        <ul className="space-y-2">
                                            {Object.entries(patterns).map(([name]) => (
                                                <li
                                                    key={name}
                                                    className="flex items-center rounded border border-slate-800/70 bg-slate-800/60 transition hover:border-slate-600"
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, name)}
                                                >
                                                    <button
                                                        onClick={() => loadPattern(patterns[name], 0, 0)}
                                                        className="flex-1 truncate px-3 py-2 text-left text-sm text-slate-100"
                                                    >
                                                        {name}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                                                Custom
                                            </h3>
                                            <span className="text-xs text-slate-500">
                                                Drag to place on canvas
                                            </span>
                                        </div>
                                        <ul className="space-y-2">
                                            {Object.entries(customPatterns).map(([name, { description }]) => (
                                                <li
                                                    key={name}
                                                    className="flex items-center gap-2 rounded border border-slate-800/70 bg-slate-800/50 px-3 py-2"
                                                >
                                                    <button
                                                        onClick={() => handleLoadCustomPattern(name)}
                                                        className="flex-1 text-left text-sm text-slate-100"
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, name, true)}
                                                        title={description || name}
                                                    >
                                                        {name}
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRemove(name, false)}
                                                            className="rounded bg-red-600/90 p-1 text-white transition hover:bg-red-500"
                                                            title="Remove"
                                                        >
                                                            <AiOutlineDelete size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRename(name, false)}
                                                            className="rounded bg-yellow-600/90 p-1 text-white transition hover:bg-yellow-500"
                                                            title="Rename"
                                                        >
                                                            <AiOutlineEdit size={16} />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                            {Object.keys(customPatterns).length === 0 && (
                                                <p className="rounded border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
                                                    Save any live structure to reuse it later.
                                                </p>
                                            )}
                                        </ul>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'configurations' && (
                                <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                                            Saved configurations
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleSaveConfiguration}
                                                className="rounded-md border border-blue-500/60 bg-blue-500/10 p-2 text-blue-100 transition hover:border-blue-400 hover:text-white"
                                                title="Save current grid state"
                                            >
                                                <AiOutlineDownload size={16} />
                                            </button>
                                            <button
                                                onClick={handleLoadClick}
                                                className="rounded-md border border-emerald-500/60 bg-emerald-500/10 p-2 text-emerald-100 transition hover:border-emerald-400 hover:text-white"
                                                title="Load configuration from file"
                                            >
                                                <AiOutlineUpload size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {Object.entries(customConfigurations).map(([name, { description }]) => (
                                            <li
                                                key={name}
                                                className="flex items-center gap-2 rounded border border-slate-800/70 bg-slate-800/50 px-3 py-2"
                                            >
                                                <button
                                                    onClick={() => handleLoadConfiguration(name)}
                                                    className="flex-1 text-left text-sm text-slate-100"
                                                    title={description || name}
                                                >
                                                    {name}
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRemove(name, true)}
                                                        className="rounded bg-red-600/90 p-1 text-white transition hover:bg-red-500"
                                                        title="Remove"
                                                    >
                                                        <AiOutlineDelete size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRename(name, true)}
                                                        className="rounded bg-yellow-600/90 p-1 text-white transition hover:bg-yellow-500"
                                                        title="Rename"
                                                    >
                                                        <AiOutlineEdit size={16} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {Object.keys(customConfigurations).length === 0 && (
                                            <p className="rounded border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
                                                Save a full-board snapshot to build your own library.
                                            </p>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
};

export default Menu;
