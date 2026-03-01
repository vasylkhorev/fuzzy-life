import React from 'react';
import { HELP_SECTIONS, HOTKEY_SECTIONS } from '../config';
import { useTranslation } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

const keyCapClass =
    'inline-flex min-w-[2.25rem] max-w-[7.5rem] justify-center rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide whitespace-normal break-words leading-tight text-center';

const HelpDialog = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-gray-900/95 p-6 text-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">{t('help.title')}</h3>
                        <p className="mt-1 text-sm text-gray-300">{t('help.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3 self-start">
                        <a
                            href="https://github.com/vasylkhorev/fuzzy-life"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center rounded-md bg-white/10 p-2 text-gray-200 transition hover:bg-white/20 hover:text-white"
                            title="GitHub Repository"
                            aria-label="GitHub Repository"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-200 transition hover:bg-white/20"
                        >
                            {t('help.close')}
                        </button>
                    </div>
                </header>

                <div className="space-y-8">
                    <section className="space-y-3">
                        <h4 className="text-lg font-semibold text-gray-100">{t('help.languageHeading')}</h4>
                        <p className="text-sm text-gray-300">
                            {t('help.languageDescription')}
                        </p>
                        <LanguageSwitcher />
                    </section>

                    {HELP_SECTIONS.map((section) => (
                        <section key={section.titleKey} className="space-y-3">
                            <h4 className="text-lg font-semibold text-gray-100">{t(section.titleKey)}</h4>
                            <ul className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                                {section.bullets.map((item) => (
                                    <li
                                        key={`${section.titleKey}-${item.labelKey}`}
                                        className="flex flex-col rounded-lg border border-white/5 bg-white/5 p-3"
                                    >
                                        <span className="text-sm font-semibold text-gray-100">
                                            {t(item.labelKey)}
                                        </span>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-300">
                                            {t(item.bodyKey)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <section className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-100">{t('help.shortcutsTitle')}</h4>
                        <div className="space-y-3">
                            {HOTKEY_SECTIONS.map((section) => (
                                <div key={section.titleKey} className="space-y-2">
                                    <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                        {t(section.titleKey)}
                                    </h5>
                                    <ul className="grid gap-2">
                                        {section.shortcuts.map((shortcut) => {
                                            const totalKeys = shortcut.keyLabelKeys.length;

                                            return (
                                                <li
                                                    key={`${section.titleKey}-${shortcut.id}`}
                                                    className="flex flex-col rounded-lg border border-white/5 bg-gray-800/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-gray-100">
                                                        {shortcut.keyLabelKeys.map((keyLabelKey, index) => (
                                                            <React.Fragment
                                                                key={`${shortcut.id}-${keyLabelKey}-${index}`}
                                                            >
                                                                <span className={keyCapClass}>{t(keyLabelKey)}</span>
                                                                {index < totalKeys - 1 && (
                                                                    <span className="px-1 text-xs font-semibold text-gray-400">
                                                                        +
                                                                    </span>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 grid min-w-0 gap-1 text-xs text-gray-300 sm:mt-0 sm:max-w-[60%]">
                                                        <span className="font-semibold text-gray-100">
                                                            {t(shortcut.actionKey)}
                                                        </span>
                                                        <span className="leading-relaxed">
                                                            {t(shortcut.descriptionKey)}
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HelpDialog;
