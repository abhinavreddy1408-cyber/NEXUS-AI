"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface Stock {
  id: string;
  symbol: string;
  buyPrice: number;
  quantity: number;
  threshold: number; // Percentage like 10 for 10%
  currentPrice: number | null;
  loading: boolean;
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState({ symbol: "", buyPrice: "", quantity: "", threshold: "5" });
  const [loading, setLoading] = useState(false);

  // Load stocks from local storage on mount (mock persistence)
  useEffect(() => {
    const saved = localStorage.getItem("nexus_portfolio");
    if (saved) {
      setStocks(JSON.parse(saved));
    }
  }, []);

  // Save stocks
  useEffect(() => {
    localStorage.setItem("nexus_portfolio", JSON.stringify(stocks));
  }, [stocks]);

  const fetchPrice = async (symbol: string) => {
    try {
      const res = await fetch(`/api/stocks?symbol=${symbol}`);
      const data = await res.json();
      return data.price;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleAddStock = async () => {
    if (!newStock.symbol || !newStock.buyPrice) return;
    setLoading(true);

    const currentPrice = await fetchPrice(newStock.symbol);

    const stock: Stock = {
      id: Date.now().toString(),
      symbol: newStock.symbol.toUpperCase(),
      buyPrice: parseFloat(newStock.buyPrice),
      quantity: parseFloat(newStock.quantity),
      threshold: parseFloat(newStock.threshold),
      currentPrice: currentPrice || 0,
      loading: false
    };

    setStocks([...stocks, stock]);
    setNewStock({ symbol: "", buyPrice: "", quantity: "", threshold: "5" });
    setLoading(false);
  };

  const refreshAll = async () => {
    setLoading(true);
    const updated = await Promise.all(stocks.map(async (s) => {
      const price = await fetchPrice(s.symbol);
      return { ...s, currentPrice: price || s.currentPrice };
    }));
    setStocks(updated);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-[#202124] mb-2">Portfolio Management</h1>
          <p className="text-warmGray text-sm uppercase tracking-widest font-bold">Real-time Analysis & Risk Control</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#202124] text-[#F5EFE8] rounded hover:bg-gray-800 transition-colors disabled:opacity-50 border border-gray-800"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Sync Market Data
        </button>
      </header>

      {/* Input Card */}
      <section className="bg-[#202124] p-8 rounded-xl shadow-lg border border-gray-800 mb-12">
        <h3 className="font-serif text-[#F5EFE8] text-xl mb-6 border-b border-gray-700 pb-2">Add Asset Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#F5EFE8] opacity-70 uppercase mb-1">Symbol</label>
            <input
              value={newStock.symbol}
              onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
              placeholder="RELIANCE"
              className="w-full p-3 bg-white border border-[#B06A20]/50 rounded font-mono text-[#202124] placeholder-gray-400 focus:border-[#B06A20] focus:ring-1 focus:ring-[#B06A20] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#F5EFE8] opacity-70 uppercase mb-1">Buy Price ($)</label>
            <input
              type="number"
              value={newStock.buyPrice}
              onChange={(e) => setNewStock({ ...newStock, buyPrice: e.target.value })}
              placeholder="2500.00"
              className="w-full p-3 bg-white border border-[#B06A20]/50 rounded font-mono text-[#202124] placeholder-gray-400 focus:border-[#B06A20] focus:ring-1 focus:ring-[#B06A20] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#F5EFE8] opacity-70 uppercase mb-1">Quantity</label>
            <input
              type="number"
              value={newStock.quantity}
              onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
              placeholder="10"
              className="w-full p-3 bg-white border border-[#B06A20]/50 rounded font-mono text-[#202124] placeholder-gray-400 focus:border-[#B06A20] focus:ring-1 focus:ring-[#B06A20] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#F5EFE8] opacity-70 uppercase mb-1">Stop Loss %</label>
            <input
              type="number"
              value={newStock.threshold}
              onChange={(e) => setNewStock({ ...newStock, threshold: e.target.value })}
              placeholder="5"
              className="w-full p-3 bg-white border border-[#B06A20]/50 rounded font-mono text-[#202124] placeholder-gray-400 focus:border-[#B06A20] focus:ring-1 focus:ring-[#B06A20] outline-none"
            />
          </div>
          <button
            onClick={handleAddStock}
            disabled={loading || !newStock.symbol}
            className="h-[50px] bg-[#B06A20] text-[#F5EFE8] font-bold rounded hover:bg-[#8B5117] transition-colors flex items-center justify-center gap-2 border border-[#B06A20]"
          >
            <Plus className="w-5 h-5" /> Add Asset
          </button>
        </div>
      </section>

      {/* Portfolio Table */}
      <section className="bg-white rounded-xl shadow-lg border border-cream-dim overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#202124] text-[#F5EFE8] border-b border-gray-800">
            <tr>
              <th className="py-4 px-6 text-left font-serif font-normal">Asset</th>
              <th className="py-4 px-6 text-right font-serif font-normal">Position</th>
              <th className="py-4 px-6 text-right font-serif font-normal">Cost Basis</th>
              <th className="py-4 px-6 text-right font-serif font-normal">Live Price</th>
              <th className="py-4 px-6 text-right font-serif font-normal">P/L Status</th>
              <th className="py-4 px-6 text-center font-serif font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dim">
            {stocks.map((stock) => {
              const currentValue = (stock.currentPrice || 0) * stock.quantity;
              const costBasis = stock.buyPrice * stock.quantity;
              const plPercent = stock.currentPrice
                ? ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100
                : 0;

              // Stop-Loss Logic: If current price < buy price * (1 - threshold%)
              const stopLossPrice = stock.buyPrice * (1 - stock.threshold / 100);
              const isStopLossTriggered = (stock.currentPrice || Infinity) < stopLossPrice;

              return (
                <tr key={stock.id} className={clsx(
                  "hover:bg-cream/50 transition-colors",
                  isStopLossTriggered && "bg-red-50"
                )}>
                  <td className="py-4 px-6">
                    <div className="font-bold text-charcoal">{stock.symbol}</div>
                    {isStopLossTriggered && (
                      <div className="flex items-center gap-1 text-vibrant-red text-xs font-bold mt-1">
                        <AlertTriangle className="w-3 h-3" /> STOP-LOSS ALERT
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-warmGray">{stock.quantity}</td>
                  <td className="py-4 px-6 text-right font-mono text-warmGray">${stock.buyPrice.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono font-bold text-charcoal">
                      ${stock.currentPrice?.toFixed(2) || "---"}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                      plPercent >= 0 ? "bg-vibrant-green/10 text-vibrant-green" : "bg-vibrant-red/10 text-vibrant-red"
                    )}>
                      {plPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {plPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setStocks(stocks.filter(s => s.id !== stock.id))}
                      className="p-2 text-warmGray hover:text-vibrant-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-warmGray">
                  No assets in portfolio. Add a strategy above to begin tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
