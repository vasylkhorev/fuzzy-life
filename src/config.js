// config.js
export const GRID_SIZE = 200;

// Shared defaults for app-wide feature toggles.
export const DEFAULT_DEBUG_CONFIG = {
    enabled: false,
    overlays: {
        showCellCoordinates: true,
    },
};

export const CELL_PIXEL_SIZE = 20;
export const CELL_PIXEL_MIN = 6;
export const CELL_PIXEL_MAX = 60;

// Structured help content used by the in-app Help dialog.
export const HELP_SECTIONS = [
    {
        title: 'Simulation Basics',
        bullets: [
            {
                label: 'Run & Pause',
                body: 'Use the Start/Stop button in the floating controls to toggle the simulation without clearing the board.',
            },
            {
                label: 'Single Step',
                body: 'Press Step to advance exactly one generation—perfect for debugging patterns or inspecting fuzzy transitions.',
            },
            {
                label: 'Clear Grid',
                body: 'Reset the world instantly with Clear. This keeps the current mode, speed, and camera position intact.',
            },
        ],
    },
    {
        title: 'Library & Files',
        bullets: [
            {
                label: 'Patterns Tab',
                body: 'Drag any pattern onto the grid to drop it where you like. Saved patterns are normalized to their top-left cell.',
            },
            {
                label: 'Configurations Tab',
                body: 'Click a configuration to replace the entire board. Use the upload icon to import `.json` exports.',
            },
            {
                label: 'Local Storage',
                body: 'Custom saves live in your browser. Clearing site data removes them, so export important work regularly.',
            },
        ],
    },
];

export const HOTKEY_SECTIONS = [
    {
        title: 'Navigation',
        shortcuts: [
            {
                keys: ['Click', 'Drag'],
                action: 'Pan the camera',
                description: 'Move around large boards while keeping your zoom level intact.',
            },
            {
                keys: ['Alt', 'Scroll'],
                action: 'Zoom at cursor',
                description: 'Smoothly zoom in or out, anchored to wherever your pointer is hovering.',
            },
            {
                keys: ['Alt', '0'],
                action: 'Reset zoom',
                description: 'Return to the default zoom level and recenter the grid in one motion.',
            },
        ],
    },
    {
        title: 'Editing',
        shortcuts: [
            {
                keys: ['Click'],
                action: 'Toggle cell state',
                description: 'Activate or deactivate a single cell. In fuzzy modes, toggles jump between off and a high starting value.',
            },
            {
                keys: ['Drag pattern card'],
                action: 'Drop pattern',
                description: 'Drag from the Library to preview placement, then release to stamp it into the world.',
            },
        ],
    },
];
