import type { Express } from "express";
import { storage } from "../storage";
import {
  isAuthenticated,
  hashPassword,
  verifyPassword,
  createUserSession,
} from "../auth";
import { validatePassword } from "../utils/passwordValidation";
import { loginProtection } from "../security/SecurityMiddleware";
import { cacheMiddleware } from "../middleware/cacheMiddleware";
import { randomInt } from "crypto";

/**
 * Authentication Routes
 * Handles user login, logout, registration, and session management
 */
export function setupAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", loginProtection, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create user session
      await createUserSession(req, user);

      console.log(`✅ User ${user.email} logged in successfully`);
      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session?.destroy((err: any) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Legacy logout endpoint
  app.get("/api/logout", (req, res) => {
    (req as any).session?.destroy((err: any) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user info with caching
  app.get(
    "/api/auth/user",
    isAuthenticated,
    cacheMiddleware({
      ttl: 300, // 5 minutes - shorter for user profile
      keyGenerator: (req) => `user:${(req as any).user.claims.sub}`,
      skipCache: (req) => {
        // Skip cache for admin users to ensure real-time admin protection works
        const user = (req as any).session?.user?.user;
        return user?.role === "admin" || user?.email === "simporefabrice15@gmail.com";
      },
    }),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // ADMIN PROTECTION: Force admin role for protected email
        if (user.email === "simporefabrice15@gmail.com" && user.role !== "admin") {
          console.log("🛡️ EMERGENCY: Admin user detected with wrong role, forcing update!");
          console.log("🛡️ Before fix:", { email: user.email, role: user.role });

          // Force update in database
          await storage.updateUserRole(user.id, "admin");

          // Fetch the corrected user
          const correctedUser = await storage.getUser(userId);
          console.log("🛡️ After fix:", { email: correctedUser?.email, role: correctedUser?.role });

          if (correctedUser) {
            user.role = "admin";
          }
        }

        // Update session with fresh user data
        if ((req as any).session?.user) {
          console.log("🔄 Updating session with fresh user data:", {
            id: user.id,
            email: user.email,
            role: user.role,
          });
          (req as any).session.user.user = user;
        }

        // Get additional role-specific data
        let roleData = null;
        if (user.role === "vendor") {
          roleData = await storage.getVendorByUserId(userId);
        } else if (user.role === "driver") {
          roleData = await storage.getDriverByUserId(userId);
        }

        console.log("🔍 Final user data being returned:", {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        res.json({ ...user, roleData });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  // Check setup status
  app.get("/api/auth/setup-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let setupComplete = false;
      let redirectTo = "/setup";

      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        setupComplete = !!vendor;
        redirectTo = vendor ? "/vendor/dashboard" : "/setup/vendor";
      } else if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        setupComplete = !!driver;
        redirectTo = driver ? "/driver/dashboard" : "/setup/driver";
      } else {
        setupComplete = true;
        redirectTo = "/";
      }

      res.json({ setupComplete, redirectTo, role: user.role });
    } catch (error) {
      console.error("Error checking setup status:", error);
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  // Set user role
  app.post("/api/auth/set-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!["customer", "vendor", "driver"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(userId, role);

      // Update session
      if ((req as any).session?.user?.user) {
        (req as any).session.user.user.role = role;
      }

      res.json({ message: "Role updated successfully", role });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Refresh session
  app.post("/api/auth/refresh-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session with fresh user data
      await createUserSession(req, user);

      res.json({
        message: "Session refreshed successfully",
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Error refreshing session:", error);
      res.status(500).json({ message: "Failed to refresh session" });
    }
  });

  // Phone signup
  app.post("/api/auth/phone-signup", async (req, res) => {
    try {
      const { phone, password, firstName, lastName } = req.body;

      // Validation
      if (!phone || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
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
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ message: "User with this phone number already exists" });
      }

      // Generate verification code
      const verificationCode = randomInt(100000, 999999).toString();

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user (not verified yet)
      const userId = await storage.createUser({
        phone,
        passwordHash,
        firstName,
        lastName,
        phoneVerified: false,
        verificationCode,
        role: "customer",
      });

      console.log(`📱 Phone signup initiated for: ${phone}`);

      // In production, send SMS with verification code
      console.log(`🔢 Verification code for ${phone}: ${verificationCode}`);

      res.json({
        message: "Verification code sent to your phone",
        userId,
        // Remove this in production
        verificationCode: process.env.NODE_ENV === "development" ? verificationCode : undefined,
      });
    } catch (error) {
      console.error("Phone signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Verify phone
  app.post("/api/auth/verify-phone", async (req, res) => {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ message: "Phone and verification code required" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Mark phone as verified
      await storage.verifyUserPhone(user.id);

      // Create session
      await createUserSession(req, user);

      console.log(`✅ Phone verified and user logged in: ${phone}`);
      res.json({
        message: "Phone verified successfully",
        user: { id: user.id, phone: user.phone, role: user.role },
      });
    } catch (error) {
      console.error("Phone verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Phone login
  app.post("/api/auth/phone-login", async (req, res) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password required" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.phoneVerified) {
        return res.status(401).json({ message: "Phone number not verified" });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      await createUserSession(req, user);

      console.log(`✅ User ${user.phone} logged in successfully`);
      res.json({
        message: "Login successful",
        user: { id: user.id, phone: user.phone, role: user.role },
      });
    } catch (error) {
      console.error("Phone login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Email signup
  app.post("/api/auth/email-signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
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
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate verification code
      const verificationCode = randomInt(100000, 999999).toString();

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user (not verified yet)
      const userId = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        emailVerified: false,
        verificationCode,
        role: "customer",
      });

      console.log(`📧 Email signup initiated for: ${email}`);

      // In production, send email with verification code
      console.log(`🔢 Verification code for ${email}: ${verificationCode}`);

      res.json({
        message: "Verification code sent to your email",
        userId,
        // Remove this in production
        verificationCode: process.env.NODE_ENV === "development" ? verificationCode : undefined,
      });
    } catch (error) {
      console.error("Email signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email" });
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Mark email as verified
      await storage.verifyUserEmail(user.id);

      // Create session
      await createUserSession(req, user);

      console.log(`✅ Email verified and user logged in: ${email}`);
      res.json({
        message: "Email verified successfully",
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });
}
