// src/components/Controls.js
import React from 'react';
import Popover from './Popover';

const Controls = ({ runOrStop, isRunning, onReset, changeSpeed, speed, nextGeneration }) => {
    return (
        <div className="flex flex-col items-center space-y-2 p-4 bg-gray-800 text-white rounded-md shadow-lg w-full max-w-sm mx-auto">
            <div className="flex space-x-4">
                <button
                    onClick={nextGeneration}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    Next
                </button>
                <button
                    onClick={runOrStop}
                    className={`px-4 py-2 ${isRunning ? 'bg-red-500' : 'bg-green-500'} text-white rounded-md hover:${isRunning ? 'bg-red-600' : 'bg-green-600'} focus:outline-none focus:ring-2 focus:ring-red-300`}
                >
                    {isRunning ? "Stop" : "Start"}
                </button>
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    Clear
                </button>
            </div>

            <div className="flex space-x-4 items-center">
                <label className="text-lg font-semibold">Speed:</label>

                {/* Wrapper for the input with the always visible ? icon */}
                <div className="relative flex items-center">
                    <input
                        type="number"
                        min="100"
                        max="1000"
                        value={speed}
                        onChange={(e) => changeSpeed(Number(e.target.value))}
                        className="w-32 p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <Popover
                        trigger="hover"
                        content={
                            <div className="text-sm text-white bg-gray-600 p-3 rounded-md">
                                Period of one generation, in milliseconds, e.g., 500 means 2 generations per second.
                            </div>
                        }
                    >
                        <div className="m-3 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600">
                            <p>?</p>
                        </div>
                    </Popover>
                </div>
            </div>
        </div>
    );
};

export default Controls;