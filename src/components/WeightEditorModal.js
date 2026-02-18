// src/components/WeightEditorModal.js
import React, { useState, useEffect } from 'react';
import { AiOutlineClose, AiOutlineInfoCircle, AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import { useTranslation } from '../i18n';

const PRESETS = [
    {
        id: 'standard',
        name: 'Standard (Radius 2)',
        neighborhoodSize: 2,
        birthRules: "2,3",
        survivalRules: "2,4",
        weights: {
            weightMinus1: 1.0, weightPlus1: 1.0,
            weightMinus2: 1.0, weightPlus2: 1.0
        }
    },
    {
        id: 'radius3',
        name: 'Rich Behavior (Radius 3)',
        neighborhoodSize: 3,
        birthRules: "3,4",
        survivalRules: "2,4,5",
        weights: {
            weightMinus1: 1.0, weightPlus1: 1.0,
            weightMinus2: 1.0, weightPlus2: 1.0,
            weightMinus3: 1.0, weightPlus3: 1.0
        }
    }
];

const WeightEditorModal = ({ isOpen, onClose, weights, neighborhoodSize, symmetric, birthRules, survivalRules, params, onWeightsChange, onNeighborhoodSizeChange, onSymmetricChange, onBirthRulesChange, onSurvivalRulesChange }) => {
    const { t } = useTranslation();

    // Store everything as strings locally to prevent cursor jumping and formatting issues
    const [localNeighborhoodSize, setLocalNeighborhoodSize] = useState(String(neighborhoodSize || 2));
    const [localSymmetric, setLocalSymmetric] = useState(symmetric !== false);
    const [localBirthRules, setLocalBirthRules] = useState(birthRules || "2,3");
    const [localSurvivalRules, setLocalSurvivalRules] = useState(survivalRules || "2,4");

    // Initialize weights as strings
    const initializeWeights = (size, sourceWeights) => {
        const newWeights = {};
        const nSize = parseInt(size) || 2;
        for (let i = 1; i <= nSize; i++) {
            const mKey = `weightMinus${i}`;
            const pKey = `weightPlus${i}`;
            newWeights[mKey] = sourceWeights?.[mKey] !== undefined ? String(sourceWeights[mKey]) : "1.0";
            newWeights[pKey] = sourceWeights?.[pKey] !== undefined ? String(sourceWeights[pKey]) : "1.0";
        }
        return newWeights;
    };

    const [localWeights, setLocalWeights] = useState(() => initializeWeights(neighborhoodSize, weights));

    // Reset local state ONLY when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalNeighborhoodSize(String(neighborhoodSize || 2));
            setLocalSymmetric(symmetric !== false);
            setLocalBirthRules(birthRules || "2,3");
            setLocalSurvivalRules(survivalRules || "2,4");
            setLocalWeights(initializeWeights(neighborhoodSize, weights));
        }
    }, [isOpen]);

    const notifyWeightsChange = (newLocalWeights) => {
        const numericWeights = {};
        Object.entries(newLocalWeights).forEach(([key, val]) => {
            const num = parseFloat(val);
            numericWeights[key] = isNaN(num) ? 0 : num;
        });
        onWeightsChange(numericWeights);
    };

    const handleWeightChange = (position, value) => {
        // Regex to allow numeric entry: optional minus, digits, optional decimal point and more digits
        if (value !== '' && value !== '-' && value !== '.' && value !== '-.' && !/^-?\d*\.?\d*$/.test(value)) {
            return;
        }

        const newWeights = { ...localWeights, [position]: value };

        // Handle symmetry
        if (localSymmetric) {
            if (position.startsWith('weightMinus')) {
                const index = position.replace('weightMinus', '');
                newWeights[`weightPlus${index}`] = value;
            } else if (position.startsWith('weightPlus')) {
                const index = position.replace('weightPlus', '');
                newWeights[`weightMinus${index}`] = value;
            }
        }

        setLocalWeights(newWeights);
        notifyWeightsChange(newWeights);
    };

    const handleSymmetricChange = (value) => {
        setLocalSymmetric(value);
        onSymmetricChange(value);

        if (value) {
            const syncedWeights = { ...localWeights };
            const nSize = parseInt(localNeighborhoodSize) || 2;
            for (let i = 1; i <= nSize; i++) {
                const mVal = localWeights[`weightMinus${i}`] || "1.0";
                const pVal = localWeights[`weightPlus${i}`] || "1.0";

                const mNum = parseFloat(mVal) || 0;
                const pNum = parseFloat(pVal) || 0;
                const avg = String((mNum + pNum) / 2);

                syncedWeights[`weightMinus${i}`] = avg;
                syncedWeights[`weightPlus${i}`] = avg;
            }
            setLocalWeights(syncedWeights);
            notifyWeightsChange(syncedWeights);
        }
    };

    const handleBirthRulesChange = (value) => {
        setLocalBirthRules(value);
        onBirthRulesChange(value);
    };

    const handleSurvivalRulesChange = (value) => {
        setLocalSurvivalRules(value);
        onSurvivalRulesChange(value);
    };

    const handleNeighborhoodSizeChange = (value) => {
        // value is a string from input or number from +/- buttons
        const stringValue = String(value);
        if (stringValue === '' || stringValue === '-') {
            setLocalNeighborhoodSize(stringValue);
            return;
        }

        const numValue = parseInt(stringValue);
        if (!isNaN(numValue)) {
            const newSize = Math.max(1, Math.min(5, numValue));
            const newSizeStr = String(newSize);
            setLocalNeighborhoodSize(newSizeStr);

            // Adjust weights for new size
            const adjustedWeights = initializeWeights(newSize, localWeights);
            setLocalWeights(adjustedWeights);

            onNeighborhoodSizeChange(newSize);
            notifyWeightsChange(adjustedWeights);
        }
    };

    const resetToDefault = () => {
        const standard = PRESETS.find(p => p.id === 'standard');
        if (standard) {
            handleApplyPreset(standard);
        }
    };

    const handleApplyPreset = (preset) => {
        const sizeStr = String(preset.neighborhoodSize);
        setLocalNeighborhoodSize(sizeStr);
        onNeighborhoodSizeChange(preset.neighborhoodSize);

        const weightsInit = initializeWeights(preset.neighborhoodSize, preset.weights);
        setLocalWeights(weightsInit);
        notifyWeightsChange(weightsInit);

        setLocalBirthRules(preset.birthRules);
        onBirthRulesChange(preset.birthRules);

        setLocalSurvivalRules(preset.survivalRules);
        onSurvivalRulesChange(preset.survivalRules);
    };

    const getWeightColor = (weightStr) => {
        const weight = parseFloat(weightStr) || 0;
        if (weight === 0) return 'bg-gray-300';
        if (weight < 0.5) return 'bg-blue-200';
        if (weight < 1.0) return 'bg-blue-300';
        if (weight < 1.5) return 'bg-blue-400';
        if (weight < 2.0) return 'bg-blue-500';
        return 'bg-blue-600';
    };

    const getWeightTextColor = (weightStr) => {
        const weight = parseFloat(weightStr) || 0;
        if (weight === 0 || weight >= 1.5) return 'text-white';
        return 'text-gray-800';
    };

    const renderNeighborhood = () => {
        const cells = [];
        const nSize = parseInt(localNeighborhoodSize) || 0;

        // Left controls
        if (nSize > 1) {
            cells.push(
                <div key="left-collapse" className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => handleNeighborhoodSizeChange(nSize - 1)}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 rounded flex items-center justify-center transition-colors"
                        title="Remove outer neighbors"
                    >
                        <AiOutlineMinus size={16} />
                    </button>
                </div>
            );
        }
        if (nSize < 5) {
            cells.push(
                <div key="left-expand" className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => handleNeighborhoodSizeChange(nSize + 1)}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white border-2 border-green-600 rounded flex items-center justify-center transition-colors"
                        title="Add neighbors"
                    >
                        <AiOutlinePlus size={16} />
                    </button>
                </div>
            );
        }

        // Neighbors Minus
        for (let i = nSize; i >= 1; i--) {
            const key = `weightMinus${i}`;
            cells.push(
                <div key={key} className="flex flex-col items-center">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={localWeights[key] || ""}
                        onChange={(e) => handleWeightChange(key, e.target.value)}
                        className={`w-16 h-16 ${getWeightColor(localWeights[key])} border-2 border-gray-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold ${getWeightTextColor(localWeights[key])}`}
                        placeholder="1.0"
                    />
                    <div className="mt-1 text-xs text-gray-600 text-center">Y-{i}</div>
                </div>
            );
        }

        // Center
        cells.push(
            <div key="center" className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                    <span className="font-bold text-white text-xs">X</span>
                </div>
                <div className="mt-1 text-xs text-gray-600 text-center">{t('weightEditor.center', 'Center')}</div>
            </div>
        );

        // Neighbors Plus
        for (let i = 1; i <= nSize; i++) {
            const key = `weightPlus${i}`;
            cells.push(
                <div key={key} className="flex flex-col items-center">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={localWeights[key] || ""}
                        onChange={(e) => handleWeightChange(key, e.target.value)}
                        className={`w-16 h-16 ${getWeightColor(localWeights[key])} border-2 border-gray-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold ${getWeightTextColor(localWeights[key])}`}
                        placeholder="1.0"
                    />
                    <div className="mt-1 text-xs text-gray-600 text-center">Y+{i}</div>
                </div>
            );
        }

        // Right controls
        if (nSize < 5) {
            cells.push(
                <div key="right-expand" className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => handleNeighborhoodSizeChange(nSize + 1)}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white border-2 border-green-600 rounded flex items-center justify-center transition-colors"
                    >
                        <AiOutlinePlus size={16} />
                    </button>
                </div>
            );
        }
        if (nSize > 1) {
            cells.push(
                <div key="right-collapse" className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => handleNeighborhoodSizeChange(nSize - 1)}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 rounded flex items-center justify-center transition-colors"
                    >
                        <AiOutlineMinus size={16} />
                    </button>
                </div>
            );
        }

        return cells;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{t('weightEditor.title', 'Weight Editor')}</h2>
                        <p className="text-sm text-gray-600 mt-1">{t('weightEditor.subtitle', 'Click on cells to set their weights')}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <AiOutlineClose size={24} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Presets:</span>
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyPreset(preset)}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-md text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={resetToDefault}
                        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-lg transition uppercase tracking-wider shadow-sm"
                    >
                        Reset to Defaults
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="flex justify-center items-center space-x-1">
                            {renderNeighborhood()}
                        </div>
                        <div className="mt-6 flex justify-center">
                            <div className="text-xs text-gray-600 text-center">
                                <div className="font-semibold mb-2">{t('weightEditor.legend', 'Weight Intensity')}</div>
                                <div className="flex items-center space-x-2">
                                    {[0, 0.5, 1.0, 1.5, 2.0].map(v => (
                                        <div key={v} className="flex items-center space-x-1">
                                            <div className={`w-4 h-4 border border-gray-400 ${getWeightColor(String(v))}`}></div>
                                            <span>{v === 2.0 ? '2.0+' : v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('weightEditor.birthRules', 'Birth Rules')}
                            </label>
                            <input
                                type="text"
                                value={localBirthRules}
                                onChange={(e) => handleBirthRulesChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="2,3"
                            />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('weightEditor.survivalRules', 'Survival Rules')}
                            </label>
                            <input
                                type="text"
                                value={localSurvivalRules}
                                onChange={(e) => handleSurvivalRulesChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="2,4"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSymmetric}
                                onChange={(e) => handleSymmetricChange(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-700">{t('weightEditor.symmetric', 'Symmetric Weights')}</div>
                                <div className="text-xs text-gray-500">{t('weightEditor.symmetricHelp', 'Keep left and right weights equal')}</div>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" onClick={resetToDefault} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                            {t('weightEditor.reset', 'Reset to Default')}
                        </button>
                        <div className="space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                                {t('weightEditor.cancel', 'Cancel')}
                            </button>
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                                {t('weightEditor.apply', 'Apply')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeightEditorModal;
