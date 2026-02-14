// Alpha Vantage Data Source Adapter
// Free tier: 25 requests/day, 5 requests/minute

import type { DataSource, DataSourceResult, OHLCV, Quote, RawSnapshot, AuditInfo } from '../types';
import { rateLimiters } from '../rate-limiter';

// Alpha Vantage API key - should be in environment variables
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const AV_BASE_URL = 'https://www.alphavantage.co/query';

function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

// Convert NSE symbol to Alpha Vantage format
function formatSymbol(symbol: string): string {
    const normalized = symbol.replace('.NS', '').replace('.NSE', '').replace('.BSE', '').toUpperCase();
    // For Indian stocks, append .BSE or .NSE for Alpha Vantage
    if (!symbol.includes('.')) {
        return `${normalized}.BSE`;  // Default to BSE for Alpha Vantage
    }
    return symbol;
}

export const alphaVantageSource: DataSource = {
    name: 'alpha-vantage',
    priority: 3,  // Lower priority due to rate limits
    supportedExchanges: ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'LSE'],

    async fetchQuote(symbol: string): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();
        const avSymbol = formatSymbol(symbol);

        await rateLimiters['alpha-vantage'].acquire();

        try {
            const quoteUrl = `${AV_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const response = await fetch(quoteUrl);

            if (!response.ok) {
                throw new Error(`Alpha Vantage API returned ${response.status}`);
            }

            const data = await response.json();

            // Check for API limit message
            if (data.Note || data['Error Message']) {
                throw new Error(data.Note || data['Error Message']);
            }

            rateLimiters['alpha-vantage'].reportSuccess();

            const responseTime = Date.now() - startTime;
            const globalQuote = data['Global Quote'] || {};

            const quoteMapped: Quote = {
                last_price: parseFloat(globalQuote['05. price']) || 0,
                bid: null,  // Not provided by Alpha Vantage
                ask: null,
                open: parseFloat(globalQuote['02. open']) || 0,
                high: parseFloat(globalQuote['03. high']) || 0,
                low: parseFloat(globalQuote['04. low']) || 0,
                previous_close: parseFloat(globalQuote['08. previous close']) || 0,
                change: parseFloat(globalQuote['09. change']) || 0,
                change_pct: parseFloat((globalQuote['10. change percent'] || '0').replace('%', '')) || 0,
                volume: parseInt(globalQuote['06. volume']) || 0,
                timestamp: globalQuote['07. latest trading day']
                    ? new Date(globalQuote['07. latest trading day']).toISOString()
                    : fetchedAt
            };

            const rawSnapshot: RawSnapshot = {
                url: quoteUrl.replace(ALPHA_VANTAGE_API_KEY, 'API_KEY_HIDDEN'),
                html_or_json: JSON.stringify(data, null, 2),
                captured_at: fetchedAt
            };

            const audit: AuditInfo = {
                http_headers: Object.fromEntries(response.headers.entries()),
                cookies: {},
                fetch_method: 'api',
                response_time_ms: responseTime,
                notes: `Alpha Vantage Global Quote API. Symbol: ${avSymbol}. Free tier with rate limits.`
            };

            return {
                success: true,
                source: 'alpha-vantage',
                symbol: avSymbol,
                exchange: avSymbol.includes('.BSE') ? 'BSE' : avSymbol.includes('.NS') ? 'NSE' : 'UNKNOWN',
                quote: quoteMapped,
                intraday: [],
                historical: [],
                raw_snapshot: rawSnapshot,
                audit,
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['alpha-vantage'].reportError();

            return {
                success: false,
                source: 'alpha-vantage',
                symbol: avSymbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `${AV_BASE_URL}?function=GLOBAL_QUOTE&symbol=${avSymbol}`,
                    html_or_json: JSON.stringify({ error: error.message }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Error: ${error.message}`
                },
                error: error.message,
                fetched_at: fetchedAt
            };
        }
    },

    async fetchHistorical(symbol: string, period: string = '1y', interval: string = '1d'): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();
        const avSymbol = formatSymbol(symbol);

        await rateLimiters['alpha-vantage'].acquire();

        try {
            // Use TIME_SERIES_DAILY for daily data
            const outputSize = period === '1mo' || period === '3mo' ? 'compact' : 'full';
            const histUrl = `${AV_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(avSymbol)}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;

            const response = await fetch(histUrl);

            if (!response.ok) {
                throw new Error(`Alpha Vantage API returned ${response.status}`);
            }

            const data = await response.json();

            if (data.Note || data['Error Message']) {
                throw new Error(data.Note || data['Error Message']);
            }

            rateLimiters['alpha-vantage'].reportSuccess();

            const timeSeries = data['Time Series (Daily)'] || {};
            const historical: OHLCV[] = Object.entries(timeSeries)
                .map(([date, values]: [string, any]) => ({
                    timestamp: new Date(date).toISOString(),
                    open: parseFloat(values['1. open']) || 0,
                    high: parseFloat(values['2. high']) || 0,
                    low: parseFloat(values['3. low']) || 0,
                    close: parseFloat(values['4. close']) || 0,
                    volume: parseInt(values['5. volume']) || 0
                }))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Filter by period
            const now = Date.now();
            const periodMs: Record<string, number> = {
                '1mo': 30 * 24 * 60 * 60 * 1000,
                '3mo': 90 * 24 * 60 * 60 * 1000,
                '6mo': 180 * 24 * 60 * 60 * 1000,
                '1y': 365 * 24 * 60 * 60 * 1000
            };
            const cutoffMs = periodMs[period] || periodMs['1y'];
            const filtered = historical.filter(h => now - new Date(h.timestamp).getTime() <= cutoffMs);

            return {
                success: true,
                source: 'alpha-vantage',
                symbol: avSymbol,
                exchange: avSymbol.includes('.BSE') ? 'BSE' : avSymbol.includes('.NS') ? 'NSE' : 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: filtered,
                raw_snapshot: {
                    url: histUrl.replace(ALPHA_VANTAGE_API_KEY, 'API_KEY_HIDDEN'),
                    html_or_json: JSON.stringify(Object.entries(timeSeries).slice(0, 5)),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Alpha Vantage Daily, ${filtered.length} records for ${period}`
                },
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['alpha-vantage'].reportError();

            return {
                success: false,
                source: 'alpha-vantage',
                symbol: avSymbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `${AV_BASE_URL}?function=TIME_SERIES_DAILY`,
                    html_or_json: JSON.stringify({ error: error.message }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Error: ${error.message}`
                },
                error: error.message,
                fetched_at: fetchedAt
            };
        }
    },

    async isAvailable(): Promise<boolean> {
        if (ALPHA_VANTAGE_API_KEY === 'demo') {
            console.log('[AlphaVantage] Using demo API key - limited functionality');
        }
        return true;
    }
};
