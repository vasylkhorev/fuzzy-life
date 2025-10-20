// src/components/ModeMenu.js
import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineInfoCircle } from "react-icons/ai";
import RulesDialog from './RulesDialog';
import { availableModes } from '../modes';

const ModeMenu = ({ isOpen, setIsOpen, model, setModel, modeParams, setModeParams }) => {
    const [showRules, setShowRules] = useState(false);
    const [selectedModelForRules, setSelectedModelForRules] = useState(model);

    if (!isOpen) return null;

    const currentMode = availableModes.find(m => m.value === model);
    const paramKeys = Object.keys(modeParams || {});

    const handleParamChange = (key, value) => {
        setModeParams(prev => ({ ...prev, [key]: Number(value) }));
    };

    const handleShowRules = (modeValue) => {
        setSelectedModelForRules(modeValue);
        setShowRules(true);
    };

    const handleCloseRules = () => setShowRules(false);

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex z-40 justify-end">
                <div className="bg-slate-900 text-white w-80 max-w-sm overflow-y-auto">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-bold">Modes</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white p-1"
                            >
                                <AiOutlineClose size={20} />
                            </button>
                        </div>

                        <ul className="space-y-1 mb-4">
                            {availableModes.map(({ value, label }) => (
                                <li key={value}>
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setModel(value)}
                                            className={`flex-1 text-left p-2 rounded text-sm ${
                                                model === value ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                        <button
                                            onClick={() => handleShowRules(value)}
                                            className="ml-2 p-1 text-gray-400 hover:text-white rounded"
                                            title="View Rules"
                                        >
                                            <AiOutlineInfoCircle size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {currentMode && (
                            <div>
                                <h3 className="text-sm font-bold mb-2">{currentMode.label}</h3>
                                <p className="text-xs text-gray-300 mb-3">{currentMode.description}</p>

                                {paramKeys.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold">Parameters:</h4>
                                        {paramKeys.map(key => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <label className="text-xs w-20">{key}:</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={modeParams[key]}
                                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                                    className="flex-1 p-1 bg-gray-700 rounded text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {paramKeys.length === 0 && (
                                    <p className="text-xs text-gray-400">No editable parameters.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <RulesDialog
                isOpen={showRules}
                onClose={handleCloseRules}
                model={selectedModelForRules}
                modeInfo={availableModes.find(m => m.value === selectedModelForRules)}
            />
        </>
    );
};

export default ModeMenu;