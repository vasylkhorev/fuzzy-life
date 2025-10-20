// src/components/HelpDialog.js
import React from 'react';

const HelpDialog = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-slate-900 text-white p-6 rounded-lg max-w-lg max-h-[80vh] overflow-y-auto shadow-lg">
                <h3 className="text-xl font-bold mb-4">How to Use the Game</h3>
                <p className="mb-2">
                    This is Conway's Game of Life grid, where you can interact with cells, patterns, and configurations. Switch modes in Controls for classic binary or continuous fuzzy evolution.
                </p>
                <ul className="ml-4 list-disc text-left list-outside mb-4">
                    <li>
                        <strong>Toggle Cells:</strong> Click on the grid to turn cells on (black) or off (empty). In continuous mode, values evolve smoothly between 0-1.
                    </li>
                    <li>
                        <strong>Pan:</strong> Click and drag the grid to move it around for better positioning.
                    </li>
                    <li>
                        <strong>Mode Selection:</strong> Use the "Mode" dropdown in Controls to switch between Classic (binary rules) and Continuous (fuzzy SmoothLife-like rules for gradual changes).
                    </li>
                    <li>
                        <strong>Menu:</strong> Click the hamburger icon (☰) at the top-left of the screen to open or close the side menu. This menu contains tabs for "Patterns" and "Configurations," where you can load, save, or manage custom patterns and configurations.
                    </li>
                    <li>
                        <strong>Patterns:</strong> In the "Patterns" tab, drag a pattern onto the grid to place it at
                        your chosen position.
                    </li>
                    <li>
                        <strong>Configurations:</strong> In the "Configurations" tab, click a configuration to replace
                        the entire grid with its saved state.
                    </li>
                    <li>
                        <strong>Saving:</strong> Use the download icon in the "Patterns" tab to save a pattern (shifted
                        to [0, 0]) or in the "Configurations" tab to save the full grid. These are stored in your
                        browser’s local storage. In continuous mode, saves capture cells >=0.5 as live.
                    </li>
                    <li>
                        <strong>Storage Note:</strong> Saved patterns and configurations persist in local storage until
                        you clear your browser’s cache or data (e.g., via browser settings or incognito mode).
                    </li>
                </ul>
                <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default HelpDialog;