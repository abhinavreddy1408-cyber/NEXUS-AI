// Multi-Source Data Aggregator
// Fetches from all sources, cross-validates, and returns best data

import type {
    DataSource,
    DataSourceResult,
    AggregatedQuote,
    Quote,
    OHLCV,
    DiscrepancyDetails
} from './types';
import {
    validateQuote,
    validateOHLCVSeries,
    crossValidatePrices,
    calculateConfidenceScore,
    checkTimestampFreshness
} from './validator';
import { yahooFinanceSource } from './sources/yahoo-finance';
import { nseIndiaSource } from './sources/nse-india';
import { bseIndiaSource } from './sources/bse-india';
import { alphaVantageSource } from './sources/alpha-vantage';

// All available data sources
const ALL_SOURCES: DataSource[] = [
    nseIndiaSource,     // Priority 1 - Official NSE
    yahooFinanceSource, // Priority 2 - Most reliable
    bseIndiaSource,     // Priority 2 - Official BSE
    alphaVantageSource  // Priority 3 - Rate limited
];

interface AggregatorOptions {
    sources?: string[];
    timeout?: number;
    skipCrossValidation?: boolean;
}

function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Fetch quote data from multiple sources in parallel
 */
export async function aggregateQuote(
    symbol: string,
    options: AggregatorOptions = {}
): Promise<AggregatedQuote> {
    const fetchedAt = getCurrentTimestamp();
    const timeout = options.timeout || 10000;

    // Filter sources if specified
    let sources = ALL_SOURCES;
    if (options.sources && options.sources.length > 0) {
        sources = ALL_SOURCES.filter(s => options.sources!.includes(s.name));
    }

    console.log(`[Aggregator] Fetching ${symbol} from ${sources.map(s => s.name).join(', ')}`);

    // Fetch from all sources in parallel with timeout
    const fetchPromises = sources.map(async (source): Promise<DataSourceResult> => {
        try {
            const result = await Promise.race([
                source.fetchQuote(symbol),
                new Promise<DataSourceResult>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);
            return result;
        } catch (error: any) {
            return {
                success: false,
                source: source.name,
                symbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: '',
                    html_or_json: JSON.stringify({ error: error.message }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: timeout,
                    notes: `Timeout or error: ${error.message}`
                },
                error: error.message,
                fetched_at: fetchedAt
            };
        }
    });

    const results = await Promise.all(fetchPromises);

    // Separate successful and failed results
    const successful = results.filter(r => r.success && r.quote);
    const failed = results.filter(r => !r.success);

    console.log(`[Aggregator] ${successful.length} sources succeeded, ${failed.length} failed`);

    // If no successful results, return error response
    if (successful.length === 0) {
        return createErrorResponse(symbol, fetchedAt, results);
    }

    // Cross-validate prices from successful sources
    const pricesForValidation = successful
        .filter(r => r.quote && r.quote.last_price > 0)
        .map(r => ({
            source: r.source,
            price: r.quote!.last_price,
            timestamp: r.quote!.timestamp
        }));

    const crossValidation = crossValidatePrices(pricesForValidation, 0.5);

    // Select primary source (highest priority with valid data)
    const primaryResult = selectPrimarySource(successful);
    const primaryQuote = primaryResult.quote!;

    // DATA FUSION: Backfill missing fundamentals from other sources
    // If primary source (e.g. NSE) lacks fundamentals, try to find them in secondary sources (e.g. Yahoo)
    if (!primaryQuote.market_cap || !primaryQuote.pe_ratio) {
        const fundingSource = successful.find(r => r.quote && (r.quote.market_cap || r.quote.pe_ratio));
        if (fundingSource && fundingSource.quote) {
            console.log(`[Aggregator] Backfilling fundamentals from ${fundingSource.source} for ${symbol}`);
            if (!primaryQuote.market_cap) primaryQuote.market_cap = fundingSource.quote.market_cap;
            if (!primaryQuote.pe_ratio) primaryQuote.pe_ratio = fundingSource.quote.pe_ratio;
            if (!primaryQuote.eps) primaryQuote.eps = fundingSource.quote.eps;
            if (!primaryQuote.dividend_yield) primaryQuote.dividend_yield = fundingSource.quote.dividend_yield;
            if (!primaryQuote.fifty_two_week_high) primaryQuote.fifty_two_week_high = fundingSource.quote.fifty_two_week_high;
            if (!primaryQuote.fifty_two_week_low) primaryQuote.fifty_two_week_low = fundingSource.quote.fifty_two_week_low;
        }
    }

    // Validate the selected quote
    const quoteValidation = validateQuote(primaryQuote);

    // Calculate freshness
    const freshness = checkTimestampFreshness(primaryQuote.timestamp, 60);

    // Calculate confidence score
    const confidenceResult = calculateConfidenceScore({
        freshnessSeconds: freshness.ageSeconds,
        sourceAgreementPct: crossValidation.agreementPct,
        ohlcValid: quoteValidation.valid,
        volumeReasonable: primaryQuote.volume > 0
    });

    // Build aggregated response
    const response: AggregatedQuote = {
        symbol,
        exchange: primaryResult.exchange,
        source: primaryResult.source,
        fetched_at: fetchedAt,

        quote: primaryQuote,
        intraday: primaryResult.intraday,
        historical: primaryResult.historical,

        confidence_score: confidenceResult.score,
        discrepancy: !crossValidation.agreed,
        discrepancy_details: crossValidation.discrepancy as DiscrepancyDetails | null,

        raw_snapshot: primaryResult.raw_snapshot,
        audit: {
            ...primaryResult.audit,
            sources_queried: sources.map(s => s.name),
            sources_successful: successful.map(r => r.source),
            cross_validation_notes: options.skipCrossValidation
                ? 'Cross-validation skipped'
                : `${successful.length} sources compared. Agreement: ${crossValidation.agreementPct.toFixed(1)}%`,
            confidence_breakdown: {
                freshness: confidenceResult.breakdown.freshness,
                source_agreement: confidenceResult.breakdown.source_agreement,
                ohlc_validity: confidenceResult.breakdown.ohlc_validity,
                volume_consistency: confidenceResult.breakdown.volume_consistency
            }
        },

        data_quality: 'complete',
        missing_fields: []
    };

    return response;
}

/**
 * Fetch historical data from multiple sources
 */
export async function aggregateHistorical(
    symbol: string,
    period: string = '1y',
    interval: string = '1d',
    options: AggregatorOptions = {}
): Promise<AggregatedQuote> {
    const fetchedAt = getCurrentTimestamp();
    const timeout = options.timeout || 15000;

    let sources = ALL_SOURCES;
    if (options.sources && options.sources.length > 0) {
        sources = ALL_SOURCES.filter(s => options.sources!.includes(s.name));
    }

    console.log(`[Aggregator] Fetching historical for ${symbol} (${period}/${interval})`);

    // Fetch historical from all sources
    const fetchPromises = sources.map(async (source): Promise<DataSourceResult> => {
        try {
            return await Promise.race([
                source.fetchHistorical(symbol, period, interval),
                new Promise<DataSourceResult>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);
        } catch (error: any) {
            return {
                success: false,
                source: source.name,
                symbol,
                exchange: 'UNKNOWN',
                quote: null,
                intraday: [],
                historical: [],
                raw_snapshot: {
                    url: '',
                    html_or_json: JSON.stringify({ error: error.message }),
                    captured_at: fetchedAt
                },
                audit: {
                    http_headers: {},
                    cookies: {},
                    fetch_method: 'api',
                    response_time_ms: timeout,
                    notes: `Error: ${error.message}`
                },
                error: error.message,
                fetched_at: fetchedAt
            };
        }
    });

    const results = await Promise.all(fetchPromises);
    const successful = results.filter(r => r.success && r.historical.length > 0);

    if (successful.length === 0) {
        return createErrorResponse(symbol, fetchedAt, results);
    }

    // Select source with most data points
    const primaryResult = successful.reduce((best, current) =>
        current.historical.length > best.historical.length ? current : best
    );

    // Validate historical data
    const validation = validateOHLCVSeries(primaryResult.historical);

    // Calculate confidence
    const confidenceResult = calculateConfidenceScore({
        freshnessSeconds: 0,
        sourceAgreementPct: 100,
        ohlcValid: validation.invalid === 0,
        volumeReasonable: true
    });

    return {
        symbol,
        exchange: primaryResult.exchange,
        source: primaryResult.source,
        fetched_at: fetchedAt,

        quote: {
            last_price: 0,
            bid: null,
            ask: null,
            open: 0,
            high: 0,
            low: 0,
            previous_close: 0,
            change: 0,
            change_pct: 0,
            volume: 0,
            timestamp: fetchedAt
        },
        intraday: primaryResult.intraday,
        historical: primaryResult.historical,

        confidence_score: confidenceResult.score,
        discrepancy: false,
        discrepancy_details: null,

        raw_snapshot: primaryResult.raw_snapshot,
        audit: {
            ...primaryResult.audit,
            sources_queried: sources.map(s => s.name),
            sources_successful: successful.map(r => r.source),
            cross_validation_notes: `Historical data from ${primaryResult.source}. ${primaryResult.historical.length} records. Valid: ${validation.valid}, Invalid: ${validation.invalid}`,
            confidence_breakdown: {
                freshness: confidenceResult.breakdown.freshness,
                source_agreement: confidenceResult.breakdown.source_agreement,
                ohlc_validity: confidenceResult.breakdown.ohlc_validity,
                volume_consistency: confidenceResult.breakdown.volume_consistency
            }
        },

        data_quality: validation.invalid > 0 ? 'partial' : 'complete',
        missing_fields: []
    };
}

// Simple in-memory cache to prevent API rate limiting and improve performance
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const AGGREGATION_CACHE = new Map<string, { data: AggregatedQuote; timestamp: number }>();

/**
 * Full fetch: Quote + Historical combined
 */
export async function aggregateFull(
    symbol: string,
    period: string = '1y',
    options: AggregatorOptions = {}
): Promise<AggregatedQuote> {
    const cacheKey = `${symbol}:${period}`;
    const cached = AGGREGATION_CACHE.get(cacheKey);

    // Return cached data if valid
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        console.log(`[Aggregator] Serving ${symbol} from cache (${((Date.now() - cached.timestamp) / 1000).toFixed(1)}s old)`);
        return cached.data;
    }

    // 1. Fetch Quote (from all sources in parallel)
    const quoteResult = await aggregateQuote(symbol, options);

    // 2. Determine Primary Source and Successful Sources
    // (This logic is already inside aggregateQuote, but we need access to the source objects for fallback)
    // We can re-use the audit info to find successful sources
    const successfulSourceNames = quoteResult.audit.sources_successful;

    // 3. Fetch Historical Data with Fallback
    // Strategy: Try primary source first (based on quote result). If it fails or returns empty, try other successful sources.
    let historical: OHLCV[] = [];
    let historySource = quoteResult.source;

    // Create a prioritized list of sources to try for history
    // Start with the source that provided the quote (Primary), then others
    const priorityList = [
        quoteResult.source,
        ...successfulSourceNames.filter(name => name !== quoteResult.source)
    ];

    for (const sourceName of priorityList) {
        // Find the source instance
        const sourceInstance = ALL_SOURCES.find(s => s.name === sourceName);
        if (!sourceInstance) continue;

        try {
            console.log(`[Aggregator] Fetching historical from ${sourceName} for ${symbol} (${period})`);
            const historyResult = await sourceInstance.fetchHistorical(symbol, period, '1d');

            if (historyResult.success && historyResult.historical && historyResult.historical.length > 0) {
                historical = historyResult.historical;
                historySource = sourceName;
                console.log(`[Aggregator] Got ${historical.length} historical records from ${sourceName}`);
                break; // Found valid history, stop looking
            } else {
                console.log(`[Aggregator] ${sourceName} returned no historical data`);
            }
        } catch (e) {
            console.error(`[Aggregator] Failed to fetch historical from ${sourceName}`, e);
        }
    }

    if (historical.length === 0) {
        console.warn(`[Aggregator] No historical data found for ${symbol} from any source`);
        // Last ditch effort: Try aggregateHistorical which tries EVERYTHING in parallel
        // (Just in case sources that failed quote might succeed history, e.g. AlphaVantage)
        try {
            const fallbackHist = await aggregateHistorical(symbol, period, '1d', options);
            if (fallbackHist.historical.length > 0) {
                historical = fallbackHist.historical;
                historySource = fallbackHist.source;
                console.log(`[Aggregator] Fallback parallel fetch succeeded from ${historySource}`);
            }
        } catch (e) {
            console.error(`[Aggregator] Fallback parallel fetch failed`, e);
        }
    }

    // Merge results
    const result: AggregatedQuote = {
        ...quoteResult,
        historical: historical,
        audit: {
            ...quoteResult.audit,
            // Update notes to reflect where history came from
            cross_validation_notes: `${quoteResult.audit.cross_validation_notes}. Historical data from ${historySource} (${historical.length} records)`
        }
    };

    // Save to cache
    AGGREGATION_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
}

// Helper: Select primary source based on priority and data quality
function selectPrimarySource(results: DataSourceResult[]): DataSourceResult {
    // Sort by source priority (lower is better)
    const sorted = [...results].sort((a, b) => {
        const priorityA = ALL_SOURCES.find(s => s.name === a.source)?.priority || 99;
        const priorityB = ALL_SOURCES.find(s => s.name === b.source)?.priority || 99;
        return priorityA - priorityB;
    });
    return sorted[0];
}

// Helper: Create error response when all sources fail
function createErrorResponse(
    symbol: string,
    fetchedAt: string,
    results: DataSourceResult[]
): AggregatedQuote {
    const errors = results.map(r => `${r.source}: ${r.error}`).join('; ');

    return {
        symbol,
        exchange: 'UNKNOWN',
        source: 'none',
        fetched_at: fetchedAt,

        quote: {
            last_price: 0,
            bid: null,
            ask: null,
            open: 0,
            high: 0,
            low: 0,
            previous_close: 0,
            change: 0,
            change_pct: 0,
            volume: 0,
            timestamp: fetchedAt
        },
        intraday: [],
        historical: [],

        confidence_score: 0,
        discrepancy: false,
        discrepancy_details: null,

        raw_snapshot: {
            url: '',
            html_or_json: JSON.stringify({ errors: results.map(r => r.error) }),
            captured_at: fetchedAt
        },
        audit: {
            http_headers: {},
            cookies: {},
            fetch_method: 'api',
            response_time_ms: 0,
            notes: `All sources failed: ${errors}`,
            sources_queried: results.map(r => r.source),
            sources_successful: [],
            cross_validation_notes: 'No data available for cross-validation',
            confidence_breakdown: {
                freshness: 0,
                source_agreement: 0,
                ohlc_validity: 0,
                volume_consistency: 0
            }
        },

        data_quality: 'partial',
        missing_fields: ['quote', 'historical', 'intraday']
    };
}
