import React from 'react';
import { useTranslation } from '../i18n';

const Info = ({ generation }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center space-y-4 p-2 bg-gray-800 text-white rounded-md shadow-lg w-full max-w-sm mx-auto">
            <div className="my-9 text-lg font-semibold">
                {t('info.generation')} <span className="text-blue-400">{generation}</span>
            </div>
        </div>
    );
};

export default Info;
