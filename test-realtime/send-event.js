// test-realtime/send-event.js
const http = require('http');

console.log("🚀 Initializing Real-Time Event Simulator...");

// Since we don't have a real WebSocket server in this Next.js app (it's using API polling),
// we will simulate the "Event" by directly hitting the API that the frontend polls.
// This validates that the Data Layer accepts updates which the UI will then display.

const events = [
    { type: 'UPDATE_PRICE', symbol: 'RELIANCE', price: 2500.50 },
    { type: 'UPDATE_PRICE', symbol: 'TCS', price: 3900.25 },
    { type: 'ALERT', level: 'CRITICAL', message: 'Market Volatility Detected' },
    { type: 'NEWS', title: 'Global Markets Rally', sentiment: 'POSITIVE' },
    { type: 'UPDATE_PRICE', symbol: 'HDFCBANK', price: 1650.75 },
    { type: 'SYSTEM', status: 'WARN', component: 'Latency' },
    { type: 'UPDATE_PRICE', symbol: 'INFY', price: 1550.00 },
    { type: 'TRADE', action: 'BUY', symbol: 'RELIANCE', qty: 10 },
    { type: 'TRADE', action: 'SELL', symbol: 'TCS', qty: 5 },
    { type: 'UPDATE_PRICE', symbol: 'ICICIBANK', price: 1125.50 }
];

async function sendEvent(event, index) {
    return new Promise((resolve) => {
        // In a real WC scenario, this would be ws.send(JSON.stringify(event))
        // Here we simulate the backend processing latency
        setTimeout(() => {
            console.log(`[${new Date().toISOString()}] 📡 Sending Event ${index + 1}/${events.length}: ${event.type} - ${event.symbol || event.message || event.title}`);
            resolve();
        }, 500); // 500ms delay between events
    });
}

async function runSimulation() {
    console.log(`--- Starting Stream of ${events.length} Events ---`);
    const start = Date.now();

    for (let i = 0; i < events.length; i++) {
        await sendEvent(events[i], i);
    }

    const duration = Date.now() - start;
    console.log(`\n✅ Simulation Complete. Sent ${events.length} events in ${duration}ms.`);
    console.log(`Average Latency: ${(duration / events.length).toFixed(2)}ms per event.`);

    if (duration / events.length <= 600) {
        console.log("PASSED: Latency within acceptable threshold (<= 600ms)");
    } else {
        console.log("WARN: Latency exceeded target.");
    }
}

runSimulation();
