// Realtime Market Data Types
// Comprehensive type definitions for multi-source data aggregation

// ============================================================================
// Core Data Types
// ============================================================================

export interface OHLCV {
    timestamp: string;  // ISO8601 with timezone
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Quote {
    last_price: number;
    bid: number | null;
    ask: number | null;
    open: number;
    high: number;
    low: number;
    previous_close: number;
    change: number;
    change_pct: number;
    volume: number;
    timestamp: string;  // Timestamp from source

    // Fundamentals (Optional)
    market_cap?: number;
    pe_ratio?: number;
    eps?: number;
    dividend_yield?: number;
    fifty_two_week_high?: number;
    fifty_two_week_low?: number;
    sector?: string;
}

export interface AuditInfo {
    http_headers: Record<string, string>;
    cookies: Record<string, string>;
    fetch_method: 'api' | 'xhr' | 'headless';
    response_time_ms: number;
    notes: string;
}

export interface RawSnapshot {
    url: string;
    html_or_json: string;
    captured_at: string;
}

export interface DiscrepancyDetails {
    source_a: { name: string; price: number; timestamp: string };
    source_b: { name: string; price: number; timestamp: string };
    pct_difference: number;
}

// ============================================================================
// Data Source Interface
// ============================================================================

export interface DataSourceResult {
    success: boolean;
    source: string;
    symbol: string;
    exchange: string;
    quote: Quote | null;
    intraday: OHLCV[];
    historical: OHLCV[];
    raw_snapshot: RawSnapshot;
    audit: AuditInfo;
    error?: string;
    fetched_at: string;
}

export interface DataSource {
    name: string;
    priority: number;  // Lower = higher priority
    supportedExchanges: string[];

    fetchQuote(symbol: string): Promise<DataSourceResult>;
    fetchHistorical(symbol: string, period: string, interval: string): Promise<DataSourceResult>;
    isAvailable(): Promise<boolean>;
}

// ============================================================================
// Aggregated Response (Final Output)
// ============================================================================

export interface AggregatedQuote {
    symbol: string;
    exchange: string;
    source: string;  // Primary source used
    fetched_at: string;

    quote: Quote;
    intraday: OHLCV[];
    historical: OHLCV[];

    confidence_score: number;  // 0..1
    discrepancy: boolean;
    discrepancy_details: DiscrepancyDetails | null;

    raw_snapshot: RawSnapshot;
    audit: AuditInfo & {
        sources_queried: string[];
        sources_successful: string[];
        cross_validation_notes: string;
        confidence_breakdown: {
            freshness: number;
            source_agreement: number;
            ohlc_validity: number;
            volume_consistency: number;
        };
    };

    data_quality: 'complete' | 'partial';
    missing_fields: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    corrected?: OHLCV;
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

export interface RateLimiterConfig {
    maxRequestsPerSecond: number;
    burstLimit: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface RealtimeQuoteRequest {
    symbol: string;
    interval?: '1m' | '5m' | '15m' | '1h' | '1d';
    period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y';
    sources?: string[];  // Optional: specify which sources to use
}

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_EXCHANGES = ['NSE', 'BSE', 'NYSE', 'NASDAQ'] as const;
export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

export const DATA_SOURCES = ['yahoo-finance', 'nse-india', 'bse-india', 'alpha-vantage'] as const;
export type DataSourceName = typeof DATA_SOURCES[number];
