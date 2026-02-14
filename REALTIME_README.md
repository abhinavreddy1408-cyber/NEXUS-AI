# Real-time Stock Data Pipeline

This project implements a robust, production-ready real-time stock data pipeline using standard WebSockets (Socket.IO).

## Architecture

- **Server**: Node.js/TypeScript server (`src/server/realtime/index.ts`) running on port 8080.
- **Providers**: Pluggable adapters interact with upstream APIs.
  - `MockProvider`: (Default) Generates realistic market simulations without API keys.
  - `FinnhubProvider`: (Stub) Ready to be implemented for global data.
  - `KiteProvider`: (Stub) Ready to be implemented for Indian markets.
- **Frontend**: Connects via `socket.io-client` to receive broadcasted updates.
- **Protocol**: 
  - Clients emit `subscribe` with a symbol (e.g., `RELIANCE.NSE`).
  - Server emits `stock_update` with normalized JSON data.

## Getting Started

### 1. Run the Realtime Server

```bash
npm run start:realtime
```

This starts the server on `http://localhost:8080`.

### 2. Verify Connection

Run the test script to verify the pipeline is delivering events:

```bash
node test-realtime/connect-test.js
```

### 3. Frontend Integration

The frontend (Next.js) automatically tries to connect to `localhost:8080`. Ensure both `npm run dev` and `npm run start:realtime` are running.

### 4. Docker

To run the entire stack:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Data Schema

All events follow this normalized schema:

```json
{
  "source": "custom",
  "exchange": "NSE",
  "symbol": "RELIANCE.NSE",
  "timestamp": "2026-01-27T13:25:12.345Z",
  "last_price": 3491.25,
  "change": 25.50,
  "change_pct": 0.74,
  ...
}
```

## Providers & Legal (IMPORTANT)

### Valid Sources
- **Simulated (Current)**: Legal for dev/test. Random walk with drift.
- **Zerodha Kite Connect**: ~₹2000/mo. Best for Indian Equities.
- **Finnhub**: Free tier available (US stocks).

### Restrictions
- **Do NOT scrape** sites like Moneycontrol or Google Finance. It violates TOS and is unreliable.
- Always use the `MockProvider` for development to avoid rate limits.
