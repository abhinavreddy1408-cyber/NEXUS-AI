import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET() {
    try {
        // Fetch Market Sentiment (Nifty 50)
        const market: any = await yahooFinance.quote("^NSEI"); // Nifty 50 Symbol
        const marketChange = market.regularMarketChangePercent || 0;

        const sentiment = marketChange > 0 ? "Bullish" : "Bearish";

        // Mock Portfolio Summary (In real app, calculate from DB)
        const summary = {
            totalRevenue: 245000 + (Math.random() * 5000), // Random flux
            activeRisks: 2, // Mock count
            marketSentiment: sentiment,
            indexValue: market.regularMarketPrice || 22000
        };

        return NextResponse.json(summary);

    } catch (error) {
        return NextResponse.json({
            totalRevenue: 0,
            activeRisks: 0,
            marketSentiment: "Neutral",
            error: "Failed to fetch dashboard data"
        });
    }
}
