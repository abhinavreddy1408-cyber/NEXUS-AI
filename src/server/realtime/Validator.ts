import { StockUpdate } from "./types";

export class Validator {
    private lastSequences: Record<string, number> = {};
    private stats = {
        totalEvents: 0,
        droppedEvents: 0,
        sequenceGaps: 0,
        latencyTotal: 0
    };

    public validate(tick: StockUpdate): boolean {
        const now = Date.now();
        const tickTime = new Date(tick.timestamp).getTime();

        // 1. Sanity: Future timestamp check (allow 1s clock drift)
        if (tickTime > now + 1000) {
            console.warn(`[Validator] Rejected future tick for ${tick.symbol}: ${tick.timestamp}`);
            this.stats.droppedEvents++;
            return false;
        }

        // 2. Sanity: Stale check (> 10s old) - depending on requirement, we might just flag quality 'stale'
        if (tickTime < now - 10000) {
            console.warn(`[Validator] Stale tick for ${tick.symbol}: ${tick.timestamp}`);
            tick.quality = "stale"; // Downgrade quality but pass through
        }

        // 3. Sanity: Price/Volume
        if (tick.last_price <= 0 || (tick.volume !== undefined && tick.volume < 0)) {
            console.error(`[Validator] Invalid price/volume for ${tick.symbol}`);
            this.stats.droppedEvents++;
            return false;
        }

        // 4. Sequence Check
        if (tick.sequence_number !== undefined) {
            const last = this.lastSequences[tick.symbol];
            if (last !== undefined) {
                if (tick.sequence_number <= last) {
                    // Duplicate or out-of-order
                    console.warn(`[Validator] Out-of-order ${tick.symbol}: ${tick.sequence_number} <= ${last}`);
                    // We might accept if it's a correction, but for strict ordering we drop or re-sort.
                    // For now, drop duplicates.
                    if (tick.sequence_number === last) return false;
                } else if (tick.sequence_number > last + 1) {
                    const gap = tick.sequence_number - last - 1;
                    console.warn(`[Validator] Gap detected for ${tick.symbol}: ${gap} frames (Last: ${last}, Curr: ${tick.sequence_number})`);
                    this.stats.sequenceGaps += gap;
                }
            }
            this.lastSequences[tick.symbol] = tick.sequence_number;
        }

        // Metrics
        this.stats.totalEvents++;
        const latency = now - tickTime;
        this.stats.latencyTotal += latency;
        tick.latency_ms = latency;

        return true;
    }

    public getStats() {
        return {
            ...this.stats,
            avgLatency: this.stats.totalEvents ? (this.stats.latencyTotal / this.stats.totalEvents).toFixed(2) : 0
        };
    }
}
