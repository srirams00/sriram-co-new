/**
 * Central In-Memory Cache Engine with TTL, expiration pruning, and pattern invalidation.
 * Conforms to Node.js Advanced Patterns standard.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieves a cached value, automatically evicting expired entries.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores a value in the cache with a specified TTL in seconds (defaults to 60s).
   */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Removes a specific key from the cache.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidates all keys matching a prefix or pattern.
   * Useful for cache busting on create/update/delete mutations.
   */
  invalidatePattern(prefix: string): number {
    let evictedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.cache.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current active cache entry count.
   */
  size(): number {
    // Clean up expired entries on count query
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

export const cacheService = new MemoryCacheService();
