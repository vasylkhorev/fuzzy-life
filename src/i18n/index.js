import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { modeTranslations } from '../modes';

const translations = {
    en: {
        languageSwitcher: {
            ariaLabel: 'Language selection',
            options: {
                en: {
                    short: 'EN',
                    label: 'English',
                    title: 'Switch to English',
                },
                sk: {
                    short: 'SK',
                    label: 'Slovak',
                    title: 'Switch to Slovak',
                },
            },
        },
        common: {
            close: 'Close',
        },
        controls: {
            title: 'Controls',
            dragTooltip: 'Drag to reposition controls',
            dragSrLabel: 'Drag',
            generation: 'Generation',
            step: 'Step',
            start: 'Start',
            stop: 'Stop',
            clear: 'Clear',
            speed: 'Speed',
            speedUnits: 'ms',
            speedTooltip: 'Period (milliseconds) between generations. Lower values run faster.',
        },
        grid: {
            libraryButton: 'Library',
            libraryButtonTitle: 'Patterns & configurations',
            title: "Conway's Game of Life",
            modesButton: 'Modes',
            modesButtonTitle: 'Modes panel',
            helpButtonTitle: 'How to use',
        },
        menu: {
            headingEyebrow: 'Library',
            headingTitle: 'Patterns & Configurations',
            tabs: {
                patterns: 'Patterns',
                configurations: 'Configurations',
            },
            patternsSectionTitle: 'Patterns:',
            configurationsSectionTitle: 'Configurations:',
            customSectionLabel: 'Custom',
            tooltips: {
                close: 'Close',
                savePattern: 'Save pattern to local storage',
                dragPattern: 'Drag to place on grid or click to load at origin',
                downloadCurrentPattern: 'Download current grid as JSON pattern',
                remove: 'Remove',
                rename: 'Rename',
                saveConfiguration: 'Save configuration to local storage',
                loadConfiguration: 'Load configuration from file',
                loadConfigurationButton: 'Click to load full grid',
            },
            prompts: {
                removeConfirm: 'Remove "{{name}}"?',
                renamePrompt: 'Enter a new name',
                nameExists: 'That name is already in use.',
            },
            messages: {
                noLiveCells: 'No live cells to save.',
            },
            generatedNames: {
                pattern: 'Pattern {{day}}.{{month}}.{{year}} {{hours}}:{{minutes}}',
                configuration: 'Config {{day}}.{{month}}.{{year}} {{hours}}:{{minutes}}',
                patternDescription: 'Pattern saved at {{timestamp}}',
                configurationDescription: 'Configuration saved at {{timestamp}}',
            },
        },
        help: {
            title: 'How to Use the Game',
            subtitle:
                'Master the controls, explore patterns, and keep the simulation flowing - everything you need for fast iteration lives here.',
            close: 'Close',
            shortcutsTitle: 'Shortcuts & Gestures',
            languageHeading: 'Language',
            languageDescription: 'Switch the interface language instantly. Preferences are saved automatically.',
            sections: {
                simulationBasics: {
                    title: 'Simulation Basics',
                    bullets: {
                        runPause: {
                            label: 'Run & Pause',
                            body: 'Use the Start/Stop button in the floating controls to toggle the simulation without clearing the board.',
                        },
                        singleStep: {
                            label: 'Single Step',
                            body: 'Press Step to advance exactly one generation - perfect for debugging patterns or inspecting fuzzy transitions.',
                        },
                        clearGrid: {
                            label: 'Clear Grid',
                            body: 'Reset the world instantly with Clear. This keeps the current mode, speed, and camera position intact.',
                        },
                    },
                },
                libraryFiles: {
                    title: 'Library & Files',
                    bullets: {
                        patternsTab: {
                            label: 'Patterns Tab',
                            body: 'Drag any pattern onto the grid to drop it where you like. Saved patterns are normalized to their top-left cell.',
                        },
                        configurationsTab: {
                            label: 'Configurations Tab',
                            body: 'Click a configuration to replace the entire board. Use the upload icon to import `.json` exports.',
                        },
                        localStorage: {
                            label: 'Local Storage',
                            body: 'Custom saves live in your browser. Clearing site data removes them, so export important work regularly.',
                        },
                    },
                },
            },
        },
        hotkeys: {
            keyLabels: {
                click: 'Click',
                drag: 'Drag',
                alt: 'Alt',
                scroll: 'Scroll',
                zero: '0',
                dragPatternCard: 'Drag pattern card',
                shift: 'Shift',
                ctrl: 'Ctrl',
                z: 'Z',
            },
            sections: {
                navigation: {
                    title: 'Navigation',
                    shortcuts: {
                        panCamera: {
                            action: 'Pan the camera',
                            description: 'Move around large boards while keeping your zoom level intact.',
                        },
                        zoomAtCursor: {
                            action: 'Zoom at cursor',
                            description: 'Smoothly zoom in or out, anchored to wherever your pointer is hovering.',
                        },
                        resetZoom: {
                            action: 'Reset zoom',
                            description: 'Return to the default zoom level and recenter the grid in one motion.',
                        },
                    },
                },
                editing: {
                    title: 'Editing',
                    shortcuts: {
                        toggleCell: {
                            action: 'Toggle cell state',
                            description:
                                'Activate or deactivate a single cell. In fuzzy modes, toggles jump between off and a high starting value.',
                        },
                        dropPattern: {
                            action: 'Drop pattern',
                            description:
                                'Drag from the Library to preview placement, then release to stamp it into the world.',
                        },
                        clearSelection: {
                            action: 'Clear selected region',
                            description:
                                'Hold Shift and drag to outline a rectangle, then release to wipe every cell inside it.',
                        },
                        undoAction: {
                            action: 'Undo last action',
                            description:
                                'Press Ctrl+Z to revert the most recent edit, whether it was a clear, toggle, or pattern drop.',
                        },
                    },
                },
            },
        },
        modeMenu: {
            title: 'Modes',
            subtitle: 'Switch behaviours and fine-tune how the simulation evolves.',
            closeTitle: 'Close modes panel',
            rules: 'Rules',
            parameters: 'Parameters',
            instantUpdate: 'Values update instantly',
            boolean: {
                on: 'On',
                off: 'Off',
            },
            noParameters: 'This mode uses default constants and does not expose any adjustable parameters yet.',
            emptyState: 'Select a mode from the list to view its details.',
        },
        modeRules: {
            title: '{{mode}} Rules',
            unknownTitle: 'Unknown mode rules',
            fallback:
                '<div class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 text-slate-200">No rules available.</div>',
            close: 'Close',
        },
        info: {
            generation: 'Generation:',
        },
        alerts: {
            invalidConfigurationFile: 'Invalid configuration file.',
        },
    },
    sk: {
        languageSwitcher: {
            ariaLabel: 'Voľba jazyka',
            options: {
                en: {
                    short: 'EN',
                    label: 'Angličtina',
                    title: 'Prepnúť do angličtiny',
                },
                sk: {
                    short: 'SK',
                    label: 'Slovenčina',
                    title: 'Prepnúť do slovenčiny',
                },
            },
        },
        common: {
            close: 'Zavrieť',
        },
        controls: {
            title: 'Ovládanie',
            dragTooltip: 'Potiahnite pre premiestnenie ovládacieho panelu',
            dragSrLabel: 'Presunúť',
            generation: 'Generácia',
            step: 'Krok',
            start: 'Spustiť',
            stop: 'Zastaviť',
            clear: 'Vyčistiť',
            speed: 'Rýchlosť',
            speedUnits: 'ms',
            speedTooltip: 'Interval (v milisekundách) medzi generáciami. Nižšie hodnoty znamenajú rýchlejší beh.',
        },
        grid: {
            libraryButton: 'Knižnica',
            libraryButtonTitle: 'Vzory a konfigurácie',
            title: 'Conwayova hra života',
            modesButton: 'Režimy',
            modesButtonTitle: 'Panel režimov',
            helpButtonTitle: 'Ako používať',
        },
        menu: {
            headingEyebrow: 'Knižnica',
            headingTitle: 'Vzory a konfigurácie',
            tabs: {
                patterns: 'Vzory',
                configurations: 'Konfigurácie',
            },
            patternsSectionTitle: 'Vzory:',
            configurationsSectionTitle: 'Konfigurácie:',
            customSectionLabel: 'Vlastné',
            tooltips: {
                close: 'Zavrieť',
                savePattern: 'Uložiť vzor do lokálneho úložiska',
                dragPattern: 'Potiahnite pre umiestnenie na mriežku alebo kliknite pre načítanie na začiatok',
                remove: 'Odstrániť',
                rename: 'Premenovať',
                saveConfiguration: 'Uložiť konfiguráciu do lokálneho úložiska',
                loadConfiguration: 'Načítať konfiguráciu zo súboru',
                loadConfigurationButton: 'Kliknite pre načítanie celej mriežky',
            },
            prompts: {
                removeConfirm: 'Odstrániť "{{name}}"?',
                renamePrompt: 'Zadajte nový názov',
                nameExists: 'Tento názov sa už používa.',
            },
            messages: {
                noLiveCells: 'Nie sú žiadne živé bunky na uloženie.',
            },
            generatedNames: {
                pattern: 'Vzor {{day}}.{{month}}.{{year}} {{hours}}:{{minutes}}',
                configuration: 'Konfigurácia {{day}}.{{month}}.{{year}} {{hours}}:{{minutes}}',
                patternDescription: 'Vzor uložený {{timestamp}}',
                configurationDescription: 'Konfigurácia uložená {{timestamp}}',
            },
        },
        help: {
            title: 'Ako používať hru',
            subtitle:
                'Majte pod kontrolou ovládanie, preskúmajte vzory a udržujte simuláciu v pohybe - všetko potrebné pre rýchle iterácie nájdete tu.',
            close: 'Zavrieť',
            shortcutsTitle: 'Skratky a gestá',
            languageHeading: 'Jazyk',
            languageDescription: 'Zmeňte jazyk rozhrania okamžite. Voľba sa uloží automaticky.',
            sections: {
                simulationBasics: {
                    title: 'Základy simulácie',
                    bullets: {
                        runPause: {
                            label: 'Spustiť a pozastaviť',
                            body: 'Použite tlačidlo Štart/Stop v plávajúcich ovládacích prvkoch na prepínanie simulácie bez vymazania mriežky.',
                        },
                        singleStep: {
                            label: 'Jeden krok',
                            body: 'Stlačte Krok pre posun o jednu generáciu - ideálne na ladenie vzorov alebo sledovanie fuzzy prechodov.',
                        },
                        clearGrid: {
                            label: 'Vyčistiť mriežku',
                            body: 'Okamžite vymažte svet pomocou Vyčistiť. Zachová sa aktuálny režim, rýchlosť aj poloha kamery.',
                        },
                    },
                },
                libraryFiles: {
                    title: 'Knižnica a súbory',
                    bullets: {
                        patternsTab: {
                            label: 'Karta vzorov',
                            body: 'Pretiahnite ľubovoľný vzor na mriežku tam, kde ho chcete. Uložené vzory sa normalizujú na svoju hornú ľavú bunku.',
                        },
                        configurationsTab: {
                            label: 'Karta konfigurácií',
                            body: 'Kliknutím na konfiguráciu nahradíte celú mriežku. Na import `.json` exportov použite ikonu nahratia.',
                        },
                        localStorage: {
                            label: 'Lokálne úložisko',
                            body: 'Vlastné uloženia ostávajú vo vašom prehliadači. Vymazanie údajov stránky ich odstráni, preto dôležité projekty pravidelne exportujte.',
                        },
                    },
                },
            },
        },
        hotkeys: {
            keyLabels: {
                click: 'Klik',
                drag: 'Ťah',
                alt: 'Alt',
                scroll: 'Rolovanie',
                zero: '0',
                dragPatternCard: 'Potiahnuť kartu vzoru',
                shift: 'Shift',
                ctrl: 'Ctrl',
                z: 'Z',
            },
            sections: {
                navigation: {
                    title: 'Navigácia',
                    shortcuts: {
                        panCamera: {
                            action: 'Posúvanie kamery',
                            description: 'Pohybujte sa po veľkých mriežkach bez zmeny priblíženia.',
                        },
                        zoomAtCursor: {
                            action: 'Priblíženie pri kurzore',
                            description: 'Plynule približujte alebo odďaľujte so zachovaním pozície kurzora.',
                        },
                        resetZoom: {
                            action: 'Obnoviť priblíženie',
                            description: 'Jedným krokom sa vráťte na predvolené priblíženie a vycentrujte mriežku.',
                        },
                    },
                },
                editing: {
                    title: 'Úpravy',
                    shortcuts: {
                        toggleCell: {
                            action: 'Prepnutie bunky',
                            description:
                                'Aktivujte alebo deaktivujte jednotlivú bunku. Vo fuzzy režimoch prepína medzi vypnutím a vysokou počiatočnou hodnotou.',
                        },
                        dropPattern: {
                            action: 'Umiestniť vzor',
                            description:
                                'Pretiahnite z knižnice pre náhľad umiestnenia a uvoľnením ho vložte do sveta.',
                        },
                        clearSelection: {
                            action: 'Vyčistiť označenú oblasť',
                            description:
                                'Podržte Shift a ťahaním označte obdĺžnik; po pustení sa všetky bunky vnútri vymažú.',
                        },
                        undoAction: {
                            action: 'Vrátiť poslednú akciu',
                            description:
                                'Stlačte Ctrl+Z a vrátite najnovšiu úpravu, či už šlo o vymazanie, prepnutie alebo vloženie vzoru.',
                        },
                    },
                },
            },
        },
        modeMenu: {
            title: 'Režimy',
            subtitle: 'Prepínajte správanie a dolaďte, ako sa simulácia vyvíja.',
            closeTitle: 'Zavrieť panel režimov',
            rules: 'Pravidlá',
            parameters: 'Parametre',
            instantUpdate: 'Hodnoty sa aktualizujú okamžite',
            boolean: {
                on: 'Zapnuté',
                off: 'Vypnuté',
            },
            noParameters: 'Tento režim používa predvolené konštanty a momentálne neponúka nastaviteľné parametre.',
            emptyState: 'Vyberte režim zo zoznamu a zobrazia sa jeho detaily.',
        },
        modeRules: {
            title: 'Pravidlá režimu {{mode}}',
            unknownTitle: 'Neznáme pravidlá režimu',
            fallback:
                '<div class="rounded-lg border border-slate-700/70 bg-slate-800/60 p-4 text-slate-200">Pravidlá nie sú k dispozícii.</div>',
            close: 'Zavrieť',
        },

        info: {
            generation: 'Generácia:',
        },
        alerts: {
            invalidConfigurationFile: 'Neplatný súbor konfigurácie.',
        },
    },
};

