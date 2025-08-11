import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  toMinorUnit,
  toMajorUnit,
  formatMoney,
  isValidMoneyAmount,
  calculateCommission,
} from "./utils/money";
import { orderNotificationService } from "./notifications/orderNotifications";
import {
  setupAuth,
  isAuthenticated,
  hashPassword,
  verifyPassword,
  createUserSession,
} from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import CloudinaryService, { upload } from "./cloudinaryStorage";
import { ObjectPermission } from "./objectAcl";
import { PaymentServiceFactory } from "./paymentService";
import {
  insertVendorSchema,
  insertDriverSchema,
  insertProductSchema,
  insertCartSchema,
  insertReviewSchema,
  insertMessageSchema,
} from "@shared/schema";
import { randomInt } from "crypto";
import { validatePassword } from "./utils/passwordValidation";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  try {
    await setupAuth(app);
  } catch (error) {
    console.warn(
      "Auth setup failed, continuing without auth for testing:",
      (error as Error).message
    );
  }

  // Login endpoint with password verification
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password provided:", !!password);

    try {
      // Validate input
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      // Find user by email
      console.log("Looking up user by email:", email);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      console.log("User found:", {
        id: user.id,
        email: user.email,
        hasPassword: !!user.password,
        role: user.role,
      });

      // Check if user has a password (for users who signed up with password)
      if (!user.password) {
        // For backward compatibility, allow test login without password
        if (process.env.NODE_ENV === "development") {
          await createUserSession(req, user);
          return res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
          });
        }
        return res.status(400).json({
          error: "Ce compte n'a pas de mot de passe. Utilisez une autre méthode de connexion.",
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      console.log("Password verified for user:", email, "Creating session...");

      // Create user session
      try {
        await createUserSession(req, user);
        console.log("Session creation completed for user:", email);
      } catch (sessionError) {
        console.error("Session creation failed:", sessionError);
        return res.status(500).json({ error: "Failed to create session" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erreur lors de la connexion" });
    }
  });

  // Logout endpoint (POST)
  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Logout endpoint (GET) - for direct navigation
  app.get("/api/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.redirect("/?error=logout_failed");
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });

  // Legacy test login (kept for backwards compatibility)
  app.post("/api/test/login", async (req, res) => {
    const { email } = req.body;

    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(400).json({ error: "User not found with this email" });
      }

      // Create user session without password check (test only)
      await createUserSession(req, user);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Test login error:", error);
      res.status(500).json({ error: "Failed to login user" });
    }
  });

  // Test route to create a test order for payment testing
  app.post("/api/test/order", async (req, res) => {
    const { amount, items } = req.body;

    try {
      const testOrder = {
        customerId: "test-user-123",
        vendorId: "test-vendor-1",
        status: "pending" as const,
        subtotal: amount.toString(),
        deliveryFee: "2000",
        totalAmount: amount.toString(),
        deliveryAddress: {
          address: "Adresse de test, Ouagadougou, Burkina Faso",
          phone: "+226 70 12 34 56",
          name: "Test User",
        },
      };

      const testOrderItems = items.map((item: any) => ({
        productId: "test-product-1",
        quantity: item.quantity || 1,
        unitPrice: item.price || 1000,
        totalPrice: (item.quantity || 1) * (item.price || 1000),
      }));

      const createdOrder = await storage.createOrder(testOrder, testOrderItems);
      res.json({ success: true, orderId: createdOrder.id });
    } catch (error) {
      console.error("Test order creation error:", error);
      res.status(500).json({ error: "Failed to create test order" });
    }
  });

  // Test payment routes (unprotected for testing)
  app.post("/api/test/payments/orange-money", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const paymentService = PaymentServiceFactory.getService("orange_money");
      const result = await paymentService.initiatePayment({
        orderId: "test-order-123",
        amount: 25000,
        phoneNumber: phoneNumber || "+226 70 12 34 56",
        paymentMethod: "orange_money",
      });
      res.json(result);
    } catch (error) {
      console.error("Orange Money test error:", error);
      res.status(500).json({ error: "Orange Money test failed" });
    }
  });

  app.post("/api/test/payments/moov-money", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const paymentService = PaymentServiceFactory.getService("moov_money");
      const result = await paymentService.initiatePayment({
        orderId: "test-order-124",
        amount: 25000,
        phoneNumber: phoneNumber || "+226 75 56 78 90",
        paymentMethod: "moov_money",
      });
      res.json(result);
    } catch (error) {
      console.error("Moov Money test error:", error);
      res.status(500).json({ error: "Moov Money test failed" });
    }
  });

  app.post("/api/test/payments/cash-on-delivery", async (req, res) => {
    try {
      const paymentService = PaymentServiceFactory.getService("cash_on_delivery");
      const result = await paymentService.initiatePayment({
        orderId: "test-order-125",
        amount: 25000,
        phoneNumber: "",
        paymentMethod: "cash_on_delivery",
      });
      res.json(result);
    } catch (error) {
      console.error("Cash on delivery test error:", error);
      res.status(500).json({ error: "Cash on delivery test failed" });
    }
  });

  app.get("/api/test/payments/:paymentId/status", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const transactionId = paymentId;

      // Determine payment method from transaction ID prefix
      let paymentMethod: "orange_money" | "moov_money" | "cash_on_delivery";
      if (transactionId.startsWith("OM_")) {
        paymentMethod = "orange_money";
      } else if (transactionId.startsWith("MM_")) {
        paymentMethod = "moov_money";
      } else {
        paymentMethod = "cash_on_delivery";
      }

      const paymentService = PaymentServiceFactory.getService(paymentMethod);
      const status = await paymentService.checkPaymentStatus(transactionId);
      res.json(status);
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Payment status check failed" });
    }
  });

  // Real Payment API Routes
  app.post("/api/payments/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, paymentMethod, phoneNumber } = req.body;
      const userId = req.user.claims.sub;

      // Validate order exists and belongs to user
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Commande introuvable" });
      }

      if (order.status !== "pending") {
        return res.status(400).json({ error: "Cette commande ne peut plus être payée" });
      }

      // Get payment service
      const paymentService = PaymentServiceFactory.getService(paymentMethod);

      // Initiate payment
      const paymentResult = await paymentService.initiatePayment({
        orderId,
        amount: toMajorUnit(order.totalAmount),
        phoneNumber: phoneNumber || "",
        paymentMethod,
      });

      if (!paymentResult.success) {
        return res.status(400).json({ error: paymentResult.message });
      }

      // Store payment record
      const payment = await storage.createPayment({
        orderId,
        amount: order.totalAmount,
        paymentMethod,
        status: "pending",
        transactionId: paymentResult.transactionId!,
        operatorReference: paymentResult.operatorReference,
        phoneNumber: phoneNumber || null,
        expiresAt: paymentResult.expiresAt || null,
      });

      res.json({
        success: true,
        paymentId: payment.id,
        transactionId: paymentResult.transactionId,
        message: paymentResult.message,
        expiresAt: paymentResult.expiresAt,
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ error: "Erreur lors de l'initiation du paiement" });
    }
  });

  app.get("/api/payments/:paymentId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.claims.sub;

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Paiement introuvable" });
      }

      // Verify order belongs to user
      const order = await storage.getOrder(payment.orderId);
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      // Check real payment status
      const paymentService = PaymentServiceFactory.getService(
        payment.paymentMethod as "orange_money" | "moov_money" | "cash_on_delivery"
      );
      const statusResult = await paymentService.checkPaymentStatus(payment.transactionId || "");

      // Update payment status if changed
      if (statusResult.status !== payment.status) {
        await storage.updatePaymentStatus(
          paymentId,
          statusResult.status,
          statusResult.failureReason || undefined
        );

        // Update order status if payment completed
        if (statusResult.status === "completed" && order.status === "pending") {
          await storage.updateOrderStatus(order.id, "confirmed");
        }
      }

      res.json({
        status: statusResult.status,
        transactionId: payment.transactionId,
        operatorReference: statusResult.operatorReference,
        failureReason: statusResult.failureReason,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Erreur lors de la vérification du statut" });
    }
  });

  // Orange Money Webhook Handlers
  app.post("/api/payments/orange-money/notify", async (req, res) => {
    try {
      const { txnid, status, reference } = req.body;

      console.log("Orange Money notification received:", req.body);

      // Find payment by transaction reference
      const payments = await storage.getOrderPayments(reference);
      const payment = payments.find((p) => p.transactionId === reference);

      if (!payment) {
        console.warn("Payment not found for Orange Money notification:", reference);
        return res.status(404).send("Payment not found");
      }

      // Update payment status
      let paymentStatus: "pending" | "completed" | "failed" = "pending";
      if (status === "SUCCESS" || status === "SUCCESSFUL") {
        paymentStatus = "completed";
      } else if (status === "FAILED" || status === "FAILURE") {
        paymentStatus = "failed";
      }

      await storage.updatePaymentStatus(payment.id, paymentStatus);
      await storage.updatePaymentTransaction(payment.id, reference, txnid);

      // Update order status if payment completed
      if (paymentStatus === "completed") {
        await storage.updateOrderStatus(payment.orderId, "confirmed");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Orange Money notification error:", error);
      res.status(500).send("Error");
    }
  });

  app.get("/api/payments/orange-money/callback", async (req, res) => {
    try {
      const { reference, status } = req.query;

      // Redirect to order status page with payment result
      const redirectUrl =
        status === "SUCCESS"
          ? `/orders/${reference}?payment=success`
          : `/orders/${reference}?payment=failed`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Orange Money callback error:", error);
      res.redirect("/orders?payment=error");
    }
  });

  app.get("/api/payments/orange-money/cancel", async (req, res) => {
    try {
      const { reference } = req.query;
      res.redirect(`/orders/${reference}?payment=cancelled`);
    } catch (error) {
      console.error("Orange Money cancel error:", error);
      res.redirect("/orders?payment=error");
    }
  });

  // Moov Money Webhook Handlers
  app.post("/api/payments/moov-money/callback", async (req, res) => {
    try {
      const { reference, status, transactionId } = req.body;

      console.log("Moov Money notification received:", req.body);

      // Find payment by transaction reference
      const payments = await storage.getOrderPayments(reference);
      const payment = payments.find((p) => p.transactionId === reference);

      if (!payment) {
        console.warn("Payment not found for Moov Money notification:", reference);
        return res.status(404).send("Payment not found");
      }

      // Update payment status
      let paymentStatus: "pending" | "completed" | "failed" = "pending";
      if (status === "SUCCESSFUL" || status === "COMPLETED") {
        paymentStatus = "completed";
      } else if (status === "FAILED" || status === "REJECTED") {
        paymentStatus = "failed";
      }

      await storage.updatePaymentStatus(payment.id, paymentStatus);
      await storage.updatePaymentTransaction(payment.id, reference, transactionId);

      // Update order status if payment completed
      if (paymentStatus === "completed") {
        await storage.updateOrderStatus(payment.orderId, "confirmed");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Moov Money notification error:", error);
      res.status(500).send("Error");
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get additional role-specific data
      let roleData = null;
      if (user.role === "vendor") {
        roleData = await storage.getVendorByUserId(userId);
      } else if (user.role === "driver") {
        roleData = await storage.getDriverByUserId(userId);
      }

      res.json({ ...user, roleData });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/setup-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let setupStatus = {
        hasVendorProfile: false,
        hasDriverProfile: false,
        vendorStatus: null,
        driverStatus: null,
      };

      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        setupStatus.hasVendorProfile = !!vendor;
        setupStatus.vendorStatus = (vendor?.status as any) || null;
      } else if (user.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        setupStatus.hasDriverProfile = !!driver;
        setupStatus.driverStatus = (driver?.status as any) || null;
      }

      res.json(setupStatus);
    } catch (error) {
      console.error("Error fetching setup status:", error);
      res.status(500).json({ message: "Failed to fetch setup status" });
    }
  });

  // User role management
  app.post("/api/auth/set-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!["customer", "vendor", "driver"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin user management - only for admins to promote other users
  app.post("/api/admin/promote-user", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);

      // Only existing admins can promote users
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can promote users" });
      }

      const { userId, role } = req.body;

      if (!["customer", "vendor", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json({
        message: `User promoted to ${role} successfully`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Emergency admin creation - only works if no admins exist
  app.post("/api/admin/emergency-create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Check if any admin users already exist
      const existingAdmins = await storage.getUsersByRole("admin");
      if (existingAdmins.length > 0) {
        return res.status(403).json({
          message: "Admin users already exist. Contact an existing admin for promotion.",
        });
      }

      // Make the current user an admin
      const updatedUser = await storage.updateUserRole(userId, "admin");
      res.json({
        message: "Emergency admin created successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error creating emergency admin:", error);
      res.status(500).json({ message: "Failed to create emergency admin" });
    }
  });

  // Vendor routes
  app.post("/api/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const vendorData = insertVendorSchema.parse({ ...req.body, userId });

      const vendor = await storage.createVendor(vendorData);

      // IMPORTANT: Protect admin users from losing admin role
      if (user?.role === "admin") {
        console.log("Admin created vendor record for testing, keeping admin role");
        // Admin keeps their admin role even with vendor record
      } else {
        // Regular users become vendors
        await storage.updateUserRole(userId, "vendor");
      }

      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get("/api/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { status } = req.query;
      const vendors = await storage.getVendors(status as any);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.patch("/api/vendors/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status } = req.body;

      const vendor = await storage.updateVendorStatus(id, status);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor status:", error);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });

  // Admin driver management routes
  app.get("/api/drivers", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { status } = req.query;
      const drivers = await storage.getDrivers(status as any);
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.patch("/api/drivers/:id/approval-status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status } = req.body;

      const driver = await storage.updateDriverApprovalStatus(id, status);
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver approval status:", error);
      res.status(500).json({ message: "Failed to update driver approval status" });
    }
  });

  // Driver routes
  app.post("/api/drivers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const driverData = insertDriverSchema.parse({ ...req.body, userId });

      const driver = await storage.createDriver(driverData);

      // IMPORTANT: Protect admin users from losing admin role
      if (user?.role === "admin") {
        console.log("Admin created driver record for testing, keeping admin role");
        // Admin keeps their admin role even with driver record
      } else {
        // Regular users become drivers
        await storage.updateUserRole(userId, "driver");
      }

      res.json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.get("/api/drivers/available", async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  app.patch("/api/drivers/:id/location", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;

      const driver = await storage.updateDriverLocation(id, lat, lng);
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({ message: "Failed to update driver location" });
    }
  });

  app.patch("/api/drivers/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isOnline } = req.body;

      const driver = await storage.updateDriverStatus(id, isOnline);
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { name, description, slug } = req.body;
      const category = await storage.createCategory({
        id: slug || name.toLowerCase().replace(/\s+/g, "-"),
        name,
        description,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Product routes
  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can create products" });
      }

      const productData = insertProductSchema.parse({ ...req.body, vendorId: vendor.id });
      const product = await storage.createProduct(productData);

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const {
        vendorId,
        categoryId,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
        page,
        pageSize,
        minPrice,
        maxPrice,
        inStock,
        tags,
      } = req.query;

      // Support both offset and page-based pagination
      const effectiveLimit = limit
        ? parseInt(limit as string)
        : pageSize
          ? parseInt(pageSize as string)
          : 20;
      const effectiveOffset = offset
        ? parseInt(offset as string)
        : page
          ? (parseInt(page as string) - 1) * effectiveLimit
          : 0;

      // Parse price filters
      const parsedMinPrice = minPrice ? parseFloat(minPrice as string) : undefined;
      const parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;

      // Parse boolean filters
      const parsedInStock = inStock === "true" ? true : inStock === "false" ? false : undefined;

      // Parse tags array
      const parsedTags = tags
        ? typeof tags === "string"
          ? [tags]
          : (tags as string[])
        : undefined;

      const result = await storage.getProducts({
        vendorId: vendorId as string,
        categoryId: categoryId as string,
        search: search as string,
        limit: effectiveLimit,
        offset: effectiveOffset,
        sortBy: sortBy as "price" | "createdAt" | "name" | "rating" | undefined,
        sortOrder: sortOrder as "asc" | "desc" | undefined,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        inStock: parsedInStock,
        tags: parsedTags,
      });

      // Return paginated response with metadata
      res.json({
        items: result.items,
        total: result.total,
        hasMore: result.hasMore,
        page: page ? parseInt(page as string) : Math.floor(effectiveOffset / effectiveLimit) + 1,
        pageSize: effectiveLimit,
        totalPages: Math.ceil(result.total / effectiveLimit),
        filters: {
          appliedFilters: {
            search: search || null,
            categoryId: categoryId || null,
            vendorId: vendorId || null,
            priceRange:
              parsedMinPrice || parsedMaxPrice
                ? { min: parsedMinPrice, max: parsedMaxPrice }
                : null,
            inStock: parsedInStock,
            sortBy: sortBy || "createdAt",
            sortOrder: sortOrder || "desc",
          },
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can update products" });
      }

      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Cart routes
  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = insertCartSchema.parse({ ...req.body, userId });

      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const cartItem = await storage.updateCartItem(id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, ...orderData } = req.body;

      const order = await storage.createOrder({ ...orderData, customerId: userId }, items);

      // Clear cart after successful order
      await storage.clearCart(userId);

      // Send email notifications asynchronously
      setTimeout(async () => {
        try {
          // Get customer and vendor information for notifications
          const customer = await storage.getUser(userId);
          const vendor = await storage.getVendor(order.vendorId);
          const vendorUser = vendor ? await storage.getUser(vendor.userId) : null;

          // Get order items with product details
          const orderItems = await storage.getOrderItemsByOrderId(order.id);
          const itemsWithDetails = await Promise.all(
            orderItems.map(async (item: any) => {
              const product = await storage.getProduct(item.productId);
              return {
                productName: product?.name || "Produit",
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice || (parseFloat(item.price) * item.quantity).toString(),
              };
            })
          );

          const notificationData = {
            order: {
              ...order,
              customer,
              vendor: vendorUser
                ? { ...vendorUser, businessName: vendor?.businessName }
                : undefined,
              items: itemsWithDetails,
            },
          };

          // Send order confirmation to customer
          if (customer?.email) {
            await orderNotificationService.sendOrderConfirmation(notificationData);
          }

          // Send new order notification to vendor
          if (vendorUser?.email) {
            await orderNotificationService.sendVendorOrderNotification(notificationData);
          }
        } catch (emailError) {
          console.error("Error sending order confirmation emails:", emailError);
          // Don't fail the order creation if email fails
        }
      }, 100); // Small delay to ensure response is sent first

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);

      // Check if it's an inventory error
      if (error instanceof Error) {
        if (error.message.includes("Insufficient stock")) {
          return res.status(400).json({
            message: error.message,
            type: "INSUFFICIENT_STOCK",
          });
        }
        if (error.message.includes("not found")) {
          return res.status(404).json({
            message: error.message,
            type: "PRODUCT_NOT_FOUND",
          });
        }
      }

      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status } = req.query;

      let filters: any = { status };

      if (user?.role === "customer") {
        filters.customerId = userId;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        filters.vendorId = vendor?.id;
      } else if (user?.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        filters.driverId = driver?.id;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/my-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersWithDetails(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      const order = await storage.updateOrderStatus(id, status);

      // Send status update notification asynchronously
      setTimeout(async () => {
        try {
          const customer = await storage.getUser(order.customerId);
          const vendor = await storage.getVendor(order.vendorId);
          const vendorUser = vendor ? await storage.getUser(vendor.userId) : null;

          const notificationData = {
            order: {
              ...order,
              customer,
              vendor: vendorUser
                ? { ...vendorUser, businessName: vendor?.businessName }
                : undefined,
            },
          };

          if (customer?.email) {
            await orderNotificationService.sendStatusUpdate(notificationData, status, message);
          }
        } catch (emailError) {
          console.error("Error sending status update email:", emailError);
        }
      }, 100);

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch("/api/orders/:id/assign-driver", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;

      const order = await storage.assignOrderToDriver(id, driverId);
      res.json(order);
    } catch (error) {
      console.error("Error assigning driver to order:", error);
      res.status(500).json({ message: "Failed to assign driver to order" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, userId });

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getProductReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ message: "Failed to fetch product reviews" });
    }
  });

  // Categories and search endpoints
  app.get("/api/categories", async (req, res) => {
    try {
      const withCount = req.query.withCount === "true";

      const categories = withCount
        ? await storage.getCategoriesWithProductCount()
        : await storage.getCategories();

      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string" || q.length < 2) {
        return res.json({ suggestions: [] });
      }

      // Search for product names and categories that match the query
      const productSuggestions = await storage.getProducts({
        search: q,
        limit: 5,
      });

      const categorySuggestions = await storage.getCategories();
      const matchingCategories = categorySuggestions
        .filter((cat: any) => cat.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 3);

      const suggestions = [
        ...productSuggestions.items.map((product: any) => ({
          type: "product",
          id: product.id,
          text: product.name,
          category: product.categoryId,
          price: product.price,
        })),
        ...matchingCategories.map((category: any) => ({
          type: "category",
          id: category.id,
          text: category.name,
          description: category.description,
        })),
      ].slice(0, 8);

      res.json({ suggestions });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  app.get("/api/search/popular", async (req, res) => {
    try {
      const popularTerms = await storage.getPopularSearchTerms();
      res.json(popularTerms);
    } catch (error) {
      console.error("Error fetching popular search terms:", error);
      res.status(500).json({ message: "Failed to fetch popular terms" });
    }
  });

  // Inventory management routes
  app.get("/api/inventory/low-stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;

      if (user?.role !== "vendor" && user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      let products;
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }
        // Filter by vendor's products only
        products = await storage.getLowStockProducts(threshold);
        products = products.filter((p: any) => p.vendorId === vendor.id);
      } else {
        // Admin can see all low stock products
        products = await storage.getLowStockProducts(threshold);
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/inventory/out-of-stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "vendor" && user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      let products;
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }
        products = await storage.getOutOfStockProducts();
        products = products.filter((p: any) => p.vendorId === vendor.id);
      } else {
        products = await storage.getOutOfStockProducts();
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching out of stock products:", error);
      res.status(500).json({ message: "Failed to fetch out of stock products" });
    }
  });

  app.put("/api/products/:id/stock", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "vendor" && user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate quantity
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      // If vendor, verify they own the product
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        const product = await storage.getProduct(id);

        if (!vendor || !product || product.vendorId !== vendor.id) {
          return res.status(404).json({ message: "Product not found or access denied" });
        }
      }

      const updatedProduct = await storage.updateProductStock(id, quantity, reason);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ message: "Failed to update product stock" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/vendor/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getVendorStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  app.get("/api/analytics/driver/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getDriverStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching driver stats:", error);
      res.status(500).json({ message: "Failed to fetch driver stats" });
    }
  });

  app.get("/api/analytics/admin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Chat routes
  app.get("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRooms = await storage.getUserChatRooms(userId);
      res.json(chatRooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.post("/api/chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds, name } = req.body;

      const chatRoom = await storage.createChatRoom({
        name,
        type: participantIds.length > 1 ? "group" : "direct",
        createdBy: userId,
      });

      // Add creator as participant
      await storage.addChatParticipant({
        chatRoomId: chatRoom.id,
        userId,
      });

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await storage.addChatParticipant({
            chatRoomId: chatRoom.id,
            userId: participantId,
          });
        }
      }

      res.json(chatRoom);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  app.get("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Check if user is participant
      const isParticipant = await storage.isUserInChatRoom(userId, roomId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getChatMessages(roomId, parseInt(limit), parseInt(offset));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/rooms/:roomId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roomId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatRoomId: roomId,
        senderId: userId,
      });

      // Check if user is participant
      const isParticipant = await storage.isUserInChatRoom(userId, roomId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied" });
      }

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json([]);
      }

      const users = await storage.searchUsers(q as string);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/chat/rooms/:roomId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roomId } = req.params;

      await storage.markMessagesAsRead(userId, roomId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadCount = await storage.getTotalUnreadCount(userId);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Phone authentication routes
  app.post("/api/auth/phone-signup", async (req, res) => {
    try {
      const { firstName, lastName, phone, password, operator, role } = req.body;

      // Validate Burkina Faso phone number format
      if (!phone || !phone.startsWith("+226") || phone.length !== 12) {
        return res
          .status(400)
          .json({ message: "Format de téléphone invalide. Utilisez +226XXXXXXXX" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message:
            passwordValidation.message ||
            "Le mot de passe ne respecte pas les critères de sécurité",
        });
      }

      // Check if phone already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ message: "Ce numéro de téléphone est déjà utilisé" });
      }

      // Generate verification code
      const verificationCode = randomInt(100000, 999999).toString();

      // Store user data temporarily and create verification record
      await storage.createPhoneVerification({
        phone,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Store pending user data (in production, you'd store this in a temporary table)
      await storage.storePendingUser({
        phone,
        firstName,
        lastName,
        phoneOperator: operator,
        role,
        password: hashedPassword,
      });

      // Send verification SMS
      try {
        const { smsService } = await import("./smsService");
        await smsService.sendVerificationSMS(phone, verificationCode, firstName);
      } catch (smsError) {
        console.error("SMS sending failed, falling back to console:", smsError);
        console.log(`SMS Verification Code for ${phone}: ${verificationCode}`);
      }

      res.json({ message: "Code de vérification envoyé", phone });
    } catch (error) {
      console.error("Error in phone signup:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/verify-phone", async (req, res) => {
    try {
      const { phone, code } = req.body;

      // Verify the code
      const verification = await storage.verifyPhoneCode(phone, code);
      if (!verification) {
        return res.status(400).json({ message: "Code incorrect ou expiré" });
      }

      // Get pending user data
      const pendingUser = await storage.getPendingUser(phone);
      if (!pendingUser) {
        return res.status(400).json({ message: "Données d'utilisateur introuvables" });
      }

      // Create the user
      const user = await storage.createUserWithPhone({
        ...(pendingUser as any),
        phone,
        phoneVerified: true,
      });

      // Mark verification as used
      await storage.markPhoneVerificationUsed(verification.id);

      // Clean up pending user data
      await storage.deletePendingUser(phone);

      res.json({ message: "Compte créé avec succès", user: { id: user.id, phone: user.phone } });
    } catch (error) {
      console.error("Error in phone verification:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  app.post("/api/auth/phone-login", async (req, res) => {
    try {
      const { phone } = req.body;

      // Check if user exists
      const user = await storage.getUserByPhone(phone);
      if (!user || !user.phoneVerified) {
        return res.status(400).json({ message: "Utilisateur non trouvé ou téléphone non vérifié" });
      }

      // Generate login code
      const loginCode = randomInt(100000, 999999).toString();

      await storage.createPhoneVerification({
        phone,
        code: loginCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Send login SMS
      try {
        const { smsService } = await import("./smsService");
        await smsService.sendLoginSMS(phone, loginCode);
      } catch (smsError) {
        console.error("SMS sending failed, falling back to console:", smsError);
        console.log(`SMS Login Code for ${phone}: ${loginCode}`);
      }

      res.json({ message: "Code de connexion envoyé", phone });
    } catch (error) {
      console.error("Error in phone login:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  // Email authentication routes
  app.post("/api/auth/email-signup", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      // Validate email format
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Format d'email invalide" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message:
            passwordValidation.message ||
            "Le mot de passe ne respecte pas les critères de sécurité",
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Cette adresse email est déjà utilisée" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Generate verification code
      const verificationCode = randomInt(100000, 999999).toString();

      // Store email verification record
      await storage.createEmailVerification({
        email,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Store pending user data with hashed password
      await storage.storePendingUser({
        email,
        firstName,
        lastName,
        role,
        password: hashedPassword,
      });

      // Send verification email
      try {
        const { emailService } = await import("./emailService");
        await emailService.sendVerificationEmail(email, verificationCode, firstName);
      } catch (emailError) {
        console.error("Email sending failed, falling back to console:", emailError);
        console.log(`Email Verification Code for ${email}: ${verificationCode}`);
      }

      res.json({ message: "Code de vérification envoyé", email });
    } catch (error) {
      console.error("Error in email signup:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;

      // Verify the code
      const verification = await storage.verifyEmailCode(email, code);
      if (!verification) {
        return res.status(400).json({ message: "Code incorrect ou expiré" });
      }

      // Get pending user data
      const pendingUser = await storage.getPendingUser(email);
      if (!pendingUser) {
        return res.status(400).json({ message: "Données d'utilisateur introuvables" });
      }

      // Create the user
      const user = await storage.createUserWithEmail({
        ...(pendingUser as any),
        email,
      });

      // Mark verification as used
      await storage.markEmailVerificationUsed(verification.id);

      // Clean up pending user data
      await storage.deletePendingUser(email);

      // Send welcome email
      try {
        const { emailService } = await import("./emailService");
        await emailService.sendWelcomeEmail(user.email!, user.firstName || "");
      } catch (emailError) {
        console.error("Welcome email sending failed:", emailError);
      }

      // Establish session for the new user (simulate login)
      const userSession = {
        claims: { sub: user.id },
        isAuthenticated: true,
      };

      // Set up session similar to how Replit auth does it
      (req as any).user = userSession;
      if (req.session) {
        (req.session as any).user = userSession;
      }

      res.json({ message: "Compte créé avec succès", user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Error in email verification:", error);
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Object Storage Routes for Product Images

  // Serve public objects (product images)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (with authentication and ACL check)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Image upload endpoint using Cloudinary
  app.post("/api/upload/image", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      console.log("📤 Image upload request received");
      console.log("Session user:", req.session?.user?.id);
      console.log("File received:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");

      if (!req.file) {
        console.error("❌ No file in request");
        return res.status(400).json({ error: "No image file provided" });
      }

      // Check if Cloudinary is configured
      if (!CloudinaryService.isConfigured()) {
        console.error("❌ Cloudinary not configured");
        return res.status(500).json({
          error: "Image storage not configured. Please set CLOUDINARY environment variables.",
        });
      }

      console.log(`📸 Uploading image to Cloudinary: ${req.file.originalname}`);

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadImage(req.file.buffer, {
        folder: "zakamall/products",
        public_id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      console.log("✅ Image uploaded successfully to Cloudinary:", result.secure_url);

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({
        error: "Failed to upload image",
        details: error.message,
      });
    }
  });

  // Legacy endpoint for compatibility with existing uploader component
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      console.log("📤 Legacy upload parameters request received");

      // Check if Cloudinary is configured
      if (!CloudinaryService.isConfigured()) {
        console.error("❌ Cloudinary not configured");
        return res.status(500).json({
          error: "Image storage not configured. Please configure Cloudinary.",
        });
      }

      // Return our image upload endpoint URL with proper Uppy-compatible format
      const uploadUrl = `${req.protocol}://${req.get("host")}/api/upload/image`;

      console.log("📸 Generated Cloudinary upload URL:", uploadUrl);

      // Return format that Uppy expects
      res.json({
        uploadURL: uploadUrl,
        method: "POST",
        fields: {},
        headers: {},
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Vendor-specific routes
  app.get("/api/vendor/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can access stats" });
      }

      const stats = await storage.getVendorStats(vendor.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  app.get("/api/vendor/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can access products" });
      }

      const products = await storage.getProducts({ vendorId: vendor.id });
      res.json(products);
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      res.status(500).json({ message: "Failed to fetch vendor products" });
    }
  });

  app.post("/api/vendor/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can create products" });
      }

      const productData = insertProductSchema.parse({ ...req.body, vendorId: vendor.id });
      const product = await storage.createProduct(productData);

      res.json(product);
    } catch (error) {
      console.error("Error creating vendor product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/vendor/products/low-stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can access low stock data" });
      }

      const products = await storage.getVendorLowStockProducts(vendor.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/vendor/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can access products" });
      }

      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if product belongs to this vendor
      if (product.vendorId !== vendor.id) {
        return res.status(403).json({ message: "Product does not belong to this vendor" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching vendor product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put("/api/vendor/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can update products" });
      }

      const product = await storage.getProduct(id);
      if (!product || product.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Product not found or access denied" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating vendor product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.patch("/api/vendor/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can update products" });
      }

      const product = await storage.getProduct(id);
      if (!product || product.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Product not found or access denied" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating vendor product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/vendor/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can delete products" });
      }

      const product = await storage.getProduct(id);
      if (!product || product.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Product not found or access denied" });
      }

      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/vendor/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can access orders" });
      }

      const { status, limit } = req.query;
      const filters: any = { vendorId: vendor.id };
      if (status && status !== "all") {
        filters.status = status;
      }

      const orders = await storage.getOrders(filters);

      // Apply limit if specified
      const limitedOrders = limit ? orders.slice(0, parseInt(limit as string)) : orders;

      res.json(limitedOrders);
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      res.status(500).json({ message: "Failed to fetch vendor orders" });
    }
  });

  app.patch("/api/vendor/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      const vendor = await storage.getVendorByUserId(userId);

      if (!vendor) {
        return res.status(403).json({ message: "Only vendors can update order status" });
      }

      const order = await storage.getOrder(id);
      if (!order || order.vendorId !== vendor.id) {
        return res.status(404).json({ message: "Order not found or access denied" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, status);

      // Create notification for customer about order status change
      try {
        await storage.createOrderStatusNotification(
          order.customerId,
          order.id,
          status,
          order.orderNumber
        );
      } catch (notificationError) {
        console.error("Error creating order status notification:", notificationError);
        // Don't fail the request if notification fails
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Driver assignment and tracking routes
  app.post("/api/orders/:id/assign-driver", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only admins or vendors can assign drivers
      if (user?.role !== "admin" && user?.role !== "vendor") {
        return res.status(403).json({ message: "Unauthorized to assign drivers" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If vendor, verify they own the order
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        if (!vendor || order.vendorId !== vendor.id) {
          return res.status(403).json({ message: "Order not found or access denied" });
        }
      }

      const updatedOrder = await storage.assignOrderToDriver(id, driverId);
      await storage.updateOrderStatus(id, "in_transit");

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error assigning driver:", error);
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  app.post("/api/orders/auto-assign", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin" && user?.role !== "vendor") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get available drivers
      const availableDrivers = await storage.getAvailableDrivers();
      if (availableDrivers.length === 0) {
        return res.status(400).json({ message: "No available drivers" });
      }

      // Simple assignment: pick the first available driver
      const assignedDriver = availableDrivers[0];
      const updatedOrder = await storage.assignOrderToDriver(orderId, assignedDriver.id);
      await storage.updateOrderStatus(orderId, "in_transit");

      res.json({ order: updatedOrder, driver: assignedDriver });
    } catch (error) {
      console.error("Error auto-assigning driver:", error);
      res.status(500).json({ message: "Failed to auto-assign driver" });
    }
  });

  // Driver-specific routes
  app.get("/api/driver/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const driver = await storage.getDriverByUserId(userId);

      if (!driver) {
        return res.status(403).json({ message: "Only drivers can access driver orders" });
      }

      const orders = await storage.getOrders({ driverId: driver.id });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching driver orders:", error);
      res.status(500).json({ message: "Failed to fetch driver orders" });
    }
  });

  app.get("/api/driver/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const driver = await storage.getDriverByUserId(userId);

      if (!driver) {
        return res.status(403).json({ message: "Only drivers can access driver stats" });
      }

      const stats = await storage.getDriverStats(driver.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching driver stats:", error);
      res.status(500).json({ message: "Failed to fetch driver stats" });
    }
  });

  app.patch("/api/driver/location", isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lng } = req.body;
      const userId = req.user.claims.sub;
      const driver = await storage.getDriverByUserId(userId);

      if (!driver) {
        return res.status(403).json({ message: "Only drivers can update location" });
      }

      const updatedDriver = await storage.updateDriverLocation(driver.id, lat, lng);
      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.patch("/api/driver/status", isAuthenticated, async (req: any, res) => {
    try {
      const { isOnline } = req.body;
      const userId = req.user.claims.sub;
      const driver = await storage.getDriverByUserId(userId);

      if (!driver) {
        return res.status(403).json({ message: "Only drivers can update status" });
      }

      const updatedDriver = await storage.updateDriverStatus(driver.id, isOnline);
      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Customer order tracking
  app.get("/api/customer/orders/:id/tracking", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const order = await storage.getOrder(id);
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ message: "Order not found or access denied" });
      }

      // Get order details with driver info if assigned
      let driverInfo = null;
      if (order.driverId) {
        driverInfo = await storage.getDriver(order.driverId);
      }

      res.json({
        order,
        driver: driverInfo,
        trackingHistory: await storage.getOrderTrackingHistory(id),
      });
    } catch (error) {
      console.error("Error fetching order tracking:", error);
      res.status(500).json({ message: "Failed to fetch order tracking" });
    }
  });

  // Admin routes
  app.get("/api/admin/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard" });
    }
  });

  app.get("/api/admin/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get query parameters for filtering
      const { status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

      // For now, return mock data structure until payment system is fully implemented
      // This prevents 404 errors in the admin dashboard
      const transactionData = {
        transactions: [], // Empty array for now since payment system is in development
        total: 0,
      };

      res.json(transactionData);
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/admins", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
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
      const { id } = req.params;
      const { role } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!["customer", "vendor", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from deleting themselves
      if (id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin create user endpoint
  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, phone, role = "customer" } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          message: "Email, password, first name, and last name are required",
        });
      }

      if (!["customer", "vendor", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        phoneVerified: phone ? true : false, // Admin-created users with phone are pre-verified
      });

      // Don't return password hash
      const { password: _, ...safeUser } = newUser;
      res.json({
        message: "User created successfully",
        user: safeUser,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Super Admin Profile Settings - Only for main admin (security restricted)
  app.get("/api/admin/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // SECURITY: Only the main admin with specific email can access
      if (user?.role !== "admin" || user?.email !== "simporefabrice15@gmail.com") {
        return res.status(403).json({ message: "Unauthorized - Main admin access only" });
      }

      // Return user profile (without password)
      const { password, ...safeProfile } = user;
      res.json(safeProfile);
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/admin/profile", isAuthenticated, async (req: any, res) => {
    try {
      const { firstName, lastName, email, currentPassword, newPassword } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // SECURITY: Only the main admin with specific email can update
      if (user?.role !== "admin" || user?.email !== "simporefabrice15@gmail.com") {
        return res.status(403).json({ message: "Unauthorized - Main admin access only" });
      }

      // Validate current password if changing password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password required to change password" });
        }

        const isValidPassword = await verifyPassword(currentPassword, user.password!);
        if (!isValidPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Check if new email is already taken (unless it's the same email)
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (newPassword) {
        updateData.password = await hashPassword(newPassword);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, updateData);

      // Return updated profile (without password)
      const { password, ...safeProfile } = updatedUser;
      res.json({ message: "Profile updated successfully", user: safeProfile });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update product images after upload
  app.put("/api/products/:productId/images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURLs || !Array.isArray(req.body.imageURLs)) {
      return res.status(400).json({ error: "imageURLs array is required" });
    }

    const userId = req.user?.claims?.sub;
    const productId = req.params.productId;

    try {
      // Verify user owns this product (vendors only)
      const user = await storage.getUser(userId);
      if (!user || user.role !== "vendor") {
        return res.status(403).json({ error: "Only vendors can update product images" });
      }

      const product = await storage.getProductById(productId);
      if (!product || product.vendorId !== userId) {
        return res.status(404).json({ error: "Product not found or not owned by user" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPaths: string[] = [];

      // Process each uploaded image
      for (const imageURL of req.body.imageURLs) {
        try {
          const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(imageURL, {
            owner: userId,
            visibility: "public", // Product images are public
          });
          normalizedPaths.push(objectPath);
        } catch (error) {
          console.error("Error setting ACL for image:", error);
          // Continue processing other images
        }
      }

      // Update product with new image paths
      await storage.updateProductImages(productId, normalizedPaths);

      res.status(200).json({
        message: "Product images updated successfully",
        imagePaths: normalizedPaths,
      });
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment Routes

  // Initiate payment
  app.post("/api/payments/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, paymentMethod, phoneNumber } = req.body;
      const userId = req.user?.claims?.sub;

      if (!orderId || !paymentMethod) {
        return res.status(400).json({ error: "Order ID and payment method are required" });
      }

      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }

      // Phone number is required for mobile money payments
      if ((paymentMethod === "orange_money" || paymentMethod === "moov_money") && !phoneNumber) {
        return res
          .status(400)
          .json({ error: "Phone number is required for mobile money payments" });
      }

      // Create payment record
      const payment = await storage.createPayment({
        orderId,
        paymentMethod,
        amount: order.totalAmount,
        currency: order.currency || "CFA",
        phoneNumber: phoneNumber || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Initiate payment with payment service
      const paymentService = PaymentServiceFactory.getService(paymentMethod);
      const result = await paymentService.initiatePayment({
        orderId,
        amount: toMajorUnit(order.totalAmount),
        phoneNumber: phoneNumber || "",
        paymentMethod,
      });

      if (result.success) {
        // Update payment with transaction details
        await storage.updatePaymentTransaction(
          payment.id,
          result.transactionId!,
          result.operatorReference
        );

        // Update order payment method and status
        await storage.updateOrderStatus(orderId, "confirmed");

        res.json({
          success: true,
          paymentId: payment.id,
          transactionId: result.transactionId,
          message: result.message,
          expiresAt: result.expiresAt,
        });
      } else {
        // Update payment status to failed
        await storage.updatePaymentStatus(payment.id, "failed", result.message);

        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // Check payment status
  app.get("/api/payments/:paymentId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.claims?.sub;

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Verify payment belongs to user's order
      const order = await storage.getOrder(payment.orderId);
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check status with payment service if still pending
      if (payment.status === "pending" && payment.transactionId) {
        const paymentService = PaymentServiceFactory.getService(payment.paymentMethod);
        const statusResult = await paymentService.checkPaymentStatus(payment.transactionId);

        // Update payment status if changed
        if (statusResult.status !== payment.status) {
          await storage.updatePaymentStatus(
            paymentId,
            statusResult.status,
            statusResult.failureReason
          );

          // Update order payment status
          if (statusResult.status === "completed") {
            await storage.updateOrderStatus(order.id, "preparing");
          }
        }

        res.json({
          status: statusResult.status,
          transactionId: payment.transactionId,
          operatorReference: payment.operatorReference,
          failureReason: statusResult.failureReason,
        });
      } else {
        res.json({
          status: payment.status,
          transactionId: payment.transactionId,
          operatorReference: payment.operatorReference,
          failureReason: payment.failureReason,
        });
      }
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Get order payments
  app.get("/api/orders/:orderId/payments", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.claims?.sub;

      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }

      const payments = await storage.getOrderPayments(orderId);
      res.json(payments);
    } catch (error) {
      console.error("Get order payments error:", error);
      res.status(500).json({ error: "Failed to get order payments" });
    }
  });

  // Payment webhooks (for production integration)
  app.post("/api/payments/orange-money/notify", async (req, res) => {
    try {
      // Handle Orange Money webhook notification
      console.log("Orange Money webhook:", req.body);
      res.status(200).json({ status: "received" });
    } catch (error) {
      console.error("Orange Money webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.post("/api/payments/moov-money/callback", async (req, res) => {
    try {
      // Handle Moov Money callback
      console.log("Moov Money callback:", req.body);
      res.status(200).json({ status: "received" });
    } catch (error) {
      console.error("Moov Money callback error:", error);
      res.status(500).json({ error: "Callback processing failed" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = await storage.getUserNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // If notifications table doesn't exist, return empty array instead of error
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        console.warn(
          "Notifications table not found, returning empty array. Run db:migrate:prod to create the table."
        );
        res.json([]);
        return;
      }
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      // If notifications table doesn't exist, return count of 0
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        console.warn(
          "Notifications table not found, returning count 0. Run db:migrate:prod to create the table."
        );
        res.json({ count: 0 });
        return;
      }
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // If notifications table doesn't exist, return success anyway
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        console.warn(
          "Notifications table not found, ignoring mark as read. Run db:migrate:prod to create the table."
        );
        res.json({ success: true });
        return;
      }
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // If notifications table doesn't exist, return success anyway
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        console.warn(
          "Notifications table not found, ignoring mark all as read. Run db:migrate:prod to create the table."
        );
        res.json({ success: true });
        return;
      }
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store connected clients with user info
  const clients = new Map<string, { ws: WebSocket; userId: string }>();

  wss.on("connection", (ws: WebSocket, req: any) => {
    console.log("WebSocket client connected");

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "auth") {
          // Store client with user ID
          clients.set(data.userId, { ws, userId: data.userId });
          ws.send(JSON.stringify({ type: "auth_success" }));
        } else if (data.type === "join_room") {
          // Join a chat room (for future use)
          ws.send(JSON.stringify({ type: "room_joined", roomId: data.roomId }));
        } else if (data.type === "new_message") {
          // Broadcast new message to all participants in the room
          const roomParticipants = await storage.getChatRoomParticipants(data.roomId);
          const messageWithSender = {
            ...data.message,
            sender: await storage.getUser(data.message.senderId),
          };

          roomParticipants.forEach((participant) => {
            const client = clients.get(participant.userId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
              // Send message to participant
              client.ws.send(
                JSON.stringify({
                  type: "message_received",
                  message: messageWithSender,
                  roomId: data.roomId,
                })
              );

              // Send notification if not the sender
              if (participant.userId !== data.message.senderId) {
                client.ws.send(
                  JSON.stringify({
                    type: "new_notification",
                    notification: {
                      title: `${messageWithSender.sender?.firstName || "Someone"} sent a message`,
                      body: messageWithSender.content,
                      roomId: data.roomId,
                      senderId: data.message.senderId,
                    },
                  })
                );
              }
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Remove client from active connections
      for (const [userId, client] of Array.from(clients.entries())) {
        if (client.ws === ws) {
          clients.delete(userId);
          break;
        }
      }
      console.log("WebSocket client disconnected");
    });
  });

  return httpServer;
}
