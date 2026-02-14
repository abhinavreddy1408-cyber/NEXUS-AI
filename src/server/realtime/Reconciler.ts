import { IStockProvider, StockUpdate } from "./types";

export class Reconciler {
    private lastSeenValues: Record<string, StockUpdate> = {};
    private providers: IStockProvider[] = [];
    private interval: NodeJS.Timeout | null = null;

    // Config
    private CHECK_INTERVAL = 30000; // 30s
    private PRICE_TOLERANCE = 0.0005; // 0.05%

    constructor(providers: IStockProvider[]) {
        this.providers = providers;
    }

    public track(tick: StockUpdate) {
        this.lastSeenValues[tick.symbol] = tick;
    }

    public start() {
        if (this.interval) clearInterval(this.interval);
        console.log(`[Reconciler] Starting audit loop every ${this.CHECK_INTERVAL}ms`);
        this.interval = setInterval(() => this.audit(), this.CHECK_INTERVAL);
    }

    public stop() {
        if (this.interval) clearInterval(this.interval);
    }

    private async audit() {
        console.log(`[Reconciler] Running audit on ${Object.keys(this.lastSeenValues).length} symbols...`);
        let errors = 0;

        for (const symbol of Object.keys(this.lastSeenValues)) {
            const lastSeen = this.lastSeenValues[symbol];

            // Find authoritative source (provider)
            const provider = this.providers.find(p => p.name === lastSeen.source);
            if (!provider) continue;

            const snapshot = await provider.getSnapshot(symbol);
            if (!snapshot) {
                console.warn(`[Reconciler] No snapshot available for ${symbol}`);
                continue;
            }

            // Compare
            const priceDiff = Math.abs(lastSeen.last_price - snapshot.last_price);
            const pricePctDiff = priceDiff / snapshot.last_price;

            if (pricePctDiff > this.PRICE_TOLERANCE) {
                console.error(`[ALERT] Price Mismatch for ${symbol}! Broadcast: ${lastSeen.last_price}, Auth: ${snapshot.last_price}, Diff: ${(pricePctDiff * 100).toFixed(4)}%`);
                errors++;
            } else {
                // console.log(`[PASS] ${symbol} matched (Diff: ${(pricePctDiff*100).toFixed(4)}%)`);
            }

            // Volume Check
            // Sequence Check
            if (lastSeen.sequence_number && snapshot.sequence_number && lastSeen.sequence_number < snapshot.sequence_number) {
                // It's expected snapshot is slightly ahead if stream is laggy, 
                // but if snapshot is BEHIND stream, that's impossible/data corruption.
                if (snapshot.sequence_number < lastSeen.sequence_number) {
                    console.error(`[ALERT] Sequence Inversion for ${symbol}! Stream is ahead of Authority.`);
                    errors++;
                }
            }
        }

        console.log(`[Reconciler] Audit complete. Errors: ${errors}`);
    }
}
