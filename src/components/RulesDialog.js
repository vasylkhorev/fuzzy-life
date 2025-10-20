// src/components/RulesDialog.js
import React, { useEffect, useRef } from 'react';
import { AiOutlineClose } from "react-icons/ai";
import { rulesHtmlMap } from '../modes';

const RulesDialog = ({ isOpen, onClose, model, modeInfo }) => {
    const dialogRef = useRef(null);

    // Whenever dialog opens or model changes, typeset MathJax
    useEffect(() => {
        if (isOpen && window.MathJax) {
            // allow the DOM to update first
            setTimeout(() => {
                // MathJax v2 API used in your original project
                if (window.MathJax && window.MathJax.Hub && typeof window.MathJax.Hub.Queue === 'function') {
                    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, dialogRef.current]);
                } else if (window.MathJax && window.MathJax.typesetPromise) {
                    // MathJax v3 fallback
                    window.MathJax.typesetPromise([dialogRef.current]).catch(() => {});
                }
            }, 50);
        }
    }, [isOpen, model]);

    if (!isOpen || !model) return null;

    const rulesHtml = rulesHtmlMap[model] || '<div class="prose text-gray-200">No rules available.</div>';
    const title = modeInfo ? `${modeInfo.label} Rules` : 'Unknown Mode Rules';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-slate-900 text-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl relative border border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                    <AiOutlineClose size={20} />
                </button>
                <h3 className="text-2xl font-bold mb-6 text-slate-100 border-b border-slate-700 pb-3">{title}</h3>

                {/* Render HTML with LaTeX inside. dialogRef used for MathJax target. */}
                <div
                    ref={dialogRef}
                    className="prose prose-slate max-w-none text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: rulesHtml }}
                />

                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesDialog;