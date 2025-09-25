/**
 * Performance Optimization: Applications Caching Strategy
 * 
 * Implements a caching layer for applications data to improve performance
 * and reduce database load for frequently accessed data.
 */

import { ApplicationListResponse, ApplicationWithRelations } from '../db/schema/applications';

// In-memory cache with TTL support
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApplicationsCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Maximum number of cached items
  
  // Cache TTL configurations (in milliseconds)
  private readonly TTL = {
    APPLICATIONS_LIST: 5 * 60 * 1000, // 5 minutes for applications list
    APPLICATIONS_STATS: 10 * 60 * 1000, // 10 minutes for stats (changes less frequently)
    APPLICATION_DETAIL: 15 * 60 * 1000, // 15 minutes for individual applications
  } as const;

  /**
   * Generate cache key for applications list
   */
  private generateListCacheKey(
    schoolId: number,
    filters: Record<string, any>,
    pagination: Record<string, any>
  ): string {
    const params = {
      schoolId,
      ...filters,
      ...pagination,
    };
    return `applications:list:${JSON.stringify(params)}`;
  }

  /**
   * Generate cache key for application stats
   */
  private generateStatsCacheKey(schoolId: number): string {
    return `applications:stats:${schoolId}`;
  }

  /**
   * Generate cache key for individual application
   */
  private generateApplicationCacheKey(applicationId: string, schoolId: number): string {
    return `applications:detail:${schoolId}:${applicationId}`;
  }

  /**
   * Check if cached item is still valid
   */
  private isValidCacheItem<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Clean up expired cache items
   */
  private cleanupExpiredItems(): void {
    for (const [key, item] of this.cache.entries()) {
      if (!this.isValidCacheItem(item)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Enforce cache size limit using LRU-like strategy
   */
  private enforceSizeLimit(): void {
    if (this.cache.size > this.maxSize) {
      // Remove oldest items
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const itemsToRemove = entries.slice(0, this.cache.size - this.maxSize);
      itemsToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cached applications list
   */
  getApplicationsList(
    schoolId: number,
    filters: Record<string, any>,
    pagination: Record<string, any>
  ): ApplicationListResponse | null {
    const key = this.generateListCacheKey(schoolId, filters, pagination);
    const item = this.cache.get(key);
    
    if (item && this.isValidCacheItem(item)) {
      return item.data;
    }
    
    return null;
  }

  /**
   * Cache applications list
   */
  setApplicationsList(
    schoolId: number,
    filters: Record<string, any>,
    pagination: Record<string, any>,
    data: ApplicationListResponse
  ): void {
    const key = this.generateListCacheKey(schoolId, filters, pagination);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL.APPLICATIONS_LIST,
    });

    this.cleanupExpiredItems();
    this.enforceSizeLimit();
  }

  /**
   * Get cached applications stats
   */
  getApplicationsStats(schoolId: number): any | null {
    const key = this.generateStatsCacheKey(schoolId);
    const item = this.cache.get(key);
    
    if (item && this.isValidCacheItem(item)) {
      return item.data;
    }
    
    return null;
  }

  /**
   * Cache applications stats
   */
  setApplicationsStats(schoolId: number, data: any): void {
    const key = this.generateStatsCacheKey(schoolId);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL.APPLICATIONS_STATS,
    });

    this.cleanupExpiredItems();
    this.enforceSizeLimit();
  }

  /**
   * Get cached individual application
   */
  getApplication(applicationId: string, schoolId: number): ApplicationWithRelations | null {
    const key = this.generateApplicationCacheKey(applicationId, schoolId);
    const item = this.cache.get(key);
    
    if (item && this.isValidCacheItem(item)) {
      return item.data;
    }
    
    return null;
  }

  /**
   * Cache individual application
   */
  setApplication(applicationId: string, schoolId: number, data: ApplicationWithRelations): void {
    const key = this.generateApplicationCacheKey(applicationId, schoolId);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL.APPLICATION_DETAIL,
    });

    this.cleanupExpiredItems();
    this.enforceSizeLimit();
  }

  /**
   * Invalidate cache for a specific school
   */
  invalidateSchoolCache(schoolId: number): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(`:${schoolId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for a specific application
   */
  invalidateApplicationCache(applicationId: string, schoolId: number): void {
    // Remove specific application cache
    const applicationKey = this.generateApplicationCacheKey(applicationId, schoolId);
    this.cache.delete(applicationKey);

    // Remove list and stats caches for the school (they might be affected)
    this.invalidateSchoolCache(schoolId);
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
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Periodic cleanup function (should be called by a scheduled job)
   */
  periodicCleanup(): void {
    this.cleanupExpiredItems();
  }
}

// Singleton instance
export const applicationsCache = new ApplicationsCache();

/**
 * Database connection pooling optimization
 */
export const DB_OPTIMIZATION_CONFIG = {
  // Connection pool settings (should be configured in database setup)
  CONNECTION_POOL: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  // Query optimization settings
  QUERY_OPTIMIZATION: {
    // Use prepared statements for frequently executed queries
    USE_PREPARED_STATEMENTS: true,
    
    // Enable query result caching at database level
    ENABLE_QUERY_CACHE: true,
    
    // Batch size for bulk operations
    BULK_OPERATION_BATCH_SIZE: 100,
    
    // Maximum query timeout
    QUERY_TIMEOUT_MS: 30000,
  },

  // Index recommendations for applications table
  RECOMMENDED_INDEXES: [
    // Primary composite index for filtering and sorting
    '(school_id, status, created_at)',
    
    // Search index for full-text search
    '(school_id, parent_name, child_name)',
    
    // Email lookup index
    '(parent_email)',
    
    // Program filtering index
    '(school_id, program_requested)',
    
    // Admin workflow indexes
    '(approved_by, approved_at)',
    '(rejected_by, rejected_at)',
  ],
} as const;

/**
 * Performance monitoring utilities
 */
export class ApplicationsPerformanceMonitor {
  private queryTimes: number[] = [];
  private maxSamples = 100;

  /**
   * Record query execution time
   */
  recordQueryTime(timeMs: number): void {
    this.queryTimes.push(timeMs);
    
    if (this.queryTimes.length > this.maxSamples) {
      this.queryTimes.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averageQueryTime: number;
    medianQueryTime: number;
    maxQueryTime: number;
    minQueryTime: number;
    totalQueries: number;
  } {
    if (this.queryTimes.length === 0) {
      return {
        averageQueryTime: 0,
        medianQueryTime: 0,
        maxQueryTime: 0,
        minQueryTime: 0,
        totalQueries: 0,
      };
    }

    const sorted = [...this.queryTimes].sort((a, b) => a - b);
    const sum = this.queryTimes.reduce((acc, time) => acc + time, 0);

    return {
      averageQueryTime: sum / this.queryTimes.length,
      medianQueryTime: sorted[Math.floor(sorted.length / 2)],
      maxQueryTime: Math.max(...this.queryTimes),
      minQueryTime: Math.min(...this.queryTimes),
      totalQueries: this.queryTimes.length,
    };
  }

  /**
   * Check if performance is within acceptable limits
   */
  isPerformanceHealthy(): boolean {
    const stats = this.getStats();
    
    // Performance is healthy if:
    // - Average query time < 200ms
    // - Max query time < 2000ms
    // - We have at least some data points
    return (
      stats.totalQueries > 0 &&
      stats.averageQueryTime < 200 &&
      stats.maxQueryTime < 2000
    );
  }
}

// Singleton performance monitor
export const performanceMonitor = new ApplicationsPerformanceMonitor();

/**
 * Decorator for caching database queries
 */
export function withCaching<T extends any[], R>(
  cacheKey: (...args: T) => string,
  getCachedValue: (...args: T) => R | null,
  setCachedValue: (value: R, ...args: T) => void,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
) {
  return function <F extends (...args: T) => Promise<R>>(
    target: F
  ): F {
    return (async (...args: T): Promise<R> => {
      // Try to get from cache first
      const cachedResult = getCachedValue(...args);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute original function and measure performance
      const startTime = Date.now();
      try {
        const result = await target(...args);
        const executionTime = Date.now() - startTime;
        
        // Record performance metrics
        performanceMonitor.recordQueryTime(executionTime);
        
        // Cache the result
        setCachedValue(result, ...args);
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        performanceMonitor.recordQueryTime(executionTime);
        throw error;
      }
    }) as F;
  };
}

/**
 * Cache warming utilities
 */
export async function warmApplicationsCache(schoolId: number): Promise<void> {
  // This function can be called during off-peak hours to pre-populate cache
  // with commonly accessed data
  
  try {
    // Import the actual query functions
    const { getApplicationsList, getApplicationsStats } = await import('../db/queries/applications');
    
    // Warm cache with first page of pending applications
    const commonFilters = { status: 'pending' as const };
    const commonPagination = { page: 1, limit: 10, offset: 0 };
    
    const listResult = await getApplicationsList(schoolId, commonFilters, commonPagination);
    applicationsCache.setApplicationsList(schoolId, commonFilters, commonPagination, listResult);
    
    // Warm cache with stats
    const statsResult = await getApplicationsStats(schoolId);
    applicationsCache.setApplicationsStats(schoolId, statsResult);
    
    console.log(`Cache warmed for school ${schoolId}`);
  } catch (error) {
    console.error(`Failed to warm cache for school ${schoolId}:`, error);
  }
}

// Export configuration for use in environment setup
export const PERFORMANCE_CONFIG = {
  CACHE_TTL: {
    APPLICATIONS_LIST: 5 * 60 * 1000, // 5 minutes
    APPLICATIONS_STATS: 10 * 60 * 1000, // 10 minutes
    APPLICATION_DETAIL: 15 * 60 * 1000, // 15 minutes
  },
  CACHE_SIZE: 100,
  QUERY_TIMEOUT: 30000, // 30 seconds
  PERFORMANCE_THRESHOLDS: {
    AVERAGE_QUERY_TIME_MS: 200,
    MAX_QUERY_TIME_MS: 2000,
  },
} as const;