interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface DiagramNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
  [key: string]: any;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

interface DiagramCache {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  metadata?: any;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'LRU' | 'LFU' | 'FIFO';
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private accessCount: Map<string, number> = new Map();
  private accessOrder: string[] = [];
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100; // Maximum number of entries
  private strategy: 'LRU' | 'LFU' | 'FIFO' = 'LRU';
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options?: CacheOptions) {
    if (options?.ttl) this.defaultTTL = options.ttl;
    if (options?.maxSize) this.maxSize = options.maxSize;
    if (options?.strategy) this.strategy = options.strategy;

    // Start cleanup interval
    this.startCleanupInterval();
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update access tracking
    this.updateAccessTracking(key);

    return entry.data as T;
  }

  // Set data in cache
  set<T>(key: string, data: T, ttl?: number): void {
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
    this.updateAccessTracking(key);
  }

  // Delete specific entry
  delete(key: string): boolean {
    this.accessCount.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.accessCount.clear();
    this.accessOrder = [];
  }

  // Check if key exists
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Cache specific methods for diagrams
  getDiagram(diagramId: string): DiagramCache | null {
    return this.get<DiagramCache>(`diagram:${diagramId}`);
  }

  setDiagram(diagramId: string, diagram: DiagramCache, ttl?: number): void {
    this.set(`diagram:${diagramId}`, diagram, ttl);
  }

  // Cache for API responses
  getApiResponse(endpoint: string, params?: any): any | null {
    const key = this.createApiKey(endpoint, params);
    return this.get(key);
  }

  setApiResponse(endpoint: string, data: any, params?: any, ttl?: number): void {
    const key = this.createApiKey(endpoint, params);
    this.set(key, data, ttl);
  }

  // Cache for computed values
  getComputed(key: string): any | null {
    return this.get(`computed:${key}`);
  }

  setComputed(key: string, data: any, ttl?: number): void {
    this.set(`computed:${key}`, data, ttl);
  }

  // Cache for resources schemas
  getResourceSchema(resourceType: string): any | null {
    return this.get(`schema:${resourceType}`);
  }

  setResourceSchema(resourceType: string, schema: any): void {
    // Resource schemas don't change often, so use longer TTL
    this.set(`schema:${resourceType}`, schema, 60 * 60 * 1000); // 1 hour
  }

  // Batch operations
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    keys.forEach(key => {
      results.set(key, this.get<T>(key));
    });
    return results;
  }

  setMany<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  // Private methods
  private updateAccessTracking(key: string): void {
    if (this.strategy === 'LRU') {
      // Remove from current position and add to end
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    } else if (this.strategy === 'LFU') {
      // Increment access count
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    } else if (this.strategy === 'FIFO') {
      // Only track order on insertion (handled in set method)
      if (!this.accessOrder.includes(key)) {
        this.accessOrder.push(key);
      }
    }
  }

  private evict(): void {
    let keyToEvict: string | undefined;

    switch (this.strategy) {
      case 'LRU':
        // Evict least recently used
        keyToEvict = this.accessOrder.shift();
        break;
      
      case 'LFU':
        // Evict least frequently used
        let minCount = Infinity;
        this.accessCount.forEach((count, key) => {
          if (count < minCount) {
            minCount = count;
            keyToEvict = key;
          }
        });
        break;
      
      case 'FIFO':
        // Evict first in
        keyToEvict = this.accessOrder.shift();
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  private createApiKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `api:${endpoint}:${paramString}`;
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now > entry.timestamp + entry.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.delete(key));
    }, 60 * 1000); // 1 minute
  }

  // Cleanup method for when service is no longer needed
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  // Cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    let totalSize = 0;

    this.cache.forEach((entry) => {
      if (now > entry.timestamp + entry.ttl) {
        expired++;
      } else {
        active++;
      }
      // Rough size estimation
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      totalEntries: this.cache.size,
      activeEntries: active,
      expiredEntries: expired,
      approximateSizeBytes: totalSize,
      strategy: this.strategy,
      maxSize: this.maxSize,
    };
  }

  // Preload commonly used data
  async preloadCommonData(): Promise<void> {
    // This method can be implemented to preload frequently accessed data
    // For example, resource schemas, user preferences, etc.
    console.log('Preloading common data into cache...');
  }
}

// Create singleton instance with default configuration
const cacheService = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  strategy: 'LRU',
});

// Export both the class and the singleton instance
export { CacheService, cacheService };
