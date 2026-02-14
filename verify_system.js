const BASE_URL = 'http://localhost:3000';

async function check(name, url, method = 'GET', body = null) {
    process.stdout.write(`Checking ${name}... `);
    try {
        const opts = { method };
        if (body) {
            opts.body = JSON.stringify(body);
            opts.headers = { 'Content-Type': 'application/json' };
        }

        const res = await fetch(BASE_URL + url, opts);
        if (res.ok) {
            console.log("✅ ONLINE");
            return true;
        } else {
            console.log(`❌ FAILED (Status ${res.status})`);
            return false;
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log("--- NEXUS AI HEALTH CHECK ---");
    await check("Dashboard API", "/api/dashboard");
    await check("Stocks API", "/api/stocks");
    await check("AI Chat Engine", "/api/chat", "POST", { industry: "Tech", problem: "Test" });
    console.log("-----------------------------");
}

run();
