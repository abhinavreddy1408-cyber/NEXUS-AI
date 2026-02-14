"use client";

import { useState } from "react";
import { Newspaper, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import type { NewsItem } from "@/stock-gallery/lib/types";

interface NewsListProps {
    news: NewsItem[];
}

function getSentimentIcon(score: number) {
    if (score > 0.2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score < -0.2) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-warmGray" />;
}

function getSentimentColor(score: number): string {
    if (score > 0.2) return "bg-green-50 border-green-200";
    if (score < -0.2) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
}

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function NewsList({ news }: NewsListProps) {
    const [expanded, setExpanded] = useState(false);
    const displayCount = expanded ? news.length : 5;
    const displayedNews = news.slice(0, displayCount);

    if (news.length === 0) {
        return (
            <div className="bg-white rounded-xl border-2 border-charcoal/10 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber/10 rounded-full flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-amber" />
                    </div>
                    <h3 className="font-serif font-bold text-charcoal">Recent News</h3>
                </div>
                <p className="text-warmGray text-sm">No recent news available for this stock.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border-2 border-charcoal/10 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber/10 rounded-full flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-amber" />
                </div>
                <div>
                    <h3 className="font-serif font-bold text-charcoal">Recent News</h3>
                    <p className="text-xs text-warmGray">{news.length} articles</p>
                </div>
            </div>

            {/* News List */}
            <div className="space-y-3">
                {displayedNews.map((item, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg border ${getSentimentColor(item.sentiment_score)} transition-colors hover:shadow-md`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {getSentimentIcon(item.sentiment_score)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-charcoal line-clamp-2 mb-1">
                                    {item.headline}
                                </h4>
                                <p className="text-xs text-warmGray line-clamp-2 mb-2">
                                    {item.summary}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-warmGray">
                                        {formatTimeAgo(item.timestamp)}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${item.sentiment_score > 0.2
                                                ? "text-green-600"
                                                : item.sentiment_score < -0.2
                                                    ? "text-red-600"
                                                    : "text-warmGray"
                                            }`}
                                    >
                                        {item.sentiment_score > 0.2
                                            ? "Positive"
                                            : item.sentiment_score < -0.2
                                                ? "Negative"
                                                : "Neutral"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expand/Collapse */}
            {news.length > 5 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-amber hover:text-amber/80 transition-colors"
                >
                    {expanded ? (
                        <>
                            Show Less <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Show All {news.length} Articles <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
