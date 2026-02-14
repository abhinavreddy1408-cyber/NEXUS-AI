"use client";

import { LayoutDashboard, TrendingUp, Sparkles, History, LogOut, Hexagon, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Stocks", href: "/stocks", icon: TrendingUp },
        { name: "Gallery", href: "/stock-gallery", icon: BarChart3 },
        { name: "Analysis", href: "/analysis", icon: Sparkles },
        { name: "History", href: "/history", icon: History },
    ];

    const handleLogout = async () => {
        try {
            await fetch("/api/auth", { method: "DELETE" });

            // Clear client-side flags
            if (typeof window !== "undefined") {
                localStorage.removeItem("user_email");
                localStorage.removeItem("nexus_auth");
            }

            router.push("/login"); // Redirect to unified login page
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <nav className="bg-[#202124] text-[#F5EFE8] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber rounded-lg flex items-center justify-center text-bottleGreen">
                    <Hexagon className="w-6 h-6 fill-current" />
                </div>
                <div>
                    <h1 className="font-serif text-2xl tracking-tight leading-none text-cream">Nexus AI</h1>
                    <p className="text-[10px] uppercase tracking-widest text-amber font-bold opacity-80">World's Paradise Ed.</p>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-bottleGreen-dark/30 p-1 rounded-full border border-white/5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm font-medium tracking-wide",
                                isActive
                                    ? "bg-amber text-cream shadow-md"
                                    : "text-cream/60 hover:text-cream hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <div className="text-xs text-cream font-serif italic">Welcome back,</div>
                    <div className="text-sm font-bold text-amber">Director Abhin</div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}
