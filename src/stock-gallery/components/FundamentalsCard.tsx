"use client";

import { TrendingUp, TrendingDown, BarChart3, DollarSign, Percent, Activity } from "lucide-react";
import type { Fundamentals, LatestQuote } from "@/stock-gallery/lib/types";

interface FundamentalsCardProps {
    latest: LatestQuote;
    fundamentals: Fundamentals;
    symbol: string;
    companyName: string;
}

function formatNumber(value: number | null | undefined, prefix: string = "", suffix: string = ""): string {
    if (value === null || value === undefined) return "N/A";
    if (value >= 1e12) return `${prefix}${(value / 1e12).toFixed(2)}T${suffix}`;
    if (value >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B${suffix}`;
    if (value >= 1e7) return `${prefix}${(value / 1e7).toFixed(2)}Cr${suffix}`;
    if (value >= 1e5) return `${prefix}${(value / 1e5).toFixed(2)}L${suffix}`;
    return `${prefix}${value.toLocaleString()}${suffix}`;
}

export default function FundamentalsCard({
    latest,
    fundamentals,
    symbol,
    companyName,
}: FundamentalsCardProps) {
    const isUp = latest.change >= 0;

    return (
        <div className="bg-white rounded-xl border-2 border-charcoal/10 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-charcoal">{symbol}</h2>
                    <p className="text-sm text-warmGray truncate max-w-xs">{companyName}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-charcoal">
                        ₹{latest.close.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center justify-end gap-1 ${isUp ? "text-green-600" : "text-red-600"}`}>
                        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-bold">
                            {isUp ? "+" : ""}₹{latest.change.toFixed(2)} ({latest.change_pct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Day Range */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="text-xs text-warmGray font-medium mb-1">Day Range</div>
                    <div className="text-sm font-bold text-charcoal">
                        ₹{fundamentals.day_low?.toFixed(2) || "N/A"} - ₹{fundamentals.day_high?.toFixed(2) || "N/A"}
                    </div>
                </div>

                {/* 52 Week Range */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="text-xs text-warmGray font-medium mb-1">52 Week Range</div>
                    <div className="text-sm font-bold text-charcoal">
                        ₹{fundamentals["52_week_low"]?.toFixed(2) || "N/A"} - ₹{fundamentals["52_week_high"]?.toFixed(2) || "N/A"}
                    </div>
                </div>

                {/* Volume */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-warmGray font-medium mb-1">
                        <BarChart3 className="w-3 h-3" />
                        Volume
                    </div>
                    <div className="text-sm font-bold text-charcoal">
                        {formatNumber(fundamentals.volume)}
                    </div>
                </div>

                {/* Market Cap */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-warmGray font-medium mb-1">
                        <DollarSign className="w-3 h-3" />
                        Market Cap
                    </div>
                    <div className="text-sm font-bold text-charcoal">
                        {formatNumber(fundamentals.market_cap, "₹")}
                    </div>
                </div>

                {/* P/E Ratio */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-warmGray font-medium mb-1">
                        <Activity className="w-3 h-3" />
                        P/E Ratio
                    </div>
                    <div className="text-sm font-bold text-charcoal">
                        {fundamentals.pe_ratio?.toFixed(2) || "N/A"}
                    </div>
                </div>

                {/* EPS */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="text-xs text-warmGray font-medium mb-1">EPS (TTM)</div>
                    <div className="text-sm font-bold text-charcoal">
                        ₹{fundamentals.eps?.toFixed(2) || "N/A"}
                    </div>
                </div>

                {/* Dividend Yield */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-warmGray font-medium mb-1">
                        <Percent className="w-3 h-3" />
                        Dividend Yield
                    </div>
                    <div className="text-sm font-bold text-charcoal">
                        {fundamentals.dividend_yield ? `${(fundamentals.dividend_yield * 100).toFixed(2)}%` : "N/A"}
                    </div>
                </div>

                {/* Sector */}
                <div className="bg-cream/50 rounded-lg p-3">
                    <div className="text-xs text-warmGray font-medium mb-1">Sector</div>
                    <div className="text-sm font-bold text-charcoal truncate">
                        {fundamentals.sector}
                    </div>
                </div>
            </div>
        </div>
    );
}
