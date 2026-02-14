import { IStockProvider, StockUpdate, Exchange, Source } from "../types";

// MoneyControl sc_id mapping for common Indian stocks and indices
const SYMBOL_MAP: Record<string, { sc_id: string; type: "stock" | "index"; name: string }> = {
    // Indices
    "^NSEI": { sc_id: "in;NSX", type: "index", name: "NIFTY 50" },
    "^BSESN": { sc_id: "in;SEN", type: "index", name: "SENSEX" },
    "^NSEBANK": { sc_id: "in;NXB", type: "index", name: "NIFTY BANK" },

    // Popular Stocks (NSE)
    "RELIANCE.NSE": { sc_id: "RI", type: "stock", name: "Reliance Industries" },
    "TCS.NSE": { sc_id: "TCS", type: "stock", name: "Tata Consultancy Services" },
    "HDFCBANK.NSE": { sc_id: "HDF01", type: "stock", name: "HDFC Bank" },
    "INFY.NSE": { sc_id: "IT", type: "stock", name: "Infosys" },
    "HINDUNILVR.NSE": { sc_id: "HU", type: "stock", name: "Hindustan Unilever" },
    "ICICIBANK.NSE": { sc_id: "ICI02", type: "stock", name: "ICICI Bank" },
    "SBIN.NSE": { sc_id: "SBI", type: "stock", name: "State Bank of India" },
    "BHARTIARTL.NSE": { sc_id: "BA08", type: "stock", name: "Bharti Airtel" },
    "KOTAKBANK.NSE": { sc_id: "KB", type: "stock", name: "Kotak Mahindra Bank" },
    "LT.NSE": { sc_id: "LT", type: "stock", name: "Larsen & Toubro" },
    "AXISBANK.NSE": { sc_id: "AB16", type: "stock", name: "Axis Bank" },
    "ITC.NSE": { sc_id: "ITC", type: "stock", name: "ITC Limited" },
    "BAJFINANCE.NSE": { sc_id: "BAF", type: "stock", name: "Bajaj Finance" },
    "MARUTI.NSE": { sc_id: "MS24", type: "stock", name: "Maruti Suzuki" },
    "TITAN.NSE": { sc_id: "TI01", type: "stock", name: "Titan Company" },
    "ASIANPAINT.NSE": { sc_id: "AP31", type: "stock", name: "Asian Paints" },
    "WIPRO.NSE": { sc_id: "W", type: "stock", name: "Wipro" },
    "HCLTECH.NSE": { sc_id: "HCL02", type: "stock", name: "HCL Technologies" },
    "SUNPHARMA.NSE": { sc_id: "SPL03", type: "stock", name: "Sun Pharmaceutical" },
    "TATAMOTORS.NSE": { sc_id: "TM03", type: "stock", name: "Tata Motors" },
    "TATASTEEL.NSE": { sc_id: "TIS", type: "stock", name: "Tata Steel" },
    "POWERGRID.NSE": { sc_id: "PGC", type: "stock", name: "Power Grid Corporation" },
    "NTPC.NSE": { sc_id: "NTP", type: "stock", name: "NTPC" },
    "ONGC.NSE": { sc_id: "ONG", type: "stock", name: "ONGC" },
    "COALINDIA.NSE": { sc_id: "CI11", type: "stock", name: "Coal India" },
};

interface MCStockResponse {
    pricecurrent: string;
    priceprevclose: string;
    pricechange: string;
    pricepercentchange: string;
    OPN?: string;
    OPEN?: string;
    HIGH?: string;
    HP?: string;
    LOW?: string;
    VOL?: string;
    "52H"?: string;
    "52L"?: string;
    lastupd: string;
    lastupd_epoch: string;
    market_state: string;
    company: string;
    symbol: string;
}

export class MoneyControlProvider implements IStockProvider {
    public name: Source = "custom";
    private interval: NodeJS.Timeout | null = null;
    private subscriptions: Set<string> = new Set();
    private callback: ((data: StockUpdate) => void) | null = null;
    private sequenceCounter: Record<string, number> = {};

    private config = {
        updateRate: 3000, // 3 seconds - respects rate limits
        stockEndpoint: "https://priceapi.moneycontrol.com/pricefeed/nse/equitycash",
        indexEndpoint: "https://priceapi.moneycontrol.com/pricefeed/notapplicable/inidicesindia",
    };

    // Cache last known values for fallback
    private lastKnownValues: Record<string, StockUpdate> = {};

    async connect(): Promise<void> {
        console.log("[MoneyControlProvider] Connected to MoneyControl PriceAPI.");
        this.startPolling();
    }

    async disconnect(): Promise<void> {
        if (this.interval) clearInterval(this.interval);
    }

