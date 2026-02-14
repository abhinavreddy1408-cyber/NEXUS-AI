// Realtime Quotes API
// GET /api/realtime/quotes?symbol=RELIANCE.NS&period=1y&interval=1d

import { NextRequest, NextResponse } from 'next/server';
import { aggregateFull, aggregateQuote, aggregateHistorical } from '@/lib/realtime/aggregator';

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);

        // Parse parameters
        const symbol = searchParams.get('symbol');
        const period = searchParams.get('period') || '1y';
        const interval = searchParams.get('interval') || '1d';
        const mode = searchParams.get('mode') || 'full'; // 'quote', 'historical', 'full'
        const sources = searchParams.get('sources')?.split(',').filter(Boolean);

        if (!symbol) {
            return NextResponse.json(
                { error: 'Missing required parameter: symbol' },
                { status: 400 }
            );
        }

        // Validate symbol format
        if (!/^[A-Za-z0-9^._-]+$/.test(symbol)) {
            return NextResponse.json(
                { error: 'Invalid symbol format' },
                { status: 400 }
            );
        }

        console.log(`[API/realtime/quotes] Fetching ${symbol} mode=${mode} period=${period}`);

        let result;
        const options = { sources, timeout: 15000 };

        switch (mode) {
            case 'quote':
                result = await aggregateQuote(symbol, options);
                break;
            case 'historical':
                result = await aggregateHistorical(symbol, period, interval, options);
                break;
            case 'full':
            default:
                result = await aggregateFull(symbol, period, options);
                break;
        }

        const responseTime = Date.now() - startTime;

        // Add API-level metadata
        const response = {
            ...result,
            api_metadata: {
                endpoint: '/api/realtime/quotes',
                request_params: { symbol, period, interval, mode },
                response_time_ms: responseTime,
                timestamp: new Date().toISOString()
            }
        };

        // Set cache headers (short cache for real-time data)
        const headers = new Headers();
        headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');
        headers.set('X-Response-Time', `${responseTime}ms`);
        headers.set('X-Confidence-Score', result.confidence_score.toString());

        if (result.discrepancy) {
            headers.set('X-Data-Discrepancy', 'true');
        }

        return NextResponse.json(response, { headers });

    } catch (error: any) {
        console.error('[API/realtime/quotes] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch realtime data',
                details: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// HEAD request for health check
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
