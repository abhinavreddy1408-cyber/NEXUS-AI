// Stock Gallery Cache - 10 minute TTL

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > DEFAULT_TTL) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

export function invalidateCache(keyPattern?: string): void {
    if (!keyPattern) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.includes(keyPattern)) {
            cache.delete(key);
        }
    }
}

export function getCacheKey(type: string, ...args: string[]): string {
    return `${type}:${args.join(":")}`;
}
