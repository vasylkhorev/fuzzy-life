// config.js
export const GRID_SIZE = 200;

// Shared defaults for app-wide feature toggles.
export const DEFAULT_DEBUG_CONFIG = {
    /**
     * Overlay mode used when debugging:
     * - 'coordinates' renders row/column labels.
     * - 'intensity' renders the raw cell value (0-1).
     * - 'none' disables overlays entirely.
     */
    cellOverlayMode: 'none',
};

// Modes to hide from the UI
export const HIDDEN_MODES = ['exclusiveHalfLife', 'testMode'];

export const CELL_PIXEL_SIZE = 20;
export const CELL_PIXEL_MIN = 6;
export const CELL_PIXEL_MAX = 60;

// Structured help content used by the in-app Help dialog.
export const HELP_SECTIONS = [
    {
        titleKey: 'help.sections.simulationBasics.title',
        bullets: [
            {
                labelKey: 'help.sections.simulationBasics.bullets.runPause.label',
                bodyKey: 'help.sections.simulationBasics.bullets.runPause.body',
            },
            {
                labelKey: 'help.sections.simulationBasics.bullets.singleStep.label',
                bodyKey: 'help.sections.simulationBasics.bullets.singleStep.body',
            },
            {
                labelKey: 'help.sections.simulationBasics.bullets.clearGrid.label',
                bodyKey: 'help.sections.simulationBasics.bullets.clearGrid.body',
            },
        ],
    },
    {
        titleKey: 'help.sections.libraryFiles.title',
        bullets: [
            {
                labelKey: 'help.sections.libraryFiles.bullets.patternsTab.label',
                bodyKey: 'help.sections.libraryFiles.bullets.patternsTab.body',
            },
            {
                labelKey: 'help.sections.libraryFiles.bullets.configurationsTab.label',
                bodyKey: 'help.sections.libraryFiles.bullets.configurationsTab.body',
            },
            {
                labelKey: 'help.sections.libraryFiles.bullets.localStorage.label',
                bodyKey: 'help.sections.libraryFiles.bullets.localStorage.body',
            },
        ],
    },
];

export const HOTKEY_SECTIONS = [
    {
        titleKey: 'hotkeys.sections.navigation.title',
        shortcuts: [
            {
                id: 'panCamera',
                keyLabelKeys: ['hotkeys.keyLabels.click', 'hotkeys.keyLabels.drag'],
                actionKey: 'hotkeys.sections.navigation.shortcuts.panCamera.action',
                descriptionKey: 'hotkeys.sections.navigation.shortcuts.panCamera.description',
            },
            {
                id: 'zoomAtCursor',
                keyLabelKeys: ['hotkeys.keyLabels.alt', 'hotkeys.keyLabels.scroll'],
                actionKey: 'hotkeys.sections.navigation.shortcuts.zoomAtCursor.action',
                descriptionKey: 'hotkeys.sections.navigation.shortcuts.zoomAtCursor.description',
            },
            {
                id: 'resetZoom',
                keyLabelKeys: ['hotkeys.keyLabels.alt', 'hotkeys.keyLabels.zero'],
                actionKey: 'hotkeys.sections.navigation.shortcuts.resetZoom.action',
                descriptionKey: 'hotkeys.sections.navigation.shortcuts.resetZoom.description',
            },
        ],
    },
    {
        titleKey: 'hotkeys.sections.editing.title',
        shortcuts: [
            {
                id: 'toggleCell',
                keyLabelKeys: ['hotkeys.keyLabels.click'],
                actionKey: 'hotkeys.sections.editing.shortcuts.toggleCell.action',
                descriptionKey: 'hotkeys.sections.editing.shortcuts.toggleCell.description',
            },
            {
                id: 'dropPattern',
                keyLabelKeys: ['hotkeys.keyLabels.dragPatternCard'],
                actionKey: 'hotkeys.sections.editing.shortcuts.dropPattern.action',
                descriptionKey: 'hotkeys.sections.editing.shortcuts.dropPattern.description',
            },
            {
                id: 'clearSelection',
                keyLabelKeys: ['hotkeys.keyLabels.shift', 'hotkeys.keyLabels.drag'],
                actionKey: 'hotkeys.sections.editing.shortcuts.clearSelection.action',
                descriptionKey: 'hotkeys.sections.editing.shortcuts.clearSelection.description',
            },
            {
                id: 'undoAction',
                keyLabelKeys: ['hotkeys.keyLabels.ctrl', 'hotkeys.keyLabels.z'],
                actionKey: 'hotkeys.sections.editing.shortcuts.undoAction.action',
                descriptionKey: 'hotkeys.sections.editing.shortcuts.undoAction.description',
            },
        ],
    },
];
