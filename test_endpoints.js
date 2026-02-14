const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url, method = 'GET', body = null) {
    console.log(`\n--- Testing ${name} (${method} ${url}) ---`);
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const start = performance.now();
        const res = await fetch(`${BASE_URL}${url}`, options);
        const duration = (performance.now() - start).toFixed(2);

        console.log(`Status: ${res.status} (${duration}ms)`);

        if (!res.ok) {
            const text = await res.text();
            console.error('Error Body:', text);
            return;
        }

        const data = await res.json();
        console.log('Response Data Sample:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
    }
}

async function runTests() {
    console.log('Starting Backend API Verification...');

    // 1. Test Dashboard Aggregation
    await testEndpoint('Dashboard API', '/api/dashboard');

    // 2. Test Real-time Stocks
    await testEndpoint('Stocks API', '/api/stocks');

    // 3. Test AI Chat (Analysis)
    await testEndpoint('AI Intelligence Engine', '/api/chat', 'POST', {
        industry: 'Automotive',
        problem: 'Impact of EV subsidies removal on luxury car sales in India'
    });
}

runTests();
