import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertProductSchema } from "@shared/schema";
import {
  cacheMiddleware,
  ProductCacheConfig,
  CacheInvalidator,
} from "../middleware/cacheMiddleware";

/**
 * Product and Category Routes
 * Handles product catalog, categories, and product management
 */
export function setupProductRoutes(app: Express) {
  // ============ CATEGORY ROUTES ============

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category (admin only)
  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only admin can create categories
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const categoryId = await storage.createCategory({ name, description });
      console.log(`📂 Category created: ${name}`);

      res.json({ message: "Category created successfully", categoryId });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // ============ PRODUCT ROUTES ============

  // Create new product
  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only vendors can create products
      if (user?.role !== "vendor") {
        return res.status(403).json({ message: "Vendor access required" });
      }

      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        return res.status(400).json({ message: "Vendor profile not found" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        vendorId: vendor.id,
      });

      const product = await storage.createProduct(productData);

      // Invalidate related caches
      await CacheInvalidator.invalidateProductList();

      console.log(`📦 Product created: ${product.name} by vendor ${vendor.storeName}`);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Get restaurant products
  app.get(
    "/api/products/restaurants",
    cacheMiddleware(ProductCacheConfig.restaurantProducts),
    async (req, res) => {
      try {
        const products = await storage.getRestaurantProducts();
        res.json(products);
      } catch (error) {
        console.error("Error fetching restaurant products:", error);
        res.status(500).json({ message: "Failed to fetch restaurant products" });
      }
    }
  );

  // Get products with filtering and pagination
  app.get("/api/products", cacheMiddleware(ProductCacheConfig.productList), async (req, res) => {
    try {
      const {
        page = "1",
        limit = "24",
        category,
        vendorId,
        minPrice,
        maxPrice,
        inStock,
        search,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(Math.max(1, parseInt(limit as string)), 100);

      const filters = {
        categoryId: category as string,
        vendorId: vendorId as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        inStock: inStock === "true",
        search: search as string,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
      };

      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product by ID
  app.get("/api/products/:id", cacheMiddleware(ProductCacheConfig.product), async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get vendor information
      const vendor = await storage.getVendor(product.vendorId);

      res.json({
        ...product,
        vendor: vendor
          ? {
              id: vendor.id,
              storeName: vendor.storeName,
              storeSlug: vendor.storeSlug,
            }
          : null,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Update product
  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check permissions
      let hasPermission = false;
      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === product.vendorId;
      }

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);

      // Invalidate caches
      await CacheInvalidator.invalidateProduct(id);

      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check permissions
      let hasPermission = false;
      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === product.vendorId;
      }

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(id);

      // Invalidate caches
      await CacheInvalidator.invalidateProduct(id);

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get product reviews
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const { enhanced = "false" } = req.query;

      const reviews = await storage.getProductReviews(id, enhanced === "true");
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get similar products
  app.get("/api/products/:id/similar", async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = "10" } = req.query;

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const similarProducts = await storage.getSimilarProducts(id, parseInt(limit as string));
      res.json(similarProducts);
    } catch (error) {
      console.error("Error fetching similar products:", error);
      res.status(500).json({ message: "Failed to fetch similar products" });
    }
  });

  // Update product stock
  app.put("/api/products/:id/stock", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { stockQuantity } = req.body;
      const userId = req.user.claims.sub;

      if (typeof stockQuantity !== "number" || stockQuantity < 0) {
        return res.status(400).json({ message: "Invalid stock quantity" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check permissions
      const user = await storage.getUser(userId);
      let hasPermission = false;

      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === product.vendorId;
      }

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update stock for this product" });
      }

      await storage.updateProductStock(id, stockQuantity);

      // Invalidate product cache
      await CacheInvalidator.invalidateProduct(id);

      console.log(`📦 Stock updated for product ${id}: ${stockQuantity} units`);
      res.json({ message: "Stock updated successfully", stockQuantity });
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });

  // Update product images
  app.put("/api/products/:productId/images", isAuthenticated, async (req: any, res) => {
    try {
      const { productId } = req.params;
      const { images } = req.body;
      const userId = req.user.claims.sub;

      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images must be an array" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check permissions
      const user = await storage.getUser(userId);
      let hasPermission = false;

      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === product.vendorId;
      }

      if (!hasPermission) {
        return res
          .status(403)
          .json({ message: "Not authorized to update images for this product" });
      }

      // Process and validate image URLs
      const processedImages = images.map((imageUrl: string) => {
        if (imageUrl.includes("cloudinary.com") && !imageUrl.includes("/upload/")) {
          console.warn(`⚠️ Malformed Cloudinary URL: ${imageUrl}`);
          return imageUrl;
        }
        return imageUrl;
      });

      await storage.updateProductImages(productId, processedImages);

      // Invalidate product cache
      await CacheInvalidator.invalidateProduct(productId);

      console.log(`🖼️ Images updated for product ${productId}: ${processedImages.length} images`);
      res.json({ message: "Product images updated successfully", images: processedImages });
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ message: "Failed to update product images" });
    }
  });
}
