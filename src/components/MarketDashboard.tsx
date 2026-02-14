"use client";

import { useEffect, useState, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { io, Socket } from "socket.io-client";
import clsx from "clsx";

// Fallback initial data in case of fetch delay
const INITIAL_DATA = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: 24000 + (Math.sin(i) * 200),
}));

export default function MarketDashboard() {
    const [data, setData] = useState<any[]>(INITIAL_DATA);
    const [currentPrice, setCurrentPrice] = useState(22000.00);
    const [trend, setTrend] = useState<"up" | "down">("up");
    const [selectedStock, setSelectedStock] = useState({ symbol: "^NSEI", name: "NIFTY 50", price: 0 });
    const [stockList, setStockList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // WS Refs
    const socketRef = useRef<Socket | null>(null);

    // 1. Fetch Stock List (Movers) via HTTP (for initial listing)
    useEffect(() => {
        async function fetchStocks() {
            try {
                const res = await fetch('/api/stocks');
                const json = await res.json();
                if (json.stocks) {
                    setStockList(json.stocks.map((s: any) => ({
                        name: s.symbol.replace('.NS', ''), // Clean name
                        symbol: s.symbol,
                        price: s.currentPrice,
                        rawChange: s.profitPercent,
                        change: (s.profitPercent > 0 ? "+" : "") + s.profitPercent + "%",
                        isUp: s.profitPercent >= 0,
                        vol: "1.2M" // Mock volume for now
                    })));
                }
            } catch (e) {
                console.error("Failed to fetch stocks list", e);
            }
        }
        fetchStocks();
        const interval = setInterval(fetchStocks, 5000); // Update list prices
        return () => clearInterval(interval);
    }, []);

    // 2. WebSocket Connection for Real-time Graph
    useEffect(() => {
        // Init Socket
        socketRef.current = io("http://localhost:8080", {
            transports: ["websocket"]
        });

        socketRef.current.on("connect", () => {
            console.log("Connected to Real-time Market Data");
        });

        socketRef.current.on("disconnect", () => {
            console.log("Disconnected from Real-time Market Data");
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // 3. Handle Subscription & Updates
    useEffect(() => {
        if (!socketRef.current) return;

        setLoading(true);

        // Initial History Fetch (HTTP is still good for bootstrapping history)
        fetch(`/api/stocks/history?symbol=${selectedStock.symbol}`)
            .then(res => res.json())
            .then(json => {
                if (json.data && json.data.length > 0) {
                    setData(json.data);
                    setCurrentPrice(json.currentPrice || json.data[json.data.length - 1].value);
                }
                setLoading(false);
            })
            .catch(e => {
                console.error("History fail", e);
                setLoading(false);
            });

        // Subscribe to Real-time Stream
        const symbol = selectedStock.symbol.replace('.NS', '.NSE'); // Normalize if needed, but keeping simple for now
        // Usually providers need exact symbol. My mock provider handles RELIANCE.NSE
        // But my HTTP API returns RELIANCE.NS. I'll stick to what the button sends.

        // Ensure format matches what MockProvider expects (RELIANCE.NSE) if possible
        // The mock provider uses .NSE for keys. The API uses .NS. I need to map.
        const socketSymbol = selectedStock.symbol.replace('.NS', '.NSE');

        socketRef.current.emit("subscribe", socketSymbol);

        const handleUpdate = (update: any) => {
            // Only process if it matches selected (dedupe)
            if (update.symbol !== socketSymbol) return;

            setCurrentPrice(update.last_price);

            setData(prev => {
                const newPoint = {
                    time: new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    value: update.last_price
                };
                // Keep last 50 points
                const newData = [...prev, newPoint];
                if (newData.length > 50) newData.shift();
                return newData;
            });
        };

        socketRef.current.on("stock_update", handleUpdate);

        return () => {
            socketRef.current?.emit("unsubscribe", socketSymbol);
            socketRef.current?.off("stock_update", handleUpdate);
        };
    }, [selectedStock.symbol]);

    // Update Trend
    useEffect(() => {
        if (data.length > 1) {
            const latest = data[data.length - 1].value;
            const prev = data[data.length - 5]?.value || data[0].value;
            setTrend(latest >= prev ? "up" : "down");
        }
    }, [data]);

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Chart Card: DARK BG -> WHITE TEXT */}
            <div className="lg:col-span-2 bg-[#202124] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-gray-800 hover-lift relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-amber font-mono">CONNECTING STREAM...</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* Blinking Live Indicator */}
                            <div className="relative w-2 h-2">
                                <div className="absolute inset-0 bg-vibrant-green rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-2 h-2 bg-vibrant-green rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold tracking-widest text-cream uppercase">{selectedStock.name} LIVE</span>
                        </div>
                        {/* FORCE CREAM TEXT */}
                        <h2 className="text-4xl text-[#F5EFE8] font-serif tracking-tight">
                            ₹{currentPrice?.toFixed(2)}
                        </h2>
                    </div>
                    <div className={clsx(
                        "text-lg font-medium px-3 py-1 rounded-md",
                        trend === "up" ? "bg-vibrant-green/10 text-vibrant-green" : "bg-vibrant-red/10 text-vibrant-red"
                    )}>
                        {trend === "up" ? "▲" : "▼"} {trend === "up" ? "+" : ""}{((data[data.length - 1]?.value - data[0]?.value) / data[0]?.value * 100).toFixed(2)}%
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    {/* Ensure parent has height */}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#B06A20" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#B06A20" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0F172A',
                                    borderColor: '#B06A20',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    fontFamily: 'var(--font-inter)',
                                    color: '#FFF'
                                }}
                                itemStyle={{ color: '#F5EFE8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#B06A20" /* Bright Amber Line */
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Watchlist: LIGHT BG -> BLACK TEXT */}
            <div className="bg-cream rounded-xl p-8 shadow-xl hover-lift flex flex-col border border-cream-dim relative overflow-hidden h-[450px]">

                <h3 className="text-xl font-serif text-charcoal mb-6 relative z-10 border-b-2 border-amber/20 pb-2">Top Indian Movers</h3>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <div
                        onClick={() => setSelectedStock({ symbol: "^NSEI", name: "NIFTY 50", price: 0 })}
                        className={clsx("flex justify-between items-center py-2 border-b border-warmGray/20 group cursor-pointer transition-colors rounded px-2",
                            selectedStock.symbol === "^NSEI" ? "bg-amber/20" : "hover:bg-white/50"
                        )}
                    >
                        <div>
                            <div className="font-bold text-black">NIFTY 50</div>
                            <div className="text-xs text-warmGray">INDEX</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-black">View Graph</div>
                        </div>
                    </div>

                    {stockList.map((stock, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedStock(stock)}
                            className={clsx("flex justify-between items-center py-2 border-b border-warmGray/20 group cursor-pointer transition-colors rounded px-2",
                                selectedStock.symbol === stock.symbol ? "bg-amber/20" : "hover:bg-white/50"
                            )}
                        >
                            <div>
                                {/* FORCE BLACK TEXT */}
                                <div className="font-bold text-black group-hover:text-amber transition-colors">{stock.name}</div>
                                <div className="text-xs text-warmGray">Vol: {stock.vol}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-black font-bold">₹{typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}</div>
                                <div className={clsx("text-xs font-bold", stock.isUp ? "text-vibrant-green" : "text-vibrant-red")}>
                                    {stock.change}
                                </div>
                            </div>
                        </div>
                    ))}

                    {stockList.length === 0 && (
                        <div className="text-center text-warmGray text-sm py-4">Loading stocks...</div>
                    )}
                </div>

                <button
                    onClick={() => window.location.href = '/analysis'}
                    className="mt-6 w-full py-3 rounded border-2 border-charcoal text-charcoal font-bold text-xs tracking-widest uppercase hover:bg-charcoal hover:text-white transition-all transform active:scale-95"
                >
                    View Full Report
                </button>
            </div>
        </section>
    );
}
