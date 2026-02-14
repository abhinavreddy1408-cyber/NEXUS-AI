"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

export default function StockTicker() {
    const [stocks, setStocks] = useState<any[]>([]);

    useEffect(() => {
        async function fetchTicker() {
            try {
                const res = await fetch('/api/stocks');
                const json = await res.json();
                if (json.stocks) {
                    setStocks(json.stocks.map((s: any) => ({
                        symbol: s.symbol.replace('.NS', ''),
                        price: s.currentPrice,
                        change: (s.profitPercent > 0 ? "+" : "") + s.profitPercent + "%",
                        isUp: s.profitPercent >= 0
                    })));
                }
            } catch (e) {
                console.error("Failed to fetch ticker", e);
            }
        }

        fetchTicker();
        const interval = setInterval(fetchTicker, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fallback if loading or empty
    const displayStocks = stocks.length > 0 ? stocks : [
        { symbol: "NIFTY 50", price: 22000, change: "+0.5%", isUp: true },
        { symbol: "LOADING...", price: 0, change: "0%", isUp: true }
    ];

    return (
        <div className="w-full overflow-hidden bg-[#202124] border-b border-gray-800 py-3">
            <div className="flex animate-scroll whitespace-nowrap hover:pause">
                {[...displayStocks, ...displayStocks, ...displayStocks, ...displayStocks].map((stock, i) => (
                    <div key={i} className="mx-8 flex items-center space-x-3 text-xs font-bold tracking-widest uppercase">
                        <span className="text-amber">{stock.symbol}</span>
                        <span className="text-white">₹{typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}</span>
                        <span className={clsx(stock.isUp ? "text-vibrant-green" : "text-vibrant-red")}>
                            {stock.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
