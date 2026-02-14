import { IStockProvider, StockUpdate, Exchange, Source } from "../types";

// Simulates an Exchange's Matching Engine State
interface InstrumentState {
    price: number;
    volume: number;
    open: number;
    high: number;
    low: number;
    prevClose: number;
    lastSequence: number;
    lastUpdate: number; // timestamp ms
}

export class MockProvider implements IStockProvider {
    public name: Source = "custom";
    private interval: NodeJS.Timeout | null = null;
    private subscriptions: Set<string> = new Set();
    private callback: ((data: StockUpdate) => void) | null = null;

    // Authoritative State (The "Exchange" Database)
    private marketState: Record<string, InstrumentState> = {
        "RELIANCE.NSE": { price: 2450.00, volume: 100000, open: 2440, high: 2460, low: 2435, prevClose: 2445, lastSequence: 0, lastUpdate: Date.now() },
        "TCS.NSE": { price: 3800.00, volume: 50000, open: 3790, high: 3820, low: 3780, prevClose: 3795, lastSequence: 0, lastUpdate: Date.now() },
        "HDFCBANK.NSE": { price: 1600.00, volume: 200000, open: 1590, high: 1610, low: 1585, prevClose: 1595, lastSequence: 0, lastUpdate: Date.now() },
        "^NSEI": { price: 22000.00, volume: 0, open: 21900, high: 22100, low: 21850, prevClose: 21950, lastSequence: 0, lastUpdate: Date.now() }
    };

    private config = {
        updateRate: 1000,
        volatility: 0.001
    };

    async connect(): Promise<void> {
        console.log("[MockProvider] Connected to Authoritative Exchange Simulator.");
        this.startSimulation();
    }

    async disconnect(): Promise<void> {
        if (this.interval) clearInterval(this.interval);
    }

    subscribe(symbols: string[]): void {
        symbols.forEach(s => {
            this.subscriptions.add(s);
            // Initialize state if new
            if (!this.marketState[s]) {
                const base = 1000 + Math.random() * 2000;
                this.marketState[s] = {
                    price: base,
                    volume: 0,
                    open: base,
                    high: base,
                    low: base,
                    prevClose: base,
                    lastSequence: 0,
                    lastUpdate: Date.now()
                };
            }
        });
    }

    unsubscribe(symbols: string[]): void {
        symbols.forEach(s => this.subscriptions.delete(s));
    }

    onMessage(callback: (data: StockUpdate) => void): void {
        this.callback = callback;
    }

    // Authoritative Endpoint for Reconciliation
    async getSnapshot(symbol: string): Promise<StockUpdate | null> {
        const state = this.marketState[symbol];
        if (!state) return null;

        // Return the exact current state as a StockUpdate
        return this.createTick(symbol, state);
    }

    private createTick(symbol: string, state: InstrumentState): StockUpdate {
        const exchange: Exchange = symbol.includes("NSE") || symbol === "^NSEI" ? "NSE" : "OTHER";
        const change = state.price - state.prevClose;
        const changePct = (change / state.prevClose) * 100;

        return {
            source: "custom",
            exchange: exchange,
            symbol: symbol,
            timestamp: new Date(state.lastUpdate).toISOString(),
            sequence_number: state.lastSequence,
            last_price: parseFloat(state.price.toFixed(2)),
            open: parseFloat(state.open.toFixed(2)),
            high: parseFloat(state.high.toFixed(2)),
            low: parseFloat(state.low.toFixed(2)),
            prev_close: parseFloat(state.prevClose.toFixed(2)),
            volume: state.volume,
            change: parseFloat(change.toFixed(2)),
            change_pct: parseFloat(changePct.toFixed(2)),
            quality: "realtime",
            latency_ms: 0 // Origin
        };
    }

    private startSimulation() {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            if (!this.callback) return;

            this.subscriptions.forEach(symbol => {
                const state = this.marketState[symbol];

                // Simulate Trade
                const changeP = (Math.random() * this.config.volatility * 2) - this.config.volatility;
                const newPrice = state.price * (1 + changeP);
                const volumeStep = Math.floor(Math.random() * 500);

                // Update Authoritative State atomically
                state.price = newPrice;
                state.volume += volumeStep;
                state.high = Math.max(state.high, newPrice);
                state.low = Math.min(state.low, newPrice);
                state.lastSequence++;
                state.lastUpdate = Date.now();

                // Emit Event
                const tick = this.createTick(symbol, state);
                this.callback!(tick);
            });

        }, this.config.updateRate);
    }
}
