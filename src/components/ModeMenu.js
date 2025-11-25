// src/components/ModeMenu.js
import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineFileText, AiOutlineCheckCircle } from "react-icons/ai";
import RulesDialog from './RulesDialog';
import { availableModes } from '../modes';
import { useTranslation } from '../i18n';

const ModeMenu = ({ isOpen, setIsOpen, model, setModel, modeParams, setModeParams }) => {
    const [showRules, setShowRules] = useState(false);
    const [selectedModelForRules, setSelectedModelForRules] = useState(model);
    const { t } = useTranslation();

    const translateOrFallback = (key, fallbackValue = '') => {
        const translated = t(key);
        return translated === key ? fallbackValue : translated;
    };

    if (!isOpen) return null;

    const currentMode = availableModes.find(m => m.value === model);
    const paramKeys = Object.keys(modeParams || {});

    const formatParamLabel = (rawKey = '') => rawKey
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();

    const handleParamChange = (key, value) => {
        setModeParams(prev => {
            const previousValue = prev?.[key];
            if (typeof previousValue === 'number') {
                return { ...prev, [key]: Number(value) };
            }
            if (typeof previousValue === 'boolean') {
                return { ...prev, [key]: Boolean(value) };
            }
            return { ...prev, [key]: value };
        });
    };

    const openRulesFor = (modeValue) => {
        setSelectedModelForRules(modeValue);
        setShowRules(true);
    };

    const closeRules = () => setShowRules(false);

    const closeMenu = () => {
        setIsOpen(false);
        setShowRules(false);
    };

    return (
        <React.Fragment>
            <div
                className="fixed inset-0 z-40 bg-black/30"
                onClick={closeMenu}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-700 bg-gray-900 text-white shadow-2xl">
                <header className="flex items-start justify-between border-b border-gray-700/80 px-6 py-4 bg-gray-900">
                    <div>
                        <h2 className="text-lg font-semibold text-white">{t('modeMenu.title')}</h2>
                        <p className="mt-1 text-xs text-gray-400">{t('modeMenu.subtitle')}</p>
                    </div>
                    <button
                        onClick={closeMenu}
                        className="rounded-md border border-gray-600 px-2 py-1 text-gray-300 transition hover:border-gray-500 hover:text-white"
                        title={t('modeMenu.closeTitle')}
                        aria-label={t('modeMenu.closeTitle')}
                    >
                        <AiOutlineClose size={16} />
                    </button>
                </header>

                <div className="border-b border-gray-700/80 bg-gray-900 px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                        {availableModes.map(({ value, label }) => {
                            const isActive = model === value;
                            const optionLabel = translateOrFallback(`modes.${value}.label`, label || formatParamLabel(value));
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setModel(value)}
                                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                                        isActive
                                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                            : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:text-white'
                                    }`}
                                >
                                    <span>{optionLabel}</span>
                                    {isActive && <AiOutlineCheckCircle size={13} className="text-white" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <section className="flex-1 overflow-y-auto px-6 py-6">
                    {currentMode ? (
                        <div className="space-y-6">
                            <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        {(() => {
                                            const modeLabel = translateOrFallback(
                                                `modes.${currentMode.value}.label`,
                                                currentMode.label || formatParamLabel(currentMode.value)
                                            );
                                            const modeDescription = translateOrFallback(
                                                `modes.${currentMode.value}.description`,
                                                currentMode.description || ''
                                            );
                                            return (
                                                <>
                                                    <h3 className="text-lg font-semibold text-white">{modeLabel}</h3>
                                                    {modeDescription && (
                                                        <p className="mt-1 text-sm leading-relaxed text-gray-300">
                                                            {modeDescription}
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openRulesFor(currentMode.value)}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-white"
                                    >
                                        <AiOutlineFileText size={15} />
                                        {translateOrFallback('modeMenu.rules', 'Rules')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                        {translateOrFallback('modeMenu.parameters', 'Parameters').toUpperCase()}
                                    </h4>
                                    {paramKeys.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {translateOrFallback('modeMenu.instantUpdate', 'Values update instantly')}
                                        </span>
                                    )}
                                </div>

                                {paramKeys.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {paramKeys.map((key) => {
                                            const currentValue = modeParams[key];
                                            const isBooleanParam = typeof currentValue === 'boolean';
                                            const labelText = translateOrFallback(
                                                `modes.${currentMode.value}.params.${key}.label`,
                                                formatParamLabel(key)
                                            );
                                            const helpText = translateOrFallback(
                                                `modes.${currentMode.value}.params.${key}.help`,
                                                currentMode?.parameterHelp?.[key]
                                            );
                                            return (
                                                <label
                                                    key={key}
                                                    className="flex h-full flex-col gap-3 rounded-md border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200"
                                                >
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                                            {labelText}
                                                        </span>
                                                        {helpText && (
                                                            <span className="block min-h-[72px] text-xs leading-snug text-gray-400">
                                                                {helpText}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isBooleanParam ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParamChange(key, !currentValue)}
                                                            className={`mt-auto rounded-md border px-3 py-2 text-sm font-semibold transition ${
                                                                currentValue
                                                                    ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-500'
                                                                    : 'border-gray-600 bg-gray-900 text-gray-200 hover:border-blue-400 hover:text-white'
                                                            }`}
                                                        >
                                                            {currentValue
                                                                ? translateOrFallback('modeMenu.boolean.on', 'On')
                                                                : translateOrFallback('modeMenu.boolean.off', 'Off')}
                                                        </button>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            value={currentValue}
                                                            onChange={(e) => handleParamChange(key, e.target.value)}
                                                            className="mt-auto w-full rounded border border-gray-600 bg-gray-900 px-2 py-2 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40"
                                                        />
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="rounded-md border border-dashed border-gray-600 bg-gray-900 p-4 text-sm text-gray-400">
                                        {translateOrFallback(
                                            'modeMenu.noParameters',
                                            'This mode uses default constants and does not expose any adjustable parameters yet.'
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/60 p-6 text-sm text-gray-400">
                            {translateOrFallback(
                                'modeMenu.emptyState',
                                'Select a mode from the list to view its details.'
                            )}
                        </div>
                    )}
                </section>
            </aside>

            <RulesDialog
                isOpen={showRules}
                onClose={closeRules}
                model={selectedModelForRules}
                modeInfo={availableModes.find(m => m.value === selectedModelForRules)}
            />
        </React.Fragment>
    );
};

export default ModeMenu;
