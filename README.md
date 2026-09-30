# NEXUS-AI: Real-Time Market Intelligence & Stock Streaming Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Socket.IO-black.svg?logo=socketdotio)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)

**NEXUS-AI** is a full-stack financial market intelligence and real-time stock data pipeline built with Next.js, WebSockets (Socket.IO), and Prisma. It bridges simulated or live market feeds with responsive streaming dashboards and AI-assisted financial analysis.

---

## ⚡ Key Features

* **High-Throughput Real-Time Streaming:** Standalone WebSocket server powered by Socket.IO for low-latency live stock price updates and tick distribution.
* **Pluggable Market Provider Architecture:**
  * `MockProvider`: Realistic market simulation generator with deterministic Brownian motion and volatility modeling.
  * `FinnhubProvider` & `KiteProvider`: Ready-to-use adapter stubs for global and Indian equity feeds.
* **AI-Assisted Market Insights:** Integrates generative AI interfaces for summarizing ticker sentiments and earnings releases.
* **Interactive Financial Analytics:** Dynamic charts built with Recharts, Framer Motion animations, and Tailwind CSS.
* **Database & ORM:** Robust schema with Prisma supporting portfolio tracking, watchlists, and historical tick logs.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │ Market Data Providers   │
                    │ (Mock / Finnhub / Kite) │
                    └───────────┬─────────────┘
                                │ Normalized Ticks
                                ▼
                    ┌─────────────────────────┐
                    │ Real-Time Server        │
                    │ (Socket.IO / port 8080) │
                    └───────────┬─────────────┘
                                │ WebSocket Broadcast
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│ Next.js Web Client      │                 │ Backend Persistence     │
│ (Interactive Dashboard) │                 │ (Prisma ORM & SQLite)   │
└─────────────────────────┘                 └─────────────────────────┘
```

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Framer Motion, Recharts
* **Backend:** Node.js, Express, Socket.IO, WebSockets (`ws`)
* **Data & Persistence:** Prisma ORM, SQLite / PostgreSQL
* **Market APIs:** Yahoo Finance (`yahoo-finance2`), Custom Streaming Adapters
* **Testing:** Vitest

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm or pnpm

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/abhinavreddy1408-cyber/NEXUS-AI.git
cd NEXUS-AI
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and populate your configuration:

```bash
cp .env.local.example .env.local
```

### 3. Initialize the Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run the Real-Time Streaming Server

In a separate terminal, launch the WebSocket streaming server:

```bash
npm run start:realtime
```
*The real-time server starts on `http://localhost:8080`.*

### 5. Start the Web Dashboard

```bash
npm run dev
```
*The web application is accessible at `http://localhost:3000`.*

---

## 📂 Project Structure

```
NEXUS-AI/
├── prisma/               # Database schema, migrations, and seeds
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # UI elements, charts, and financial tables
│   ├── lib/              # Shared utilities, Prisma client, and formatters
│   ├── server/           # Real-time WebSocket server and data providers
│   │   └── realtime/     # Socket.IO connection manager & feed publishers
│   └── stock-gallery/    # Stock discovery and ticker display components
├── test-realtime/        # Standalone verification scripts for WebSocket feeds
└── package.json
```

---

## 🔮 Future Improvements

- [ ] Add Redis Pub/Sub for distributed horizontal scaling across multi-node socket servers.
- [ ] Connect production order execution endpoints via Zerodha Kite Connect and Alpaca APIs.
- [ ] Implement automated stop-loss and limit order triggering logic in real-time engine.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

## 📬 Contact

**Abhinav Reddy** — [@abhinavreddy1408-cyber](https://github.com/abhinavreddy1408-cyber)  
Project Link: [https://github.com/abhinavreddy1408-cyber/NEXUS-AI](https://github.com/abhinavreddy1408-cyber/NEXUS-AI)
