// NSE India Data Source Adapter
// Fetches real-time data from NSE India official endpoints

import type { DataSource, DataSourceResult, OHLCV, Quote, RawSnapshot, AuditInfo } from '../types';
import { rateLimiters } from '../rate-limiter';

const NSE_BASE_URL = 'https://www.nseindia.com';
const NSE_API_URL = 'https://www.nseindia.com/api';

function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

// NSE requires specific headers to accept requests
function getNSEHeaders(): Record<string, string> {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nseindia.com/'
    };
}

// Convert NSE symbol to standard format
function normalizeSymbol(symbol: string): string {
    return symbol.replace('.NS', '').replace('.NSE', '').toUpperCase();
}

export const nseIndiaSource: DataSource = {
    name: 'nse-india',
    priority: 1,  // Highest priority for NSE stocks
    supportedExchanges: ['NSE'],

    async fetchQuote(symbol: string): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();
        const nseSymbol = normalizeSymbol(symbol);

        await rateLimiters['nse-india'].acquire();

        try {
            // First, get cookies by visiting the main page
            const cookieResponse = await fetch(NSE_BASE_URL, {
                headers: getNSEHeaders()
            });

            const cookies = cookieResponse.headers.get('set-cookie') || '';

            // Now fetch quote data
            const quoteUrl = `${NSE_API_URL}/quote-equity?symbol=${encodeURIComponent(nseSymbol)}`;
            const response = await fetch(quoteUrl, {
                headers: {
                    ...getNSEHeaders(),
                    'Cookie': cookies
                }
            });

            if (!response.ok) {
                throw new Error(`NSE API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            rateLimiters['nse-india'].reportSuccess();

            const responseTime = Date.now() - startTime;
            const priceInfo = data.priceInfo || {};
            const info = data.info || {};

            const quoteMapped: Quote = {
                last_price: priceInfo.lastPrice || 0,
                bid: priceInfo.intraDayHighLow?.min || null,
                ask: priceInfo.intraDayHighLow?.max || null,
                open: priceInfo.open || 0,
                high: priceInfo.intraDayHighLow?.max || priceInfo.weekHighLow?.max || 0,
                low: priceInfo.intraDayHighLow?.min || priceInfo.weekHighLow?.min || 0,
                previous_close: priceInfo.previousClose || 0,
                change: priceInfo.change || 0,
                change_pct: priceInfo.pChange || 0,
                volume: priceInfo.totalTradedVolume || 0,
                timestamp: data.metadata?.lastUpdateTime
                    ? new Date(data.metadata.lastUpdateTime).toISOString()
                    : fetchedAt
            };

            const rawSnapshot: RawSnapshot = {
                url: quoteUrl,
                html_or_json: JSON.stringify(data, null, 2),
                captured_at: fetchedAt
            };

            const audit: AuditInfo = {
                http_headers: Object.fromEntries(response.headers.entries()),
                cookies: { session: cookies.substring(0, 100) + '...' },
                fetch_method: 'api',
                response_time_ms: responseTime,
                notes: `NSE India official API. Symbol: ${nseSymbol}. Company: ${info.companyName || 'N/A'}`
            };

            return {
                success: true,
                source: 'nse-india',
                symbol: nseSymbol,
                exchange: 'NSE',
                quote: quoteMapped,
                intraday: [],
                historical: [],
                raw_snapshot: rawSnapshot,
                audit,
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['nse-india'].reportError();

            return {
                success: false,
                source: 'nse-india',
                symbol: nseSymbol,
                exchange: 'NSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `${NSE_API_URL}/quote-equity?symbol=${nseSymbol}`,
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

    async fetchHistorical(symbol: string, period: string = '1y'): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();
        const nseSymbol = normalizeSymbol(symbol);

        await rateLimiters['nse-india'].acquire();

        try {
            // Get cookies first
            const cookieResponse = await fetch(NSE_BASE_URL, {
                headers: getNSEHeaders()
            });
            const cookies = cookieResponse.headers.get('set-cookie') || '';

            // Fetch historical data
            const histUrl = `${NSE_API_URL}/historical/cm/equity?symbol=${encodeURIComponent(nseSymbol)}`;
            const response = await fetch(histUrl, {
                headers: {
                    ...getNSEHeaders(),
                    'Cookie': cookies
                }
            });

            if (!response.ok) {
                throw new Error(`NSE Historical API returned ${response.status}`);
            }

            const data = await response.json();
            rateLimiters['nse-india'].reportSuccess();

            const historical: OHLCV[] = (data.data || []).map((d: any) => ({
                timestamp: new Date(d.CH_TIMESTAMP || d.mTIMESTAMP).toISOString(),
                open: parseFloat(d.CH_OPENING_PRICE) || 0,
                high: parseFloat(d.CH_TRADE_HIGH_PRICE) || 0,
                low: parseFloat(d.CH_TRADE_LOW_PRICE) || 0,
                close: parseFloat(d.CH_CLOSING_PRICE) || 0,
                volume: parseInt(d.CH_TOT_TRADED_QTY) || 0
            }));

            return {
                success: true,
                source: 'nse-india',
                symbol: nseSymbol,
                exchange: 'NSE',
                quote: null,
                intraday: [],
                historical,
                raw_snapshot: {
                    url: histUrl,
                    html_or_json: JSON.stringify(data.data?.slice(0, 5) || []),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `NSE historical data, ${historical.length} records`
                },
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['nse-india'].reportError();

            return {
                success: false,
                source: 'nse-india',
                symbol: nseSymbol,
                exchange: 'NSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `${NSE_API_URL}/historical/cm/equity?symbol=${nseSymbol}`,
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
        try {
            const response = await fetch(NSE_BASE_URL, {
                headers: getNSEHeaders()
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
