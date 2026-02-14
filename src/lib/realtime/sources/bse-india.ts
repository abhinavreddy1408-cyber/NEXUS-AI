// BSE India Data Source Adapter
// Fetches real-time data from BSE India official endpoints

import type { DataSource, DataSourceResult, OHLCV, Quote, RawSnapshot, AuditInfo } from '../types';
import { rateLimiters } from '../rate-limiter';

const BSE_API_URL = 'https://api.bseindia.com/BseIndiaAPI/api';
const BSE_BASE_URL = 'https://www.bseindia.com';

function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

// BSE symbol mapping (common NSE symbols to BSE script codes)
const BSE_SYMBOL_MAP: Record<string, string> = {
    'RELIANCE': '500325',
    'TCS': '532540',
    'HDFCBANK': '500180',
    'INFY': '500209',
    'ICICIBANK': '532174',
    'HINDUNILVR': '500696',
    'ITC': '500875',
    'SBIN': '500112',
    'BHARTIARTL': '532454',
    'KOTAKBANK': '500247',
    'LT': '500510',
    'AXISBANK': '532215',
    'WIPRO': '507685',
    'HCLTECH': '532281',
    'TATAMOTORS': '500570',
    'TATASTEEL': '500470',
    'NTPC': '532555',
    'POWERGRID': '532898',
    'SUNPHARMA': '524715',
    'MARUTI': '532500'
};

function normalizeSymbol(symbol: string): string {
    return symbol.replace('.NS', '').replace('.NSE', '').replace('.BS', '').replace('.BSE', '').toUpperCase();
}

function getBSEScriptCode(symbol: string): string | null {
    const normalized = normalizeSymbol(symbol);
    return BSE_SYMBOL_MAP[normalized] || null;
}

export const bseIndiaSource: DataSource = {
    name: 'bse-india',
    priority: 2,
    supportedExchanges: ['BSE'],

    async fetchQuote(symbol: string): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();
        const normalizedSymbol = normalizeSymbol(symbol);
        const scriptCode = getBSEScriptCode(normalizedSymbol);

        if (!scriptCode) {
            return {
                success: false,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: BSE_API_URL,
                    html_or_json: JSON.stringify({ error: 'Symbol not found in BSE mapping' }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Symbol ${normalizedSymbol} not found in BSE symbol map`
                },
                error: `Symbol ${normalizedSymbol} not mapped to BSE script code`,
                fetched_at: fetchedAt
            };
        }

        await rateLimiters['bse-india'].acquire();

        try {
            const quoteUrl = `${BSE_API_URL}/getScripHeaderData/Equity/${scriptCode}`;
            const response = await fetch(quoteUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Referer': BSE_BASE_URL
                }
            });

            if (!response.ok) {
                throw new Error(`BSE API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            rateLimiters['bse-india'].reportSuccess();

            const responseTime = Date.now() - startTime;
            const header = data.Header || {};
            const current = data.Current || data.CurrRate || {};

            const quoteMapped: Quote = {
                last_price: parseFloat(current.LTP || header.LTP) || 0,
                bid: parseFloat(current.BidPrice) || null,
                ask: parseFloat(current.OfferPrice) || null,
                open: parseFloat(current.Open || header.Open) || 0,
                high: parseFloat(current.High || header.High) || 0,
                low: parseFloat(current.Low || header.Low) || 0,
                previous_close: parseFloat(current.PrevClose || header.PrevClose) || 0,
                change: parseFloat(current.Chg || header.Change) || 0,
                change_pct: parseFloat(current.PerChg || header.PerChange) || 0,
                volume: parseInt(current.Volume || header.TotVol) || 0,
                timestamp: current.UPD_TIME
                    ? new Date(current.UPD_TIME).toISOString()
                    : fetchedAt
            };

            const rawSnapshot: RawSnapshot = {
                url: quoteUrl,
                html_or_json: JSON.stringify(data, null, 2),
                captured_at: fetchedAt
            };

            const audit: AuditInfo = {
                http_headers: Object.fromEntries(response.headers.entries()),
                cookies: {},
                fetch_method: 'api',
                response_time_ms: responseTime,
                notes: `BSE India API. Script Code: ${scriptCode}. Company: ${header.SLONGNAME || normalizedSymbol}`
            };

            return {
                success: true,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: quoteMapped,
                intraday: [],
                historical: [],
                raw_snapshot: rawSnapshot,
                audit,
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['bse-india'].reportError();

            return {
                success: false,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `${BSE_API_URL}/getScripHeaderData/Equity/${scriptCode}`,
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
        const normalizedSymbol = normalizeSymbol(symbol);
        const scriptCode = getBSEScriptCode(normalizedSymbol);

        if (!scriptCode) {
            return {
                success: false,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: BSE_API_URL,
                    html_or_json: JSON.stringify({ error: 'Symbol not mapped' }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Symbol ${normalizedSymbol} not found in BSE symbol map`
                },
                error: 'Symbol not mapped',
                fetched_at: fetchedAt
            };
        }

        await rateLimiters['bse-india'].acquire();

        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();

            switch (period) {
                case '1mo': startDate.setMonth(endDate.getMonth() - 1); break;
                case '3mo': startDate.setMonth(endDate.getMonth() - 3); break;
                case '6mo': startDate.setMonth(endDate.getMonth() - 6); break;
                case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
                default: startDate.setFullYear(endDate.getFullYear() - 1);
            }

            const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
            const histUrl = `${BSE_API_URL}/StockReachGraph/w?scripcode=${scriptCode}&flag=0&fromdate=${formatDate(startDate)}&todate=${formatDate(endDate)}`;

            const response = await fetch(histUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Referer': BSE_BASE_URL
                }
            });

            if (!response.ok) {
                throw new Error(`BSE Historical API returned ${response.status}`);
            }

            const data = await response.json();
            rateLimiters['bse-india'].reportSuccess();

            const historical: OHLCV[] = (data.Data || data || []).map((d: any) => ({
                timestamp: new Date(d.dttm || d.Date).toISOString(),
                open: parseFloat(d.open || d.Open) || 0,
                high: parseFloat(d.high || d.High) || 0,
                low: parseFloat(d.low || d.Low) || 0,
                close: parseFloat(d.close || d.Close) || 0,
                volume: parseInt(d.volume || d.Volume) || 0
            }));

            return {
                success: true,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: null,
                intraday: [],
                historical,
                raw_snapshot: {
                    url: histUrl,
                    html_or_json: JSON.stringify((data.Data || data || []).slice(0, 5)),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `BSE historical data, ${historical.length} records`
                },
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['bse-india'].reportError();

            return {
                success: false,
                source: 'bse-india',
                symbol: normalizedSymbol,
                exchange: 'BSE',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: BSE_API_URL,
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
            const response = await fetch(BSE_BASE_URL, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
