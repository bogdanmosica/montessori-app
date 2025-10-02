import type { DailyMetric, ActivityMetricsSummary } from './activity-aggregation';

/**
 * Simple in-memory cache for activity metrics
 * TTL: 5 minutes for recent data, 1 hour for historical data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ActivityCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly RECENT_DATA_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HISTORICAL_DATA_TTL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Generate cache key
   */
  private generateKey(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    activityTypes?: string[]
  ): string {
    const types = activityTypes?.sort().join(',') || 'all';
    return `${tenantId}:${startDate.toISOString()}:${endDate.toISOString()}:${types}`;
  }

  /**
   * Check if date range is recent (within last 7 days)
   */
  private isRecentData(endDate: Date): boolean {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return endDate >= weekAgo;
  }

  /**
   * Get TTL based on data recency
   */
  private getTTL(endDate: Date): number {
    return this.isRecentData(endDate) ? this.RECENT_DATA_TTL : this.HISTORICAL_DATA_TTL;
  }

  /**
   * Get cached daily metrics
   */
  getDailyMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    activityTypes?: string[]
  ): DailyMetric[] | null {
    const key = this.generateKey(tenantId, startDate, endDate, activityTypes);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached daily metrics
   */
  setDailyMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    activityTypes: string[] | undefined,
    data: DailyMetric[]
  ): void {
    const key = this.generateKey(tenantId, startDate, endDate, activityTypes);
    const ttl = this.getTTL(endDate);
    const now = Date.now();

    // Clean cache if too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Get cached summary metrics
   */
  getSummaryMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): ActivityMetricsSummary | null {
    const key = `summary:${this.generateKey(tenantId, startDate, endDate)}`;
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached summary metrics
   */
  setSummaryMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    data: ActivityMetricsSummary
  ): void {
    const key = `summary:${this.generateKey(tenantId, startDate, endDate)}`;
    const ttl = this.getTTL(endDate);
    const now = Date.now();

    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Invalidate cache for a tenant (when new data is created)
   */
  invalidateTenant(tenantId: number): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`) || key.startsWith(`summary:${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    const entriesToRemove = Math.ceil(this.MAX_CACHE_SIZE * 0.1); // Remove 10%
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, entriesToRemove);

    sortedEntries.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // Would need hit/miss tracking for this
    };
  }
}

// Export singleton instance
export const activityCache = new ActivityCache();
