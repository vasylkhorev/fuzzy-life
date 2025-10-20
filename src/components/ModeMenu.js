// src/components/ModeMenu.js
import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineFileText, AiOutlineCheckCircle } from "react-icons/ai";
import RulesDialog from './RulesDialog';
import { availableModes } from '../modes';

const ModeMenu = ({ isOpen, setIsOpen, model, setModel, modeParams, setModeParams }) => {
    const [showRules, setShowRules] = useState(false);
    const [selectedModelForRules, setSelectedModelForRules] = useState(model);

    if (!isOpen) return null;

    const currentMode = availableModes.find(m => m.value === model);
    const paramKeys = Object.keys(modeParams || {});

    const formatParamLabel = (rawKey = '') => rawKey
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();

    const handleParamChange = (key, value) => {
        setModeParams(prev => ({ ...prev, [key]: Number(value) }));
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
                        <h2 className="text-lg font-semibold text-white">Modes</h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Switch behaviours and fine-tune how the simulation evolves.
                        </p>
                    </div>
                    <button
                        onClick={closeMenu}
                        className="rounded-md border border-gray-600 px-2 py-1 text-gray-300 transition hover:border-gray-500 hover:text-white"
                        title="Close modes panel"
                    >
                        <AiOutlineClose size={16} />
                    </button>
                </header>

                <div className="border-b border-gray-700/80 bg-gray-900 px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                        {availableModes.map(({ value, label }) => {
                            const isActive = model === value;
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
                                    <span>{label}</span>
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
                                        <h3 className="text-lg font-semibold text-white">{currentMode.label}</h3>
                                        {currentMode.description && (
                                            <p className="mt-1 text-sm leading-relaxed text-gray-300">
                                                {currentMode.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openRulesFor(currentMode.value)}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-white"
                                    >
                                        <AiOutlineFileText size={15} />
                                        Rules
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                        Parameters
                                    </h4>
                                    {paramKeys.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                            Values update instantly
                                        </span>
                                    )}
                                </div>

                                {paramKeys.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {paramKeys.map((key) => (
                                            <label
                                                key={key}
                                                className="flex flex-col gap-2 rounded-md border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200"
                                            >
                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                                    {formatParamLabel(key)}
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={modeParams[key]}
                                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                                    className="w-full rounded border border-gray-600 bg-gray-900 px-2 py-2 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-md border border-dashed border-gray-600 bg-gray-900 p-4 text-sm text-gray-400">
                                        This mode uses default constants and does not expose any adjustable parameters yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/60 p-6 text-sm text-gray-400">
                            Select a mode from the list to view its details.
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