Object.entries(modeTranslations).forEach(([lang, modesMap]) => {
    if (!translations[lang]) {
        translations[lang] = {};
    }
    translations[lang].modes = {
        ...(translations[lang].modes || {}),
        ...modesMap,
    };
});

const SUPPORTED_LANGUAGES = Object.keys(translations);
const FALLBACK_LANGUAGE = 'en';
const LANGUAGE_STORAGE_KEY = 'fuzzyLife.language';

const LanguageContext = createContext({
    language: FALLBACK_LANGUAGE,
    setLanguage: () => {},
    translate: (key) => key,
});

const resolveValue = (collection, key) => {
    return key.split('.').reduce((accumulator, segment) => {
        if (accumulator && Object.prototype.hasOwnProperty.call(accumulator, segment)) {
            return accumulator[segment];
        }
        return undefined;
    }, collection);
};

const formatTemplate = (value, replacements = {}) => {
    if (typeof value !== 'string') {
        return value;
    }
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) =>
        Object.prototype.hasOwnProperty.call(replacements, token) ? String(replacements[token]) : ''
    );
};

const translateValue = (language, key, replacements) => {
    const primary = resolveValue(translations[language], key);
    if (primary !== undefined) {
        return typeof primary === 'string' ? formatTemplate(primary, replacements) : primary;
    }
    if (language !== FALLBACK_LANGUAGE) {
        const fallback = resolveValue(translations[FALLBACK_LANGUAGE], key);
        if (fallback !== undefined) {
            return typeof fallback === 'string' ? formatTemplate(fallback, replacements) : fallback;
        }
    }
    return formatTemplate(key, replacements);
};

const getInitialLanguage = () => {
    if (typeof window === 'undefined') {
        return FALLBACK_LANGUAGE;
    }
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
    }
    const browserLanguage = window.navigator.language || '';
    const normalized = browserLanguage.toLowerCase();
    const detected = SUPPORTED_LANGUAGES.find((code) => normalized.startsWith(code));
    return detected || FALLBACK_LANGUAGE;
};

export const LanguageProvider = ({ children }) => {
    const [languageState, setLanguageState] = useState(getInitialLanguage);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, languageState);
            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.setAttribute('lang', languageState);
            }
        }
    }, [languageState]);

    const setLanguage = useCallback(
        (nextLanguage) => {
            if (SUPPORTED_LANGUAGES.includes(nextLanguage)) {
                setLanguageState(nextLanguage);
            }
        },
        [setLanguageState]
    );

    const value = useMemo(
        () => ({
            language: languageState,
            setLanguage,
            translate: (key, replacements) => translateValue(languageState, key, replacements),
        }),
        [languageState, setLanguage]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export const useTranslation = () => {
    const context = useLanguage();
    return {
        t: context.translate,
        language: context.language,
        setLanguage: context.setLanguage,
    };
};

export { SUPPORTED_LANGUAGES };
