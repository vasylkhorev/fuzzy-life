// src/components/Controls.js
import React from 'react';
import Popover from './Popover';
import { BsArrowsMove } from 'react-icons/bs';
import { useTranslation } from '../i18n';

const Controls = ({
    runOrStop,
    isRunning,
    onReset,
    changeSpeed,
    speed,
    nextGeneration,
    generation,
    onDragHandleMouseDown,
    isDragging,
}) => {
    const { t } = useTranslation();

    return (
        <div className="w-72 rounded-lg border border-gray-700 bg-gray-900/95 p-4 text-white shadow-xl backdrop-blur pointer-events-auto">
            <div
                className={`mb-3 flex select-none items-center justify-between border-b border-gray-700 pb-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={onDragHandleMouseDown}
            >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    {t('controls.title')}
                </span>
                <span className="text-gray-500" title={t('controls.dragTooltip')}>
                    <BsArrowsMove
                        aria-hidden="true"
                        size={14}
                    />
                    <span className="sr-only">{t('controls.dragSrLabel')}</span>
                </span>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {t('controls.generation')}
                    </span>
                    <span className="text-lg font-semibold text-blue-400">{generation}</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={nextGeneration}
                        className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                        {t('controls.step')}
                    </button>
                    <button
                        onClick={runOrStop}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold text-white transition ${
                            isRunning
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                        }`}
                    >
                        {t(isRunning ? 'controls.stop' : 'controls.start')}
                    </button>
                    <button
                        onClick={onReset}
                        className="rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-600"
                    >
                        {t('controls.clear')}
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {t('controls.speed')}
                        <Popover
                            trigger="hover"
                            content={
                                <div className="text-sm text-white bg-gray-700 p-3 rounded-md">
                                    {t('controls.speedTooltip')}
                                </div>
                            }
                        >
                            <span className="cursor-help text-[11px] text-gray-300 underline decoration-dotted">
                                {t('controls.speedUnits')}
                            </span>
                        </Popover>
                    </label>
                    <input
                        type="number"
                        min="50"
                        max="2000"
                        value={speed}
                        onChange={(e) => changeSpeed(Number(e.target.value))}
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                    />
                </div>
            </div>
        </div>
    );
};

export default Controls;
