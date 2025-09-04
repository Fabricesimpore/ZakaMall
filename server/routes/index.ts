import type { Express } from "express";
import { setupAuthRoutes } from "./auth";
import { setupAdminRoutes } from "./admin";
import { setupCartOrderRoutes } from "./cart-orders";
import { setupProductRoutes } from "./products";
import { setupVendorRoutes } from "./vendors";
import { setupPaymentRoutes } from "./payments";
import { setupDriverRoutes } from "./drivers";
import { setupSearchReviewRoutes } from "./search-reviews";

/**
 * Setup all modular routes
 * This replaces the monolithic routes.ts file with organized, maintainable modules
 */
export function setupRoutes(app: Express) {
  console.log("🔧 Setting up modular routes...");

  // Authentication routes - login, logout, registration, session management
  setupAuthRoutes(app);
  
  // Admin routes - user management, vendor approval, system administration
  setupAdminRoutes(app);
  
  // Cart and Order routes - shopping cart operations and order management
  setupCartOrderRoutes(app);
  
  // Product routes - product catalog, categories, product management
  setupProductRoutes(app);
  
  // Vendor routes - vendor registration, management, and vendor-specific operations
  setupVendorRoutes(app);
  
  // Payment routes - payment processing, callbacks, and payment status
  setupPaymentRoutes(app);
  
  // Driver routes - driver management, location tracking, availability
  setupDriverRoutes(app);
  
  // Search and Review routes - product search, suggestions, and review management
  setupSearchReviewRoutes(app);

  console.log("✅ All modular routes initialized successfully");
  console.log("📊 Route modules loaded:");
  console.log("   - Authentication (11 routes)");
  console.log("   - Admin Management (24 routes)");
  console.log("   - Cart & Orders (14 routes)");
  console.log("   - Products & Categories (10 routes)");
  console.log("   - Vendor Management (7 routes)");
  console.log("   - Payment Processing (10 routes)");
  console.log("   - Driver Management (6 routes)");
  console.log("   - Search & Reviews (10 routes)");
  console.log("   - Total: ~92+ routes organized into 8 modules");
}