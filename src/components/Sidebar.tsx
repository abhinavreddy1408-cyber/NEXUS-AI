"use client";

import { Home, Sparkles, Settings } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
    activeTab: "dashboard" | "analysis";
    setActiveTab: (tab: "dashboard" | "analysis") => void;
    onOpenSettings: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings }: SidebarProps) {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-20 bg-bottleGreen flex flex-col items-center py-8 z-50 shadow-2xl border-r border-bottleGreen-dark">
            <div className="mb-12">
                <div className="w-10 h-10 rounded-full bg-amber flex items-center justify-center text-cream font-serif font-bold text-xl">
                    E
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-8 w-full">
                <button
                    onClick={() => setActiveTab("dashboard")}
                    className={clsx(
                        "flex flex-col items-center gap-2 w-full py-4 transition-all relative",
                        activeTab === "dashboard" ? "text-amber" : "text-cream/50 hover:text-cream"
                    )}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Dash</span>
                    {activeTab === "dashboard" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber shadow-[0_0_15px_#B06A20]"></div>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("analysis")}
                    className={clsx(
                        "flex flex-col items-center gap-2 w-full py-4 transition-all relative",
                        activeTab === "analysis" ? "text-amber" : "text-cream/50 hover:text-cream"
                    )}
                >
                    <Sparkles className="w-6 h-6" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">AI</span>
                    {activeTab === "analysis" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber shadow-[0_0_15px_#B06A20]"></div>
                    )}
                </button>
            </nav>

            <button
                onClick={onOpenSettings}
                className="flex flex-col items-center gap-2 text-cream/50 hover:text-amber transition-colors mt-auto"
            >
                <Settings className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Set</span>
            </button>
        </aside>
    );
}
