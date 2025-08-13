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
  type InsertReviewVote,
  type ReviewResponse,
  type InsertReviewResponse,
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
  getVendors(status?: "pending" | "approved" | "rejected" | "suspended"): Promise<Vendor[]>;
  updateVendorStatus(
    id: string,
    status: "pending" | "approved" | "rejected" | "suspended"
  ): Promise<Vendor>;

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
  voteOnReview(reviewId: string, userId: string, voteType: 'helpful' | 'not_helpful'): Promise<void>;
  getReviewVotes(reviewId: string): Promise<ReviewVote[]>;
  addVendorResponse(reviewId: string, vendorId: string, response: string): Promise<ReviewResponse>;
  getReviewResponses(reviewId: string): Promise<ReviewResponse[]>;
  getEnhancedReviews(productId: string): Promise<any[]>;

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
    // Delete in correct order to handle foreign key constraints

    // 1. Delete messages sent by this user
    await db.delete(messages).where(eq(messages.senderId, userId));

    // 2. Delete chat participants
    await db.delete(chatParticipants).where(eq(chatParticipants.userId, userId));

    // 3. Delete chat rooms created by this user (messages already deleted)
    await db.delete(chatRooms).where(eq(chatRooms.createdBy, userId));

    // 4. Delete reviews by this user
    await db.delete(reviews).where(eq(reviews.userId, userId));

    // 5. Delete cart items
    await db.delete(cart).where(eq(cart.userId, userId));

    // 6. Delete orders where user is customer (order items will be handled by cascade)
    await db.delete(orders).where(eq(orders.customerId, userId));

    // 7. Delete driver record if exists
    await db.delete(drivers).where(eq(drivers.userId, userId));

    // 8. Delete vendor record if exists (this might cascade to products)
    await db.delete(vendors).where(eq(vendors.userId, userId));

    // 9. Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
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

  async getVendors(status?: "pending" | "approved" | "rejected" | "suspended"): Promise<Vendor[]> {
    if (status) {
      return await db
        .select()
        .from(vendors)
        .where(eq(vendors.status, status))
        .orderBy(desc(vendors.createdAt));
    }
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
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
    if ((status === "rejected" || status === "suspended") && vendor) {
      await db
        .update(users)
        .set({ role: "customer", updatedAt: new Date() })
        .where(eq(users.id, vendor.userId));
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
    if ((status === "rejected" || status === "suspended") && driver) {
      await db
        .update(users)
        .set({ role: "customer", updatedAt: new Date() })
        .where(eq(users.id, driver.userId));
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

  async getPopularSearchTerms(limit: number = 10): Promise<{ term: string; count: number }[]> {
    // This would typically be implemented with a search_logs table
    // For now, return empty array - would need to implement search logging first
    return [];
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

  async voteOnReview(reviewId: string, userId: string, voteType: 'helpful' | 'not_helpful'): Promise<void> {
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
    const votes = await db
      .select()
      .from(reviewVotes)
      .where(eq(reviewVotes.reviewId, reviewId));

    const helpfulVotes = votes.filter(v => v.voteType === 'helpful').length;
    const totalVotes = votes.length;

    await db
      .update(reviews)
      .set({ helpfulVotes, totalVotes })
      .where(eq(reviews.id, reviewId));
  }

  async getReviewVotes(reviewId: string): Promise<ReviewVote[]> {
    return await db
      .select()
      .from(reviewVotes)
      .where(eq(reviewVotes.reviewId, reviewId));
  }

  async addVendorResponse(reviewId: string, vendorId: string, response: string): Promise<ReviewResponse> {
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
}

export const storage = new DatabaseStorage();
