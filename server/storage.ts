import {
  users,
  vendors,
  drivers,
  categories,
  products,
  orders,
  orderItems,
  cart,
  reviews,
  reviewVotes,
  reviewResponses,
  chatRooms,
  chatParticipants,
  messages,
  payments,
  notifications,
  phoneVerifications,
  emailVerifications,
  searchLogs,
  userBehavior,
  productSimilarities,
  userPreferences,
  securityEvents,
  rateLimitViolations,
  fraudAnalysis,
  userVerifications,
  vendorTrustScores,
  suspiciousActivities,
  blacklist,
  vendorAuditLog,
  storeSlugRedirects,
  type User,
  type UpsertUser,
  type InsertUser,
  type Vendor,
  type InsertVendor,
  type Driver,
  type InsertDriver,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type Review,
  type InsertReview,
  type ReviewVote,
  type ReviewResponse,
  type ChatRoom,
  type InsertChatRoom,
  type ChatParticipant,
  type InsertChatParticipant,
  type Message,
  type InsertMessage,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  vendorNotificationSettings,
  type VendorNotificationSettings,
  type InsertVendorNotificationSettings as _InsertVendorNotificationSettings,
  type PhoneVerification,
  type InsertPhoneVerification,
  type EmailVerification,
  type InsertEmailVerification,
  type OrderTracking,
  type SearchLog,
  type InsertSearchLog,
  type SearchFilters,
  type SearchResult,
  type UserBehavior,
  type InsertUserBehavior,
  type InsertProductSimilarity,
  type InsertUserPreference,
  type RecommendationRequest,
  type RecommendationsResponse,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  desc,
  asc,
  and,
  ilike,
  or,
  count,
  countDistinct,
  avg,
  sum,
  sql,
  gte,
  lte,
  isNull,
  gt,
} from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithPhone(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: "customer" | "vendor" | "driver" | "admin"): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  getUsersByRole(role: "customer" | "vendor" | "driver" | "admin"): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;

  // Phone verification operations
  createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification>;
  verifyPhoneCode(phone: string, code: string): Promise<PhoneVerification | undefined>;
  markPhoneVerificationUsed(id: string): Promise<void>;

  // Email verification operations
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  verifyEmailCode(email: string, code: string): Promise<EmailVerification | undefined>;
  markEmailVerificationUsed(id: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithEmail(userData: any): Promise<User>;

  // Temporary pending user storage (in production, use a proper cache like Redis)
  storePendingUser(userData: any): Promise<void>;
  getPendingUser(identifier: string): Promise<any>; // Changed from phone to identifier to support both
  deletePendingUser(identifier: string): Promise<void>;

  // Vendor operations
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  getVendorBySlug(slug: string): Promise<Vendor | undefined>;
  getVendors(status?: "pending" | "approved" | "rejected" | "suspended"): Promise<Vendor[]>;
  checkStoreNameAvailability(storeName: string): Promise<boolean>;
  updateVendorStatus(
    id: string,
    status: "pending" | "approved" | "rejected" | "suspended"
  ): Promise<Vendor>;
  logVendorAction(
    vendorId: string,
    action: string,
    actorId?: string,
    notes?: string
  ): Promise<void>;

  // Driver operations
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  getAvailableDrivers(): Promise<Driver[]>;
  getDrivers(status?: string): Promise<any[]>;
  updateDriverLocation(id: string, lat: number, lng: number): Promise<Driver>;
  updateDriverStatus(id: string, isOnline: boolean): Promise<Driver>;
  updateDriverApprovalStatus(id: string, status: string): Promise<Driver>;

  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductById(id: string): Promise<Product | undefined>;
  getProducts(filters?: {
    vendorId?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: "price" | "createdAt" | "name" | "rating";
    sortOrder?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    tags?: string[];
  }): Promise<{ items: Product[]; total: number; hasMore: boolean }>;
  getVendorProducts(vendorId: string): Promise<Product[]>;
  getRestaurantProducts(): Promise<any[]>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<Product>;
  updateProductImages(id: string, images: string[]): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  getVendorLowStockProducts(vendorId: string): Promise<Product[]>;

  // Cart operations
  addToCart(item: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]>;
  getOrders(filters?: {
    customerId?: string;
    vendorId?: string;
    driverId?: string;
    status?: string;
  }): Promise<Order[]>;
  getOrdersWithDetails(userId: string): Promise<any[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  assignOrderToDriver(orderId: string, driverId: string): Promise<Order>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: string): Promise<Review[]>;
  voteOnReview(
    reviewId: string,
    userId: string,
    voteType: "helpful" | "not_helpful"
  ): Promise<void>;
  getReviewVotes(reviewId: string): Promise<ReviewVote[]>;
  addVendorResponse(reviewId: string, vendorId: string, response: string): Promise<ReviewResponse>;
  getReviewResponses(reviewId: string): Promise<ReviewResponse[]>;
  getEnhancedReviews(productId: string): Promise<any[]>;

  // Advanced Search operations
  searchProducts(filters: SearchFilters): Promise<SearchResult>;
  logSearch(searchLog: InsertSearchLog): Promise<SearchLog>;
  getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
  getPopularSearchTerms(limit?: number): Promise<{ term: string; count: number }[]>;
  getSearchFacets(filters: SearchFilters): Promise<SearchResult["facets"]>;

  // Recommendation System operations
  trackUserBehavior(behavior: InsertUserBehavior): Promise<UserBehavior>;
  getRecommendations(request: RecommendationRequest): Promise<RecommendationsResponse>;
  updateProductSimilarities(productId: string): Promise<void>;
  updateUserPreferences(userId: string): Promise<void>;
  getTrendingProducts(limit?: number): Promise<Product[]>;
  getSimilarProducts(productId: string, limit?: number): Promise<Product[]>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<RecommendationsResponse>;
  getCollaborativeRecommendations(userId: string, limit?: number): Promise<RecommendationsResponse>;

  // Analytics
  getVendorStats(vendorId: string): Promise<{
    totalSales: number;
    monthlyOrders: number;
    totalProducts: number;
    averageRating: number;
  }>;
  getVendorAnalytics(vendorId: string): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topProducts: Array<{ name: string; sales: number; revenue: number }>;
    recentOrders: Array<{
      id: string;
      customerName: string;
      amount: number;
      status: string;
    }>;
  }>;
  getDriverStats(driverId: string): Promise<{
    dailyEarnings: number;
    completedDeliveries: number;
    averageRating: number;
  }>;
  getAdminStats(): Promise<{
    activeVendors: number;
    dailyOrders: number;
    platformRevenue: number;
    availableDrivers: number;
  }>;

  // Chat operations
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getUserChatRooms(userId: string): Promise<(ChatRoom & { unreadCount: number })[]>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  isUserInChatRoom(_userId: string, _chatRoomId: string): Promise<boolean>;
  createMessage(_message: InsertMessage): Promise<Message>;
  getChatMessages(_chatRoomId: string, _limit?: number, _offset?: number): Promise<Message[]>;
  searchUsers(_query: string): Promise<User[]>;
  getChatRoomParticipants(_chatRoomId: string): Promise<ChatParticipant[]>;

  // Payment operations
  createPayment(_payment: InsertPayment): Promise<Payment>;
  getPayment(_id: string): Promise<Payment | undefined>;
  getOrderPayments(_orderId: string): Promise<Payment[]>;
  updatePaymentStatus(
    _id: string,
    _status: "pending" | "completed" | "failed" | "refunded",
    _failureReason?: string
  ): Promise<Payment>;
  updatePaymentTransaction(
    _id: string,
    _transactionId: string,
    _operatorReference?: string
  ): Promise<Payment>;
  markMessagesAsRead(_userId: string, _chatRoomId: string): Promise<void>;
  incrementUnreadCount(_chatRoomId: string, _excludeUserId: string): Promise<void>;
  getTotalUnreadCount(_userId: string): Promise<number>;

  // Order tracking
  getOrderTrackingHistory(_orderId: string): Promise<OrderTracking[]>;

  // Admin operations
  addVendorNotes(_vendorId: string, _notes: string): Promise<void>;
  getTransactions(_filters: {
    page: number;
    limit: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ transactions: Payment[]; total: number }>;
}

// Temporary in-memory storage for pending users (use Redis in production)
const pendingUsers = new Map<
  string,
  {
    phone: string;
    operator: string;
    code: string;
    timestamp: number;
    userData: unknown;
  }
