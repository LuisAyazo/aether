/**
 * Cache Service for optimizing API calls
 * Implements a time-based cache with configurable TTL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Get data from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache keys constants
export const CACHE_KEYS = {
  DASHBOARD_DATA: 'dashboard_data',
  USER_COMPANIES: 'user_companies',
  WORKSPACES: (companyId: string) => `workspaces_${companyId}`,
  ENVIRONMENTS: (companyId: string) => `environments_${companyId}`,
  DIAGRAMS: (companyId: string, envId: string) => `diagrams_${companyId}_${envId}`,
  DIAGRAM: (companyId: string, envId: string, diagramId: string) => `diagram_${companyId}_${envId}_${diagramId}`,
} as const;

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  DASHBOARD: 10 * 60 * 1000,    // 10 minutes
  COMPANIES: 15 * 60 * 1000,    // 15 minutes
  WORKSPACES: 10 * 60 * 1000,   // 10 minutes
  ENVIRONMENTS: 10 * 60 * 1000, // 10 minutes
  DIAGRAMS: 5 * 60 * 1000,      // 5 minutes
  DIAGRAM: 2 * 60 * 1000,       // 2 minutes (individual diagram)
} as const;
