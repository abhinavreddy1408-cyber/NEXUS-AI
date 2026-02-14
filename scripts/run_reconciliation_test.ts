import { io } from "socket.io-client";
import * as fs from "fs";

// Config
const DURATION_SECONDS = process.argv[2] ? parseInt(process.argv[2]) : 30 * 60; // Default 30 min
const SYMBOLS = ["RELIANCE.NSE", "TCS.NSE", "^NSEI"];
const OUTPUT_FILE = "reconciliation-report.html";

console.log(`[TEST] Starting Accuracy Test for ${DURATION_SECONDS}s on [${SYMBOLS.join(', ')}]`);

const socket = io("http://localhost:8080");

interface TickStats {
    count: number;
    lastSequence: number;
    gaps: number;
    outOfOrder: number;
    startTime: number;
    endTime: number;
}

const stats: Record<string, TickStats> = {};
SYMBOLS.forEach(s => stats[s] = { count: 0, lastSequence: -1, gaps: 0, outOfOrder: 0, startTime: Date.now(), endTime: 0 });

socket.on("connect", () => {
    console.log("[TEST] Connected. Subscribing...");
    SYMBOLS.forEach(s => socket.emit("subscribe", s));
});


socket.on("stock_update", (data: any) => {
    const s = stats[data.symbol];
    if (!s) return;

    s.endTime = Date.now();
    s.count++;

    // Sequence Check
    if (data.sequence_number !== undefined) {
        if (s.lastSequence !== -1) {
            if (data.sequence_number <= s.lastSequence) {
                s.outOfOrder++;
            } else if (data.sequence_number > s.lastSequence + 1) {
                s.gaps += (data.sequence_number - s.lastSequence - 1);
            }
        }
        s.lastSequence = data.sequence_number;
    }

    // Log progress every 100 ticks
    if (s.count % 100 === 0) {
        process.stdout.write(`.`);
    }
});

// Timer to finish
setTimeout(() => {
    console.log("\n[TEST] Test Complete. Generating Report...");
    socket.disconnect();
    generateReport();
    process.exit(0);
}, DURATION_SECONDS * 1000);

function generateReport() {
    let html = `
    <html>
    <head>
        <title>Real-Time Reconciliation Report</title>
        <style>body { font-family: sans-serif; padding: 20px; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } .pass { color: green; font-weight: bold; } .fail { color: red; font-weight: bold; }</style>
    </head>
    <body>
        <h1>Market Data Accuracy Report</h1>
        <p>Values based on authoritative sequence tracking.</p>
        <table>
            <tr>
                <th>Symbol</th>
                <th>Total Ticks</th>
                <th>Seq Gaps</th>
                <th>Out of Order</th>
                <th>Status</th>
            </tr>
    `;

    Object.keys(stats).forEach(sym => {
        const s = stats[sym];
        const status = (s.gaps === 0 && s.outOfOrder === 0) ? "PASS" : "FAIL";
        html += `
            <tr>
                <td>${sym}</td>
                <td>${s.count}</td>
                <td class="${s.gaps > 0 ? 'fail' : ''}">${s.gaps}</td>
                <td class="${s.outOfOrder > 0 ? 'fail' : ''}">${s.outOfOrder}</td>
                <td class="${status === 'PASS' ? 'pass' : 'fail'}">${status}</td>
            </tr>
        `;
    });

    html += `</table></body></html>`;

    fs.writeFileSync(OUTPUT_FILE, html);
    console.log(`[TEST] Report written to ${OUTPUT_FILE}`);
}
