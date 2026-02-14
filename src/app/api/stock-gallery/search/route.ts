// Stock Gallery Search API
// GET /api/stock-gallery/search?q=<query>

import { NextRequest, NextResponse } from "next/server";
import type { StockSearchResult, SearchResponse } from "@/stock-gallery/lib/types";

const MAX_RESULTS = 10;

// Rate limiting (simple in-memory)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Local stock database for reliable search (popular NSE stocks)
const STOCK_DATABASE: StockSearchResult[] = [
    { symbol: "RELIANCE.NS", company_name: "Reliance Industries Ltd", exchange: "NSE", sector: "Oil & Gas" },
    { symbol: "TCS.NS", company_name: "Tata Consultancy Services Ltd", exchange: "NSE", sector: "Technology" },
    { symbol: "HDFCBANK.NS", company_name: "HDFC Bank Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "INFY.NS", company_name: "Infosys Ltd", exchange: "NSE", sector: "Technology" },
    { symbol: "ICICIBANK.NS", company_name: "ICICI Bank Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "HINDUNILVR.NS", company_name: "Hindustan Unilever Ltd", exchange: "NSE", sector: "FMCG" },
    { symbol: "ITC.NS", company_name: "ITC Ltd", exchange: "NSE", sector: "FMCG" },
    { symbol: "SBIN.NS", company_name: "State Bank of India", exchange: "NSE", sector: "Financial Services" },
    { symbol: "BHARTIARTL.NS", company_name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom" },
    { symbol: "KOTAKBANK.NS", company_name: "Kotak Mahindra Bank Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "LT.NS", company_name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Capital Goods" },
    { symbol: "AXISBANK.NS", company_name: "Axis Bank Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "MARUTI.NS", company_name: "Maruti Suzuki India Ltd", exchange: "NSE", sector: "Automobile" },
    { symbol: "TITAN.NS", company_name: "Titan Company Ltd", exchange: "NSE", sector: "Consumer Durables" },
    { symbol: "SUNPHARMA.NS", company_name: "Sun Pharmaceutical Industries Ltd", exchange: "NSE", sector: "Pharma" },
    { symbol: "BAJFINANCE.NS", company_name: "Bajaj Finance Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "ASIANPAINT.NS", company_name: "Asian Paints Ltd", exchange: "NSE", sector: "Consumer Durables" },
    { symbol: "NESTLEIND.NS", company_name: "Nestle India Ltd", exchange: "NSE", sector: "FMCG" },
    { symbol: "WIPRO.NS", company_name: "Wipro Ltd", exchange: "NSE", sector: "Technology" },
    { symbol: "HCLTECH.NS", company_name: "HCL Technologies Ltd", exchange: "NSE", sector: "Technology" },
    { symbol: "TATAMOTORS.NS", company_name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobile" },
    { symbol: "TATASTEEL.NS", company_name: "Tata Steel Ltd", exchange: "NSE", sector: "Metals" },
    { symbol: "ONGC.NS", company_name: "Oil and Natural Gas Corporation Ltd", exchange: "NSE", sector: "Oil & Gas" },
    { symbol: "NTPC.NS", company_name: "NTPC Ltd", exchange: "NSE", sector: "Power" },
    { symbol: "POWERGRID.NS", company_name: "Power Grid Corporation of India Ltd", exchange: "NSE", sector: "Power" },
    { symbol: "ULTRACEMCO.NS", company_name: "UltraTech Cement Ltd", exchange: "NSE", sector: "Cement" },
    { symbol: "ADANIENT.NS", company_name: "Adani Enterprises Ltd", exchange: "NSE", sector: "Conglomerate" },
    { symbol: "ADANIPORTS.NS", company_name: "Adani Ports and Special Economic Zone Ltd", exchange: "NSE", sector: "Logistics" },
    { symbol: "BAJAJFINSV.NS", company_name: "Bajaj Finserv Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "COALINDIA.NS", company_name: "Coal India Ltd", exchange: "NSE", sector: "Mining" },
    { symbol: "DRREDDY.NS", company_name: "Dr. Reddy's Laboratories Ltd", exchange: "NSE", sector: "Pharma" },
    { symbol: "EICHERMOT.NS", company_name: "Eicher Motors Ltd", exchange: "NSE", sector: "Automobile" },
    { symbol: "GRASIM.NS", company_name: "Grasim Industries Ltd", exchange: "NSE", sector: "Cement" },
    { symbol: "HDFCLIFE.NS", company_name: "HDFC Life Insurance Company Ltd", exchange: "NSE", sector: "Insurance" },
    { symbol: "HEROMOTOCO.NS", company_name: "Hero MotoCorp Ltd", exchange: "NSE", sector: "Automobile" },
    { symbol: "HINDALCO.NS", company_name: "Hindalco Industries Ltd", exchange: "NSE", sector: "Metals" },
    { symbol: "INDUSINDBK.NS", company_name: "IndusInd Bank Ltd", exchange: "NSE", sector: "Financial Services" },
    { symbol: "JSWSTEEL.NS", company_name: "JSW Steel Ltd", exchange: "NSE", sector: "Metals" },
    { symbol: "M&M.NS", company_name: "Mahindra & Mahindra Ltd", exchange: "NSE", sector: "Automobile" },
    { symbol: "SBILIFE.NS", company_name: "SBI Life Insurance Company Ltd", exchange: "NSE", sector: "Insurance" },
    { symbol: "TECHM.NS", company_name: "Tech Mahindra Ltd", exchange: "NSE", sector: "Technology" },
    { symbol: "BRITANNIA.NS", company_name: "Britannia Industries Ltd", exchange: "NSE", sector: "FMCG" },
    { symbol: "CIPLA.NS", company_name: "Cipla Ltd", exchange: "NSE", sector: "Pharma" },
    { symbol: "DIVISLAB.NS", company_name: "Divi's Laboratories Ltd", exchange: "NSE", sector: "Pharma" },
    { symbol: "APOLLOHOSP.NS", company_name: "Apollo Hospitals Enterprise Ltd", exchange: "NSE", sector: "Healthcare" },
    { symbol: "TATACONSUM.NS", company_name: "Tata Consumer Products Ltd", exchange: "NSE", sector: "FMCG" },
    { symbol: "SHREECEM.NS", company_name: "Shree Cement Ltd", exchange: "NSE", sector: "Cement" },
    { symbol: "BPCL.NS", company_name: "Bharat Petroleum Corporation Ltd", exchange: "NSE", sector: "Oil & Gas" },
    { symbol: "UPL.NS", company_name: "UPL Ltd", exchange: "NSE", sector: "Chemicals" },
    { symbol: "NIFTY50.NS", company_name: "Nifty 50 Index", exchange: "NSE", sector: "Index" },
];

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

function sanitizeQuery(query: string): string {
    // Remove special characters, limit length
    return query.replace(/[^a-zA-Z0-9\s.-]/g, "").slice(0, 50).trim().toLowerCase();
}

export async function GET(req: NextRequest) {
    try {
        // Rate limiting
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Search temporarily limited; please wait a few seconds." },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(req.url);
        const rawQuery = searchParams.get("q") || "";
        const query = sanitizeQuery(rawQuery);

        if (query.length < 1) {
            return NextResponse.json({ results: [] });
        }

        // Search in local database
        const results = STOCK_DATABASE
            .filter(stock =>
                stock.symbol.toLowerCase().includes(query) ||
                stock.company_name.toLowerCase().includes(query) ||
                stock.sector.toLowerCase().includes(query)
            )
            .slice(0, MAX_RESULTS);

        console.log(`[StockGallery/Search] Query: "${query}", Found: ${results.length} results`);

        const response: SearchResponse = { results };
        return NextResponse.json(response);

    } catch (error: any) {
        console.error("[StockGallery/Search] Unexpected error:", error);
        return NextResponse.json(
            { error: "Search failed. Please try again.", details: error?.message },
            { status: 500 }
        );
    }
}
