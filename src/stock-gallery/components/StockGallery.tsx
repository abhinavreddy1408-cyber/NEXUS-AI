"use client";

import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import SearchBar from "@/stock-gallery/components/SearchBar";
import DetailPanel from "@/stock-gallery/components/DetailPanel";
import type { StockSearchResult } from "@/stock-gallery/lib/types";

export default function StockGallery() {
    const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);

    return (
        <div className="min-h-screen bg-cream">
            {/* Hero Section */}
            <div className="bg-charcoal text-cream py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <BarChart3 className="w-10 h-10 text-amber" />
                        <h1 className="text-4xl font-serif font-bold">Stock Gallery</h1>
                    </div>
                    <p className="text-lg text-cream/80 mb-8">
                        Search any stock by symbol or company name to view comprehensive details,
                        <br />
                        interactive charts, AI-powered predictions, and recent news.
                    </p>

                    {/* Search Bar */}
                    <div className="flex justify-center">
                        <SearchBar onSelect={setSelectedStock} />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto py-16 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-charcoal/5">
                        <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mb-4">
                            <BarChart3 className="w-6 h-6 text-amber" />
                        </div>
                        <h3 className="font-serif font-bold text-xl text-charcoal mb-2">
                            Interactive Charts
                        </h3>
                        <p className="text-warmGray text-sm">
                            View candlestick charts with technical indicators including SMA, EMA, RSI,
                            and Bollinger Bands. Customize time periods from 1 day to 2 years.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-charcoal/5">
                        <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-amber" />
                        </div>
                        <h3 className="font-serif font-bold text-xl text-charcoal mb-2">
                            AI Predictions
                        </h3>
                        <p className="text-warmGray text-sm">
                            Get model-based price forecasts with 95% confidence intervals,
                            backtest metrics, and plain-language explanations of market drivers.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-charcoal/5">
                        <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-charcoal mb-2">
                            News & Sentiment
                        </h3>
                        <p className="text-warmGray text-sm">
                            Stay informed with recent news articles featuring sentiment analysis
                            to understand market perception at a glance.
                        </p>
                    </div>
                </div>

                {/* Quick Search Suggestions */}
                <div className="mt-16 text-center">
                    <h3 className="font-serif font-bold text-xl text-charcoal mb-4">
                        Popular Searches
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { symbol: "RELIANCE.NS", company_name: "Reliance Industries", exchange: "NSE", sector: "Oil & Gas" },
                            { symbol: "TCS.NS", company_name: "Tata Consultancy Services", exchange: "NSE", sector: "Technology" },
                            { symbol: "HDFCBANK.NS", company_name: "HDFC Bank", exchange: "NSE", sector: "Financial Services" },
                            { symbol: "INFY.NS", company_name: "Infosys", exchange: "NSE", sector: "Technology" },
                            { symbol: "ICICIBANK.NS", company_name: "ICICI Bank", exchange: "NSE", sector: "Financial Services" },
                        ].map((stock) => (
                            <button
                                key={stock.symbol}
                                onClick={() => setSelectedStock(stock)}
                                className="px-4 py-2 bg-white border-2 border-charcoal/10 rounded-lg text-sm font-medium text-charcoal hover:border-amber hover:bg-amber/5 transition-colors"
                            >
                                {stock.symbol.replace(".NS", "")}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Panel Modal */}
            {selectedStock && (
                <DetailPanel
                    stock={selectedStock}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    );
}
