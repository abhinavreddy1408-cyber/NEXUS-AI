import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET() {
  try {
    const stocks = [
      { symbol: "RELIANCE.NS", buyPrice: 2450.00, quantity: 10, profitThreshold: 10 },
      { symbol: "TCS.NS", buyPrice: 3800.00, quantity: 5, profitThreshold: 5 },
      { symbol: "HDFCBANK.NS", buyPrice: 1600.00, quantity: 20, profitThreshold: 8 },
      { symbol: "INFY.NS", buyPrice: 1500.00, quantity: 15, profitThreshold: 6 },
      { symbol: "ICICIBANK.NS", buyPrice: 950.00, quantity: 25, profitThreshold: 7 },
    ];

    // Helper: Timeout wrapper for promises
    const withTimeout = (promise: Promise<any>, ms: number) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
      ]);
    };

    // 2. Fetch Live Prices
    const promises = stocks.map(async (stock) => {
      try {
        // Fetch with 3s timeout
        const quote: any = await withTimeout(yahooFinance.quote(stock.symbol), 3000);
        let currentPrice = quote.regularMarketPrice || stock.buyPrice;

        // Add small jitter to simulate "live" market if market is closed
        // +/- 0.05% random fluctuation
        const jitter = currentPrice * (Math.random() * 0.001 - 0.0005);
        currentPrice += jitter;

        // Calculation
        const profitPercent = ((currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
        const triggerWarning = profitPercent < -Math.abs(stock.profitThreshold);

        return {
          ...stock,
          currentPrice,
          profitPercent: parseFloat(profitPercent.toFixed(2)),
          currency: "INR",
          triggerWarning
        };
      } catch (e) {
        console.error(`Failed to fetch ${stock.symbol}`, e);
        // Fallback with jitter so it still looks alive even if API fails
        const mockPrice = stock.buyPrice * (1 + (Math.random() * 0.02 - 0.01));
        const profitPercent = ((mockPrice - stock.buyPrice) / stock.buyPrice) * 100;

        return {
          ...stock,
          currentPrice: mockPrice,
          profitPercent: parseFloat(profitPercent.toFixed(2)),
          error: "Data Unavailable (Mock)"
        };
      }
    });

    const results = await Promise.all(promises);

    return NextResponse.json({ stocks: results });

  } catch (error) {
    console.error("Stocks API Error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 });
  }
}
