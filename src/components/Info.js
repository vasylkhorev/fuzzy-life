import React from 'react';

const Info = ({ generation }) => {
    return (
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-800 text-white rounded-md shadow-lg w-full max-w-sm mx-auto">
            <div className="my-9 text-lg font-semibold">
                Generation: <span className="text-blue-400">{generation}</span>
            </div>
        </div>
    );
};

export default Info;
