// src/components/Menu.js
import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineDownload, AiOutlineUpload, AiOutlineDelete, AiOutlineEdit, AiOutlineClose, AiOutlineSave } from "react-icons/ai";
import { CELL_PIXEL_SIZE, GRID_SIZE } from '../config';
import { useTranslation } from '../i18n';
import { modes } from '../modes';

const Menu = ({ isOpen, setIsOpen, mode = 'classic', patterns = {}, grid, loadPattern, loadConfiguration, loadConfigurationFromFile, cellPixelSize = CELL_PIXEL_SIZE, selectedPattern, setSelectedPattern }) => {
    const [customPatterns, setCustomPatterns] = useState({});
    const [customConfigurations, setCustomConfigurations] = useState({});
    const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' or 'configurations'
    const menuRef = useRef(null);
    const { t, language } = useTranslation();
    const locale = language === 'sk' ? 'sk-SK' : 'en-US';
    const safeMode = mode || 'classic';
    const builtInPatterns = patterns || {};

    const getStorageKey = (baseKey) => `${baseKey}:${safeMode}`;

    const getPatternWidth = (pattern) => {
        if (!pattern || !pattern.cells) return 1;
        const cols = pattern.cells.map(([row, col]) => col);
        return Math.max(...cols) - Math.min(...cols) + 1;
    };

    const loadNamespacedStorage = (baseKey) => {
        if (typeof window === 'undefined' || !window.localStorage) {
            return {};
        }
        try {
            const namespacedKey = getStorageKey(baseKey);
            const namespacedValue = localStorage.getItem(namespacedKey);
            if (namespacedValue) {
                return JSON.parse(namespacedValue);
            }
            const legacyValue = localStorage.getItem(baseKey);
            if (legacyValue) {
                localStorage.setItem(namespacedKey, legacyValue);
                return JSON.parse(legacyValue);
            }
        } catch (error) {
            console.error(`Failed to parse ${baseKey} for mode ${safeMode}`, error);
        }
        return {};
    };

    const persistNamespacedStorage = (baseKey, value) => {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        try {
            localStorage.setItem(getStorageKey(baseKey), JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to persist ${baseKey} for mode ${safeMode}`, error);
        }
    };

    useEffect(() => {
        const storedCustomPatterns = loadNamespacedStorage('customPatterns');
        const storedCustomConfigurations = loadNamespacedStorage('customConfigurations');
        setCustomPatterns(storedCustomPatterns);
        setCustomConfigurations(storedCustomConfigurations);
    }, [safeMode]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleGlobalDragEnd = () => {
            const preview = document.querySelector('.drag-preview');
            if (preview && preview.parentNode) {
                preview.parentNode.removeChild(preview);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('dragend', handleGlobalDragEnd);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, [isOpen, setIsOpen]);

    const handleLoadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => loadConfigurationFromFile(e);
        input.click();
    };

    const getNormalizedPattern = () => {
        const currentMode = modes[safeMode] || modes.classic;
        const cells = currentMode.serializeCells(grid, false); // Patterns: exclude zeros

        if (cells.length === 0) return null;

        // Normalize coordinates (zero them)
        let minRow, minCol;
        if (Array.isArray(cells[0])) {
            // Array format [row, col]
            minRow = Math.min(...cells.map(([row]) => row));
            minCol = Math.min(...cells.map(([, col]) => col));
        } else {
            // Object format {r, c, v}
            minRow = Math.min(...cells.map(cell => cell.r));
            minCol = Math.min(...cells.map(cell => cell.c));
        }

        const zeroedCells = cells.map(cell => {
            if (Array.isArray(cell)) {
                return [cell[0] - minRow, cell[1] - minCol];
            }
            return { r: cell.r - minRow, c: cell.c - minCol, v: cell.v };
        });

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const newName = t('menu.generatedNames.pattern', { day, month, year, hours, minutes });
        const timestamp = now.toLocaleString(locale);

        const pattern = {
            name: newName,
            cells: zeroedCells,
            description: t('menu.generatedNames.patternDescription', { timestamp })
        };
        return pattern;
    };

    const handleSavePattern = () => {
        const pattern = getNormalizedPattern();
        if (!pattern) {
            console.log(t('menu.messages.noLiveCells'));
            return;
        }
        const updatedCustomPatterns = { ...customPatterns, [pattern.name]: pattern };
        setCustomPatterns(updatedCustomPatterns);
        persistNamespacedStorage('customPatterns', updatedCustomPatterns);
        console.log(`Saved zeroed pattern to localStorage: ${pattern.name}`, pattern);
    };

    const handleSaveConfiguration = () => {
        const currentMode = modes[safeMode] || modes.classic;
        const cells = currentMode.serializeCells(grid, true); // Configurations: include zeros
        
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const newName = t('menu.generatedNames.configuration', { day, month, year, hours, minutes });
        const timestamp = now.toLocaleString(locale);

        const configuration = {
            name: newName,
            cells: cells,
            description: t('menu.generatedNames.configurationDescription', { timestamp })
        };
        const updatedCustomConfigurations = { ...customConfigurations, [newName]: configuration };
        setCustomConfigurations(updatedCustomConfigurations);
        persistNamespacedStorage('customConfigurations', updatedCustomConfigurations);
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
        const confirmRemove = window.confirm(t('menu.prompts.removeConfirm', { name }));
        if (confirmRemove) {
            if (isConfiguration) {
                const updatedCustomConfigurations = { ...customConfigurations };
                delete updatedCustomConfigurations[name];
                setCustomConfigurations(updatedCustomConfigurations);
                persistNamespacedStorage('customConfigurations', updatedCustomConfigurations);
                console.log(`Removed configuration from localStorage: ${name}`);
            } else {
                const updatedCustomPatterns = { ...customPatterns };
                delete updatedCustomPatterns[name];
                setCustomPatterns(updatedCustomPatterns);
                persistNamespacedStorage('customPatterns', updatedCustomPatterns);
                console.log(`Removed pattern from localStorage: ${name}`);
            }
        } else {
            console.log(`Removal of ${name} cancelled`);
        }
    };

    const handleRename = (oldName, isConfiguration = false) => {
        const newName = prompt(t('menu.prompts.renamePrompt'), oldName);
        const source = isConfiguration ? customConfigurations : customPatterns;
        const setSource = isConfiguration ? setCustomConfigurations : setCustomPatterns;
        const storageBaseKey = isConfiguration ? 'customConfigurations' : 'customPatterns';

        if (newName && newName !== oldName && !source[newName] && !builtInPatterns[newName]) {
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
                persistNamespacedStorage(storageBaseKey, updatedSource);
                console.log(`Renamed ${oldName} to ${newName} in ${storageBaseKey}`);
            }
        } else if (newName && (source[newName] || builtInPatterns[newName])) {
            alert(t('menu.prompts.nameExists'));
        }
    };

    const handleDragStart = (e, name, isCustom = false, isConfiguration = false) => {
        const pattern = isConfiguration ? customConfigurations[name] : (isCustom ? customPatterns[name] : builtInPatterns[name]);
        if (pattern) {
            e.dataTransfer.setData('application/json', JSON.stringify(pattern));
            e.dataTransfer.effectAllowed = 'move';

            // Create a completely transparent drag image to hide it
            const emptyImage = new Image();
            emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(emptyImage, 0, 0);

            const cellSize = Math.max(1, cellPixelSize || CELL_PIXEL_SIZE);
            const preview = document.createElement('canvas');
            preview.className = 'drag-preview';

            const rows = Math.max(...pattern.cells.map(cell => {
                if (Array.isArray(cell)) return cell[0];
                return cell.r !== undefined ? cell.r : cell.row;
            })) + 1;
            const cols = Math.max(...pattern.cells.map(cell => {
                if (Array.isArray(cell)) return cell[1];
                return cell.c !== undefined ? cell.c : cell.col;
            })) + 1;

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
            pattern.cells.forEach((cell) => {
                let row, col;
                if (Array.isArray(cell)) {
                    [row, col] = cell;
                } else if (cell && typeof cell === 'object') {
                    row = cell.r !== undefined ? cell.r : cell.row;
                    col = cell.c !== undefined ? cell.c : cell.col;
                } else {
                    return;
                }
                if (row !== undefined && col !== undefined) {
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            });

            document.body.appendChild(preview);
        }
    };

    const handleDragEnd = () => {
        const preview = document.querySelector('.drag-preview');
        if (preview && preview.parentNode) {
            preview.parentNode.removeChild(preview);
        }
    };

    const sanitizeFileName = (name = '') =>
        name.replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-') || 'pattern';

    const formatPatternJson = (pattern) => {
        if (!pattern) return '';
        const inlineCells = JSON.stringify(pattern.cells || []);
        const token = '__INLINE_CELLS__';
        const ordered = {
            ...pattern,
            name: pattern.name,
            description: pattern.description,
            cells: token
        };
        const withToken = JSON.stringify(ordered, null, 2);
        return withToken.replace(`"${token}"`, inlineCells);
    };

    const handleDownloadCurrentPattern = () => {
        const pattern = getNormalizedPattern();
        if (!pattern) {
            console.log(t('menu.messages.noLiveCells'));
            return;
        }
        try {
            const fileName = `${sanitizeFileName(pattern.name)}.json`;
            const blob = new Blob([formatPatternJson(pattern)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download current pattern', error);
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto shadow-xl border-r border-slate-800" ref={menuRef}>
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                                {t('menu.headingEyebrow')}
                            </p>
                            <h2 className="text-lg font-semibold text-white">{t('menu.headingTitle')}</h2>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-md border border-slate-700 p-1 text-slate-300 transition hover:border-slate-500 hover:text-white"
                            title={t('menu.tooltips.close')}
                            aria-label={t('menu.tooltips.close')}
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
                                {t('menu.tabs.patterns')}
                            </button>
                            <button
                                onClick={() => setActiveTab('configurations')}
                                className={`flex-1 p-2 rounded ${activeTab === 'configurations' ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                {t('menu.tabs.configurations')}
                            </button>
                        </div>

                        {activeTab === 'patterns' && (
                            <div>
                                <div className="flex items-center justify-between w-full mb-4">
                                    <h2 className="text-lg font-bold">{t('menu.patternsSectionTitle')}</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownloadCurrentPattern}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center"
                                            title={t('menu.tooltips.downloadCurrentPattern', 'Download current pattern as JSON')}
                                            aria-label={t('menu.tooltips.downloadCurrentPattern', 'Download current pattern as JSON')}
                                        >
                                            <AiOutlineDownload size={16} />
                                        </button>
                                        <button
                                            onClick={handleSavePattern}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center"
                                            title={t('menu.tooltips.savePattern')}
                                            aria-label={t('menu.tooltips.savePattern')}
                                        >
                                            <AiOutlineSave size={16} />
                                        </button>
                                    </div>
                                </div>
                                <ul>
                                    {Object.entries(builtInPatterns).map(([name, { description }]) => (
                                        <li key={name} className="mb-2 flex items-center gap-2">
                                            <button
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, name, false, false)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => {
    const pattern = { ...builtInPatterns[name], name };
    // Simple approach: place at center of visible area
    // For 1D mode, this should work regardless of scroll position
    const centerCol = Math.floor(GRID_SIZE / 2);
    const patternWidth = getPatternWidth(pattern);
    const colOffset = centerCol - Math.floor(patternWidth / 2);
    loadPattern(pattern, 0, colOffset);
}}
                                                className="flex-1 text-left p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-move whitespace-normal break-words"
                                                title={t('menu.tooltips.clickPattern', 'Click to place pattern in center')}
                                                aria-label={t('menu.tooltips.clickPattern', 'Click to place pattern in center')}
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
                                            <span className="bg-slate-900 px-4 text-sm">{t('menu.customSectionLabel')}</span>
                                        </div>
                                    </div>
                                    <ul>
                                        {Object.entries(customPatterns).map(([name, {description}]) => (
                                            <li key={name} className="mb-2 flex items-center space-x-2">
                                                <button
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, name, true, false)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => handleLoadCustomPattern(name)}
                                                    className="flex-1 text-left whitespace-normal break-all pr-2 bg-gray-700 hover:bg-gray-600 rounded p-2 cursor-move"
                                                    title={t('menu.tooltips.dragPattern')}
                                                    aria-label={t('menu.tooltips.dragPattern')}
                                                >
                                                    {name}
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRemove(name, false)}
                                                        className="p-1 bg-red-600 hover:bg-red-500 rounded"
                                                        title={t('menu.tooltips.remove')}
                                                        aria-label={t('menu.tooltips.remove')}
                                                    >
                                                        <AiOutlineDelete size={16}/>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRename(name, false)}
                                                        className="p-1 bg-yellow-600 hover:bg-yellow-500 rounded"
                                                        title={t('menu.tooltips.rename')}
                                                        aria-label={t('menu.tooltips.rename')}
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
                                    <h2 className="text-lg flex-shrink-0 font-bold">{t('menu.configurationsSectionTitle')}</h2>
                                    <div className="flex space-x-2 p-2">
                                        <button
                                            onClick={handleSaveConfiguration}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center"
                                            title={t('menu.tooltips.saveConfiguration')}
                                            aria-label={t('menu.tooltips.saveConfiguration')}
                                        >
                                            <AiOutlineDownload size={16} />
                                        </button>
                                        <button
                                            onClick={handleLoadClick}
                                            className="p-2 bg-green-600 hover:bg-green-500 rounded flex items-center justify-center"
                                            title={t('menu.tooltips.loadConfiguration')}
                                            aria-label={t('menu.tooltips.loadConfiguration')}
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
                                                title={t('menu.tooltips.loadConfigurationButton')}
                                                aria-label={t('menu.tooltips.loadConfigurationButton')}
                                            >
                                                {name}
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRemove(name, true)}
                                                    className="p-1 bg-red-600 hover:bg-red-500 rounded"
                                                    title={t('menu.tooltips.remove')}
                                                    aria-label={t('menu.tooltips.remove')}
                                                >
                                                    <AiOutlineDelete size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRename(name, true)}
                                                    className="p-1 bg-yellow-600 hover:bg-yellow-500 rounded"
                                                    title={t('menu.tooltips.rename')}
                                                    aria-label={t('menu.tooltips.rename')}
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
