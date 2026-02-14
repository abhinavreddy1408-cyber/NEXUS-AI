export type Exchange = "NSE" | "BSE" | "NYSE" | "NASDAQ" | "OTHER";
export type Source = "finnhub" | "kite" | "polygon" | "iex" | "custom";
export type DataQuality = "realtime" | "delayed" | "stale" | "correction";

export interface StockUpdate {
    source: Source;
    exchange: Exchange;
    symbol: string;
    timestamp: string; // ISO 8601, authoritative exchange time
    sequence_number?: number; // Monotonically increasing ID from upstream
    last_price: number;
    open?: number;
    high?: number;
    low?: number;
    prev_close?: number;
    volume?: number;
    bid?: number;
    ask?: number;
    change?: number;
    change_pct?: number;
    quality: DataQuality;
    latency_ms?: number; // Time drift
    market_state?: string; // "OPEN" | "CLOSED"
}

export interface IStockProvider {
    name: Source;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(symbols: string[]): void;
    unsubscribe(symbols: string[]): void;
    onMessage(callback: (data: StockUpdate) => void): void;

    // New: For Reconciliation
    getSnapshot(symbol: string): Promise<StockUpdate | null>;
}
