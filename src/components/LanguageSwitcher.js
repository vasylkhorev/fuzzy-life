import React, { useMemo } from 'react';
import { SUPPORTED_LANGUAGES, useLanguage, useTranslation } from '../i18n';
import { ReactComponent as FlagEn } from '../assets/flags/flag-en.svg';
import { ReactComponent as FlagSk } from '../assets/flags/flag-sk.svg';

const FLAG_COMPONENTS = {
    en: FlagEn,
    sk: FlagSk,
};

const getFlagIcon = (code) => {
    const Component = FLAG_COMPONENTS[code];
    if (!Component) {
        return <span className="inline-block h-10 w-10 rounded-sm bg-gray-700" aria-hidden="true" />;
    }
    return <Component aria-hidden="true" className="block h-full w-full" preserveAspectRatio="xMidYMid meet" />;
};

const LanguageSwitcher = ({ className = '' }) => {
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();

    const options = useMemo(
        () =>
            SUPPORTED_LANGUAGES.map((code) => ({
                code,
                short: t(`languageSwitcher.options.${code}.short`),
                label: t(`languageSwitcher.options.${code}.label`),
                title: t(`languageSwitcher.options.${code}.title`),
            })),
        [t]
    );

    return (
        <div
            className={`flex flex-col gap-3 ${className}`}
            role="group"
            aria-label={t('languageSwitcher.ariaLabel')}
        >
            <div className="flex flex-wrap gap-2">
                {options.map(({ code, short, label, title }) => {
                    const isActive = language === code;
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => setLanguage(code)}
                            className={`flex min-w-[8rem] items-center gap-3 rounded-md border px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                                isActive
                                    ? 'border-blue-500 bg-blue-600 text-white'
                                    : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                            }`}
                            aria-pressed={isActive}
                            title={title}
                        >
                            <span className="flex h-6 w-10 items-center justify-center overflow-hidden rounded-sm">
                                {getFlagIcon(code)}
                            </span>
                            <span className="flex flex-col items-start leading-tight">
                                <span className="text-xs font-semibold uppercase tracking-wider">{short}</span>
                                <span className="text-xs text-slate-300">{label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LanguageSwitcher;

