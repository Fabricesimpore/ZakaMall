import { Request, Response, NextFunction } from "express";
import { cacheService, ensureCacheReady } from "../cache";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

// Default cache key generator
function defaultKeyGenerator(req: Request): string {
  const url = req.originalUrl || req.url;
  const method = req.method;
  const userId = (req.session as any)?.user?.id || 'anonymous';
  
  // Include user ID for personalized content
  if (url.includes('/cart') || url.includes('/orders') || url.includes('/profile')) {
    return `${method}:${url}:${userId}`;
  }
  
  return `${method}:${url}`;
}

// Cache middleware factory
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    onCacheHit = () => {},
    onCacheMiss = () => {},
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if cache is not ready or explicitly skipped
    if (!(await ensureCacheReady()) || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        onCacheHit(cacheKey);
        console.log(`🎯 Cache HIT for: ${cacheKey}`);
        
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      onCacheMiss(cacheKey);
      console.log(`💨 Cache MISS for: ${cacheKey}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttl).catch(error => {
            console.error(`❌ Failed to cache response for ${cacheKey}:`, error);
          });
        }
        
        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error(`❌ Cache middleware error for ${cacheKey}:`, error);
      next(); // Continue without cache on error
    }
  };
}

// Specific cache configurations for different routes
export const ProductCacheConfig = {
  // Individual product details - cache for 30 minutes
  product: {
    ttl: 1800, // 30 minutes
    keyGenerator: (req: Request) => `product:${req.params.id}`,
  },

  // Product lists - cache for 10 minutes  
  productList: {
    ttl: 600, // 10 minutes
    keyGenerator: (req: Request) => {
      const params = new URLSearchParams(req.query as any);
      return `products:${params.toString()}`;
    },
  },

  // Similar products - cache for 1 hour
  similarProducts: {
    ttl: 3600, // 1 hour
    keyGenerator: (req: Request) => `similar:${req.params.id}:${req.query.limit || '10'}`,
  },

  // Restaurant products - cache for 15 minutes
  restaurantProducts: {
    ttl: 900, // 15 minutes
    keyGenerator: () => 'restaurant_products',
  },

  // Product reviews - cache for 20 minutes
  productReviews: {
    ttl: 1200, // 20 minutes
    keyGenerator: (req: Request) => `reviews:${req.params.id}:${req.query.enhanced || 'false'}`,
  },
};

// Cache invalidation helper
export class CacheInvalidator {
  static async invalidateProduct(productId: string) {
    await Promise.all([
      cacheService.del(`product:${productId}`),
      cacheService.invalidatePattern(`products:*`),
      cacheService.invalidatePattern(`similar:${productId}:*`),
      cacheService.invalidatePattern(`reviews:${productId}:*`),
    ]);
    console.log(`🗑️ Invalidated cache for product: ${productId}`);
  }

  static async invalidateProductList() {
    await cacheService.invalidatePattern('products:*');
    console.log('🗑️ Invalidated product list cache');
  }

  static async invalidateVendor(vendorId: string) {
    await Promise.all([
      cacheService.del(`vendor:${vendorId}`),
      cacheService.invalidatePattern(`products:*vendorId=${vendorId}*`),
    ]);
    console.log(`🗑️ Invalidated cache for vendor: ${vendorId}`);
  }

  static async invalidateUser(userId: string) {
    await Promise.all([
      cacheService.del(`user:${userId}`),
      cacheService.del(`cart:${userId}`),
    ]);
    console.log(`🗑️ Invalidated cache for user: ${userId}`);
  }

  static async invalidateAll() {
    const deleted = await cacheService.invalidatePattern('zakamal:*');
    console.log(`🗑️ Invalidated all cache: ${deleted} keys deleted`);
  }
}