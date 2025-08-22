import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { generateUniqueStoreSlug, generateStoreNameSuggestions } from "../utils/vendor-slug";
import {
  vendorRegistrationSchema,
  storeNameCheckSchema,
  vendorApprovalSchema,
} from "@shared/schema";

/**
 * Fast vendor registration endpoint
 * Minimal required fields, extended details can be completed later
 */
export async function registerVendor(req: Request, res: Response) {
  try {
    // Rate limiting by IP (simple implementation)
    const clientIp = req.ip;
    // TODO: Implement proper rate limiting with Redis/memory store

    // Validate input
    const data = vendorRegistrationSchema.parse(req.body);

    // Check if store name is available
    const isAvailable = await storage.checkStoreNameAvailability(data.storeName);
    if (!isAvailable) {
      const suggestions = generateStoreNameSuggestions(data.storeName);
      return res.status(400).json({
        error: "Store name already taken",
        code: "STORE_NAME_TAKEN",
        suggestions,
      });
    }

    // Generate unique slug
    const storeSlug = await generateUniqueStoreSlug(data.storeName);

    // Begin transaction for vendor creation
    try {
      // Create vendor with pending status
      const vendor = await storage.createVendor({
        userId: req.user?.id || "system", // TODO: Get from auth middleware
        storeName: data.storeName,
        storeSlug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        countryCode: data.countryCode,
        legalName: data.legalName,
        status: "pending",
      });

      // Log the registration action
      await storage.logVendorAction(
        vendor.id,
        "submitted",
        vendor.userId,
        "Vendor registration submitted"
      );

      res.status(201).json({
        vendor_id: vendor.id,
        store_slug: storeSlug,
        message: "Registration submitted successfully. Your store is pending review.",
      });
    } catch (error) {
      console.error("Vendor registration failed:", error);
      res.status(500).json({
        error: "Registration failed",
        message: "Please try again later",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: error.issues,
      });
    }

    console.error("Vendor registration error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * Check store name availability
 */
export async function checkStoreNameAvailability(req: Request, res: Response) {
  try {
    const { name } = storeNameCheckSchema.parse(req.query);

    if (name.length < 3) {
      return res.json({
        available: false,
        reason: "too_short",
        message: "Store name must be at least 3 characters long",
      });
    }

    const isAvailable = await storage.checkStoreNameAvailability(name);

    if (!isAvailable) {
      const suggestions = generateStoreNameSuggestions(name);
      return res.json({
        available: false,
        reason: "taken",
        message: "This store name is already taken",
        suggestions,
      });
    }

    res.json({
      available: true,
      message: "Store name is available",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: error.issues,
      });
    }

    console.error("Store name check error:", error);
    res.status(500).json({
      error: "Failed to check availability",
    });
  }
}

/**
 * Admin: Get vendors for review
 */
export async function getVendorsForReview(req: Request, res: Response) {
  try {
    const { status = "pending", query } = req.query;

    // Verify admin access
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const vendors = await storage.getVendors(status as any);

    // Filter by search query if provided
    let filteredVendors = vendors;
    if (query && typeof query === "string") {
      const searchTerm = query.toLowerCase();
      filteredVendors = vendors.filter(
        (vendor) =>
          vendor.storeName?.toLowerCase().includes(searchTerm) ||
          vendor.contactEmail?.toLowerCase().includes(searchTerm) ||
          vendor.legalName?.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      vendors: filteredVendors,
      total: filteredVendors.length,
    });
  } catch (error) {
    console.error("Get vendors for review error:", error);
    res.status(500).json({
      error: "Failed to fetch vendors",
    });
  }
}

/**
 * Admin: Approve vendor
 */
export async function approveVendor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = vendorApprovalSchema.parse(req.body);

    // Verify admin access
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Use idempotency key to prevent double-clicks
    const idempotencyKey = req.headers["idempotency-key"] as string;
    // TODO: Implement idempotency check with Redis/memory store

    try {
      // Update vendor status and log action
      const vendor = await storage.updateVendorStatus(id, "approved");
      await storage.logVendorAction(id, "approved", req.user.id, notes);

      // Trigger product reindexing for this vendor
      const { syncHooks } = await import("../services/product-sync");
      syncHooks.onVendorStatusChanged(id).catch((error) => {
        console.error("Failed to reindex vendor products:", error);
      });

      // TODO: Send approval notification email to vendor

      res.json({
        success: true,
        vendor,
        message: "Vendor approved successfully",
      });
    } catch (error) {
      console.error("Vendor approval failed:", error);
      res.status(500).json({
        error: "Approval failed",
        message: "Please try again",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: error.issues,
      });
    }

    console.error("Approve vendor error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * Admin: Reject vendor
 */
export async function rejectVendor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = vendorApprovalSchema.parse(req.body);

    // Verify admin access
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Update vendor status and log action
      const vendor = await storage.updateVendorStatus(id, "rejected");
      await storage.logVendorAction(id, "rejected", req.user.id, notes);

      // Remove all vendor products from search index
      const { syncHooks } = await import("../services/product-sync");
      syncHooks.onVendorStatusChanged(id).catch((error) => {
        console.error("Failed to remove vendor products from index:", error);
      });

      // TODO: Send rejection notification email to vendor

      res.json({
        success: true,
        vendor,
        message: "Vendor rejected",
      });
    } catch (error) {
      console.error("Vendor rejection failed:", error);
      res.status(500).json({
        error: "Rejection failed",
        message: "Please try again",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: error.issues,
      });
    }

    console.error("Reject vendor error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * Admin: Suspend vendor
 */
export async function suspendVendor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = vendorApprovalSchema.parse(req.body);

    // Verify admin access
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Update vendor status and log action
      const vendor = await storage.updateVendorStatus(id, "suspended");
      await storage.logVendorAction(id, "suspended", req.user.id, notes);

      // Remove all vendor products from search index
      const { syncHooks } = await import("../services/product-sync");
      syncHooks.onVendorStatusChanged(id).catch((error) => {
        console.error("Failed to remove vendor products from index:", error);
      });

      // TODO: Send suspension notification email to vendor

      res.json({
        success: true,
        vendor,
        message: "Vendor suspended",
      });
    } catch (error) {
      console.error("Vendor suspension failed:", error);
      res.status(500).json({
        error: "Suspension failed",
        message: "Please try again",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: error.issues,
      });
    }

    console.error("Suspend vendor error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}
