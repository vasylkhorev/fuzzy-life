// src/components/HelpDialog.js
import React from 'react';
import { HELP_SECTIONS, HOTKEY_SECTIONS } from '../config';

const keyCapClass =
    'inline-flex min-w-[2.25rem] max-w-[7.5rem] justify-center rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide whitespace-normal break-words leading-tight text-center';

const HelpDialog = ({ isOpen, onClose }) => {
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
                        <h3 className="text-2xl font-bold tracking-tight">How to Use the Game</h3>
                        <p className="mt-1 text-sm text-slate-300">
                            Master the controls, explore patterns, and keep the simulation flowing—everything you need
                            for fast iteration lives here.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="self-start rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/20"
                    >
                        Close
                    </button>
                </header>

                <div className="space-y-8">
                    {HELP_SECTIONS.map((section) => (
                        <section key={section.title} className="space-y-3">
                            <h4 className="text-lg font-semibold text-slate-100">{section.title}</h4>
                            <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                                {section.bullets.map((item) => (
                                    <li
                                        key={`${section.title}-${item.label}`}
                                        className="flex flex-col rounded-lg border border-white/5 bg-white/5 p-3"
                                    >
                                        <span className="text-sm font-semibold text-slate-100">{item.label}</span>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.body}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <section className="space-y-4">
                        <h4 className="text-lg font-semibold text-slate-100">Shortcuts &amp; Gestures</h4>
                        <div className="space-y-3">
                            {HOTKEY_SECTIONS.map((section) => (
                                <div key={section.title} className="space-y-2">
                                    <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        {section.title}
                                    </h5>
                                    <ul className="grid gap-2">
                                        {section.shortcuts.map((shortcut) => (
                                            <li
                                                key={`${section.title}-${shortcut.action}`}
                                                className="flex flex-col rounded-lg border border-white/5 bg-slate-800/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-slate-100">
                                                    {shortcut.keys.map((keyLabel, index) => (
                                                        <React.Fragment key={`${shortcut.action}-${keyLabel}-${index}`}>
                                                            <span className={keyCapClass}>{keyLabel}</span>
                                                            {index < shortcut.keys.length - 1 && (
                                                                <span className="px-1 text-xs font-semibold text-slate-400">
                                                                    +
                                                                </span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                                <div className="mt-2 grid min-w-0 gap-1 text-xs text-slate-300 sm:mt-0 sm:max-w-[60%]">
                                                    <span className="font-semibold text-slate-100">
                                                        {shortcut.action}
                                                    </span>
                                                    <span className="leading-relaxed">{shortcut.description}</span>
                                                </div>
                                            </li>
                                        ))}
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
