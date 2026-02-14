const YahooFinance = require('yahoo-finance2').default;

async function testYahoo() {
    console.log("Testing Yahoo Finance (Instantiated) for RELIANCE.NS...");
    try {
        const yahooFinance = new YahooFinance();

        const quote = await yahooFinance.quote('RELIANCE.NS');
        console.log("Quote Success:", quote.regularMarketPrice);
        console.log("Market Cap:", quote.marketCap);

        const history = await yahooFinance.historical('RELIANCE.NS', {
            period1: '2023-01-01',
            interval: '1d'
        });
        console.log("History Success. Records:", history.length);
    } catch (e) {
        console.error("Yahoo Failed:", e.message);
        if (e.message.includes("is not a constructor")) {
            console.log("Maybe default export IS the instance? Retrying without new...");
            try {
                const yf = require('yahoo-finance2').default;
                const q = await yf.quote('RELIANCE.NS');
                console.log("Retry Quote Success:", q.regularMarketPrice);
            } catch (e2) {
                console.error("Retry Failed:", e2.message);
            }
        }
    }
}

testYahoo();
