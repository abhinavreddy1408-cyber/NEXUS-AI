const { io } = require("socket.io-client");

const socket = io("http://localhost:8080");

socket.on("connect", () => {
    console.log("Connected to Realtime Server!");

    const symbol = "RELIANCE.NSE";
    console.log(`Subscribing to ${symbol}...`);
    socket.emit("subscribe", symbol);
});

socket.on("stock_update", (data) => {
    console.log(`[EVENT RECEIVED] ${data.symbol}: ₹${data.last_price} (${data.change_pct}%)`);
});

socket.on("disconnect", () => {
    console.log("Disconnected.");
});

// Keep alive for 10 seconds then exit
setTimeout(() => {
    socket.disconnect();
    process.exit(0);
}, 10000);
