import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, hashPassword } from "../auth";
import { adminProtection } from "../security/SecurityMiddleware";
import { insertVendorSchema } from "@shared/schema";
import { generateUniqueStoreSlug } from "../utils/vendor-slug";
import { validatePassword } from "../utils/passwordValidation";

/**
 * Vendor Routes
 * Handles vendor registration, management, and vendor-specific operations
 */
export function setupVendorRoutes(app: Express) {
  // Create vendor profile (for existing authenticated users)
  app.post("/api/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "vendor") {
        return res.status(403).json({ message: "User must have vendor role" });
      }

      // Check if vendor already exists
      const existingVendor = await storage.getVendorByUserId(userId);
      if (existingVendor) {
        return res.status(400).json({ message: "Vendor profile already exists" });
      }

      const vendorData = insertVendorSchema.parse({
        ...req.body,
        userId,
        storeSlug: await generateUniqueStoreSlug(req.body.storeName),
      });

      const vendor = await storage.createVendor(vendorData);

      console.log(`🏪 Vendor profile created: ${vendor.storeName} for user ${user.email}`);
      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor profile" });
    }
  });

  // Get all vendors (admin only)
  app.get("/api/vendors", isAuthenticated, adminProtection, async (req: any, res) => {
    try {
      const { status } = req.query;
      const vendors = await storage.getVendors(status as any);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Update vendor status (admin only)
  app.patch("/api/vendors/:id/status", isAuthenticated, adminProtection, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateVendorStatus(id, status);

      console.log(`📋 Vendor ${id} status updated to: ${status}`);
      res.json({ message: "Vendor status updated successfully" });
    } catch (error) {
      console.error("Error updating vendor status:", error);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });

  // Register new vendor (public endpoint)
  app.post("/api/vendors/register", async (req, res) => {
    try {
      const {
        // User details
        email,
        phone,
        password,
        firstName,
        lastName,
        // Vendor details
        storeName,
        businessName,
        businessType,
        businessAddress,
        businessPhone,
        businessEmail,
        businessDescription,
        website,
        taxId,
        bankAccountNumber,
        bankName,
        businessLicense,
        businessRegistrationNumber,
      } = req.body;

      // Validate required fields
      if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone number is required" });
      }

      if (!password || !firstName || !lastName || !storeName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: "Password does not meet requirements",
          requirements: passwordValidation.requirements,
        });
      }

      // Check if user already exists
      let existingUser = null;
      if (email) {
        existingUser = await storage.getUserByEmail(email);
      }
      if (!existingUser && phone) {
        existingUser = await storage.getUserByPhone(phone);
      }

      if (existingUser) {
        return res.status(400).json({ message: "User with this email/phone already exists" });
      }

      // Check if store name is available
      const existingVendor = await storage.getVendorByStoreName(storeName);
      if (existingVendor) {
        return res.status(400).json({ message: "Store name is already taken" });
      }

      const passwordHash = await hashPassword(password);

      // Create user account
      const userId = await storage.createUser({
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role: "vendor",
        emailVerified: false,
        phoneVerified: false,
      });

      // Create vendor profile
      const vendorData = insertVendorSchema.parse({
        userId,
        storeName,
        storeSlug: await generateUniqueStoreSlug(storeName),
        businessName,
        businessType,
        businessAddress,
        businessPhone,
        businessEmail,
        businessDescription,
        website,
        taxId,
        bankAccountNumber,
        bankName,
        businessLicense,
        businessRegistrationNumber,
        status: "pending", // Requires admin approval
      });

      const vendor = await storage.createVendor(vendorData);

      console.log(`🏪 Vendor registration: ${storeName} (${email || phone})`);
      res.json({
        message: "Vendor registration successful. Awaiting admin approval.",
        vendor: {
          id: vendor.id,
          storeName: vendor.storeName,
          status: vendor.status,
        },
      });
    } catch (error) {
      console.error("Vendor registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Check if store name is available
  app.get("/api/vendors/check-store-name", async (req, res) => {
    try {
      const { storeName } = req.query;

      if (!storeName) {
        return res.status(400).json({ message: "Store name is required" });
      }

      const existingVendor = await storage.getVendorByStoreName(storeName as string);
      const isAvailable = !existingVendor;

      res.json({
        available: isAvailable,
        storeName,
        slug: isAvailable ? await generateUniqueStoreSlug(storeName as string) : null,
      });
    } catch (error) {
      console.error("Error checking store name:", error);
      res.status(500).json({ message: "Failed to check store name availability" });
    }
  });

  // Get vendor by slug (public endpoint)
  app.get("/api/vendors/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const vendor = await storage.getVendorBySlug(slug);

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Only return public vendor information
      const publicVendorInfo = {
        id: vendor.id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        businessDescription: vendor.businessDescription,
        website: vendor.website,
        businessPhone: vendor.businessPhone,
        businessEmail: vendor.businessEmail,
        status: vendor.status,
        createdAt: vendor.createdAt,
      };

      res.json(publicVendorInfo);
    } catch (error) {
      console.error("Error fetching vendor by slug:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  // Get vendor trust score
  app.get("/api/vendors/:id/trust-score", async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await storage.getVendor(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Calculate trust score based on various factors
      const trustMetrics = await storage.getVendorTrustMetrics(id);

      // Simple trust score calculation (can be enhanced)
      let trustScore = 50; // Base score

      // Factors that increase trust
      if (trustMetrics.totalOrders > 10) trustScore += 10;
      if (trustMetrics.totalOrders > 50) trustScore += 10;
      if (trustMetrics.avgRating > 4.0) trustScore += 15;
      if (trustMetrics.avgRating > 4.5) trustScore += 10;
      if (trustMetrics.completionRate > 0.9) trustScore += 15;
      if (vendor.businessLicense) trustScore += 10;
      if (vendor.taxId) trustScore += 5;

      // Factors that decrease trust
      if (trustMetrics.disputeRate > 0.1) trustScore -= 20;
      if (trustMetrics.avgRating < 3.0) trustScore -= 15;
      if (trustMetrics.completionRate < 0.8) trustScore -= 10;

      // Cap between 0 and 100
      trustScore = Math.max(0, Math.min(100, trustScore));

      res.json({
        vendorId: id,
        trustScore,
        metrics: trustMetrics,
        factors: {
          totalOrders: trustMetrics.totalOrders,
          avgRating: trustMetrics.avgRating,
          completionRate: trustMetrics.completionRate,
          disputeRate: trustMetrics.disputeRate,
          hasBusinessLicense: !!vendor.businessLicense,
          hasTaxId: !!vendor.taxId,
        },
      });
    } catch (error) {
      console.error("Error calculating vendor trust score:", error);
      res.status(500).json({ message: "Failed to calculate trust score" });
    }
  });
}
