// Yahoo Finance Data Source Adapter
// Uses yahoo-finance2 library for market data

import YahooFinance from 'yahoo-finance2';
import type { DataSource, DataSourceResult, OHLCV, Quote, RawSnapshot, AuditInfo } from '../types';
import { rateLimiters } from '../rate-limiter';

// Instantiate the client (v2+ behavior)
const yahooFinance = new YahooFinance();

function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

export const yahooFinanceSource: DataSource = {
    name: 'yahoo-finance',
    priority: 2,
    supportedExchanges: ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'LSE'],

    async fetchQuote(symbol: string): Promise<DataSourceResult> {
        const startTime = Date.now();
        const fetchedAt = getCurrentTimestamp();

        await rateLimiters['yahoo-finance'].acquire();

        try {
            const quote = await yahooFinance.quote(symbol);
            rateLimiters['yahoo-finance'].reportSuccess();

            const responseTime = Date.now() - startTime;

            const quoteMapped: Quote = {
                last_price: quote.regularMarketPrice || 0,
                bid: quote.bid || null,
                ask: quote.ask || null,
                open: quote.regularMarketOpen || 0,
                high: quote.regularMarketDayHigh || 0,
                low: quote.regularMarketDayLow || 0,
                previous_close: quote.regularMarketPreviousClose || 0,
                change: quote.regularMarketChange || 0,
                change_pct: quote.regularMarketChangePercent || 0,
                volume: quote.regularMarketVolume || 0,
                timestamp: quote.regularMarketTime
                    ? new Date(quote.regularMarketTime * 1000).toISOString()
                    : fetchedAt,

                // Fundamentals
                market_cap: quote.marketCap,
                pe_ratio: quote.trailingPE,
                eps: quote.epsTrailingTwelveMonths,
                dividend_yield: quote.dividendYield ? quote.dividendYield / 100 : undefined,
                fifty_two_week_high: quote.fiftyTwoWeekHigh,
                fifty_two_week_low: quote.fiftyTwoWeekLow,
                sector: undefined
            };

            const rawSnapshot: RawSnapshot = {
                url: `https://finance.yahoo.com/quote/${symbol}`,
                html_or_json: JSON.stringify(quote, null, 2),
                captured_at: fetchedAt
            };

            const audit: AuditInfo = {
                http_headers: {},
                cookies: {},
                fetch_method: 'api',
                response_time_ms: responseTime,
                notes: `Yahoo Finance API via yahoo-finance2 library. Symbol: ${symbol}`
            };

            return {
                success: true,
                source: 'yahoo-finance',
                symbol,
                exchange: quote.exchange || 'UNKNOWN',
                quote: quoteMapped,
                intraday: [],
                historical: [],
                raw_snapshot: rawSnapshot,
                audit,
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['yahoo-finance'].reportError();

            return {
                success: false,
                source: 'yahoo-finance',
                symbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `https://finance.yahoo.com/quote/${symbol}`,
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

        await rateLimiters['yahoo-finance'].acquire();

        try {
            // Calculate period dates
            const now = new Date();
            const period1 = new Date();

            switch (period) {
                case '1d': period1.setDate(now.getDate() - 1); break;
                case '5d': period1.setDate(now.getDate() - 5); break;
                case '1mo': period1.setMonth(now.getMonth() - 1); break;
                case '3mo': period1.setMonth(now.getMonth() - 3); break;
                case '6mo': period1.setMonth(now.getMonth() - 6); break;
                case '1y': period1.setFullYear(now.getFullYear() - 1); break;
            }

            const historical: any[] = await yahooFinance.historical(symbol, {
                period1: period1.toISOString().split('T')[0],
                period2: now.toISOString().split('T')[0],
                interval: '1d' as any // Cast to satisfy type if needed
            });

            rateLimiters['yahoo-finance'].reportSuccess();

            const ohlcv: OHLCV[] = (historical || []).map((h: any) => ({
                timestamp: new Date(h.date).toISOString(),
                open: h.open || 0,
                high: h.high || 0,
                low: h.low || 0,
                close: h.close || 0,
                volume: h.volume || 0
            }));

            return {
                success: true,
                source: 'yahoo-finance',
                symbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: ohlcv,
                raw_snapshot: {
                    url: `https://finance.yahoo.com/quote/${symbol}/history`,
                    html_or_json: JSON.stringify(historical.slice(0, 5)),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: Date.now() - startTime,
                    notes: `Historical data for ${period}, ${ohlcv.length} records`
                },
                fetched_at: fetchedAt
            };

        } catch (error: any) {
            rateLimiters['yahoo-finance'].reportError();

            return {
                success: false,
                source: 'yahoo-finance',
                symbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: `https://finance.yahoo.com/quote/${symbol}/history`,
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
            await yahooFinance.quote('AAPL');
            return true;
        } catch {
            return false;
        }
    }
};
