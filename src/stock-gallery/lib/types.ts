// Stock Gallery Type Definitions

export interface StockSearchResult {
    symbol: string;
    company_name: string;
    exchange: string;
    sector: string;
}

export interface LatestQuote {
    timestamp: string;
    close: number;
    change: number;
    change_pct: number;
}

export interface Fundamentals {
    market_cap: number | null;
    pe_ratio: number | null;
    eps: number | null;
    dividend_yield: number | null;
    sector: string;
    "52_week_high"?: number;
    "52_week_low"?: number;
    day_high?: number;
    day_low?: number;
    volume?: number;
}

export interface OHLCV {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface IndicatorPoint {
    timestamp: string;
    value: number;
}

export interface Indicators {
    sma20?: IndicatorPoint[];
    sma50?: IndicatorPoint[];
    ema20?: IndicatorPoint[];
    rsi14?: IndicatorPoint[];
    bollinger?: {
        upper: IndicatorPoint[];
        middle: IndicatorPoint[];
        lower: IndicatorPoint[];
    };
}

export interface ForecastPoint {
    timestamp: string;
    predicted_close: number;
    lower_ci: number;
    upper_ci: number;
}

export interface BacktestMetrics {
    MAE: number;
    RMSE: number;
    coverage_pct: number;
    last_trained: string;
}

export interface Prediction {
    available: boolean;
    reason?: string;
    computing?: boolean;
    model_name?: string;
    model_version?: string;
    confidence_score?: number;
    forecast_horizon_days?: number;
    forecast?: ForecastPoint[];
    backtest?: BacktestMetrics;
    explanation?: string;
}

export interface NewsItem {
    timestamp: string;
    headline: string;
    summary: string;
    sentiment_score: number; // -1 to 1
}

export interface StockDetails {
    symbol: string;
    company_name: string;
    exchange: string;
    latest: LatestQuote;
    fundamentals: Fundamentals;
    historical: OHLCV[];
    indicators: Indicators;
    prediction: Prediction;
    news: NewsItem[];
    data_source: {
        primary: string;
        sources_used: string[];
        confidence_score: number;
        discrepancy_detected: boolean;
        fetched_at: string;
    };
}

export interface SearchResponse {
    results: StockSearchResult[];
}

export interface DetailsResponse extends StockDetails { }

// Query parameters
export interface DetailsQueryParams {
    symbol: string;
    period?: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "all";
    interval?: "1m" | "5m" | "15m" | "1h" | "1d";
    forecast_horizon?: 1 | 7 | 30;
}