    subscribe(symbols: string[]): void {
        symbols.forEach(s => {
            const normalized = this.normalizeSymbol(s);
            if (SYMBOL_MAP[normalized]) {
                this.subscriptions.add(normalized);
                this.sequenceCounter[normalized] = 0;
                console.log(`[MoneyControlProvider] Subscribed to ${normalized}`);
            } else {
                console.warn(`[MoneyControlProvider] Unknown symbol: ${s} (normalized: ${normalized}). Add to SYMBOL_MAP.`);
            }
        });
    }

    unsubscribe(symbols: string[]): void {
        symbols.forEach(s => {
            const normalized = this.normalizeSymbol(s);
            this.subscriptions.delete(normalized);
        });
    }

    onMessage(callback: (data: StockUpdate) => void): void {
        this.callback = callback;
    }

    async getSnapshot(symbol: string): Promise<StockUpdate | null> {
        const normalized = this.normalizeSymbol(symbol);
        const mapping = SYMBOL_MAP[normalized];
        if (!mapping) return null;

        try {
            const data = await this.fetchPrice(normalized);
            return data;
        } catch (e) {
            return this.lastKnownValues[normalized] || null;
        }
    }

    private normalizeSymbol(symbol: string): string {
        // Handle various formats: RELIANCE.NS, RELIANCE.NSE, ^NSEI
        let normalized = symbol.toUpperCase();
        if (normalized.endsWith(".NS")) {
            normalized = normalized.replace(".NS", ".NSE");
        }
        return normalized;
    }

    private async fetchPrice(symbol: string): Promise<StockUpdate | null> {
        const mapping = SYMBOL_MAP[symbol];
        if (!mapping) return null;

        const baseUrl = mapping.type === "index"
            ? this.config.indexEndpoint
            : this.config.stockEndpoint;

        const url = `${baseUrl}/${encodeURIComponent(mapping.sc_id)}`;

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Referer": "https://www.moneycontrol.com/",
                },
            });

            if (!response.ok) {
                console.error(`[MoneyControlProvider] HTTP ${response.status} for ${symbol}`);
                return this.lastKnownValues[symbol] || null;
            }

            const json = await response.json();
            if (json.code !== "200" || !json.data) {
                console.error(`[MoneyControlProvider] API error for ${symbol}:`, json.message);
                return this.lastKnownValues[symbol] || null;
            }

            const data: MCStockResponse = json.data;
            this.sequenceCounter[symbol] = (this.sequenceCounter[symbol] || 0) + 1;

            const tick: StockUpdate = this.createTick(symbol, data);
            this.lastKnownValues[symbol] = tick;
            return tick;

        } catch (e) {
            console.error(`[MoneyControlProvider] Fetch error for ${symbol}:`, e);
            return this.lastKnownValues[symbol] || null;
        }
    }

    private createTick(symbol: string, data: MCStockResponse): StockUpdate {
        const mapping = SYMBOL_MAP[symbol];
        const exchange: Exchange = symbol.startsWith("^") ? "NSE" :
            (symbol.includes("NSE") ? "NSE" : "OTHER");

        const lastPrice = parseFloat(data.pricecurrent) || 0;
        const prevClose = parseFloat(data.priceprevclose) || lastPrice;
        const open = parseFloat(data.OPN || data.OPEN || "0") || lastPrice;
        const high = parseFloat(data.HP || data.HIGH || "0") || lastPrice;
        const low = parseFloat(data.LOW || "0") || lastPrice;
        const volume = parseInt(data.VOL || "0", 10) || 0;
        const change = parseFloat(data.pricechange) || 0;
        const changePct = parseFloat(data.pricepercentchange) || 0;

        return {
            source: "custom",
            exchange: exchange,
            symbol: symbol,
            timestamp: new Date().toISOString(),
            sequence_number: this.sequenceCounter[symbol],
            last_price: lastPrice,
            open: open,
            high: high,
            low: low,
            prev_close: prevClose,
            volume: volume,
            change: change,
            change_pct: changePct,
            quality: data.market_state === "OPEN" ? "realtime" : "delayed",
            latency_ms: 0,
            market_state: data.market_state,
        };
    }

    private startPolling() {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(async () => {
            if (!this.callback || this.subscriptions.size === 0) return;

            for (const symbol of this.subscriptions) {
                try {
                    const tick = await this.fetchPrice(symbol);
                    if (tick) {
                        this.callback(tick);
                    }
                } catch (e) {
                    console.error(`[MoneyControlProvider] Error polling ${symbol}:`, e);
                }

                // Small delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 200));
            }
        }, this.config.updateRate);
    }
}
