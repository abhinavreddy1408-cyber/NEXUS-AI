// Stock Gallery Details API - Using Multi-Source Realtime Aggregator
// GET /api/stock-gallery/details?symbol=<symbol>&period=1y

import { NextRequest, NextResponse } from 'next/server';
import { aggregateFull } from '@/lib/realtime/aggregator';
import { generatePrediction } from '@/stock-gallery/lib/prediction-model';

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);

        const symbol = searchParams.get('symbol');
        const period = searchParams.get('period') || '1y';
        const forecastHorizon = parseInt(searchParams.get('forecast_horizon') || '7');

        if (!symbol) {
            return NextResponse.json(
                { error: 'Missing required parameter: symbol' },
                { status: 400 }
            );
        }

        console.log(`[StockGallery/Details] Fetching ${symbol} with multi-source aggregator`);

        // Use the multi-source aggregator for accurate data
        const aggregatedData = await aggregateFull(symbol, period, { timeout: 12000 });

        const responseTime = Date.now() - startTime;

        // Transform to stock-gallery expected format
        const response = {
            symbol: aggregatedData.symbol,
            company_name: aggregatedData.symbol.replace('.NS', '').replace('.BSE', '') + ' Ltd',
            exchange: aggregatedData.exchange,

            latest: {
                timestamp: aggregatedData.quote.timestamp,
                close: aggregatedData.quote.last_price,
                change: aggregatedData.quote.change,
                change_pct: aggregatedData.quote.change_pct
            },

            fundamentals: {
                market_cap: aggregatedData.quote.market_cap || null,
                pe_ratio: aggregatedData.quote.pe_ratio || null,
                eps: aggregatedData.quote.eps || null,
                dividend_yield: aggregatedData.quote.dividend_yield || null,
                sector: aggregatedData.quote.sector || 'N/A',
                // Fallbacks to day high/low if 52wk not available (though aggregator tries to fill them)
                '52_week_high': aggregatedData.quote.fifty_two_week_high || aggregatedData.quote.high,
                '52_week_low': aggregatedData.quote.fifty_two_week_low || aggregatedData.quote.low,
                day_high: aggregatedData.quote.high,
                day_low: aggregatedData.quote.low,
                volume: aggregatedData.quote.volume
            },

            historical: aggregatedData.historical,

            indicators: {
                sma20: calculateSMA(aggregatedData.historical, 20)
            },

            // Generate real prediction using the model
            prediction: generatePrediction(aggregatedData.historical, forecastHorizon),

            news: [
                {
                    timestamp: new Date().toISOString(),
                    headline: `${aggregatedData.symbol} market update`,
                    summary: 'Real-time data from multiple sources.',
                    sentiment_score: 0.5
                }
            ],

            // Include data quality info
            data_source: {
                primary: aggregatedData.source,
                sources_used: aggregatedData.audit.sources_successful,
                confidence_score: aggregatedData.confidence_score,
                discrepancy_detected: aggregatedData.discrepancy,
                fetched_at: aggregatedData.fetched_at,
                response_time_ms: responseTime
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[StockGallery/Details] Error:', error);

        return NextResponse.json(
            { error: 'Failed to fetch stock details', details: error.message },
            { status: 500 }
        );
    }
}

// Helper: Calculate SMA
function calculateSMA(data: any[], period: number): { timestamp: string; value: number }[] {
    if (!data || data.length < period) return [];

    const result: { timestamp: string; value: number }[] = [];

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sum += data[j].close;
        }
        result.push({
            timestamp: data[i].timestamp,
            value: parseFloat((sum / period).toFixed(2))
        });
    }

    return result;
}
