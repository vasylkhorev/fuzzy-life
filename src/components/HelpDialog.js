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
                className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">{t('help.title')}</h3>
                        <p className="mt-1 text-sm text-slate-300">{t('help.subtitle')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="self-start rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/20"
                    >
                        {t('help.close')}
                    </button>
                </header>

                <div className="space-y-8">
                    <section className="space-y-3">
                        <h4 className="text-lg font-semibold text-slate-100">{t('help.languageHeading')}</h4>
                        <p className="text-sm text-slate-300">
                            {t('help.languageDescription')}
                        </p>
                        <LanguageSwitcher />
                    </section>

                    {HELP_SECTIONS.map((section) => (
                        <section key={section.titleKey} className="space-y-3">
                            <h4 className="text-lg font-semibold text-slate-100">{t(section.titleKey)}</h4>
                            <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                                {section.bullets.map((item) => (
                                    <li
                                        key={`${section.titleKey}-${item.labelKey}`}
                                        className="flex flex-col rounded-lg border border-white/5 bg-white/5 p-3"
                                    >
                                        <span className="text-sm font-semibold text-slate-100">
                                            {t(item.labelKey)}
                                        </span>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                            {t(item.bodyKey)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <section className="space-y-4">
                        <h4 className="text-lg font-semibold text-slate-100">{t('help.shortcutsTitle')}</h4>
                        <div className="space-y-3">
                            {HOTKEY_SECTIONS.map((section) => (
                                <div key={section.titleKey} className="space-y-2">
                                    <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        {t(section.titleKey)}
                                    </h5>
                                    <ul className="grid gap-2">
                                        {section.shortcuts.map((shortcut) => {
                                            const totalKeys = shortcut.keyLabelKeys.length;

                                            return (
                                                <li
                                                    key={`${section.titleKey}-${shortcut.id}`}
                                                    className="flex flex-col rounded-lg border border-white/5 bg-slate-800/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-slate-100">
                                                        {shortcut.keyLabelKeys.map((keyLabelKey, index) => (
                                                            <React.Fragment
                                                                key={`${shortcut.id}-${keyLabelKey}-${index}`}
                                                            >
                                                                <span className={keyCapClass}>{t(keyLabelKey)}</span>
                                                                {index < totalKeys - 1 && (
                                                                    <span className="px-1 text-xs font-semibold text-slate-400">
                                                                        +
                                                                    </span>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 grid min-w-0 gap-1 text-xs text-slate-300 sm:mt-0 sm:max-w-[60%]">
                                                        <span className="font-semibold text-slate-100">
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
