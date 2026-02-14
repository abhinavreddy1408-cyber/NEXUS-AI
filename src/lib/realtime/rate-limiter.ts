// Rate Limiter with Token Bucket Algorithm
// Implements rate limiting with exponential backoff for API requests

import type { RateLimiterConfig } from './types';

interface TokenBucket {
    tokens: number;
    lastRefill: number;
    backoffUntil: number;
    consecutiveErrors: number;
}

const buckets = new Map<string, TokenBucket>();

const DEFAULT_CONFIG: RateLimiterConfig = {
    maxRequestsPerSecond: 5,
    burstLimit: 10,
    backoffMultiplier: 2,
    maxBackoffMs: 60000
};

export function createRateLimiter(sourceName: string, config: Partial<RateLimiterConfig> = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Initialize bucket for this source
    if (!buckets.has(sourceName)) {
        buckets.set(sourceName, {
            tokens: cfg.burstLimit,
            lastRefill: Date.now(),
            backoffUntil: 0,
            consecutiveErrors: 0
        });
    }

    return {
        async acquire(): Promise<boolean> {
            const bucket = buckets.get(sourceName)!;
            const now = Date.now();

            // Check if in backoff period
            if (now < bucket.backoffUntil) {
                const waitMs = bucket.backoffUntil - now;
                console.log(`[RateLimiter/${sourceName}] In backoff, waiting ${waitMs}ms`);
                await sleep(waitMs);
            }

            // Refill tokens based on elapsed time
            const elapsed = (now - bucket.lastRefill) / 1000;
            const tokensToAdd = elapsed * cfg.maxRequestsPerSecond;
            bucket.tokens = Math.min(cfg.burstLimit, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;

            // Check if we have tokens
            if (bucket.tokens < 1) {
                const waitMs = (1 - bucket.tokens) / cfg.maxRequestsPerSecond * 1000;
                console.log(`[RateLimiter/${sourceName}] Rate limited, waiting ${waitMs.toFixed(0)}ms`);
                await sleep(waitMs);
                bucket.tokens = 1;
            }

            // Consume token
            bucket.tokens -= 1;
            return true;
        },

        reportSuccess(): void {
            const bucket = buckets.get(sourceName)!;
            bucket.consecutiveErrors = 0;
            bucket.backoffUntil = 0;
        },

        reportError(statusCode?: number): void {
            const bucket = buckets.get(sourceName)!;
            bucket.consecutiveErrors += 1;

            // Calculate exponential backoff
            const backoffMs = Math.min(
                1000 * Math.pow(cfg.backoffMultiplier, bucket.consecutiveErrors),
                cfg.maxBackoffMs
            );

            bucket.backoffUntil = Date.now() + backoffMs;
            console.log(`[RateLimiter/${sourceName}] Error (${statusCode || 'unknown'}), backoff for ${backoffMs}ms`);
        },

        getStatus(): { available: boolean; tokensRemaining: number; backoffMs: number } {
            const bucket = buckets.get(sourceName)!;
            const now = Date.now();
            return {
                available: bucket.tokens >= 1 && now >= bucket.backoffUntil,
                tokensRemaining: Math.floor(bucket.tokens),
                backoffMs: Math.max(0, bucket.backoffUntil - now)
            };
        }
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Pre-configured rate limiters for each source
export const rateLimiters = {
    'yahoo-finance': createRateLimiter('yahoo-finance', { maxRequestsPerSecond: 2 }),
    'nse-india': createRateLimiter('nse-india', { maxRequestsPerSecond: 1 }),
    'bse-india': createRateLimiter('bse-india', { maxRequestsPerSecond: 1 }),
    'alpha-vantage': createRateLimiter('alpha-vantage', { maxRequestsPerSecond: 0.1 })  // 5/min free tier
};
