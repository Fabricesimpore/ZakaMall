import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, hashPassword } from "../auth";
import { adminProtection } from "../security/SecurityMiddleware";
import { validatePassword } from "../utils/passwordValidation";

// Helper function to ensure admin access with protection for simporefabrice15@gmail.com
async function ensureAdminAccess(
  userId: string,
  storage: any
): Promise<{ isAdmin: boolean; user: any }> {
  const user = await storage.getUser(userId);

  // ADMIN PROTECTION: Force admin role for protected email
  if (user?.email === "simporefabrice15@gmail.com" && user?.role !== "admin") {
    console.log("🛡️ ADMIN PROTECTION: Auto-fixing admin role for simporefabrice15@gmail.com");
    await storage.updateUserRole(user.id, "admin");
    user.role = "admin";
  }

  const isAdmin = user?.role === "admin";
  return { isAdmin, user };
}

/**
 * Admin Routes
 * Handles administrative functions, user management, and system operations
 */
export function setupAdminRoutes(app: Express) {
  // Promote user to admin
  app.post("/api/admin/promote-user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID required" });
      }

      await storage.updateUserRole(targetUserId, "admin");
      res.json({ message: "User promoted to admin successfully" });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Emergency admin creation
  app.post("/api/admin/emergency-create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Special protection for the main admin email
      if (user?.email !== "simporefabrice15@gmail.com") {
        return res.status(403).json({ message: "Emergency admin creation not authorized" });
      }

      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields required" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: "Password does not meet requirements",
          requirements: passwordValidation.requirements,
        });
      }

      const passwordHash = await hashPassword(password);

      const adminUserId = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role: "admin",
        emailVerified: true,
      });

      console.log(`🛡️ Emergency admin created: ${email}`);
      res.json({ message: "Emergency admin created successfully", userId: adminUserId });
    } catch (error) {
      console.error("Emergency admin creation error:", error);
      res.status(500).json({ message: "Failed to create emergency admin" });
    }
  });

  // Emergency admin restore
  app.post("/api/admin/emergency-restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.email === "simporefabrice15@gmail.com") {
        // Force admin role for protected email
        await storage.updateUserRole(userId, "admin");
        console.log("🛡️ Emergency restore: simporefabrice15@gmail.com promoted to admin");

        // Update session
        if ((req as any).session?.user?.user) {
          (req as any).session.user.user.role = "admin";
        }

        return res.json({
          message: "Admin role restored successfully",
          user: { id: user.id, email: user.email, role: "admin" },
        });
      } else {
        return res
          .status(403)
          .json({ message: "Emergency restore not authorized for this account" });
      }
    } catch (error) {
      console.error("Emergency restore error:", error);
      res.status(500).json({ message: "Emergency restore failed" });
    }
  });

  // Debug role information
  app.get("/api/admin/debug-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const sessionUser = (req as any).session?.user?.user;

      res.json({
        database: {
          id: user?.id,
          email: user?.email,
          role: user?.role,
          exists: !!user,
        },
        session: {
          id: sessionUser?.id,
          email: sessionUser?.email,
          role: sessionUser?.role,
          exists: !!sessionUser,
        },
        match: user?.id === sessionUser?.id && user?.role === sessionUser?.role,
      });
    } catch (error) {
      console.error("Debug role error:", error);
      res.status(500).json({ message: "Debug failed" });
    }
  });

  // Nuclear restore (last resort)
  app.post("/api/admin/nuclear-restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.email === "simporefabrice15@gmail.com") {
        // Nuclear option: recreate admin
        console.log("🚨 NUCLEAR RESTORE: Recreating admin permissions");

        await storage.updateUserRole(userId, "admin");

        // Force session update
        const freshUser = await storage.getUser(userId);
        if ((req as any).session?.user) {
          (req as any).session.user.user = freshUser;
          (req as any).session.user.claims = {
            ...(req as any).session.user.claims,
            role: "admin",
          };
        }

        return res.json({
          message: "Nuclear restore completed",
          user: { id: freshUser?.id, email: freshUser?.email, role: freshUser?.role },
        });
      } else {
        return res.status(403).json({ message: "Nuclear restore not authorized" });
      }
    } catch (error) {
      console.error("Nuclear restore error:", error);
      res.status(500).json({ message: "Nuclear restore failed" });
    }
  });

  // Check database role
  app.post("/api/admin/check-db-role", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const user = await storage.getUserByEmail(email);
      res.json({
        exists: !!user,
        role: user?.role || null,
        id: user?.id || null,
      });
    } catch (error) {
      console.error("Check DB role error:", error);
      res.status(500).json({ message: "Failed to check role" });
    }
  });

  // Force database admin role
  app.post("/api/admin/force-db-admin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || email !== "simporefabrice15@gmail.com") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUserRole(user.id, "admin");
      console.log(`🛡️ Force DB admin: ${email} role updated to admin`);

      res.json({
        message: "Database role forced to admin",
        user: { id: user.id, email: user.email, role: "admin" },
      });
    } catch (error) {
      console.error("Force DB admin error:", error);
      res.status(500).json({ message: "Failed to force admin role" });
    }
  });

  // Admin vendor management
  app.get("/api/admin/vendors", isAuthenticated, adminProtection, async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/admin/vendors/pending", isAuthenticated, adminProtection, async (req, res) => {
    try {
      const pendingVendors = await storage.getVendors("pending");
      res.json(pendingVendors);
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
      res.status(500).json({ message: "Failed to fetch pending vendors" });
    }
  });

  app.post("/api/admin/vendors/:id/approve", isAuthenticated, adminProtection, async (req, res) => {
    const { id } = req.params;
    try {
      await storage.updateVendorStatus(id, "approved");
      res.json({ message: "Vendor approved successfully" });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ message: "Failed to approve vendor" });
    }
  });

  app.post("/api/admin/vendors/:id/reject", isAuthenticated, adminProtection, async (req, res) => {
    const { id } = req.params;
    try {
      await storage.updateVendorStatus(id, "rejected");
      res.json({ message: "Vendor rejected successfully" });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ message: "Failed to reject vendor" });
    }
  });

  app.post("/api/admin/vendors/:id/suspend", isAuthenticated, adminProtection, async (req, res) => {
    const { id } = req.params;
    try {
      await storage.updateVendorStatus(id, "suspended");
      res.json({ message: "Vendor suspended successfully" });
    } catch (error) {
      console.error("Error suspending vendor:", error);
      res.status(500).json({ message: "Failed to suspend vendor" });
    }
  });

  // Admin dashboard
  app.get("/api/admin/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get dashboard stats
      const stats = {
        totalUsers: await storage.getUserCount(),
        totalVendors: await storage.getVendorCount(),
        totalProducts: await storage.getProductCount(),
        totalOrders: await storage.getOrderCount(),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin transactions
  app.get("/api/admin/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin user management
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/admins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const admins = await storage.getUsersByRole("admin");
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!["customer", "vendor", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(id, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/admin/users/:id/diagnose", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const user = await storage.getUser(id);
      const vendor = await storage.getVendorByUserId(id);
      const driver = await storage.getDriverByUserId(id);

      res.json({
        user,
        vendor: vendor || null,
        driver: driver || null,
      });
    } catch (error) {
      console.error("Error diagnosing user:", error);
      res.status(500).json({ message: "Failed to diagnose user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;

      // Don't allow deletion of the main admin
      const targetUser = await storage.getUser(id);
      if (targetUser?.email === "simporefabrice15@gmail.com") {
        return res.status(403).json({ message: "Cannot delete protected admin account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { email, password, firstName, lastName, role } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "All fields required" });
      }

      if (!["customer", "vendor", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: "Password does not meet requirements",
          requirements: passwordValidation.requirements,
        });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const newUserId = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        emailVerified: true,
      });

      console.log(`👤 Admin created user: ${email} with role: ${role}`);
      res.json({ message: "User created successfully", userId: newUserId });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin profile management
  app.get("/api/admin/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin, user } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ message: "Failed to fetch admin profile" });
    }
  });

  app.patch("/api/admin/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { firstName, lastName } = req.body;

      await storage.updateUser(userId, { firstName, lastName });

      // Update session
      if ((req as any).session?.user?.user) {
        (req as any).session.user.user.firstName = firstName;
        (req as any).session.user.user.lastName = lastName;
      }

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin analytics
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Fixed users endpoint
  app.get("/api/admin/users-fixed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isAdmin } = await ensureAdminAccess(userId, storage);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsersFixed();
      res.json(users);
    } catch (error) {
      console.error("Error fetching fixed users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
}
