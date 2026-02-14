// Technical Indicator Calculations
import type { OHLCV, IndicatorPoint } from "./types";

/**
 * Simple Moving Average
 */
export function calculateSMA(data: OHLCV[], period: number): IndicatorPoint[] {
    if (data.length < period) return [];

    const result: IndicatorPoint[] = [];

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

/**
 * Exponential Moving Average
 */
export function calculateEMA(data: OHLCV[], period: number): IndicatorPoint[] {
    if (data.length < period) return [];

    const result: IndicatorPoint[] = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i].close;
    }
    let ema = sum / period;
    result.push({
        timestamp: data[period - 1].timestamp,
        value: parseFloat(ema.toFixed(2))
    });

    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
        ema = (data[i].close - ema) * multiplier + ema;
        result.push({
            timestamp: data[i].timestamp,
            value: parseFloat(ema.toFixed(2))
        });
    }

    return result;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: OHLCV[], period: number = 14): IndicatorPoint[] {
    if (data.length < period + 1) return [];

    const result: IndicatorPoint[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // First RSI
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < data.length; i++) {
        if (i > period) {
            avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
        }

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        result.push({
            timestamp: data[i].timestamp,
            value: parseFloat(rsi.toFixed(2))
        });
    }

    return result;
}

/**
 * Bollinger Bands (20-period SMA with 2 standard deviations)
 */
export function calculateBollingerBands(
    data: OHLCV[],
    period: number = 20,
    stdDev: number = 2
): { upper: IndicatorPoint[]; middle: IndicatorPoint[]; lower: IndicatorPoint[] } {
    if (data.length < period) {
        return { upper: [], middle: [], lower: [] };
    }

    const upper: IndicatorPoint[] = [];
    const middle: IndicatorPoint[] = [];
    const lower: IndicatorPoint[] = [];

    for (let i = period - 1; i < data.length; i++) {
        // Calculate SMA
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sum += data[j].close;
        }
        const sma = sum / period;

        // Calculate Standard Deviation
        let sumSquares = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sumSquares += Math.pow(data[j].close - sma, 2);
        }
        const std = Math.sqrt(sumSquares / period);

        middle.push({ timestamp: data[i].timestamp, value: parseFloat(sma.toFixed(2)) });
        upper.push({ timestamp: data[i].timestamp, value: parseFloat((sma + stdDev * std).toFixed(2)) });
        lower.push({ timestamp: data[i].timestamp, value: parseFloat((sma - stdDev * std).toFixed(2)) });
    }

    return { upper, middle, lower };
}

/**
 * Calculate all indicators for a dataset
 */
export function calculateAllIndicators(data: OHLCV[]) {
    return {
        sma20: calculateSMA(data, 20),
        sma50: calculateSMA(data, 50),
        ema20: calculateEMA(data, 20),
        rsi14: calculateRSI(data, 14),
        bollinger: calculateBollingerBands(data, 20, 2)
    };
}
