import { Server } from "socket.io";
import { createServer } from "http";
import { IStockProvider, StockUpdate } from "./types";
import { MockProvider } from "./providers/MockProvider";
import { MoneyControlProvider } from "./providers/MoneyControlProvider";
import { Validator } from "./Validator";
import { Reconciler } from "./Reconciler";

const PORT = parseInt(process.env.REALTIME_PORT || "8080", 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:3000"];

class RealtimeServer {
    private io: Server;
    private providers: IStockProvider[] = [];
    private activeSymbols: Set<string> = new Set();

    // Hardening Modules
    private validator: Validator;
    private reconciler: Reconciler;

    constructor() {
        // Initialize Validator first
        this.validator = new Validator();

        const httpServer = createServer((req, res) => {
            if (req.url === '/health') {
                const stats = this.validator.getStats();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'OK', ...stats }));
                return;
            }
        });

        this.io = new Server(httpServer, {
            cors: {
                origin: ALLOWED_ORIGINS,
                methods: ["GET", "POST"]
            }
        });

        // Initialize Providers FIRST so Reconciler can access them
        this.initializeProviders();

        this.reconciler = new Reconciler(this.providers);
        this.reconciler.start();

        httpServer.listen(PORT, () => {
            console.log(`[RealtimeServer] Listening on port ${PORT}`);
        });

        this.setupSocketHandlers();
    }

    private initializeProviders() {
        // Primary: MoneyControl for real Indian market data
        // Fallback: MockProvider for development/testing
        const useRealData = process.env.USE_REAL_DATA !== "false"; // Default to true

        if (useRealData) {
            console.log("[RealtimeServer] Using MoneyControlProvider for real market data.");
            this.providers.push(new MoneyControlProvider());
        } else {
            console.log("[RealtimeServer] Using MockProvider for simulated data.");
            this.providers.push(new MockProvider());
        }

        this.providers.forEach(async (p) => {
            p.onMessage(this.processUpdate.bind(this));
            try {
                await p.connect();
                console.log(`[RealtimeServer] Provider ${p.name} connected.`);

                // Subscribe to defaults
                p.subscribe(["^NSEI", "RELIANCE.NSE", "TCS.NSE", "HDFCBANK.NSE"]);
            } catch (e) {
                console.error(`[RealtimeServer] Failed to connect provider ${p.name}`, e);
            }
        });
    }


    // New: Pipeline Processing
    private processUpdate(data: StockUpdate) {
        // 1. Validate
        if (!this.validator.validate(data)) {
            return; // Drop bad data
        }

        // 2. Track for Audit
        this.reconciler.track(data);

        // 3. Broadcast
        this.broadcastUpdate(data);
    }

    private setupSocketHandlers() {
        this.io.on("connection", (socket) => {
            console.log(`[RealtimeServer] Client connected: ${socket.id}`);

            socket.on("subscribe", (symbol: string) => {
                const cleanSymbol = symbol.toUpperCase();
                socket.join(cleanSymbol);
                console.log(`[RealtimeServer] Client ${socket.id} subscribed to ${cleanSymbol}`);

                // Tell providers to track this if not already
                if (!this.activeSymbols.has(cleanSymbol)) {
                    this.activeSymbols.add(cleanSymbol);
                    this.providers.forEach(p => p.subscribe([cleanSymbol]));
                }
            });

            socket.on("unsubscribe", (symbol: string) => {
                socket.leave(symbol.toUpperCase());
            });

            socket.on("disconnect", () => {
                console.log(`[RealtimeServer] Client disconnected: ${socket.id}`);
            });
        });
    }

    private broadcastUpdate(data: StockUpdate) {
        // Emit to specific room for efficient distribution
        this.io.to(data.symbol).emit("stock_update", data);
    }
}

new RealtimeServer();
