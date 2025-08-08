import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { PaymentServiceFactory } from "./paymentService";
import { insertVendorSchema, insertDriverSchema, insertProductSchema, insertCartSchema, insertOrderSchema, insertReviewSchema, insertChatRoomSchema, insertMessageSchema, insertChatParticipantSchema, insertPhoneVerificationSchema, insertEmailVerificationSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { randomInt } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get additional role-specific data
      let roleData = null;
      if (user.role === 'vendor') {
        roleData = await storage.getVendorByUserId(userId);
      } else if (user.role === 'driver') {
        roleData = await storage.getDriverByUserId(userId);
      }

      res.json({ ...user, roleData });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/auth/setup-status', isAuthenticated, async (req: any, res) => {
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

      if (user.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(userId);
        setupStatus.hasVendorProfile = !!vendor;
        setupStatus.vendorStatus = vendor?.status as any || null;
      } else if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(userId);
        setupStatus.hasDriverProfile = !!driver;
        setupStatus.driverStatus = driver?.status as any || null;
      }

      res.json(setupStatus);
    } catch (error) {
      console.error("Error fetching setup status:", error);
      res.status(500).json({ message: "Failed to fetch setup status" });
    }
  });

  // User role management
  app.post('/api/auth/set-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!['customer', 'vendor', 'driver'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Vendor routes
  app.post('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorData = insertVendorSchema.parse({ ...req.body, userId });
      
      const vendor = await storage.createVendor(vendorData);
      await storage.updateUserRole(userId, 'vendor');
      
      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
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

  app.patch('/api/vendors/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
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

  // Driver routes
  app.post('/api/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const driverData = insertDriverSchema.parse({ ...req.body, userId });
      
      const driver = await storage.createDriver(driverData);
      await storage.updateUserRole(userId, 'driver');
      
      res.json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.get('/api/drivers/available', async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  app.patch('/api/drivers/:id/location', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/drivers/:id/status', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Product routes
  app.post('/api/products', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/products', async (req, res) => {
    try {
      const { vendorId, categoryId, search, limit } = req.query;
      
      const products = await storage.getProducts({
        vendorId: vendorId as string,
        categoryId: categoryId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
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

  app.patch('/api/products/:id', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.patch('/api/cart/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, ...orderData } = req.body;
      
      const order = await storage.createOrder(
        { ...orderData, customerId: userId },
        items
      );
      
      // Clear cart after successful order
      await storage.clearCart(userId);
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status } = req.query;
      
      let filters: any = { status };
      
      if (user?.role === 'customer') {
        filters.customerId = userId;
      } else if (user?.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(userId);
        filters.vendorId = vendor?.id;
      } else if (user?.role === 'driver') {
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

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch('/api/orders/:id/assign-driver', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/products/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getProductReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ message: "Failed to fetch product reviews" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/vendor/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getVendorStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  app.get('/api/analytics/driver/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getDriverStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching driver stats:", error);
      res.status(500).json({ message: "Failed to fetch driver stats" });
    }
  });

  app.get('/api/analytics/admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
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
  app.get('/api/chat/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRooms = await storage.getUserChatRooms(userId);
      res.json(chatRooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.post('/api/chat/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds, name } = req.body;
      
      const chatRoom = await storage.createChatRoom({
        name,
        type: participantIds.length > 1 ? 'group' : 'direct',
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

  app.get('/api/chat/rooms/:roomId/messages', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/chat/rooms/:roomId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roomId } = req.params;
      const messageData = insertMessageSchema.parse({ ...req.body, chatRoomId: roomId, senderId: userId });
      
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

  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/chat/rooms/:roomId/read', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/auth/phone-signup', async (req, res) => {
    try {
      const { firstName, lastName, phone, operator, role } = req.body;
      
      // Validate Burkina Faso phone number format
      if (!phone || !phone.startsWith('+226') || phone.length !== 12) {
        return res.status(400).json({ message: "Format de téléphone invalide. Utilisez +226XXXXXXXX" });
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
      
      // Store pending user data (in production, you'd store this in a temporary table)
      await storage.storePendingUser({
        phone,
        firstName,
        lastName,
        phoneOperator: operator,
        role,
      });
      
      // In production, send SMS via Orange/Moov API
      console.log(`SMS Verification Code for ${phone}: ${verificationCode}`);
      
      res.json({ message: "Code de vérification envoyé", phone });
    } catch (error) {
      console.error("Error in phone signup:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });
  
  app.post('/api/auth/verify-phone', async (req, res) => {
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
        ...pendingUser,
        phone,
        phoneVerified: true,
        id: undefined, // Let the database generate the ID
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
  
  app.post('/api/auth/phone-login', async (req, res) => {
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
      
      // In production, send SMS
      console.log(`SMS Login Code for ${phone}: ${loginCode}`);
      
      res.json({ message: "Code de connexion envoyé", phone });
    } catch (error) {
      console.error("Error in phone login:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  // Email authentication routes
  app.post('/api/auth/email-signup', async (req, res) => {
    try {
      const { firstName, lastName, email, role } = req.body;
      
      // Validate email format
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Format d'email invalide" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Cette adresse email est déjà utilisée" });
      }
      
      // Generate verification code
      const verificationCode = randomInt(100000, 999999).toString();
      
      // Store email verification record
      await storage.createEmailVerification({
        email,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
      
      // Store pending user data
      await storage.storePendingUser({
        email,
        firstName,
        lastName,
        role,
      });
      
      // In production, send email via email service
      console.log(`Email Verification Code for ${email}: ${verificationCode}`);
      
      res.json({ message: "Code de vérification envoyé", email });
    } catch (error) {
      console.error("Error in email signup:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });
  
  app.post('/api/auth/verify-email', async (req, res) => {
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
        ...pendingUser,
        email,
        id: undefined, // Let the database generate the ID
      });
      
      // Mark verification as used
      await storage.markEmailVerificationUsed(verification.id);
      
      // Clean up pending user data
      await storage.deletePendingUser(email);
      
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
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
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

  // Get upload URL for product images
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
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
      if (!user || user.role !== 'vendor') {
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
          const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
            imageURL,
            {
              owner: userId,
              visibility: "public", // Product images are public
            },
          );
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
      if ((paymentMethod === 'orange_money' || paymentMethod === 'moov_money') && !phoneNumber) {
        return res.status(400).json({ error: "Phone number is required for mobile money payments" });
      }

      // Create payment record
      const payment = await storage.createPayment({
        orderId,
        paymentMethod,
        amount: order.totalAmount,
        currency: order.currency || 'CFA',
        phoneNumber: phoneNumber || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Initiate payment with payment service
      const paymentService = PaymentServiceFactory.getService(paymentMethod);
      const result = await paymentService.initiatePayment({
        orderId,
        amount: parseFloat(order.totalAmount),
        phoneNumber: phoneNumber || '',
        paymentMethod
      });

      if (result.success) {
        // Update payment with transaction details
        await storage.updatePaymentTransaction(
          payment.id,
          result.transactionId!,
          result.operatorReference
        );

        // Update order payment method and status
        await storage.updateOrderStatus(orderId, 'confirmed');

        res.json({
          success: true,
          paymentId: payment.id,
          transactionId: result.transactionId,
          message: result.message,
          expiresAt: result.expiresAt
        });
      } else {
        // Update payment status to failed
        await storage.updatePaymentStatus(payment.id, 'failed', result.message);
        
        res.status(400).json({
          success: false,
          message: result.message
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
      if (payment.status === 'pending' && payment.transactionId) {
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
          if (statusResult.status === 'completed') {
            await storage.updateOrderStatus(order.id, 'preparing');
          }
        }

        res.json({
          status: statusResult.status,
          transactionId: payment.transactionId,
          operatorReference: payment.operatorReference,
          failureReason: statusResult.failureReason
        });
      } else {
        res.json({
          status: payment.status,
          transactionId: payment.transactionId,
          operatorReference: payment.operatorReference,
          failureReason: payment.failureReason
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

  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with user info
  const clients = new Map<string, { ws: WebSocket; userId: string }>();
  
  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // Store client with user ID
          clients.set(data.userId, { ws, userId: data.userId });
          ws.send(JSON.stringify({ type: 'auth_success' }));
        } else if (data.type === 'join_room') {
          // Join a chat room (for future use)
          ws.send(JSON.stringify({ type: 'room_joined', roomId: data.roomId }));
        } else if (data.type === 'new_message') {
          // Broadcast new message to all participants in the room
          const roomParticipants = await storage.getChatRoomParticipants(data.roomId);
          const messageWithSender = {
            ...data.message,
            sender: await storage.getUser(data.message.senderId)
          };
          
          roomParticipants.forEach(participant => {
            const client = clients.get(participant.userId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
              // Send message to participant
              client.ws.send(JSON.stringify({
                type: 'message_received',
                message: messageWithSender,
                roomId: data.roomId
              }));
              
              // Send notification if not the sender
              if (participant.userId !== data.message.senderId) {
                client.ws.send(JSON.stringify({
                  type: 'new_notification',
                  notification: {
                    title: `${messageWithSender.sender?.firstName || 'Someone'} sent a message`,
                    body: messageWithSender.content,
                    roomId: data.roomId,
                    senderId: data.message.senderId
                  }
                }));
              }
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from active connections
      for (const [userId, client] of Array.from(clients.entries())) {
        if (client.ws === ws) {
          clients.delete(userId);
          break;
        }
      }
      console.log('WebSocket client disconnected');
    });
  });
  
  return httpServer;
}
