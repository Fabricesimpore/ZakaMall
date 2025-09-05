import Redis from "ioredis";

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    // Check if Redis should be disabled in production without proper config
    if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL && !process.env.REDIS_HOST) {
      console.log('📝 Redis cache disabled - running without cache in production');
      // Create a mock client that won't try to connect
      this.client = null as any;
      return;
    }

    const config: CacheConfig = {
      host: process.env.REDIS_HOST || process.env.REDIS_URL || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || "zakamal:",
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    };

    this.client = new Redis({
      ...config,
      lazyConnect: true, // Don't connect immediately
      retryDelayOnFailover: config.retryDelayOnFailover,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.client) return;
    
    this.client.on("connect", () => {
      console.log("✅ Redis connected successfully");
      this.isConnected = true;
    });

    this.client.on("error", (error) => {
      console.error("❌ Redis connection error:", error);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      console.log("⚠️ Redis connection closed");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });
  }

  async connect(): Promise<boolean> {
    if (!this.client) {
      console.log('📝 Redis cache is disabled');
      return false;
    }
    
    try {
      await this.client.connect();
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error);
      return false;
    }
  }

  isReady(): boolean {
    return this.client && this.isConnected && this.client.status === "ready";
  }

  // Generic cache operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isReady()) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`❌ Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`❌ Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Product-specific cache operations
  async cacheProduct(productId: string, product: any, ttl: number = 3600): Promise<void> {
    await this.set(`product:${productId}`, product, ttl);
  }

  async getProduct(productId: string): Promise<any | null> {
    return await this.get(`product:${productId}`);
  }

  async cacheProductList(key: string, products: any[], ttl: number = 1800): Promise<void> {
    await this.set(`products:${key}`, products, ttl);
  }

  async getProductList(key: string): Promise<any[] | null> {
    return await this.get(`products:${key}`);
  }

  // Search cache operations
  async cacheSearchResults(query: string, results: any, ttl: number = 600): Promise<void> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`;
    await this.set(searchKey, results, ttl);
  }

  async getSearchResults(query: string): Promise<any | null> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`;
    return await this.get(searchKey);
  }

  // User session cache
  async cacheUserSession(userId: string, sessionData: any, ttl: number = 7200): Promise<void> {
    await this.set(`user:${userId}`, sessionData, ttl);
  }

  async getUserSession(userId: string): Promise<any | null> {
    return await this.get(`user:${userId}`);
  }

  // Vendor data cache
  async cacheVendor(vendorId: string, vendor: any, ttl: number = 3600): Promise<void> {
    await this.set(`vendor:${vendorId}`, vendor, ttl);
  }

  async getVendor(vendorId: string): Promise<any | null> {
    return await this.get(`vendor:${vendorId}`);
  }

  // Cart cache operations
  async cacheCart(userId: string, cart: any, ttl: number = 1800): Promise<void> {
    await this.set(`cart:${userId}`, cart, ttl);
  }

  async getCart(userId: string): Promise<any | null> {
    return await this.get(`cart:${userId}`);
  }

  async invalidateCart(userId: string): Promise<void> {
    await this.del(`cart:${userId}`);
  }

  // Category cache
  async cacheCategories(categories: any[], ttl: number = 7200): Promise<void> {
    await this.set("categories", categories, ttl);
  }

  async getCategories(): Promise<any[] | null> {
    return await this.get("categories");
  }

  // Pattern-based cache invalidation
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (!this.isReady()) return 0;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`❌ Cache pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  // Cache statistics
  async getStats(): Promise<any> {
    try {
      if (!this.isReady()) return null;
      const info = await this.client.info("memory");
      const keyspace = await this.client.info("keyspace");
      return { info, keyspace, connected: this.isConnected };
    } catch (error) {
      console.error("❌ Cache stats error:", error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Helper function to ensure cache is ready
export async function ensureCacheReady(): Promise<boolean> {
  // Check if Redis is disabled in production
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log('⚠️ Redis not configured in production, running without cache');
    return false;
  }

  if (!cacheService.isReady()) {
    return await cacheService.connect();
  }
  return true;
}

// Cache key builders
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (key: string) => `products:${key}`,
  vendor: (id: string) => `vendor:${id}`,
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  search: (query: string) => `search:${Buffer.from(query).toString("base64")}`,
  categories: () => "categories",
} as const;