>();

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async createUserWithPhone(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserRole(
    userId: string,
    role: "customer" | "vendor" | "driver" | "admin"
  ): Promise<User> {
    // PROTECTION: Check if this is the protected admin account
    const targetUser = await this.getUser(userId);
    if (targetUser?.email === "simporefabrice15@gmail.com") {
      // Always ensure protected admin account has admin role
      if (role !== "admin") {
        console.log("🛡️ BLOCKED: Attempt to demote protected admin account");
        console.log(`  Blocked attempt to change from ${targetUser.role} to ${role}`);
        console.log("🛡️ ENFORCING: Admin role for protected account");
        role = "admin"; // Force admin role
      } else {
        console.log("🛡️ ALLOWED: Confirming admin role for protected account");
      }
    }

    // Update user role
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    // If promoting to vendor, create vendor record if it doesn't exist
    if (role === "vendor") {
      const existingVendor = await this.getVendorByUserId(userId);
      if (!existingVendor) {
        // Create basic vendor record for admin-promoted user
        await this.createVendor({
          userId,
          businessName: `${user.firstName} ${user.lastName} Business`,
          businessDescription: "Admin-created vendor account",
          businessAddress: "Address to be updated",
          businessPhone: user.phone || "Phone to be updated",
          bankName: "Bank to be updated",
          bankAccount: "Account to be updated",
          status: "approved", // Admin-promoted vendors are auto-approved
        });
      }
    }

    // If promoting to driver, create driver record if it doesn't exist
    if (role === "driver") {
      const existingDriver = await this.getDriverByUserId(userId);
      if (!existingDriver) {
        // Create basic driver record for admin-promoted user
        await this.createDriver({
          userId,
          vehicleType: "To be updated",
          licenseNumber: "To be updated",
          experience: "To be updated",
          status: "approved", // Admin-promoted drivers are auto-approved
          isOnline: false,
          currentLat: null,
          currentLng: null,
        });
      }
    }

    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    // PROTECTION: Check if this is the protected admin account
    const targetUser = await this.getUser(userId);
    if (targetUser?.email === "simporefabrice15@gmail.com") {
      // Only allow the admin to update their own non-critical fields
      const allowedUpdates = ["firstName", "lastName", "phone", "profileImageUrl"];
      const filteredUpdates: any = {};

      for (const key of allowedUpdates) {
        if (key in updates) {
          filteredUpdates[key] = updates[key as keyof User];
        }
      }

      // Never allow role or email changes
      delete filteredUpdates.role;
      delete filteredUpdates.email;

      console.log("🛡️ Protected admin update - filtered updates:", filteredUpdates);

      const [user] = await db
        .update(users)
        .set({ ...filteredUpdates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return user;
    }

    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersByRole(role: "customer" | "vendor" | "driver" | "admin"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(userId: string): Promise<void> {
    console.log("🗑️ Starting simplified user deletion for:", userId);

    // PROTECTION: Check if this is the protected admin account
    const targetUser = await this.getUser(userId);
    if (targetUser?.email === "simporefabrice15@gmail.com") {
      console.log("🛡️ BLOCKED: Attempt to delete protected admin account");
      throw new Error("Cannot delete protected admin account");
    }

    // Helper function to safely delete from a table
    const safeDelete = async (name: string, deleteOp: () => Promise<any>) => {
      try {
        console.log(`  Trying to delete from ${name}...`);
        await deleteOp();
        console.log(`  ✅ Deleted from ${name}`);
        return true;
      } catch (error: any) {
        console.log(`  ⚠️ Skipped ${name}: ${error.message?.slice(0, 100)}`);
        return false;
      }
    };

    try {
      // Try to delete related records, but don't fail if they don't exist
      await safeDelete("messages", () => db.delete(messages).where(eq(messages.senderId, userId)));
      await safeDelete("chatParticipants", () =>
        db.delete(chatParticipants).where(eq(chatParticipants.userId, userId))
      );
      await safeDelete("chatRooms", () =>
        db.delete(chatRooms).where(eq(chatRooms.createdBy, userId))
      );
      await safeDelete("reviews", () => db.delete(reviews).where(eq(reviews.userId, userId)));
      await safeDelete("cart", () => db.delete(cart).where(eq(cart.userId, userId)));
      await safeDelete("orders", () => db.delete(orders).where(eq(orders.customerId, userId)));
      // Delete phone verifications by user's phone number (if exists)
      if (targetUser?.phone) {
        await safeDelete("phoneVerifications", () =>
          db.delete(phoneVerifications).where(eq(phoneVerifications.phone, targetUser.phone!))
        );
      }

      // Delete email verifications by user's email (if exists)
      if (targetUser?.email) {
        await safeDelete("emailVerifications", () =>
          db.delete(emailVerifications).where(eq(emailVerifications.email, targetUser.email!))
        );
      }
      await safeDelete("notifications", () =>
        db.delete(notifications).where(eq(notifications.userId, userId))
      );
      await safeDelete("vendorNotificationSettings", () =>
        db.delete(vendorNotificationSettings).where(eq(vendorNotificationSettings.userId, userId))
      );
      await safeDelete("drivers", () => db.delete(drivers).where(eq(drivers.userId, userId)));
      await safeDelete("vendors", () => db.delete(vendors).where(eq(vendors.userId, userId)));

      // Delete security and monitoring related records
      await safeDelete("securityEvents", () =>
        db
          .delete(securityEvents)
          .where(or(eq(securityEvents.userId, userId), eq(securityEvents.resolvedBy, userId)))
      );
      await safeDelete("fraudAnalysis", () =>
        db
          .delete(fraudAnalysis)
          .where(or(eq(fraudAnalysis.userId, userId), eq(fraudAnalysis.reviewedBy, userId)))
      );
      await safeDelete("userVerifications", () =>
        db
          .delete(userVerifications)
          .where(or(eq(userVerifications.userId, userId), eq(userVerifications.verifiedBy, userId)))
      );
      await safeDelete("suspiciousActivities", () =>
        db
          .delete(suspiciousActivities)
          .where(
            or(
              eq(suspiciousActivities.userId, userId),
              eq(suspiciousActivities.investigatedBy, userId)
            )
          )
      );
      await safeDelete("blacklist", () =>
        db.delete(blacklist).where(eq(blacklist.addedBy, userId))
      );
      await safeDelete("searchLogs", () =>
        db.delete(searchLogs).where(eq(searchLogs.userId, userId))
      );
      await safeDelete("userBehavior", () =>
        db.delete(userBehavior).where(eq(userBehavior.userId, userId))
      );
      await safeDelete("userPreferences", () =>
        db.delete(userPreferences).where(eq(userPreferences.userId, userId))
      );
      await safeDelete("rateLimitViolations", () =>
        db.delete(rateLimitViolations).where(eq(rateLimitViolations.userId, userId))
      );

      // Finally delete the user - try multiple approaches
      console.log("🔥 Deleting user record...");

      try {
        // First attempt: Use Drizzle ORM
        await db.delete(users).where(eq(users.id, userId));
        console.log("✅ User deletion completed successfully");
      } catch (ormError: any) {
        console.log("⚠️ Drizzle deletion failed, trying raw SQL...");

        try {
          // Second attempt: Use raw SQL
          await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
          console.log("✅ User deletion completed with raw SQL");
        } catch (rawError: any) {
          console.error("❌ Both ORM and raw SQL deletion failed");
          console.error("ORM Error:", ormError.message);
          console.error("Raw SQL Error:", rawError.message);

          // Check if user actually exists
          const userExists = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId));
          if (userExists.length === 0) {
            console.log("🤔 User doesn't exist anymore - deletion may have succeeded partially");
            return; // Don't throw error if user is gone
          }

          throw new Error(`Failed to delete user: ${rawError.message}`);
        }
      }
    } catch (error: any) {
      console.error("❌ Unexpected error in user deletion:", error.message);
      throw error;
    }
  }

  // Vendor operations
  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.storeSlug, slug));
    return vendor;
  }

  async checkStoreNameAvailability(storeName: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(sql`LOWER(${vendors.storeName}) = ${storeName.toLowerCase()}`);
    return !existing;
  }

  async logVendorAction(
    vendorId: string,
    action: string,
    actorId?: string,
    notes?: string
  ): Promise<void> {
    await db.insert(vendorAuditLog).values({
      vendorId,
      action,
      actorId,
      notes,
    });
  }

  async getVendors(status?: "pending" | "approved" | "rejected" | "suspended"): Promise<Vendor[]> {
    const baseQuery = db
      .select({
        id: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        storeSlug: vendors.storeSlug,
        legalName: vendors.legalName,
        contactEmail: vendors.contactEmail,
        contactPhone: vendors.contactPhone,
        countryCode: vendors.countryCode,
        logoUrl: vendors.logoUrl,
        bannerUrl: vendors.bannerUrl,
        businessDescription: vendors.businessDescription,
        businessAddress: vendors.businessAddress,
        businessPhone: vendors.businessPhone,
        status: vendors.status,
        reviewNotes: vendors.reviewNotes,
        createdAt: vendors.createdAt,
        updatedAt: vendors.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
        },
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .orderBy(desc(vendors.createdAt));

    if (status) {
      return await baseQuery.where(eq(vendors.status, status));
    }
    return await baseQuery;
  }

  async updateVendorStatus(
    id: string,
    status: "pending" | "approved" | "rejected" | "suspended"
  ): Promise<Vendor> {
    // First update the vendor status
    const [vendor] = await db
      .update(vendors)
      .set({ status, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();

    // If approving vendor, also update user role to "vendor"
    if (status === "approved" && vendor) {
      await db
        .update(users)
        .set({ role: "vendor", updatedAt: new Date() })
        .where(eq(users.id, vendor.userId));
    }

    // If rejecting/suspending vendor, change user role back to "customer"
    // BUT NEVER change admin roles!
    if ((status === "rejected" || status === "suspended") && vendor) {
      // Get the user to check if they're the protected admin
      const user = await db.select().from(users).where(eq(users.id, vendor.userId)).limit(1);
      const targetUser = user[0];

      if (targetUser?.email === "simporefabrice15@gmail.com") {
        console.log(
          "🛡️ PROTECTED: Admin user role will NOT be changed to customer during vendor rejection"
        );
      } else {
        await db
          .update(users)
          .set({ role: "customer", updatedAt: new Date() })
          .where(eq(users.id, vendor.userId));
        console.log(`Changed user ${targetUser?.email} role to customer after vendor rejection`);
      }
    }

    return vendor;
  }

  // Driver operations
  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.isActive, true), eq(drivers.isOnline, true)));
  }

  async updateDriverLocation(id: string, lat: number, lng: number): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({
        currentLat: lat.toString(),
        currentLng: lng.toString(),
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async updateDriverStatus(id: string, isOnline: boolean): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({ isOnline, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async getDrivers(status?: string): Promise<any[]> {
    const query = db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        vehicleType: drivers.vehicleType,
        licenseNumber: drivers.licenseNumber,
        vehicleModel: drivers.vehicleModel,
        vehicleYear: drivers.vehicleYear,
        vehicleColor: drivers.vehicleColor,
        vehiclePlate: drivers.vehiclePlate,
        emergencyContact: drivers.emergencyContact,
        emergencyName: drivers.emergencyName,
        workZone: drivers.workZone,
        experience: drivers.experience,
        status: drivers.status,
        isActive: drivers.isActive,
        isOnline: drivers.isOnline,
        rating: drivers.rating,
        currentLat: drivers.currentLat,
        currentLng: drivers.currentLng,
        createdAt: drivers.createdAt,
        updatedAt: drivers.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          createdAt: users.createdAt,
        },
      })
      .from(drivers)
      .leftJoin(users, eq(drivers.userId, users.id));

    if (status) {
      query.where(eq(drivers.status, status as any));
    }

    return await query;
  }

  async updateDriverApprovalStatus(id: string, status: string): Promise<Driver> {
    // First update the driver status
    const [driver] = await db
      .update(drivers)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();

    // If approving driver, also update user role to "driver"
    if (status === "approved" && driver) {
      await db
        .update(users)
        .set({ role: "driver", updatedAt: new Date() })
        .where(eq(users.id, driver.userId));
    }

    // If rejecting/suspending driver, change user role back to "customer"
    // BUT NEVER change admin roles!
    if ((status === "rejected" || status === "suspended") && driver) {
      // Get the user to check if they're the protected admin
      const user = await db.select().from(users).where(eq(users.id, driver.userId)).limit(1);
      const targetUser = user[0];

      if (targetUser?.email === "simporefabrice15@gmail.com") {
        console.log(
          "🛡️ PROTECTED: Admin user role will NOT be changed to customer during driver rejection"
        );
      } else {
        await db
          .update(users)
          .set({ role: "customer", updatedAt: new Date() })
          .where(eq(users.id, driver.userId));
        console.log(`Changed user ${targetUser?.email} role to customer after driver rejection`);
      }
    }

    return driver;
  }

  // Category operations
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = (await db.insert(categories).values(categoryData).returning()) as Category[];
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  // Product operations
  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProducts(filters?: {
    vendorId?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: "price" | "createdAt" | "name" | "rating";
    sortOrder?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    tags?: string[];
    includeInactive?: boolean;
    minRating?: number;
  }): Promise<{ items: Product[]; total: number; hasMore: boolean }> {
    const conditions = [];

    // Only filter by isActive for marketplace queries (not vendor queries)
    if (!filters?.includeInactive) {
      conditions.push(eq(products.isActive, true));
    }

    if (filters?.vendorId) {
      conditions.push(eq(products.vendorId, filters.vendorId));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      // Enhanced search: name, description, and SKU
      const searchTerm = filters.search.toLowerCase();
      conditions.push(
        or(
          ilike(products.name, `%${searchTerm}%`),
          ilike(products.description, `%${searchTerm}%`),
          ilike(products.sku, `%${searchTerm}%`)
        )!
      );
    }

    // Price range filtering
    if (filters?.minPrice !== undefined) {
      conditions.push(sql`${products.price}::numeric >= ${filters.minPrice}`);
    }

    if (filters?.maxPrice !== undefined) {
      conditions.push(sql`${products.price}::numeric <= ${filters.maxPrice}`);
    }

    // Stock filtering
    if (filters?.inStock === true) {
      conditions.push(
        or(
          eq(products.trackQuantity, false), // Products that don't track quantity are always "in stock"
          sql`${products.quantity} > 0` // Products with quantity > 0
        )!
      );
    } else if (filters?.inStock === false) {
      conditions.push(and(eq(products.trackQuantity, true), sql`${products.quantity} <= 0`)!);
    }

    // Rating filtering
    if (filters?.minRating !== undefined && filters.minRating > 0) {
      conditions.push(sql`${products.rating}::numeric >= ${filters.minRating}`);
    }

    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Default pagination settings
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder || "desc";

    // Build sort clause
    let orderByClause;
    switch (sortBy) {
      case "price":
        orderByClause = sortOrder === "asc" ? asc(products.price) : desc(products.price);
        break;
      case "name":
        orderByClause = sortOrder === "asc" ? asc(products.name) : desc(products.name);
        break;
      case "rating":
        // Note: This requires a more complex query to calculate average rating
        // For now, we'll sort by creation date and add rating sorting later
        orderByClause = sortOrder === "asc" ? asc(products.createdAt) : desc(products.createdAt);
        break;
      default:
        orderByClause = sortOrder === "asc" ? asc(products.createdAt) : desc(products.createdAt);
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereCondition);
    const total = countResult[0]?.count || 0;

    // Get paginated results
    const items = await db
      .select()
      .from(products)
      .where(whereCondition)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId))
      .orderBy(desc(products.createdAt));
  }

  // Get restaurant products for the video feed
  async getRestaurantProducts(): Promise<any[]> {
    const restaurantProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        videos: products.videos,
        rating: products.rating,
        vendorId: products.vendorId,
        vendorName: vendors.storeName,
      })
      .from(products)
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(products.categoryId, "restaurant"),
          eq(vendors.status, "approved")
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(50); // Limit to recent 50 restaurant items

    return restaurantProducts;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: string, quantity: number, reason?: string): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    console.log(
      `[INVENTORY] Updated stock for product ${id}: ${quantity} units. Reason: ${reason || "Manual adjustment"}`
    );

    // Check for low stock and create notification if needed
    if (quantity <= 5 && quantity > 0) {
      try {
        const vendor = await this.getVendor(product.vendorId);
        if (vendor) {
          await this.createLowStockNotification(vendor.userId, product.name, quantity);
        }
      } catch (error) {
        console.error("Error creating low stock notification:", error);
      }
    }

    return product;
  }

  async restoreInventoryForOrder(orderId: string): Promise<void> {
    // This method restores inventory when an order is cancelled
    return await db.transaction(async (tx) => {
      // Get all order items for this order
      const items = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          productName: products.name,
          trackQuantity: products.trackQuantity,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      // Restore inventory for each item that tracks quantity
      for (const item of items) {
        if (item.trackQuantity) {
          await tx
            .update(products)
            .set({
              quantity: sql`${products.quantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));

          console.log(
            `[INVENTORY] Restored ${item.quantity} units for product "${item.productName}" (Order cancellation: ${orderId})`
          );
        }
      }
    });
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.trackQuantity, true),
          sql`${products.quantity} <= ${threshold}`,
          eq(products.isActive, true)
        )
      )
      .orderBy(asc(products.quantity));
  }

  async getCategoriesWithProductCount(): Promise<any[]> {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, and(eq(categories.id, products.categoryId), eq(products.isActive, true)))
      .groupBy(categories.id, categories.name, categories.description)
      .orderBy(categories.name);
  }

  // Advanced Search Implementation
  async searchProducts(filters: SearchFilters): Promise<SearchResult> {
    const conditions = [];

    // Base condition - only active products
    conditions.push(eq(products.isActive, true));

    // Text search with relevance scoring
    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      conditions.push(
        or(
          ilike(products.name, `%${searchTerm}%`),
          ilike(products.description, `%${searchTerm}%`),
          ilike(products.sku, `%${searchTerm}%`),
          ilike(products.tags, `%${searchTerm}%`)
        )!
      );
    }

    // Category filter
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    // Vendor filter
    if (filters.vendorId) {
      conditions.push(eq(products.vendorId, filters.vendorId));
    }

    // Price range filter
    if (filters.priceMin !== undefined) {
      conditions.push(gte(products.price, filters.priceMin.toString()));
    }
    if (filters.priceMax !== undefined) {
      conditions.push(lte(products.price, filters.priceMax.toString()));
    }

    // Rating filter
    if (filters.rating !== undefined) {
      conditions.push(gte(products.rating, filters.rating.toString()));
    }

    // Stock filter
    if (filters.inStock) {
      conditions.push(gte(products.quantity, 1));
    }

    // Featured filter
    if (filters.isFeatured) {
      conditions.push(eq(products.isFeatured, true));
    }

    // Images filter
    if (filters.hasImages) {
      conditions.push(sql`array_length(${products.images}, 1) > 0`);
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map((tag) => ilike(products.tags, `%${tag}%`));
      conditions.push(or(...tagConditions)!);
    }

    // Build the main query
    let query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        rating: products.rating,
        reviewCount: products.reviewCount,
        quantity: products.quantity,
        isFeatured: products.isFeatured,
        tags: products.tags,
        vendorId: products.vendorId,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        vendorName: vendors.businessName,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions));

    // Apply sorting
    switch (filters.sortBy) {
      case "price_asc":
        query = query.orderBy(asc(products.price));
        break;
      case "price_desc":
        query = query.orderBy(desc(products.price));
        break;
      case "rating":
        query = query.orderBy(desc(products.rating));
        break;
      case "newest":
        query = query.orderBy(desc(products.createdAt));
        break;
      case "oldest":
        query = query.orderBy(asc(products.createdAt));
        break;
      case "name_asc":
        query = query.orderBy(asc(products.name));
        break;
      case "name_desc":
        query = query.orderBy(desc(products.name));
        break;
      case "relevance":
      default:
        // For relevance, order by multiple factors
        if (filters.query) {
          // Prioritize exact matches, then partial matches
          query = query.orderBy(
            desc(products.isFeatured),
            desc(products.rating),
            desc(products.reviewCount),
            desc(products.createdAt)
          );
        } else {
          query = query.orderBy(
            desc(products.isFeatured),
            desc(products.rating),
            desc(products.createdAt)
          );
        }
        break;
    }

    // Get total count without pagination
    const totalQuery = db
      .select({ count: count() })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions));

    const [totalResult] = await totalQuery;
    const total = totalResult.count;

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const paginatedProducts = await query.limit(limit).offset(offset);

    // Get facets for filtering
    const facets = await this.getSearchFacets(filters);

    return {
      products: paginatedProducts as any[],
      total,
      facets,
      suggestions: filters.query ? await this.getSearchSuggestions(filters.query, 5) : [],
    };
  }

  async getSearchFacets(filters: SearchFilters): Promise<SearchResult["facets"]> {
    // Build base conditions (same as search but without the facet being calculated)
    const baseConditions = [eq(products.isActive, true)];

    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      baseConditions.push(
        or(
          ilike(products.name, `%${searchTerm}%`),
          ilike(products.description, `%${searchTerm}%`),
          ilike(products.sku, `%${searchTerm}%`),
          ilike(products.tags, `%${searchTerm}%`)
        )!
      );
    }

    // Get category facets
    const categoryFacets = await db
      .select({
        id: categories.id,
        name: categories.name,
        count: count(),
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...baseConditions))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(count()));

    // Get vendor facets
    const vendorFacets = await db
      .select({
        id: vendors.id,
        name: vendors.businessName,
        count: count(),
      })
      .from(products)
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(...baseConditions))
      .groupBy(vendors.id, vendors.businessName)
      .orderBy(desc(count()));

    // Get rating facets
    const ratingFacets = await db
      .select({
        rating: sql<number>`floor(${products.rating})`,
        count: count(),
      })
      .from(products)
      .where(and(...baseConditions))
      .groupBy(sql`floor(${products.rating})`)
      .orderBy(desc(sql`floor(${products.rating})`));

    // Define price ranges
    const priceRanges = [
      { min: 0, max: 1000, label: "0 - 1 000 CFA" },
      { min: 1000, max: 5000, label: "1 000 - 5 000 CFA" },
      { min: 5000, max: 10000, label: "5 000 - 10 000 CFA" },
      { min: 10000, max: 25000, label: "10 000 - 25 000 CFA" },
      { min: 25000, max: 50000, label: "25 000 - 50 000 CFA" },
      { min: 50000, max: 999999999, label: "50 000+ CFA" },
    ];

    // Get price range facets
    const priceRangeFacets = await Promise.all(
      priceRanges.map(async (range) => {
        const [result] = await db
          .select({ count: count() })
          .from(products)
          .where(
            and(
              ...baseConditions,
              gte(products.price, range.min.toString()),
              lte(products.price, range.max.toString())
            )
          );
        return {
          ...range,
          count: result.count,
        };
      })
    );

    // Get tag facets (extract from products.tags array)
    const tagFacets: { tag: string; count: number }[] = [];

    return {
      categories: categoryFacets,
      vendors: vendorFacets,
      priceRanges: priceRangeFacets.filter((range) => range.count > 0),
      ratings: ratingFacets.map((r) => ({ rating: r.rating, count: r.count })),
      tags: tagFacets,
    };
  }

  async logSearch(searchLog: InsertSearchLog): Promise<SearchLog> {
    const [log] = await db.insert(searchLogs).values(searchLog).returning();
    return log;
  }

  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const searchTerm = query.toLowerCase();

    // Get product name suggestions
    const productSuggestions = await db
      .select({ name: products.name })
      .from(products)
      .where(and(eq(products.isActive, true), ilike(products.name, `%${searchTerm}%`)))
      .limit(limit)
      .orderBy(desc(products.rating), desc(products.reviewCount));

    // Get category suggestions
    const categorySuggestions = await db
      .select({ name: categories.name })
      .from(categories)
      .where(ilike(categories.name, `%${searchTerm}%`))
      .limit(Math.floor(limit / 2));

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...productSuggestions.map((p) => p.name),
      ...categorySuggestions.map((c) => c.name),
    ];

    return [...new Set(allSuggestions)].slice(0, limit);
  }

  async getPopularSearchTerms(limit: number = 10): Promise<{ term: string; count: number }[]> {
    const popularTerms = await db
      .select({
        term: searchLogs.query,
        count: count(),
      })
      .from(searchLogs)
      .where(gte(searchLogs.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) // Last 30 days
      .groupBy(searchLogs.query)
      .orderBy(desc(count()))
      .limit(limit);

    return popularTerms;
  }

  // Recommendation System Implementation
  async trackUserBehavior(behavior: InsertUserBehavior): Promise<UserBehavior> {
    const [behaviorRecord] = await db.insert(userBehavior).values(behavior).returning();

    // Trigger preference update in background (fire and forget)
    if (behavior.userId) {
      this.updateUserPreferences(behavior.userId).catch(console.error);
    }

    return behaviorRecord;
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationsResponse> {
    const { type, userId, productId, limit = 10 } = request;

    switch (type) {
      case "personalized":
        return userId
          ? await this.getPersonalizedRecommendations(userId, limit)
          : await this.getTrendingRecommendations(limit);

      case "similar":
        return productId
          ? await this.getItemBasedRecommendations(productId, limit)
          : await this.getTrendingRecommendations(limit);

      case "trending":
        return await this.getTrendingRecommendations(limit);

      case "user_based":
        return userId
          ? await this.getCollaborativeRecommendations(userId, limit)
          : await this.getTrendingRecommendations(limit);

      case "item_based":
        return productId
          ? await this.getItemBasedRecommendations(productId, limit)
          : await this.getTrendingRecommendations(limit);

      default:
        return await this.getTrendingRecommendations(limit);
    }
  }

  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationsResponse> {
    // Get user preferences
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .orderBy(desc(userPreferences.preferenceScore));

    // Get user's recent behavior to exclude already viewed items
    const recentBehavior = await db
      .select({ productId: userBehavior.productId })
      .from(userBehavior)
      .where(eq(userBehavior.userId, userId))
      .orderBy(desc(userBehavior.createdAt))
      .limit(50);

    const viewedProductIds = recentBehavior.map((b) => b.productId);

    // Build recommendations based on preferences
    let recommendedProducts: any[] = [];

    if (userPrefs.length > 0) {
      // Category-based recommendations
      const categoryPrefs = userPrefs.filter(
        (p) => p.preferenceType === "category" && p.categoryId
      );
      if (categoryPrefs.length > 0) {
        const categoryRecommendations = await db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            images: products.images,
            rating: products.rating,
            reviewCount: products.reviewCount,
            vendorId: products.vendorId,
            categoryId: products.categoryId,
            vendorName: vendors.businessName,
            categoryName: categories.name,
          })
          .from(products)
          .leftJoin(vendors, eq(products.vendorId, vendors.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.isActive, true),
              eq(products.categoryId, categoryPrefs[0].categoryId!),
              viewedProductIds.length > 0
                ? sql`${products.id} NOT IN (${sql.join(
                    viewedProductIds.map((id) => sql`${id}`),
                    sql`, `
                  )})`
                : sql`1=1`
            )
          )
          .orderBy(desc(products.rating), desc(products.reviewCount))
          .limit(Math.ceil(limit * 0.6));

        recommendedProducts.push(
          ...categoryRecommendations.map((p) => ({
            ...p,
            score: 0.8,
            reason: `Based on your interest in ${p.categoryName}`,
            type: "category_preference",
          }))
        );
      }

      // Vendor-based recommendations
      const vendorPrefs = userPrefs.filter((p) => p.preferenceType === "vendor" && p.vendorId);
      if (vendorPrefs.length > 0 && recommendedProducts.length < limit) {
        const vendorRecommendations = await db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            images: products.images,
            rating: products.rating,
            reviewCount: products.reviewCount,
            vendorId: products.vendorId,
            categoryId: products.categoryId,
            vendorName: vendors.businessName,
            categoryName: categories.name,
          })
          .from(products)
          .leftJoin(vendors, eq(products.vendorId, vendors.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.isActive, true),
              eq(products.vendorId, vendorPrefs[0].vendorId!),
              viewedProductIds.length > 0
                ? sql`${products.id} NOT IN (${sql.join(
                    viewedProductIds.map((id) => sql`${id}`),
                    sql`, `
                  )})`
                : sql`1=1`,
              recommendedProducts.length > 0
                ? sql`${products.id} NOT IN (${sql.join(
                    recommendedProducts.map((p) => sql`${p.id}`),
                    sql`, `
                  )})`
                : sql`1=1`
            )
          )
          .orderBy(desc(products.rating))
          .limit(Math.ceil(limit * 0.4));

        recommendedProducts.push(
          ...vendorRecommendations.map((p) => ({
            ...p,
            score: 0.7,
            reason: `More from ${p.vendorName}`,
            type: "vendor_preference",
          }))
        );
      }
    }

    // Fill remaining slots with trending products
    if (recommendedProducts.length < limit) {
      const trendingProducts = await this.getTrendingProducts(limit - recommendedProducts.length);
      const existingIds = recommendedProducts.map((p) => p.id);

      const filteredTrending = trendingProducts
        .filter((p) => !existingIds.includes(p.id) && !viewedProductIds.includes(p.id))
        .slice(0, limit - recommendedProducts.length);

      recommendedProducts.push(
        ...filteredTrending.map((p) => ({
          ...p,
          vendorName: null,
          categoryName: null,
          score: 0.5,
          reason: "Trending now",
          type: "trending",
        }))
      );
    }

    return {
      recommendations: recommendedProducts.slice(0, limit).map((p) => ({
        productId: p.id,
        score: p.score,
        reason: p.reason,
        type: p.type,
        product: p,
      })),
      metadata: {
        algorithm: "personalized",
        totalProducts: recommendedProducts.length,
        userProfile:
          userPrefs.length > 0
            ? {
                preferences: userPrefs.length,
                topCategory: userPrefs.find((p) => p.preferenceType === "category")?.categoryId,
                topVendor: userPrefs.find((p) => p.preferenceType === "vendor")?.vendorId,
              }
            : null,
      },
    };
  }

  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationsResponse> {
    // Find users with similar behavior patterns
    const userInteractions = await db
      .select({ productId: userBehavior.productId })
      .from(userBehavior)
      .where(
        and(
          eq(userBehavior.userId, userId),
          sql`${userBehavior.actionType} IN ('purchase', 'add_to_cart')`
        )
      );

    if (userInteractions.length === 0) {
      return await this.getTrendingRecommendations(limit);
    }

    const userProductIds = userInteractions.map((i) => i.productId);

    // Find similar users who also interacted with the same products
    const similarUsers = await db
      .select({
        userId: userBehavior.userId,
        commonProducts: count(),
      })
      .from(userBehavior)
      .where(
        and(
          sql`${userBehavior.userId} != ${userId}`,
          sql`${userBehavior.productId} IN (${sql.join(
            userProductIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`${userBehavior.actionType} IN ('purchase', 'add_to_cart')`
        )
      )
      .groupBy(userBehavior.userId)
      .having(sql`count(*) >= 2`)
      .orderBy(desc(count()))
      .limit(10);

    if (similarUsers.length === 0) {
      return await this.getTrendingRecommendations(limit);
    }

    const similarUserIds = similarUsers.map((u) => u.userId).filter(Boolean);

    // Get products that similar users liked but current user hasn't interacted with
    const recommendations = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        rating: products.rating,
        reviewCount: products.reviewCount,
        vendorId: products.vendorId,
        categoryId: products.categoryId,
        vendorName: vendors.businessName,
        categoryName: categories.name,
        interactions: count(),
      })
      .from(userBehavior)
      .innerJoin(products, eq(userBehavior.productId, products.id))
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          sql`${userBehavior.userId} IN (${sql.join(
            similarUserIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`${userBehavior.productId} NOT IN (${sql.join(
            userProductIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`${userBehavior.actionType} IN ('purchase', 'add_to_cart')`
        )
      )
      .groupBy(
        products.id,
        products.name,
        products.description,
        products.price,
        products.images,
        products.rating,
        products.reviewCount,
        products.vendorId,
        products.categoryId,
        vendors.businessName,
        categories.name
      )
      .orderBy(desc(count()), desc(products.rating))
      .limit(limit);

    return {
      recommendations: recommendations.map((p) => ({
        productId: p.id,
        score: Math.min(0.9, 0.5 + p.interactions * 0.1),
        reason: "People with similar tastes also liked this",
        type: "collaborative",
        product: p,
      })),
      metadata: {
        algorithm: "collaborative_filtering",
        totalProducts: recommendations.length,
        userProfile: {
          similarUsers: similarUsers.length,
          userInteractions: userInteractions.length,
        },
      },
    };
  }

  async getItemBasedRecommendations(
    productId: string,
    limit: number = 10
  ): Promise<RecommendationsResponse> {
    // Get the source product details
    const sourceProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (sourceProduct.length === 0) {
      return await this.getTrendingRecommendations(limit);
    }

    const product = sourceProduct[0];

    // Get pre-computed similarities
    let similarProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        rating: products.rating,
        reviewCount: products.reviewCount,
        vendorId: products.vendorId,
        categoryId: products.categoryId,
        vendorName: vendors.businessName,
        categoryName: categories.name,
        similarityScore: productSimilarities.similarityScore,
      })
      .from(productSimilarities)
      .innerJoin(products, eq(productSimilarities.productBId, products.id))
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(productSimilarities.productAId, productId), eq(products.isActive, true)))
      .orderBy(desc(productSimilarities.similarityScore))
      .limit(limit);

    // If no pre-computed similarities, fall back to category and vendor matching
    if (similarProducts.length < limit) {
      const categoryMatches = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          images: products.images,
          rating: products.rating,
          reviewCount: products.reviewCount,
          vendorId: products.vendorId,
          categoryId: products.categoryId,
          vendorName: vendors.businessName,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.isActive, true),
            eq(products.categoryId, product.categoryId),
            sql`${products.id} != ${productId}`,
            similarProducts.length > 0
              ? sql`${products.id} NOT IN (${sql.join(
                  similarProducts.map((p) => sql`${p.id}`),
                  sql`, `
                )})`
              : sql`1=1`
          )
        )
        .orderBy(desc(products.rating), desc(products.reviewCount))
        .limit(limit - similarProducts.length);

      similarProducts.push(
        ...categoryMatches.map((p) => ({
          ...p,
          similarityScore: "0.6",
        }))
      );
    }

    return {
      recommendations: similarProducts.map((p) => ({
        productId: p.id,
        score: parseFloat(p.similarityScore || "0.5"),
        reason:
          p.categoryName === product.categoryName
            ? `Similar to ${product.name}`
            : `From the same category`,
        type: "item_based",
        product: p,
      })),
      metadata: {
        algorithm: "item_based",
        totalProducts: similarProducts.length,
        sourceProduct: {
          id: product.id,
          name: product.name,
          category: product.categoryId,
        },
      },
    };
  }

  async getTrendingRecommendations(limit: number = 10): Promise<RecommendationsResponse> {
    const trendingProducts = await this.getTrendingProducts(limit);

    return {
      recommendations: trendingProducts.map((product, index) => ({
        productId: product.id,
        score: 0.8 - index * 0.05, // Decreasing score based on position
        reason: "Trending now",
        type: "trending",
        product: product,
      })),
      metadata: {
        algorithm: "trending",
        totalProducts: trendingProducts.length,
      },
    };
  }

  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    // Calculate trending score based on recent orders, views, and rating
    return await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        images: products.images,
        rating: products.rating,
        reviewCount: products.reviewCount,
        quantity: products.quantity,
        vendorId: products.vendorId,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(
        desc(products.isFeatured),
        desc(products.rating),
        desc(products.reviewCount),
        desc(products.createdAt)
      )
      .limit(limit);
  }

  async getSimilarProducts(productId: string, limit: number = 6): Promise<Product[]> {
    const result = await this.getItemBasedRecommendations(productId, limit);
    return result.recommendations.map((r) => r.product);
  }

  async updateProductSimilarities(productId: string): Promise<void> {
    // Get the product details
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (product.length === 0) return;

    const sourceProduct = product[0];

    // Find similar products based on various criteria
    const similarProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.id} != ${productId}`));

    // Calculate similarities and batch insert
    const similarities: InsertProductSimilarity[] = [];

    for (const targetProduct of similarProducts) {
      let totalScore = 0;
      let _factors = 0;

      // Category similarity (40% weight)
      if (sourceProduct.categoryId === targetProduct.categoryId) {
        totalScore += 0.4;
        _factors++;
      }

      // Vendor similarity (20% weight)
      if (sourceProduct.vendorId === targetProduct.vendorId) {
        totalScore += 0.2;
        _factors++;
      }

      // Price similarity (20% weight)
      const priceDiff = Math.abs(parseFloat(sourceProduct.price) - parseFloat(targetProduct.price));
      const maxPrice = Math.max(parseFloat(sourceProduct.price), parseFloat(targetProduct.price));
      if (maxPrice > 0) {
        const priceScore = Math.max(0, 1 - priceDiff / maxPrice);
        totalScore += priceScore * 0.2;
        _factors++;
      }

      // Rating similarity (20% weight)
      const ratingDiff = Math.abs(
        parseFloat(sourceProduct.rating || "0") - parseFloat(targetProduct.rating || "0")
      );
      const ratingScore = Math.max(0, 1 - ratingDiff / 5);
      totalScore += ratingScore * 0.2;
      _factors++;

      // Only store if similarity is meaningful
      if (totalScore > 0.3) {
        similarities.push({
          productAId: productId,
          productBId: targetProduct.id,
          similarityScore: totalScore.toFixed(4),
          similarityType: "computed",
        });
      }
    }

    // Delete existing similarities for this product
    await db.delete(productSimilarities).where(eq(productSimilarities.productAId, productId));

    // Insert new similarities in batches
    if (similarities.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < similarities.length; i += batchSize) {
        const batch = similarities.slice(i, i + batchSize);
        await db.insert(productSimilarities).values(batch);
      }
    }
  }

  async updateUserPreferences(userId: string): Promise<void> {
    // Get user's behavior data
    const behaviorData = await db
      .select({
        productId: userBehavior.productId,
        actionType: userBehavior.actionType,
        categoryId: products.categoryId,
        vendorId: products.vendorId,
        price: products.price,
      })
      .from(userBehavior)
      .innerJoin(products, eq(userBehavior.productId, products.id))
      .where(eq(userBehavior.userId, userId))
      .orderBy(desc(userBehavior.createdAt))
      .limit(100);

    if (behaviorData.length === 0) return;

    // Calculate category preferences
    const categoryScores: { [categoryId: string]: number } = {};
    const vendorScores: { [vendorId: string]: number } = {};
    const priceRanges: { [range: string]: number } = {};

    behaviorData.forEach((behavior) => {
      const weight = this.getActionWeight(behavior.actionType);

      // Category preferences
      if (behavior.categoryId) {
        categoryScores[behavior.categoryId] = (categoryScores[behavior.categoryId] || 0) + weight;
      }

      // Vendor preferences
      if (behavior.vendorId) {
        vendorScores[behavior.vendorId] = (vendorScores[behavior.vendorId] || 0) + weight;
      }

      // Price range preferences
      const price = parseFloat(behavior.price);
      let priceRange = "medium";
      if (price < 5000) priceRange = "low";
      else if (price > 25000) priceRange = "high";

      priceRanges[priceRange] = (priceRanges[priceRange] || 0) + weight;
    });

    // Delete existing preferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));

    // Insert new preferences
    const preferences: InsertUserPreference[] = [];

    // Category preferences
    Object.entries(categoryScores).forEach(([categoryId, score]) => {
      preferences.push({
        userId,
        categoryId,
        preferenceScore: (score / behaviorData.length).toFixed(4),
        preferenceType: "category",
      });
    });

    // Vendor preferences
    Object.entries(vendorScores).forEach(([vendorId, score]) => {
      preferences.push({
        userId,
        vendorId,
        preferenceScore: (score / behaviorData.length).toFixed(4),
        preferenceType: "vendor",
      });
    });

    // Price range preferences
    Object.entries(priceRanges).forEach(([range, score]) => {
      preferences.push({
        userId,
        priceRange: range,
        preferenceScore: (score / behaviorData.length).toFixed(4),
        preferenceType: "price",
      });
    });

    if (preferences.length > 0) {
      await db.insert(userPreferences).values(preferences);
    }
  }

  private getActionWeight(actionType: string): number {
    switch (actionType) {
      case "purchase":
        return 3.0;
      case "add_to_cart":
        return 2.0;
      case "like":
        return 1.5;
      case "view":
        return 1.0;
      case "share":
        return 1.2;
      default:
        return 0.5;
    }
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.trackQuantity, true),
          sql`${products.quantity} <= 0`,
          eq(products.isActive, true)
        )
      )
      .orderBy(products.name);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async updateProductImages(id: string, images: string[]): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ images, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getVendorLowStockProducts(vendorId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.vendorId, vendorId),
          eq(products.isActive, true),
          sql`${products.quantity} <= 5`
        )
      )
      .orderBy(products.quantity);
  }

  // Cart operations
  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, itemData.userId), eq(cart.productId, itemData.productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cart)
        .set({
          quantity: existingItem.quantity + itemData.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cart.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cart).values(itemData).returning();
      return newItem;
    }
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(cart)
      .leftJoin(products, eq(cart.productId, products.id))
      .where(eq(cart.userId, userId))
      .orderBy(desc(cart.createdAt));

    return result.map((row) => ({
      ...row.cart,
      product: row.products!,
    }));
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [item] = await db
      .update(cart)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cart.id, id))
      .returning();
    return item;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cart).where(eq(cart.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cart).where(eq(cart.userId, userId));
  }

  // Order operations
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Start transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Check inventory for all items first
      const inventoryChecks = await Promise.all(
        items.map(async (item) => {
          const [product] = await tx
            .select({
              id: products.id,
              name: products.name,
              quantity: products.quantity,
              trackQuantity: products.trackQuantity,
            })
            .from(products)
            .where(eq(products.id, item.productId));

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Check if we need to track quantity and if we have enough stock
          if (product.trackQuantity && (product.quantity || 0) < (item.quantity || 1)) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available: ${product.quantity || 0}, Requested: ${item.quantity || 1}`
            );
          }

          return {
            productId: item.productId,
            requestedQuantity: item.quantity || 1,
            product,
          };
        })
      );

      // Get vendor information to calculate commission
      const [vendor] = await tx
        .select({
          id: vendors.id,
          commissionRate: vendors.commissionRate,
        })
        .from(vendors)
        .where(eq(vendors.id, orderData.vendorId));

      if (!vendor) {
        throw new Error(`Vendor ${orderData.vendorId} not found`);
      }

      // Calculate commission breakdown
      const subtotal = parseFloat(orderData.subtotal);
      const deliveryFee = parseFloat(orderData.deliveryFee || "0");
      const taxAmount = parseFloat(orderData.taxAmount || "0");
      const totalAmount = parseFloat(orderData.totalAmount);

      // Generate order number for logging
      const orderNumber = `ZK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Commission is calculated on subtotal (product value) only, not on delivery fee or tax
      const commissionRate = parseFloat(vendor.commissionRate || "5.00");
      const commissionAmount = (subtotal * commissionRate) / 100;
      const vendorEarnings = subtotal - commissionAmount;
      const platformRevenue = commissionAmount;

      console.log(`[COMMISSION] Order ${orderNumber} breakdown:`, {
        subtotal,
        commissionRate: `${commissionRate}%`,
        commissionAmount,
        vendorEarnings,
        platformRevenue,
        deliveryFee,
        taxAmount,
        totalAmount,
      });

      // If we get here, all items have sufficient stock
      // Create order with commission data
      const orderWithCommission = {
        ...orderData,
        orderNumber,
        commissionRate: commissionRate.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        vendorEarnings: vendorEarnings.toFixed(2),
        platformRevenue: platformRevenue.toFixed(2),
      };

      const [order] = await tx.insert(orders).values(orderWithCommission).returning();

      // Insert order items
      const orderItemsWithOrderId = items.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await tx.insert(orderItems).values(orderItemsWithOrderId);

      // Reserve/decrement inventory for items that track quantity
      for (const check of inventoryChecks) {
        if (check.product.trackQuantity) {
          await tx
            .update(products)
            .set({
              quantity: sql`${products.quantity} - ${check.requestedQuantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, check.productId));

          console.log(
            `[INVENTORY] Reserved ${check.requestedQuantity} units of product ${check.productId} for order ${orderNumber}`
          );
        }
      }

      console.log(`[ORDER] Created order ${orderNumber} with commission tracking`);
      return order;
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Commission analytics methods
  async getVendorCommissionSummary(
    vendorId: string,
    dateRange?: { startDate?: Date; endDate?: Date }
  ) {
    const conditions = [eq(orders.vendorId, vendorId)];

    if (dateRange?.startDate) {
      conditions.push(gte(orders.createdAt, dateRange.startDate));
    }
    if (dateRange?.endDate) {
      conditions.push(lte(orders.createdAt, dateRange.endDate));
    }

    const result = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orders.subtotal})`,
        totalCommission: sql<number>`sum(${orders.commissionAmount})`,
        totalEarnings: sql<number>`sum(${orders.vendorEarnings})`,
        avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        totalDeliveryFees: sql<number>`sum(${orders.deliveryFee})`,
      })
      .from(orders)
      .where(and(...conditions));

    return (
      result[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalEarnings: 0,
        avgCommissionRate: 0,
        totalDeliveryFees: 0,
      }
    );
  }

  async getPlatformCommissionSummary(dateRange?: { startDate?: Date; endDate?: Date }) {
    const conditions = [];

    if (dateRange?.startDate) {
      conditions.push(gte(orders.createdAt, dateRange.startDate));
    }
    if (dateRange?.endDate) {
      conditions.push(lte(orders.createdAt, dateRange.endDate));
    }

    const result = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalGMV: sql<number>`sum(${orders.totalAmount})`, // Gross Merchandise Value
        totalCommissionRevenue: sql<number>`sum(${orders.platformRevenue})`,
        totalVendorEarnings: sql<number>`sum(${orders.vendorEarnings})`,
        avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        totalDeliveryRevenue: sql<number>`sum(${orders.deliveryFee})`,
      })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return (
      result[0] || {
        totalOrders: 0,
        totalGMV: 0,
        totalCommissionRevenue: 0,
        totalVendorEarnings: 0,
        avgCommissionRate: 0,
        totalDeliveryRevenue: 0,
      }
    );
  }

  async getTopVendorsByRevenue(
    limit: number = 10,
    dateRange?: { startDate?: Date; endDate?: Date }
  ) {
    const conditions = [];

    if (dateRange?.startDate) {
      conditions.push(gte(orders.createdAt, dateRange.startDate));
    }
    if (dateRange?.endDate) {
      conditions.push(lte(orders.createdAt, dateRange.endDate));
    }

    return await db
      .select({
        vendorId: orders.vendorId,
        businessName: vendors.businessName,
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orders.subtotal})`,
        totalCommission: sql<number>`sum(${orders.commissionAmount})`,
        commissionRate: sql<number>`avg(${orders.commissionRate})`,
      })
      .from(orders)
      .innerJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orders.vendorId, vendors.businessName)
      .orderBy(sql`sum(${orders.subtotal}) desc`)
      .limit(limit);
  }

  async getOrders(filters?: {
    customerId?: string;
    vendorId?: string;
    driverId?: string;
    status?: string;
  }): Promise<Order[]> {
    const conditions = [];

    if (filters?.customerId) {
      conditions.push(eq(orders.customerId, filters.customerId));
    }

    if (filters?.vendorId) {
      conditions.push(eq(orders.vendorId, filters.vendorId));
    }

    if (filters?.driverId) {
      conditions.push(eq(orders.driverId, filters.driverId));
    }

    if (filters?.status) {
      conditions.push(
        eq(
          orders.status,
          filters.status as
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready_for_pickup"
            | "in_transit"
            | "delivered"
            | "cancelled"
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(orders)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(orders.createdAt));
    }

    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersWithDetails(userId: string): Promise<any[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithDetails = await Promise.all(
      userOrders.map(async (order) => {
        // Get order items
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

        // Get vendor info
        let vendor = null;
        if (order.vendorId) {
          vendor = await db
            .select({
              id: vendors.id,
              businessName: vendors.businessName,
              businessPhone: vendors.businessPhone,
            })
            .from(vendors)
            .where(eq(vendors.id, order.vendorId))
            .limit(1);
        }

        // Get driver info
        let driver = null;
        if (order.driverId) {
          const driverInfo = await db
            .select({
              driverId: drivers.id,
              userId: drivers.userId,
            })
            .from(drivers)
            .where(eq(drivers.id, order.driverId))
            .limit(1);

          if (driverInfo.length > 0) {
            const driverUser = await db
              .select({
                name: users.firstName,
                phone: users.phone,
              })
              .from(users)
              .where(eq(users.id, driverInfo[0].userId))
              .limit(1);

            driver =
              driverUser.length > 0
                ? {
                    id: driverInfo[0].driverId,
                    name: driverUser[0].name,
                    phone: driverUser[0].phone,
                  }
                : null;
          }
        }

        return {
          ...order,
          items,
          vendor: vendor?.[0] || null,
          driver,
        };
      })
    );

    return ordersWithDetails;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        status: status as
          | "pending"
          | "confirmed"
          | "preparing"
          | "ready_for_pickup"
          | "in_transit"
          | "delivered"
          | "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ driverId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async voteOnReview(
    reviewId: string,
    userId: string,
    voteType: "helpful" | "not_helpful"
  ): Promise<void> {
    // First check if user already voted on this review
    const existingVote = await db
      .select()
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, userId)))
      .limit(1);

    if (existingVote.length > 0) {
      // Update existing vote
      await db
        .update(reviewVotes)
        .set({ voteType })
        .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, userId)));
    } else {
      // Create new vote
      await db.insert(reviewVotes).values({
        reviewId,
        userId,
        voteType,
      });
    }

    // Update helpfulVotes and totalVotes in reviews table
    const votes = await db.select().from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId));

    const helpfulVotes = votes.filter((v) => v.voteType === "helpful").length;
    const totalVotes = votes.length;

    await db.update(reviews).set({ helpfulVotes, totalVotes }).where(eq(reviews.id, reviewId));
  }

  async getReviewVotes(reviewId: string): Promise<ReviewVote[]> {
    return await db.select().from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId));
  }

  async addVendorResponse(
    reviewId: string,
    vendorId: string,
    response: string
  ): Promise<ReviewResponse> {
    const [vendorResponse] = await db
      .insert(reviewResponses)
      .values({
        reviewId,
        vendorId,
        response,
        isOfficial: true,
      })
      .returning();
    return vendorResponse;
  }

  async getReviewResponses(reviewId: string): Promise<ReviewResponse[]> {
    return await db
      .select()
      .from(reviewResponses)
      .where(eq(reviewResponses.reviewId, reviewId))
      .orderBy(desc(reviewResponses.createdAt));
  }

  async getEnhancedReviews(productId: string): Promise<any[]> {
    return await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        images: reviews.images,
        isVerified: reviews.isVerified,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        isRecommended: reviews.isRecommended,
        purchaseVerified: reviews.purchaseVerified,
        reviewerLevel: reviews.reviewerLevel,
        createdAt: reviews.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  // Analytics
  async getVendorStats(vendorId: string): Promise<{
    totalSales: number;
    monthlyOrders: number;
    totalProducts: number;
    averageRating: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [salesResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const [monthlyOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.vendorId, vendorId), gte(orders.createdAt, monthStart)));

    const [productsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const [ratingResult] = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.vendorId, vendorId));

    return {
      totalSales: Number(salesResult?.total || 0),
      monthlyOrders: monthlyOrdersResult?.count || 0,
      totalProducts: productsResult?.count || 0,
      averageRating: Number(ratingResult?.avg || 0),
    };
  }

  // Enhanced vendor analytics methods
  async getVendorAnalytics(vendorId: string): Promise<{
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topProducts: Array<{ name: string; sales: number; revenue: number }>;
    recentOrders: Array<{
      id: string;
      customerName: string;
      amount: number;
      status: string;
    }>;
  }> {
    const now = new Date();
    const _sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Total sales
    const [salesResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    // Total orders
    const [ordersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    // Total products
    const [productsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    // Unique customers
    const [customersResult] = await db
      .select({ count: countDistinct(orders.customerId) })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    // Monthly revenue for last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [monthResult] = await db
        .select({ total: sum(orders.totalAmount) })
        .from(orders)
        .where(
          and(
            eq(orders.vendorId, vendorId),
            gte(orders.createdAt, monthStart),
            lte(orders.createdAt, monthEnd)
          )
        );

      const monthNames = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jui",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      monthlyRevenue.push({
        month: monthNames[monthStart.getMonth()],
        revenue: Number(monthResult?.total || 0),
      });
    }

    // Top products by sales
    const topProducts = await db
      .select({
        name: products.name,
        sales: count(orderItems.id),
        revenue: sum(sql<number>`${orderItems.quantity} * ${orderItems.unitPrice}`),
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.vendorId, vendorId))
      .groupBy(products.id, products.name)
      .orderBy(desc(count(orderItems.id)))
      .limit(5);

    // Recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        customerName: sql<string>`CASE 
          WHEN ${orders.customerId} IS NOT NULL THEN CONCAT(${users.firstName}, ' ', ${users.lastName})
          ELSE ${orders.guestName}
        END`,
        amount: orders.totalAmount,
        status: orders.status,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return {
      totalSales: Number(salesResult?.total || 0),
      totalOrders: ordersResult?.count || 0,
      totalProducts: productsResult?.count || 0,
      totalCustomers: customersResult?.count || 0,
      monthlyRevenue,
      topProducts: topProducts.map((p) => ({
        name: p.name,
        sales: p.sales,
        revenue: Number(p.revenue || 0),
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customerName: o.customerName || "Client invité",
        amount: Number(o.amount),
        status: o.status || "pending",
      })),
    };
  }

  async getDriverStats(driverId: string): Promise<{
    dailyEarnings: number;
    completedDeliveries: number;
    averageRating: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [earningsResult] = await db
      .select({ total: sum(orders.deliveryFee) })
      .from(orders)
      .where(and(eq(orders.driverId, driverId), eq(orders.createdAt, today)));

    const [deliveriesResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.driverId, driverId), eq(orders.status, "delivered")));

    // For driver rating, we'd need to modify the reviews table to include driver ratings
    // For now, using driver table rating
    const driver = await this.getDriver(driverId);

    return {
      dailyEarnings: Number(earningsResult?.total || 0),
      completedDeliveries: deliveriesResult?.count || 0,
      averageRating: Number(driver?.rating || 0),
    };
  }

  async getAdminStats(): Promise<{
    activeVendors: number;
    dailyOrders: number;
    platformRevenue: number;
    availableDrivers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [vendorsResult] = await db
      .select({ count: count() })
      .from(vendors)
      .where(eq(vendors.status, "approved"));

    const [ordersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.createdAt, today));

    const [revenueResult] = await db.select({ total: sum(orders.totalAmount) }).from(orders);

    const [driversResult] = await db
      .select({ count: count() })
      .from(drivers)
      .where(and(eq(drivers.isActive, true), eq(drivers.isOnline, true)));

    return {
      activeVendors: vendorsResult?.count || 0,
      dailyOrders: ordersResult?.count || 0,
      platformRevenue: Number(revenueResult?.total || 0),
      availableDrivers: driversResult?.count || 0,
    };
  }

  // Chat operations
  async createChatRoom(chatRoomData: InsertChatRoom): Promise<ChatRoom> {
    const [chatRoom] = await db.insert(chatRooms).values(chatRoomData).returning();
    return chatRoom;
  }

  async getUserChatRooms(userId: string): Promise<(ChatRoom & { unreadCount: number })[]> {
    const rooms = await db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        isActive: chatRooms.isActive,
        createdBy: chatRooms.createdBy,
        lastMessageAt: chatRooms.lastMessageAt,
        createdAt: chatRooms.createdAt,
        updatedAt: chatRooms.updatedAt,
        unreadCount: chatParticipants.unreadCount,
      })
      .from(chatRooms)
      .innerJoin(chatParticipants, eq(chatRooms.id, chatParticipants.chatRoomId))
      .where(and(eq(chatParticipants.userId, userId), eq(chatRooms.isActive, true)))
      .orderBy(desc(chatRooms.lastMessageAt));
    return rooms.map((room) => ({
      ...room,
      unreadCount: room.unreadCount || 0,
    }));
  }

  async addChatParticipant(participantData: InsertChatParticipant): Promise<ChatParticipant> {
    const [participant] = await db.insert(chatParticipants).values(participantData).returning();
    return participant;
  }

  async isUserInChatRoom(userId: string, chatRoomId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(chatParticipants)
      .where(and(eq(chatParticipants.userId, userId), eq(chatParticipants.chatRoomId, chatRoomId)));
    return !!participant;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();

    // Update chat room's last message timestamp
    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chatRooms.id, messageData.chatRoomId));

    // Increment unread count for all participants except sender
    await this.incrementUnreadCount(messageData.chatRoomId, messageData.senderId);

    return message;
  }

  async getChatMessages(chatRoomId: string, limit = 50, offset = 0): Promise<Message[]> {
    const messageList = await db
      .select({
        id: messages.id,
        chatRoomId: messages.chatRoomId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        isDeleted: messages.isDeleted,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.chatRoomId, chatRoomId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    return messageList;
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchUsers = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .limit(20);
    return searchUsers;
  }

  async getChatRoomParticipants(chatRoomId: string): Promise<ChatParticipant[]> {
    const participants = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.chatRoomId, chatRoomId));
    return participants;
  }

  async markMessagesAsRead(userId: string, chatRoomId: string): Promise<void> {
    await db
      .update(chatParticipants)
      .set({
        lastReadAt: new Date(),
        unreadCount: 0,
      })
      .where(and(eq(chatParticipants.userId, userId), eq(chatParticipants.chatRoomId, chatRoomId)));
  }

  async incrementUnreadCount(chatRoomId: string, excludeUserId: string): Promise<void> {
    const participants = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatRoomId, chatRoomId),
          sql`${chatParticipants.userId} != ${excludeUserId}`
        )
      );

    for (const participant of participants) {
      await db
        .update(chatParticipants)
        .set({ unreadCount: sql`${chatParticipants.unreadCount} + 1` })
        .where(eq(chatParticipants.id, participant.id));
    }
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: sum(chatParticipants.unreadCount) })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    return Number(result?.total || 0);
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(
    id: string,
    status: "pending" | "completed" | "failed" | "refunded",
    failureReason?: string
  ): Promise<Payment> {
    const updateData: Partial<Payment> = {
      status,
      updatedAt: new Date(),
      processedAt: status !== "pending" ? new Date() : null,
    };

    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePaymentTransaction(
    id: string,
    transactionId: string,
    operatorReference?: string
  ): Promise<Payment> {
    const updateData: Partial<Payment> = {
      transactionId,
      updatedAt: new Date(),
    };

    if (operatorReference) {
      updateData.operatorReference = operatorReference;
    }

    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Phone verification operations
  async createPhoneVerification(
    verificationData: InsertPhoneVerification
  ): Promise<PhoneVerification> {
    const [verification] = await db.insert(phoneVerifications).values(verificationData).returning();
    return verification;
  }

  async verifyPhoneCode(phone: string, code: string): Promise<PhoneVerification | undefined> {
    const [verification] = await db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          eq(phoneVerifications.phone, phone),
          eq(phoneVerifications.code, code),
          eq(phoneVerifications.isUsed, false)
        )
      )
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    // Check if verification is still valid (not expired)
    if (verification && new Date() > verification.expiresAt) {
      return undefined;
    }

    return verification;
  }

  async markPhoneVerificationUsed(id: string): Promise<void> {
    await db.update(phoneVerifications).set({ isUsed: true }).where(eq(phoneVerifications.id, id));
  }

  // Email verification operations
  async createEmailVerification(
    verificationData: InsertEmailVerification
  ): Promise<EmailVerification> {
    const [verification] = await db.insert(emailVerifications).values(verificationData).returning();
    return verification;
  }

  async verifyEmailCode(email: string, code: string): Promise<EmailVerification | undefined> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.code, code),
          eq(emailVerifications.isUsed, false)
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    // Check if verification is still valid (not expired)
    if (verification && new Date() > verification.expiresAt) {
      return undefined;
    }

    return verification;
  }

  async markEmailVerificationUsed(id: string): Promise<void> {
    await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithEmail(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Temporary pending user storage
  async storePendingUser(userData: any): Promise<void> {
    const key = userData.phone || userData.email;
    pendingUsers.set(key, userData);
  }

  async getPendingUser(identifier: string): Promise<unknown> {
    return pendingUsers.get(identifier);
  }

  async deletePendingUser(identifier: string): Promise<void> {
    pendingUsers.delete(identifier);
  }

  // Order tracking
  async getOrderTrackingHistory(orderId: string): Promise<OrderTracking[]> {
    // For now, return basic status changes. In production, you'd have a dedicated tracking table
    const order = await this.getOrder(orderId);
    if (!order) return [];

    const history = [
      {
        status: "pending",
        timestamp: order.createdAt,
        description: "Commande créée",
      },
    ];

    if (order.status !== "pending") {
      history.push({
        status: order.status || "unknown",
        timestamp: order.updatedAt,
        description: this.getStatusDescription(order.status || "unknown"),
      });
    }

    return history;
  }

  private getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      confirmed: "Commande confirmée",
      preparing: "Commande en préparation",
      ready_for_pickup: "Commande prête pour la livraison",
      in_transit: "Commande en cours de livraison",
      delivered: "Commande livrée",
      cancelled: "Commande annulée",
    };
    return descriptions[status] || status;
  }

  // Admin operations
  async addVendorNotes(vendorId: string, notes: string): Promise<void> {
    await db
      .update(vendors)
      .set({
        adminNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId));
  }

  async getTransactions(filters: {
    page: number;
    limit: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ transactions: Payment[]; total: number }> {
    const conditions = [];

    if (filters.status) {
      conditions.push(
        eq(payments.status, filters.status as "pending" | "completed" | "failed" | "refunded")
      );
    }

    if (filters.dateFrom) {
      conditions.push(sql`${payments.createdAt} >= ${new Date(filters.dateFrom)}`);
    }

    if (filters.dateTo) {
      conditions.push(sql`${payments.createdAt} <= ${new Date(filters.dateTo)}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db.select({ count: count() }).from(payments).where(whereCondition);

    // Get paginated results
    const offset = (filters.page - 1) * filters.limit;
    const transactions = await db
      .select()
      .from(payments)
      .where(whereCondition)
      .orderBy(desc(payments.createdAt))
      .limit(filters.limit)
      .offset(offset);

    return {
      transactions,
      total: countResult?.count || 0,
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Helper method to create common notification types
  async createOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
    orderNumber: string
  ): Promise<void> {
    const statusMessages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: "Commande confirmée",
        message: `Votre commande #${orderNumber} a été confirmée par le vendeur.`,
      },
      preparing: {
        title: "Commande en préparation",
        message: `Votre commande #${orderNumber} est en cours de préparation.`,
      },
      ready_for_pickup: {
        title: "Commande prête",
        message: `Votre commande #${orderNumber} est prête pour la livraison.`,
      },
      in_transit: {
        title: "Commande en transit",
        message: `Votre commande #${orderNumber} est en cours de livraison.`,
      },
      delivered: {
        title: "Commande livrée",
        message: `Votre commande #${orderNumber} a été livrée avec succès.`,
      },
      cancelled: {
        title: "Commande annulée",
        message: `Votre commande #${orderNumber} a été annulée.`,
      },
    };

    const notification = statusMessages[status];
    if (notification) {
      await this.createNotification({
        userId,
        type: "order_status",
        title: notification.title,
        message: notification.message,
        data: { orderId, status, orderNumber },
        isRead: false,
      });
    }
  }

  async createLowStockNotification(
    vendorId: string,
    productName: string,
    stockQuantity: number
  ): Promise<void> {
    await this.createNotification({
      userId: vendorId,
      type: "low_stock",
      title: "Stock faible",
      message: `Le produit "${productName}" n'a plus que ${stockQuantity} unité${stockQuantity !== 1 ? "s" : ""} en stock.`,
      data: { productName, stockQuantity },
      isRead: false,
    });
  }

  // Vendor-specific notification methods
  async getVendorNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const vendorNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return vendorNotifications;
  }

  async getVendorUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async markVendorNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllVendorNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteVendorNotification(notificationId: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async getVendorNotificationSettings(userId: string): Promise<VendorNotificationSettings | null> {
    const [settings] = await db
      .select()
      .from(vendorNotificationSettings)
      .where(eq(vendorNotificationSettings.userId, userId));

    if (!settings) {
      // Create default settings for the vendor
      const defaultSettings = {
        userId,
        emailNotifications: {
          newOrders: true,
          orderStatusChanges: true,
          lowStock: true,
          payments: true,
          reviews: true,
          system: true,
        },
        pushNotifications: {
          newOrders: true,
          orderStatusChanges: false,
          lowStock: true,
          urgentAlerts: true,
        },
        smsNotifications: {
          newOrders: false,
          urgentAlerts: true,
        },
        lowStockThreshold: 5,
        soundEnabled: true,
      };

      const [created] = await db
        .insert(vendorNotificationSettings)
        .values(defaultSettings)
        .returning();

      return created;
    }

    return settings;
  }

  async updateVendorNotificationSettings(
    userId: string,
    settings: Partial<VendorNotificationSettings>
  ): Promise<void> {
    await db
      .update(vendorNotificationSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(vendorNotificationSettings.userId, userId));
  }

  async createVendorNotification(
    vendorId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.createNotification({
      userId: vendorId,
      type,
      title,
      message,
      data,
      isRead: false,
    });
  }

  async getAdminAnalytics(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalDrivers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingVendors: number;
    activeVendors: number;
    pendingOrders: number;
    completedOrders: number;
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    topVendors: Array<{
      id: string;
      businessName: string;
      totalRevenue: number;
      totalOrders: number;
    }>;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: string;
      status: string;
    }>;
    platformMetrics: {
      totalProducts: number;
      totalCategories: number;
      averageOrderValue: number;
      platformCommissionEarned: number;
    };
  }> {
    try {
      // Get basic counts
      const [userCount] = await db.select({ count: count() }).from(users);
      const totalUsers = userCount?.count || 0;

      const [vendorCount] = await db.select({ count: count() }).from(vendors);
      const totalVendors = vendorCount?.count || 0;

      const [driverCount] = await db.select({ count: count() }).from(drivers);
      const totalDrivers = driverCount?.count || 0;

      const [orderCount] = await db.select({ count: count() }).from(orders);
      const totalOrders = orderCount?.count || 0;

      const [productCount] = await db.select({ count: count() }).from(products);
      const totalProducts = productCount?.count || 0;

      const [categoryCount] = await db.select({ count: count() }).from(categories);
      const totalCategories = categoryCount?.count || 0;

      // Get vendor status counts
      const [pendingVendorCount] = await db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, "pending"));
      const pendingVendors = pendingVendorCount?.count || 0;

      const [activeVendorCount] = await db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, "approved"));
      const activeVendors = activeVendorCount?.count || 0;

      // Get order status counts
      const [pendingOrderCount] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "pending"));
      const pendingOrders = pendingOrderCount?.count || 0;

      const [completedOrderCount] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "delivered"));
      const completedOrders = completedOrderCount?.count || 0;

      // Calculate total revenue and platform commission
      const [revenueResult] = await db
        .select({
          totalRevenue: sum(orders.totalAmount),
          platformRevenue: sum(orders.platformRevenue),
        })
        .from(orders)
        .where(eq(orders.status, "delivered"));

      const totalRevenue = parseFloat(revenueResult?.totalRevenue || "0");
      const platformCommissionEarned = parseFloat(revenueResult?.platformRevenue || "0");

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get monthly revenue for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenueData = await db
        .select({
          month: sql<string>`DATE_TRUNC('month', ${orders.createdAt})::text`,
          revenue: sum(orders.totalAmount),
          orders: count(orders.id),
        })
        .from(orders)
        .where(and(eq(orders.status, "delivered"), gte(orders.createdAt, sixMonthsAgo)))
        .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

      const monthlyRevenue = monthlyRevenueData.map((row) => ({
        month: new Date(row.month).toLocaleDateString("fr-FR", {
          month: "short",
        }),
        revenue: parseFloat(row.revenue || "0"),
        orders: row.orders || 0,
      }));

      // Get top vendors by revenue
      const topVendorsData = await db
        .select({
          id: vendors.id,
          businessName: vendors.businessName,
          totalRevenue: sum(orders.vendorEarnings),
          totalOrders: count(orders.id),
        })
        .from(vendors)
        .leftJoin(orders, eq(orders.vendorId, vendors.userId))
        .where(eq(orders.status, "delivered"))
        .groupBy(vendors.id, vendors.businessName)
        .orderBy(desc(sum(orders.vendorEarnings)))
        .limit(5);

      const topVendors = topVendorsData.map((vendor) => ({
        id: vendor.id,
        businessName: vendor.businessName || "Vendeur",
        totalRevenue: parseFloat(vendor.totalRevenue || "0"),
        totalOrders: vendor.totalOrders || 0,
      }));

      // Get recent activity (simplified)
      const recentOrdersData = await db
        .select({
          id: orders.id,
          createdAt: orders.createdAt,
          status: orders.status,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(10);

      const recentActivity = recentOrdersData.map((order) => ({
        type: "order_placed",
        description: `Nouvelle commande ${order.orderNumber}`,
        timestamp: order.createdAt?.toISOString() || new Date().toISOString(),
        status: order.status || "pending",
      }));

      return {
        totalUsers,
        totalVendors,
        totalDrivers,
        totalOrders,
        totalRevenue,
        pendingVendors,
        activeVendors,
        pendingOrders,
        completedOrders,
        monthlyRevenue,
        topVendors,
        recentActivity,
        platformMetrics: {
          totalProducts,
          totalCategories,
          averageOrderValue,
          platformCommissionEarned,
        },
      };
    } catch (error) {
      console.error("Error getting admin analytics:", error);
      throw error;
    }
  }

  // Security and Fraud Detection Methods

  async logSecurityEvent(event: {
    incidentType: string;
    severity: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    requestHeaders?: any;
    requestBody?: any;
    responseStatus?: number;
    geoLocation?: any;
    description?: string;
    metadata?: any;
  }) {
    try {
      return await db
        .insert(securityEvents)
        .values({
          incidentType: event.incidentType as any,
          severity: event.severity,
          userId: event.userId,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          requestPath: event.requestPath,
          requestMethod: event.requestMethod,
          requestHeaders: event.requestHeaders,
          requestBody: event.requestBody,
          responseStatus: event.responseStatus,
          geoLocation: event.geoLocation,
          description: event.description,
          metadata: event.metadata,
        })
        .returning();
    } catch (error) {
      console.error("Error logging security event:", error);
      throw error;
    }
  }

  async logRateLimitViolation(data: {
    ipAddress: string;
    userId?: string;
    endpoint: string;
    attemptCount: number;
    windowEnd: Date;
    metadata?: any;
  }) {
    try {
      return await db.insert(rateLimitViolations).values(data).returning();
    } catch (error) {
      console.error("Error logging rate limit violation:", error);
      throw error;
    }
  }

  async logFraudAnalysis(data: {
    orderId?: string;
    userId?: string;
    status: string;
    riskScore: number;
    riskFactors?: any;
    rules?: string[];
    ipAddress?: string;
    deviceFingerprint?: string;
    geoLocation?: any;
    velocityChecks?: any;
    behaviorScore?: number;
    paymentRisk?: number;
    accountAge?: number;
    isVpnDetected?: boolean;
    isTorDetected?: boolean;
  }) {
    try {
      return await db
        .insert(fraudAnalysis)
        .values({
          orderId: data.orderId,
          userId: data.userId,
          status: data.status as any,
          riskScore: data.riskScore.toString(),
          riskFactors: data.riskFactors,
          rules: data.rules,
          ipAddress: data.ipAddress,
          deviceFingerprint: data.deviceFingerprint,
          geoLocation: data.geoLocation,
          velocityChecks: data.velocityChecks,
          behaviorScore: data.behaviorScore?.toString(),
          paymentRisk: data.paymentRisk?.toString(),
          accountAge: data.accountAge,
          isVpnDetected: data.isVpnDetected,
          isTorDetected: data.isTorDetected,
        })
        .returning();
    } catch (error) {
      console.error("Error logging fraud analysis:", error);
      throw error;
    }
  }

  async isBlacklisted(
    type: string,
    value: string
  ): Promise<{ isBlacklisted: boolean; reason?: string }> {
    try {
      const result = await db
        .select()
        .from(blacklist)
        .where(
          and(
            eq(blacklist.type, type as any),
            eq(blacklist.value, value),
            eq(blacklist.isActive, true),
            or(isNull(blacklist.expiresAt), gt(blacklist.expiresAt, new Date()))
          )
        )
        .limit(1);

      if (result.length > 0) {
        return { isBlacklisted: true, reason: result[0].reason };
      }

      return { isBlacklisted: false };
    } catch (error) {
      console.error("Error checking blacklist:", error);
      return { isBlacklisted: false };
    }
  }

  async addToBlacklist(data: {
    type: string;
    value: string;
    reason: string;
    severity: string;
    addedBy: string;
    expiresAt?: Date;
    metadata?: any;
  }) {
    try {
      return await db
        .insert(blacklist)
        .values({
          type: data.type as any,
          value: data.value,
          reason: data.reason,
          severity: data.severity,
          addedBy: data.addedBy,
          expiresAt: data.expiresAt,
          metadata: data.metadata,
        })
        .returning();
    } catch (error) {
      console.error("Error adding to blacklist:", error);
      throw error;
    }
  }

  async getUserRecentOrders(userId: string, hours: number = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      return await db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), gt(orders.createdAt, since)))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting user recent orders:", error);
      return [];
    }
  }

  async getUserRecentSessions(userId: string, days: number = 7) {
    // This would require a sessions tracking table in production
    // For now, return mock data or implement session tracking
    return [];
  }

  async getUserKnownDevices(userId: string) {
    // This would require device tracking implementation
    // For now, return empty array
    return [];
  }

  async getUserBehaviorProfile(userId: string) {
    try {
      // Calculate behavior profile from user orders and activities
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      if (userOrders.length === 0) {
        return null;
      }

      const totalAmount = userOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const averageOrderAmount = totalAmount / userOrders.length;

      return {
        orderCount: userOrders.length,
        averageOrderAmount,
        totalSpent: totalAmount,
        firstOrderDate: userOrders[userOrders.length - 1]?.createdAt,
        lastOrderDate: userOrders[0]?.createdAt,
      };
    } catch (error) {
      console.error("Error getting user behavior profile:", error);
      return null;
    }
  }

  async getUserVerifications(userId: string) {
    try {
      return await db
        .select()
        .from(userVerifications)
        .where(eq(userVerifications.userId, userId))
        .orderBy(desc(userVerifications.createdAt));
    } catch (error) {
      console.error("Error getting user verifications:", error);
      return [];
    }
  }

  async isKnownPaymentMethod(userId: string, cardHash: string): Promise<boolean> {
    // This would require storing payment method hashes
    // For now, return false (treat all as new)
    return false;
  }

  async logSuspiciousActivity(data: {
    userId?: string;
    activityType: string;
    riskScore: number;
    anomalyFactors: any;
    ipAddress?: string;
    userAgent?: string;
    geoLocation?: any;
    sessionData?: any;
  }) {
    try {
      return await db
        .insert(suspiciousActivities)
        .values({
          userId: data.userId,
          activityType: data.activityType as any,
          riskScore: data.riskScore.toString(),
          anomalyFactors: data.anomalyFactors,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          geoLocation: data.geoLocation,
          sessionData: data.sessionData,
        })
        .returning();
    } catch (error) {
      console.error("Error logging suspicious activity:", error);
      throw error;
    }
  }

  async createUserVerification(data: {
    userId: string;
    verificationType: string;
    documentUrl?: string;
    documentType?: string;
    verificationCode?: string;
    expiresAt?: Date;
    metadata?: any;
  }) {
    try {
      return await db
        .insert(userVerifications)
        .values({
          userId: data.userId,
          verificationType: data.verificationType as any,
          documentUrl: data.documentUrl,
          documentType: data.documentType,
          verificationCode: data.verificationCode,
          expiresAt: data.expiresAt,
          metadata: data.metadata,
        })
        .returning();
    } catch (error) {
      console.error("Error creating user verification:", error);
      throw error;
    }
  }

  async updateUserVerification(
    verificationId: string,
    data: {
      status?: string;
      verifiedBy?: string;
      rejectionReason?: string;
      extractedData?: any;
    }
  ) {
    try {
      return await db
        .update(userVerifications)
        .set({
          status: data.status as any,
          verifiedBy: data.verifiedBy,
          verifiedAt: data.status === "verified" ? new Date() : undefined,
          rejectionReason: data.rejectionReason,
          extractedData: data.extractedData,
          updatedAt: new Date(),
        })
        .where(eq(userVerifications.id, verificationId))
        .returning();
    } catch (error) {
      console.error("Error updating user verification:", error);
      throw error;
    }
  }

  async updateVendorTrustScore(
    vendorId: string,
    scores: {
      overallScore: number;
      identityScore?: number;
      activityScore?: number;
      reviewScore?: number;
      complianceScore?: number;
      financialScore?: number;
      factors?: any;
      riskFlags?: string[];
    }
  ) {
    try {
      // Check if trust score exists
      const existing = await db
        .select()
        .from(vendorTrustScores)
        .where(eq(vendorTrustScores.vendorId, vendorId))
        .limit(1);

      if (existing.length > 0) {
        return await db
          .update(vendorTrustScores)
          .set({
            overallScore: scores.overallScore.toString(),
            identityScore: scores.identityScore?.toString(),
            activityScore: scores.activityScore?.toString(),
            reviewScore: scores.reviewScore?.toString(),
            complianceScore: scores.complianceScore?.toString(),
            financialScore: scores.financialScore?.toString(),
            factors: scores.factors,
            riskFlags: scores.riskFlags,
            lastUpdated: new Date(),
          })
          .where(eq(vendorTrustScores.vendorId, vendorId))
          .returning();
      } else {
        return await db
          .insert(vendorTrustScores)
          .values({
            vendorId,
            overallScore: scores.overallScore.toString(),
            identityScore: scores.identityScore?.toString(),
            activityScore: scores.activityScore?.toString(),
            reviewScore: scores.reviewScore?.toString(),
            complianceScore: scores.complianceScore?.toString(),
            financialScore: scores.financialScore?.toString(),
            factors: scores.factors,
            riskFlags: scores.riskFlags,
          })
          .returning();
      }
    } catch (error) {
      console.error("Error updating vendor trust score:", error);
      throw error;
    }
  }

  async getVendorTrustScore(vendorId: string) {
    try {
      const result = await db
        .select()
        .from(vendorTrustScores)
        .where(eq(vendorTrustScores.vendorId, vendorId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error getting vendor trust score:", error);
      return null;
    }
  }

  // Additional Security Methods

  async getSecurityEvents(params: {
    limit?: number;
    offset?: number;
    severity?: string;
    incidentType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const conditions = [];

      if (params.severity) conditions.push(eq(securityEvents.severity, params.severity));
      if (params.incidentType)
        conditions.push(eq(securityEvents.incidentType, params.incidentType as any));
      if (params.startDate) conditions.push(gte(securityEvents.createdAt, params.startDate));
      if (params.endDate) conditions.push(lte(securityEvents.createdAt, params.endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await db
        .select()
        .from(securityEvents)
        .where(whereClause)
        .orderBy(desc(securityEvents.createdAt))
        .limit(params.limit || 50)
        .offset(params.offset || 0);
    } catch (error) {
      console.error("Error getting security events:", error);
      return [];
    }
  }

  async getFraudAnalysis(params: {
    limit?: number;
    offset?: number;
    status?: string;
    minRiskScore?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const conditions = [];

      if (params.status) conditions.push(eq(fraudAnalysis.status, params.status as any));
      if (params.minRiskScore)
        conditions.push(gte(fraudAnalysis.riskScore, params.minRiskScore.toString()));
      if (params.startDate) conditions.push(gte(fraudAnalysis.createdAt, params.startDate));
      if (params.endDate) conditions.push(lte(fraudAnalysis.createdAt, params.endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await db
        .select()
        .from(fraudAnalysis)
        .where(whereClause)
        .orderBy(desc(fraudAnalysis.createdAt))
        .limit(params.limit || 50)
        .offset(params.offset || 0);
    } catch (error) {
      console.error("Error getting fraud analysis:", error);
      return [];
    }
  }

  async updateFraudAnalysisReview(
    analysisId: string,
    data: {
      status: string;
      reviewedBy: string;
      reviewNotes?: string;
      reviewedAt: Date;
    }
  ) {
    try {
      return await db
        .update(fraudAnalysis)
        .set({
          status: data.status as any,
          reviewedBy: data.reviewedBy,
          reviewNotes: data.reviewNotes,
          reviewedAt: data.reviewedAt,
          updatedAt: new Date(),
        })
        .where(eq(fraudAnalysis.id, analysisId))
        .returning();
    } catch (error) {
      console.error("Error updating fraud analysis review:", error);
      throw error;
    }
  }

  async getSuspiciousActivities(params: {
    limit?: number;
    offset?: number;
    minRiskScore?: number;
    activityType?: string;
    investigated?: boolean;
  }) {
    try {
      const conditions = [];

      if (params.minRiskScore)
        conditions.push(gte(suspiciousActivities.riskScore, params.minRiskScore.toString()));
      if (params.activityType)
        conditions.push(eq(suspiciousActivities.activityType, params.activityType as any));
      if (params.investigated !== undefined)
        conditions.push(eq(suspiciousActivities.isInvestigated, params.investigated));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await db
        .select()
        .from(suspiciousActivities)
        .where(whereClause)
        .orderBy(desc(suspiciousActivities.createdAt))
        .limit(params.limit || 50)
        .offset(params.offset || 0);
    } catch (error) {
      console.error("Error getting suspicious activities:", error);
      return [];
    }
  }

  async getBlacklistEntries(params: { type?: string; isActive?: boolean }) {
    try {
      const conditions = [];

      if (params.type) conditions.push(eq(blacklist.type, params.type as any));
      if (params.isActive !== undefined) conditions.push(eq(blacklist.isActive, params.isActive));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await db
        .select()
        .from(blacklist)
        .where(whereClause)
        .orderBy(desc(blacklist.createdAt));
    } catch (error) {
      console.error("Error getting blacklist entries:", error);
      return [];
    }
  }

  async removeFromBlacklist(blacklistId: string) {
    try {
      return await db
        .update(blacklist)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(blacklist.id, blacklistId))
        .returning();
    } catch (error) {
      console.error("Error removing from blacklist:", error);
      throw error;
    }
  }

  async getSecurityDashboard() {
    try {
      // Get security metrics for the dashboard
      const recentEvents = await db
        .select({ count: sql`count(*)` })
        .from(securityEvents)
        .where(gte(securityEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))); // Last 24 hours

      const fraudCases = await db
        .select({
          status: fraudAnalysis.status,
          count: sql`count(*)`,
        })
        .from(fraudAnalysis)
        .groupBy(fraudAnalysis.status);

      const suspiciousActivities = await db
        .select({ count: sql`count(*)` })
        .from(suspiciousActivities)
        .where(eq(suspiciousActivities.isInvestigated, false));

      const blacklistCount = await db
        .select({ count: sql`count(*)` })
        .from(blacklist)
        .where(eq(blacklist.isActive, true));

      return {
        recentSecurityEvents: recentEvents[0]?.count || 0,
        fraudCasesByStatus: fraudCases,
        pendingSuspiciousActivities: suspiciousActivities[0]?.count || 0,
        activeBlacklistEntries: blacklistCount[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error getting security dashboard:", error);
      throw error;
    }
  }

  // Removed duplicate methods - using existing implementations

  async verifyCode(verificationId: string, code: string) {
    try {
      const verification = await db
        .select()
        .from(userVerifications)
        .where(eq(userVerifications.id, verificationId))
        .limit(1);

      if (!verification[0]) {
        return { success: false, message: "Verification not found" };
      }

      const v = verification[0];

      if (v.status !== "pending") {
        return { success: false, message: "Verification already processed" };
      }

      if (v.expiresAt && new Date() > v.expiresAt) {
        return { success: false, message: "Verification code expired" };
      }

      if (v.verificationCode !== code) {
        return { success: false, message: "Invalid verification code" };
      }

      // Mark as verified
      await this.updateUserVerification(verificationId, {
        status: "verified",
      });

      return { success: true, message: "Verification successful" };
    } catch (error) {
      console.error("Error verifying code:", error);
      return { success: false, message: "Verification failed" };
    }
  }

  async computeVendorTrustScore(vendorId: string) {
    try {
      const vendor = await this.getVendor(vendorId);
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Calculate various trust score components
      const identityScore = await this.calculateVendorIdentityScore(vendorId);
      const activityScore = await this.calculateVendorActivityScore(vendorId);
      const reviewScore = await this.calculateVendorReviewScore(vendorId);
      const complianceScore = await this.calculateVendorComplianceScore(vendorId);
      const financialScore = await this.calculateVendorFinancialScore(vendorId);

      // Calculate overall score (weighted average)
      const weights = {
        identity: 0.25,
        activity: 0.2,
        review: 0.25,
        compliance: 0.15,
        financial: 0.15,
      };

      const overallScore =
        identityScore * weights.identity +
        activityScore * weights.activity +
        reviewScore * weights.review +
        complianceScore * weights.compliance +
        financialScore * weights.financial;

      // Identify risk flags
      const riskFlags = [];
      if (identityScore < 0.5) riskFlags.push("UNVERIFIED_IDENTITY");
      if (reviewScore < 0.3) riskFlags.push("POOR_REVIEWS");
      if (activityScore < 0.2) riskFlags.push("LOW_ACTIVITY");
      if (complianceScore < 0.4) riskFlags.push("COMPLIANCE_ISSUES");

      const trustScore = await this.updateVendorTrustScore(vendorId, {
        overallScore,
        identityScore,
        activityScore,
        reviewScore,
        complianceScore,
        financialScore,
        factors: {
          weights,
          calculations: {
            identity: "Based on verification status and business documents",
            activity: "Based on product listings, sales volume, and engagement",
            review: "Based on customer ratings and review quality",
            compliance: "Based on policy adherence and dispute resolution",
            financial: "Based on transaction history and payment reliability",
          },
        },
        riskFlags,
      });

      return trustScore;
    } catch (error) {
      console.error("Error computing vendor trust score:", error);
      throw error;
    }
  }

  // Helper methods for trust score calculation
  private async calculateVendorIdentityScore(vendorId: string): Promise<number> {
    // Check if vendor has verified business documents
    const verifications = await db
      .select()
      .from(userVerifications)
      .where(and(eq(userVerifications.userId, vendorId), eq(userVerifications.status, "verified")));

    const hasBusinessLicense = verifications.some((v) => v.verificationType === "business_license");
    const hasAddressProof = verifications.some((v) => v.verificationType === "address_proof");
    const hasIdentityDoc = verifications.some((v) => v.verificationType === "identity_document");

    let score = 0.2; // Base score
    if (hasBusinessLicense) score += 0.4;
    if (hasAddressProof) score += 0.2;
    if (hasIdentityDoc) score += 0.2;

    return Math.min(score, 1.0);
  }

  private async calculateVendorActivityScore(vendorId: string): Promise<number> {
    const products = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const recentOrders = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(
        and(
          sql`${orders.id} IN (SELECT DISTINCT order_id FROM order_items WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId}))`,
          gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      );

    const productCount = products[0]?.count || 0;
    const orderCount = recentOrders[0]?.count || 0;

    // Score based on activity levels
    let score = 0;
    if (productCount > 0) score += 0.3;
    if (productCount > 10) score += 0.2;
    if (productCount > 50) score += 0.2;
    if (orderCount > 0) score += 0.1;
    if (orderCount > 5) score += 0.1;
    if (orderCount > 20) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async calculateVendorReviewScore(vendorId: string): Promise<number> {
    const reviewStats = await db
      .select({
        avgRating: sql`AVG(CAST(${reviews.rating} AS DECIMAL))`,
        reviewCount: sql`COUNT(*)`,
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(eq(products.vendorId, vendorId));

    const stats = reviewStats[0];
    const avgRating = parseFloat(stats.avgRating as string) || 0;
    const reviewCount = parseInt(stats.reviewCount as string) || 0;

    if (reviewCount === 0) return 0.5; // Neutral score for no reviews

    // Score based on average rating and review volume
    let score = avgRating / 5; // Normalize to 0-1
    if (reviewCount > 10) score += 0.1;
    if (reviewCount > 50) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async calculateVendorComplianceScore(vendorId: string): Promise<number> {
    // Check for any policy violations or disputes
    // For now, return a base score (in production, check actual compliance data)
    return 0.8;
  }

  private async calculateVendorFinancialScore(vendorId: string): Promise<number> {
    // Check payment history and financial reliability
    const completedOrders = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(
        and(
          sql`${orders.id} IN (SELECT DISTINCT order_id FROM order_items WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId}))`,
          eq(orders.status, "delivered")
        )
      );

    const cancelledOrders = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(
        and(
          sql`${orders.id} IN (SELECT DISTINCT order_id FROM order_items WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId}))`,
          eq(orders.status, "cancelled")
        )
      );

    const completed = parseInt(completedOrders[0]?.count as string) || 0;
    const cancelled = parseInt(cancelledOrders[0]?.count as string) || 0;
    const total = completed + cancelled;

    if (total === 0) return 0.5; // Neutral score for no orders

    const completionRate = completed / total;
    return Math.min(completionRate + 0.2, 1.0); // Add base score
  }
}

export const storage = new DatabaseStorage();
