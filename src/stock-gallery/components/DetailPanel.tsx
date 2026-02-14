"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, RefreshCw, Settings } from "lucide-react";
import type { StockDetails, StockSearchResult } from "@/stock-gallery/lib/types";
import CandlestickChart from "./CandlestickChart";
import VolumeChart from "./VolumeChart";
import FundamentalsCard from "./FundamentalsCard";
import PredictionCard from "./PredictionCard";
import NewsList from "./NewsList";

interface DetailPanelProps {
    stock: StockSearchResult;
    onClose: () => void;
}

type Period = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y";
type Interval = "5m" | "15m" | "1h" | "1d";

const PERIODS: { value: Period; label: string }[] = [
    { value: "1d", label: "1D" },
    { value: "5d", label: "5D" },
    { value: "1mo", label: "1M" },
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "2y", label: "2Y" },
];

function isMarketOpen(timestamp: string): boolean {
    const date = new Date(timestamp);
    const now = new Date();
    // Simple check: if data is more than 5 minutes old, consider it "Market Closed" state for UI
    // In reality, we'd check specific market hours, but freshness is a good proxy for "Live" vs "Snapshot"
    return (now.getTime() - date.getTime()) < 5 * 60 * 1000;
}

export default function DetailPanel({ stock, onClose }: DetailPanelProps) {
    const [data, setData] = useState<StockDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<Period>("1y");
    const [interval, setInterval] = useState<Interval>("1d");
    const [forecastHorizon, setForecastHorizon] = useState(7);
    const [showIndicators, setShowIndicators] = useState(false);
    const [enabledIndicators, setEnabledIndicators] = useState({
        sma20: true,
        sma50: false,
        ema20: false,
        bollinger: false,
    });

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                symbol: stock.symbol,
                period,
                interval,
                forecast_horizon: forecastHorizon.toString(),
            });

            const res = await fetch(`/api/stock-gallery/details?${params}`);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch details");
            }

            const json: StockDetails = await res.json();
            setData(json);
        } catch (e: any) {
            console.error("Details fetch error:", e);
            setError(e.message || "Failed to load stock details");
        } finally {
            setLoading(false);
        }
    }, [stock.symbol, period, interval, forecastHorizon]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const toggleIndicator = (key: keyof typeof enabledIndicators) => {
        setEnabledIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-panel-title"
        >
            <div className="bg-cream w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 bg-white">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 id="detail-panel-title" className="text-xl font-serif font-bold text-charcoal">
                                {stock.symbol}
                            </h2>
                            {data && (
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isMarketOpen(data.data_source.fetched_at)
                                        ? "bg-vibrant-green/10 text-vibrant-green border border-vibrant-green/20"
                                        : "bg-charcoal/5 text-charcoal/50 border border-charcoal/10"
                                        }`}>
                                        {isMarketOpen(data.data_source.fetched_at) ? "● Live" : "Market Closed"}
                                    </span>
                                    <span className="text-[10px] font-mono text-charcoal/40 bg-charcoal/5 px-1.5 py-0.5 rounded">
                                        {data.data_source.primary.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-warmGray">{stock.company_name}</p>
                        {data && (
                            <p className="text-[10px] text-charcoal/40 mt-1">
                                Updated: {new Date(data.data_source.fetched_at).toLocaleString()}
                                {data.data_source.discrepancy_detected && (
                                    <span className="text-amber ml-2" title="Minor price differences detected between sources">
                                        ⚠️ Cross-validation alert
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDetails}
                            disabled={loading}
                            className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Refresh data"
                        >
                            <RefreshCw className={`w-5 h-5 text-charcoal ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowIndicators(!showIndicators)}
                            className={`p-2 rounded-lg transition-colors ${showIndicators ? "bg-amber text-white" : "hover:bg-charcoal/5"
                                }`}
                            aria-label="Toggle indicator settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
                            aria-label="Close panel"
                        >
                            <X className="w-5 h-5 text-charcoal" />
                        </button>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-charcoal/10">
                    <span className="text-xs font-medium text-warmGray mr-2">Period:</span>
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${period === p.value
                                ? "bg-charcoal text-white"
                                : "bg-cream text-charcoal hover:bg-charcoal/10"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}

                    {/* Indicator toggles */}
                    {showIndicators && (
                        <div className="ml-4 flex items-center gap-2 pl-4 border-l border-charcoal/10">
                            <span className="text-xs font-medium text-warmGray">Overlays:</span>
                            {Object.entries(enabledIndicators).map(([key, enabled]) => (
                                <button
                                    key={key}
                                    onClick={() => toggleIndicator(key as keyof typeof enabledIndicators)}
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${enabled ? "bg-amber text-white" : "bg-cream text-charcoal hover:bg-amber/20"
                                        }`}
                                >
                                    {key.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-scroll p-6 min-h-0 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-amber animate-spin" />
                                <span className="text-sm text-warmGray">Loading stock details...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-red-600 font-medium mb-2">{error}</p>
                                <button
                                    onClick={fetchDetails}
                                    className="text-sm text-amber hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <FundamentalsCard
                                latest={data.latest}
                                fundamentals={data.fundamentals}
                                symbol={data.symbol}
                                companyName={data.company_name}
                            />

                            {/* Charts */}
                            <div className="bg-white rounded-xl border-2 border-charcoal/10 p-4 shadow-lg">
                                <h3 className="font-serif font-bold text-charcoal mb-4">Price Chart</h3>
                                <CandlestickChart
                                    data={data.historical}
                                    indicators={data.indicators}
                                    forecast={data.prediction.available ? data.prediction.forecast : []}
                                    enabledIndicators={enabledIndicators}
                                    height={350}
                                />
                                <div className="mt-2">
                                    <h4 className="text-xs font-medium text-warmGray mb-2">Volume</h4>
                                    <VolumeChart data={data.historical} height={60} />
                                </div>
                            </div>

                            {/* Prediction + News Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <PredictionCard
                                    prediction={data.prediction}
                                    onHorizonChange={(h) => setForecastHorizon(h)}
                                    selectedHorizon={forecastHorizon}
                                />
                                <NewsList news={data.news} />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
