"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [demoMode, setDemoMode] = useState(true);
    const [notifications, setNotifications] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-cream-dim">
                <div className="bg-bottleGreen p-4 flex justify-between items-center text-cream">
                    <h2 className="font-serif text-xl tracking-wide">System Settings</h2>
                    <button onClick={onClose} className="hover:text-amber transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-cream-dim">
                        <div>
                            <h3 className="text-charcoal font-bold">Demo Mode</h3>
                            <p className="text-warmGray text-sm">Simulate live market data</p>
                        </div>
                        <button
                            onClick={() => setDemoMode(!demoMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${demoMode ? 'bg-amber' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${demoMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-cream-dim">
                        <div>
                            <h3 className="text-charcoal font-bold">Notifications</h3>
                            <p className="text-warmGray text-sm">Real-time executive alerts</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-bottleGreen' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <button onClick={onClose} className="text-sm font-bold text-warmGray hover:text-charcoal uppercase tracking-widest">
                            Close Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
