import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
    const shortcuts = [
        { key: '1', description: 'Navigate to Call-Center Dashboard' },
        { key: '2', description: 'Navigate to Incoming Reports Stream' },
        { key: '3', description: 'Navigate to Active Incidents Register' },
        { key: '4', description: 'Navigate to Tactical GIS Map' },
        { key: '5', description: 'Navigate to Response Dispatch Panel' },
        { key: 'N', description: 'Log New 911 Intake / Raw Report' },
        { key: 'M', description: 'Toggle Call-Center Audio Chimes / Radio Mute' },
        { key: '/', description: 'Focus Global Search & Filter Bar' },
        { key: '?', description: 'Open this Keyboard Shortcuts Cheat Sheet' },
        { key: 'Esc', description: 'Close any active Modal, Drawer, or Triage Window' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn select-none">
            <div className="bg-white border border-sky-400/30 rounded-2xl w-full max-w-lg p-5 shadow-[0_0_35px_rgba(56,189,248,0.30)] space-y-4">
                <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-sky-600" />
                        <h3 className="text-sm font-bold text-slate-900">Call-Center Keyboard Shortcuts</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-sky-100/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2 text-xs">
                    {shortcuts.map((sc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-sky-50/40 border border-sky-400/20 shadow-sm">
                            <span className="text-slate-700 font-medium">{sc.description}</span>
                            <kbd className="px-2 py-1 rounded bg-white border border-sky-400/30 text-sky-700 font-mono font-bold text-[11px] shadow-sm">
                                {sc.key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                    Ergonomic Rapid Dispatch Mode • Key bindings active throughout CAD session
                </div>
            </div>
        </div>
    );
};
