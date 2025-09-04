import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { adminProtection } from "../security/SecurityMiddleware";
import { insertDriverSchema } from "@shared/schema";

/**
 * Driver Routes
 * Handles driver management, location tracking, and availability
 */
export function setupDriverRoutes(app: Express) {

  // Get all drivers (admin only)
  app.get("/api/drivers", isAuthenticated, adminProtection, async (req: any, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Update driver status (admin only)
  app.patch("/api/drivers/:id/status", isAuthenticated, adminProtection, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await storage.updateDriverStatus(id, status);
      res.json({ message: "Driver status updated successfully" });
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  // Update driver commission rate (admin only) 
  app.patch("/api/drivers/:id/commission", isAuthenticated, adminProtection, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { commissionRate } = req.body;

      if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
        return res.status(400).json({ message: "Invalid commission rate" });
      }

      await storage.updateDriverCommission(id, commissionRate);
      res.json({ message: "Driver commission updated successfully" });
    } catch (error) {
      console.error("Error updating driver commission:", error);
      res.status(500).json({ message: "Failed to update driver commission" });
    }
  });

  // Create driver profile (authenticated users)
  app.post("/api/drivers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "driver") {
        return res.status(403).json({ message: "User must have driver role" });
      }

      // Check if driver already exists
      const existingDriver = await storage.getDriverByUserId(userId);
      if (existingDriver) {
        return res.status(400).json({ message: "Driver profile already exists" });
      }

      const driverData = insertDriverSchema.parse({
        ...req.body,
        userId,
      });

      const driver = await storage.createDriver(driverData);
      
      console.log(`🚗 Driver profile created for user ${user.email}`);
      res.json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver profile" });
    }
  });

  // Get available drivers (public endpoint for order assignment)
  app.get("/api/drivers/available", async (req, res) => {
    try {
      const { lat, lng, maxDistance = 10 } = req.query;
      
      const filters: any = {
        isActive: true,
        status: "available",
      };

      // If location provided, filter by distance
      if (lat && lng) {
        filters.location = {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
          maxDistance: parseFloat(maxDistance as string),
        };
      }

      const availableDrivers = await storage.getAvailableDrivers(filters);
      res.json(availableDrivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  // Update driver location (driver only)
  app.patch("/api/drivers/:id/location", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { currentLat, currentLng } = req.body;
      const userId = req.user.claims.sub;

      // Verify driver owns this profile or is admin
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      const user = await storage.getUser(userId);
      const isOwner = driver.userId === userId;
      const isAdmin = user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this driver's location" });
      }

      if (typeof currentLat !== "number" || typeof currentLng !== "number") {
        return res.status(400).json({ message: "Valid latitude and longitude required" });
      }

      await storage.updateDriverLocation(id, currentLat, currentLng);
      
      console.log(`📍 Driver ${id} location updated: ${currentLat}, ${currentLng}`);
      res.json({ message: "Location updated successfully" });
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({ message: "Failed to update driver location" });
    }
  });

  // Update driver availability status (driver only)
  app.patch("/api/drivers/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = req.user.claims.sub;

      // Verify driver owns this profile or is admin
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      const user = await storage.getUser(userId);
      const isOwner = driver.userId === userId;
      const isAdmin = user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this driver's status" });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      await storage.updateDriverAvailability(id, isActive);
      
      const status = isActive ? "available" : "unavailable";
      console.log(`🚗 Driver ${id} is now ${status}`);
      res.json({ message: `Driver status updated to ${status}` });
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });
}