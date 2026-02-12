// src/components/WeightEditorModal.js
import React, { useState, useEffect } from 'react';
import { AiOutlineClose, AiOutlineInfoCircle, AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import { useTranslation } from '../i18n';

const WeightEditorModal = ({ isOpen, onClose, weights, threshold, neighborhoodSize, symmetric, birthRules, survivalRules, onWeightsChange, onThresholdChange, onNeighborhoodSizeChange, onSymmetricChange, onBirthRulesChange, onSurvivalRulesChange }) => {
    const { t } = useTranslation();
    const [localNeighborhoodSize, setLocalNeighborhoodSize] = useState(neighborhoodSize || 2);
    const [localSymmetric, setLocalSymmetric] = useState(symmetric !== false); // Default to true
    const [localBirthRules, setLocalBirthRules] = useState(birthRules || "2,3");
    const [localSurvivalRules, setLocalSurvivalRules] = useState(survivalRules || "2,4");
    
    // Initialize weights based on neighborhood size
    const initializeWeights = (size) => {
        const newWeights = {};
        for (let i = 1; i <= size; i++) {
            newWeights[`weightMinus${i}`] = weights?.[`weightMinus${i}`] || 1.0;
            newWeights[`weightPlus${i}`] = weights?.[`weightPlus${i}`] || 1.0;
        }
        return newWeights;
    };
    
    const [localWeights, setLocalWeights] = useState(() => initializeWeights(localNeighborhoodSize));
    const [localThreshold, setLocalThreshold] = useState(threshold || 2.0);

    // Update weights when neighborhood size changes
    useEffect(() => {
        const newWeights = initializeWeights(localNeighborhoodSize);
        setLocalWeights(newWeights);
        onWeightsChange(newWeights);
    }, [localNeighborhoodSize]);

    const handleWeightChange = (position, value) => {
        // Allow empty value, zero, or valid numbers
        if (value === '' || value === '-' || value === '0' || value === '0.') {
            const newWeights = { ...localWeights, [position]: value };
            setLocalWeights(newWeights);
            onWeightsChange(newWeights);
            return;
        }
        
        // Parse as float, allow decimal points
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const newWeights = { ...localWeights, [position]: numValue };
            
            // If symmetric mode is enabled, mirror the change
            if (localSymmetric) {
                if (position.startsWith('weightMinus')) {
                    const index = position.replace('weightMinus', '');
                    const mirrorPosition = `weightPlus${index}`;
                    newWeights[mirrorPosition] = numValue;
                } else if (position.startsWith('weightPlus')) {
                    const index = position.replace('weightPlus', '');
                    const mirrorPosition = `weightMinus${index}`;
                    newWeights[mirrorPosition] = numValue;
                }
            }
            
            setLocalWeights(newWeights);
            onWeightsChange(newWeights);
        }
    };

    const handleSymmetricChange = (value) => {
        setLocalSymmetric(value);
        onSymmetricChange(value);
        
        // If enabling symmetric, sync all weights
        if (value) {
            const syncedWeights = { ...localWeights };
            for (let i = 1; i <= localNeighborhoodSize; i++) {
                const leftWeight = localWeights[`weightMinus${i}`] || 1.0;
                const rightWeight = localWeights[`weightPlus${i}`] || 1.0;
                const averageWeight = (parseFloat(leftWeight) + parseFloat(rightWeight)) / 2;
                syncedWeights[`weightMinus${i}`] = averageWeight;
                syncedWeights[`weightPlus${i}`] = averageWeight;
            }
            setLocalWeights(syncedWeights);
            onWeightsChange(syncedWeights);
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

    const handleThresholdChange = (value) => {
        // Allow empty value or valid numbers
        if (value === '' || value === '-') {
            setLocalThreshold(value);
            onThresholdChange(value);
            return;
        }
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setLocalThreshold(numValue);
            onThresholdChange(numValue);
        }
    };

    const handleNeighborhoodSizeChange = (value) => {
        // Allow empty value or valid numbers
        if (value === '' || value === '-') {
            setLocalNeighborhoodSize(value);
            onNeighborhoodSizeChange(value);
            return;
        }
        
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
            const newSize = Math.max(1, Math.min(5, numValue)); // Limit to reasonable range
            setLocalNeighborhoodSize(newSize);
            onNeighborhoodSizeChange(newSize);
        }
    };

    const resetToDefault = () => {
        const newWeights = initializeWeights(localNeighborhoodSize);
        setLocalWeights(newWeights);
        onWeightsChange(newWeights);
        setLocalThreshold(2.0);
        onThresholdChange(2.0);
        setLocalNeighborhoodSize(2);
        onNeighborhoodSizeChange(2);
        setLocalBirthRules("2,3");
        onBirthRulesChange("2,3");
        setLocalSurvivalRules("2,4");
        onSurvivalRulesChange("2,4");
    };

    const getWeightColor = (weight) => {
        if (weight === '' || weight === 0) return 'bg-gray-300';
        if (weight < 0.5) return 'bg-blue-200';
        if (weight < 1.0) return 'bg-blue-300';
        if (weight < 1.5) return 'bg-blue-400';
        if (weight < 2.0) return 'bg-blue-500';
        return 'bg-blue-600';
    };

    const getWeightTextColor = (weight) => {
        if (weight === '' || weight === 0 || weight >= 1.5) return 'text-white';
        return 'text-gray-800';
    };

    const renderNeighborhood = () => {
        const cells = [];
        
        // Left collapse button (if not at minimum size) - on the edge
        if (localNeighborhoodSize > 1) {
            cells.push(
                <div key="left-collapse" className="flex flex-col items-center">
                    <button
                        onClick={() => handleNeighborhoodSizeChange(localNeighborhoodSize - 1)}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 rounded flex items-center justify-center transition-colors"
                        title="Remove outer neighbors from both sides"
                    >
                        <AiOutlineMinus size={16} />
                    </button>
                </div>
            );
        }
        
        // Left expand button (if not at max size)
        if (localNeighborhoodSize < 5) {
            cells.push(
                <div key="left-expand" className="flex flex-col items-center">
                    <button
                        onClick={() => handleNeighborhoodSizeChange(localNeighborhoodSize + 1)}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white border-2 border-green-600 rounded flex items-center justify-center transition-colors"
                        title="Add neighbors on both sides"
                    >
                        <AiOutlinePlus size={16} />
                    </button>
                </div>
            );
        }
        
        // Left side neighbors
        for (let i = localNeighborhoodSize; i >= 1; i--) {
            cells.push(
                <div key={`minus${i}`} className="flex flex-col items-center">
                    <input
                        type="number"
                        step="0.1"
                        value={localWeights[`weightMinus${i}`] === '' || localWeights[`weightMinus${i}`] === '0' || localWeights[`weightMinus${i}`] === '0.' ? localWeights[`weightMinus${i}`] : (localWeights[`weightMinus${i}`] || 1.0)}
                        onChange={(e) => handleWeightChange(`weightMinus${i}`, e.target.value)}
                        className={`w-16 h-16 ${getWeightColor(localWeights[`weightMinus${i}`] || 1.0)} border-2 border-gray-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none font-bold ${getWeightTextColor(localWeights[`weightMinus${i}`] || 1.0)}`}
                        placeholder="1.0"
                    />
                    <div className="mt-1 text-xs text-gray-600 text-center">
                        Y-{i}
                    </div>
                </div>
            );
        }
        
        // Center cell
        cells.push(
            <div key="center" className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                    <span className="font-bold text-white text-xs">X</span>
                </div>
                <div className="mt-1 text-xs text-gray-600 text-center">
                    {t('weightEditor.center', 'Center')}
                </div>
            </div>
        );
        
        // Right side neighbors
        for (let i = 1; i <= localNeighborhoodSize; i++) {
            cells.push(
                <div key={`plus${i}`} className="flex flex-col items-center">
                    <input
                        type="number"
                        step="0.1"
                        value={localWeights[`weightPlus${i}`] === '' || localWeights[`weightPlus${i}`] === '0' || localWeights[`weightPlus${i}`] === '0.' ? localWeights[`weightPlus${i}`] : (localWeights[`weightPlus${i}`] || 1.0)}
                        onChange={(e) => handleWeightChange(`weightPlus${i}`, e.target.value)}
                        className={`w-16 h-16 ${getWeightColor(localWeights[`weightPlus${i}`] || 1.0)} border-2 border-gray-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none font-bold ${getWeightTextColor(localWeights[`weightPlus${i}`] || 1.0)}`}
                        placeholder="1.0"
                    />
                    <div className="mt-1 text-xs text-gray-600 text-center">
                        Y+{i}
                    </div>
                </div>
            );
        }
        
        // Right expand button (if not at max size)
        if (localNeighborhoodSize < 5) {
            cells.push(
                <div key="right-expand" className="flex flex-col items-center">
                    <button
                        onClick={() => handleNeighborhoodSizeChange(localNeighborhoodSize + 1)}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white border-2 border-green-600 rounded flex items-center justify-center transition-colors"
                        title="Add neighbors on both sides"
                    >
                        <AiOutlinePlus size={16} />
                    </button>
                </div>
            );
        }
        
        // Right collapse button (if not at minimum size)
        if (localNeighborhoodSize > 1) {
            cells.push(
                <div key="right-collapse" className="flex flex-col items-center">
                    <button
                        onClick={() => handleNeighborhoodSizeChange(localNeighborhoodSize - 1)}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 rounded flex items-center justify-center transition-colors"
                        title="Remove outer neighbors from both sides"
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t('weightEditor.title', 'Weight Editor')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {t('weightEditor.subtitle', 'Click on cells to set their weights')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <AiOutlineClose size={24} />
                    </button>
                </div>

                {/* Visual Neighborhood */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex justify-center items-center space-x-1">
                        {renderNeighborhood()}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex justify-center">
                        <div className="text-xs text-gray-600 text-center">
                            <div className="font-semibold mb-2">{t('weightEditor.legend', 'Weight Intensity')}</div>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-gray-300 border border-gray-400"></div>
                                    <span>0</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-blue-300 border border-gray-400"></div>
                                    <span>0.5</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-blue-400 border border-gray-400"></div>
                                    <span>1.0</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-blue-500 border border-gray-400"></div>
                                    <span>1.5</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 bg-blue-600 border border-gray-400"></div>
                                    <span>2.0+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <div className="p-6">

                {/* Birth Rules and Survival Rules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Birth Rules */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('weightEditor.birthRules', 'Birth Rules')}
                            <span className="ml-2 text-xs text-gray-500">
                                ({t('weightEditor.birthRulesHelp', 'Number of neighbors for birth (comma-separated)')})
                            </span>
                        </label>
                        <input
                            type="text"
                            value={localBirthRules}
                            onChange={(e) => handleBirthRulesChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="2,3"
                        />
                    </div>

                    {/* Survival Rules */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('weightEditor.survivalRules', 'Survival Rules')}
                            <span className="ml-2 text-xs text-gray-500">
                                ({t('weightEditor.survivalRulesHelp', 'Number of neighbors for survival (comma-separated)')})
                            </span>
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

                {/* Symmetric Option */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localSymmetric}
                            onChange={(e) => handleSymmetricChange(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">
                                {t('weightEditor.symmetric', 'Symmetric Weights')}
                            </div>
                            <div className="text-xs text-gray-500">
                                {t('weightEditor.symmetricHelp', 'Keep left and right weights equal (mirror symmetry)')}
                            </div>
                        </div>
                    </label>
                </div>

                {/* Info Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                        <AiOutlineInfoCircle className="text-blue-600 mt-0.5" size={16} />
                        <div className="text-sm text-blue-800">
                            <div className="font-semibold mb-1">
                                {t('weightEditor.howItWorks', 'How it works')}
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>{t('weightEditor.info1', 'Each neighbor cell contributes its weight when alive')}</li>
                                <li>{t('weightEditor.info2', 'The center cell (X) is the cell being evaluated')}</li>
                                <li>{t('weightEditor.info3', 'Birth: dead cell becomes alive if weighted sum ≥ threshold')}</li>
                                <li>{t('weightEditor.info4', 'Survival: live cell stays alive if weighted sum ≥ threshold')}</li>
                                <li>{t('weightEditor.info5', 'Neighborhood size determines how many neighbors on each side')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={resetToDefault}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        {t('weightEditor.reset', 'Reset to Default')}
                    </button>
                    <div className="space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            {t('weightEditor.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                        >
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
