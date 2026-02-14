// OHLCV Data Validator
// Validates data integrity and computes quality metrics

import type { OHLCV, Quote, ValidationResult } from './types';

/**
 * Validates OHLCV data integrity
 * Rules:
 * - high >= max(open, close, low)
 * - low <= min(open, close, high)
 * - All values must be positive
 * - Volume must be non-negative
 */
export function validateOHLCV(data: OHLCV): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let corrected: OHLCV | undefined;

    // Check for positive values
    if (data.open <= 0) errors.push(`Invalid open price: ${data.open}`);
    if (data.high <= 0) errors.push(`Invalid high price: ${data.high}`);
    if (data.low <= 0) errors.push(`Invalid low price: ${data.low}`);
    if (data.close <= 0) errors.push(`Invalid close price: ${data.close}`);
    if (data.volume < 0) errors.push(`Invalid volume: ${data.volume}`);

    // Check OHLC constraints
    const maxPrice = Math.max(data.open, data.close);
    const minPrice = Math.min(data.open, data.close);

    if (data.high < maxPrice) {
        warnings.push(`High (${data.high}) < max(open, close) (${maxPrice})`);
        corrected = { ...data, high: maxPrice };
    }

    if (data.low > minPrice) {
        warnings.push(`Low (${data.low}) > min(open, close) (${minPrice})`);
        corrected = { ...(corrected || data), low: minPrice };
    }

    if (data.high < data.low) {
        errors.push(`High (${data.high}) < Low (${data.low})`);
    }

    // Validate timestamp
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
        errors.push(`Invalid timestamp: ${data.timestamp}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        corrected
    };
}

/**
 * Validates a Quote object
 */
export function validateQuote(quote: Quote): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for positive values
    if (quote.last_price <= 0) errors.push(`Invalid last_price: ${quote.last_price}`);
    if (quote.open <= 0) errors.push(`Invalid open: ${quote.open}`);
    if (quote.high <= 0) errors.push(`Invalid high: ${quote.high}`);
    if (quote.low <= 0) errors.push(`Invalid low: ${quote.low}`);
    if (quote.previous_close <= 0) errors.push(`Invalid previous_close: ${quote.previous_close}`);

    // OHLC constraints
    if (quote.high < Math.max(quote.open, quote.last_price)) {
        warnings.push('High price inconsistency detected');
    }
    if (quote.low > Math.min(quote.open, quote.last_price)) {
        warnings.push('Low price inconsistency detected');
    }

    // Validate change calculation
    const expectedChange = quote.last_price - quote.previous_close;
    const expectedChangePct = (expectedChange / quote.previous_close) * 100;

    if (Math.abs(quote.change - expectedChange) > 0.01) {
        warnings.push(`Change value mismatch: reported ${quote.change}, calculated ${expectedChange.toFixed(2)}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validates an array of OHLCV data
 */
export function validateOHLCVSeries(data: OHLCV[]): { valid: number; invalid: number; warnings: number } {
    let valid = 0;
    let invalid = 0;
    let warnings = 0;

    for (const candle of data) {
        const result = validateOHLCV(candle);
        if (result.valid) {
            valid++;
        } else {
            invalid++;
        }
        if (result.warnings.length > 0) {
            warnings++;
        }
    }

    return { valid, invalid, warnings };
}

/**
 * Check timestamp freshness
 */
export function checkTimestampFreshness(timestamp: string, maxAgeSeconds: number = 60): {
    fresh: boolean;
    ageSeconds: number;
} {
    const ts = new Date(timestamp).getTime();
    const now = Date.now();
    const ageSeconds = (now - ts) / 1000;

    return {
        fresh: ageSeconds <= maxAgeSeconds,
        ageSeconds
    };
}

/**
 * Calculate confidence score based on data quality metrics
 */
export function calculateConfidenceScore(params: {
    freshnessSeconds: number;
    sourceAgreementPct: number;
    ohlcValid: boolean;
    volumeReasonable: boolean;
}): { score: number; breakdown: Record<string, number> } {
    // Freshness score (0-1): 1.0 if <5s, 0.5 if <30s, 0.2 if <60s, 0.1 otherwise
    let freshnessScore: number;
    if (params.freshnessSeconds < 5) freshnessScore = 1.0;
    else if (params.freshnessSeconds < 30) freshnessScore = 0.7;
    else if (params.freshnessSeconds < 60) freshnessScore = 0.4;
    else freshnessScore = 0.1;

    // Source agreement (0-1)
    const agreementScore = params.sourceAgreementPct / 100;

    // OHLC validity (0 or 1)
    const ohlcScore = params.ohlcValid ? 1.0 : 0.0;

    // Volume consistency (0 or 1)
    const volumeScore = params.volumeReasonable ? 1.0 : 0.5;

    // Weighted average
    const weights = { freshness: 0.3, agreement: 0.4, ohlc: 0.2, volume: 0.1 };
    const score =
        freshnessScore * weights.freshness +
        agreementScore * weights.agreement +
        ohlcScore * weights.ohlc +
        volumeScore * weights.volume;

    return {
        score: parseFloat(score.toFixed(3)),
        breakdown: {
            freshness: freshnessScore,
            source_agreement: agreementScore,
            ohlc_validity: ohlcScore,
            volume_consistency: volumeScore
        }
    };
}

/**
 * Cross-validate prices between sources
 */
export function crossValidatePrices(
    prices: { source: string; price: number; timestamp: string }[],
    tolerancePct: number = 0.5
): {
    agreed: boolean;
    discrepancy: { source_a: any; source_b: any; pct_difference: number } | null;
    agreementPct: number;
} {
    if (prices.length < 2) {
        return { agreed: true, discrepancy: null, agreementPct: 100 };
    }

    let maxDiscrepancy = 0;
    let worstPair: { source_a: any; source_b: any; pct_difference: number } | null = null;
    let agreementCount = 0;
    let totalComparisons = 0;

    for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
            const a = prices[i];
            const b = prices[j];
            const avgPrice = (a.price + b.price) / 2;
            const pctDiff = Math.abs(a.price - b.price) / avgPrice * 100;

            totalComparisons++;
            if (pctDiff <= tolerancePct) {
                agreementCount++;
            }

            if (pctDiff > maxDiscrepancy) {
                maxDiscrepancy = pctDiff;
                worstPair = {
                    source_a: { name: a.source, price: a.price, timestamp: a.timestamp },
                    source_b: { name: b.source, price: b.price, timestamp: b.timestamp },
                    pct_difference: parseFloat(pctDiff.toFixed(4))
                };
            }
        }
    }

    const agreementPct = totalComparisons > 0 ? (agreementCount / totalComparisons) * 100 : 100;

    return {
        agreed: maxDiscrepancy <= tolerancePct,
        discrepancy: maxDiscrepancy > tolerancePct ? worstPair : null,
        agreementPct
    };
}
