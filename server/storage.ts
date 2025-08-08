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
  chatRooms,
  chatParticipants,
  messages,
  payments,
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
  type ChatRoom,
  type InsertChatRoom,
  type ChatParticipant,
  type InsertChatParticipant,
  type Message,
  type InsertMessage,
  type Payment,
  type InsertPayment,
  type PhoneVerification,
  type InsertPhoneVerification,
  type EmailVerification,
  type InsertEmailVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, count, avg, sum, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithPhone(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: 'customer' | 'vendor' | 'driver' | 'admin'): Promise<User>;
  
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
  getPendingUser(identifier: string): Promise<any>;  // Changed from phone to identifier to support both
  deletePendingUser(identifier: string): Promise<void>;
  
  // Vendor operations
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  getVendors(status?: 'pending' | 'approved' | 'rejected' | 'suspended'): Promise<Vendor[]>;
  updateVendorStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'suspended'): Promise<Vendor>;
  
  // Driver operations
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  getAvailableDrivers(): Promise<Driver[]>;
  updateDriverLocation(id: string, lat: number, lng: number): Promise<Driver>;
  updateDriverStatus(id: string, isOnline: boolean): Promise<Driver>;
  
  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductById(id: string): Promise<Product | undefined>;
  getProducts(filters?: { vendorId?: string; categoryId?: string; search?: string; limit?: number }): Promise<Product[]>;
  getVendorProducts(vendorId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<Product>;
  updateProductImages(id: string, images: string[]): Promise<Product>;
  
  // Cart operations
  addToCart(item: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrders(filters?: { customerId?: string; vendorId?: string; driverId?: string; status?: string }): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  assignOrderToDriver(orderId: string, driverId: string): Promise<Order>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: string): Promise<Review[]>;
  
  // Analytics
  getVendorStats(vendorId: string): Promise<{
    totalSales: number;
    monthlyOrders: number;
    totalProducts: number;
    averageRating: number;
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
  isUserInChatRoom(userId: string, chatRoomId: string): Promise<boolean>;
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatRoomId: string, limit?: number, offset?: number): Promise<Message[]>;
  searchUsers(query: string): Promise<User[]>;
  getChatRoomParticipants(chatRoomId: string): Promise<ChatParticipant[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getOrderPayments(orderId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'refunded', failureReason?: string): Promise<Payment>;
  updatePaymentTransaction(id: string, transactionId: string, operatorReference?: string): Promise<Payment>;
  markMessagesAsRead(userId: string, chatRoomId: string): Promise<void>;
  incrementUnreadCount(chatRoomId: string, excludeUserId: string): Promise<void>;
  getTotalUnreadCount(userId: string): Promise<number>;
}

// Temporary in-memory storage for pending users (use Redis in production)
const pendingUsers = new Map<string, any>();

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
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createUserWithPhone(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: 'customer' | 'vendor' | 'driver' | 'admin'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Vendor operations
  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db
      .insert(vendors)
      .values(vendorData)
      .returning();
    return vendor;
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, userId));
    return vendor;
  }

  async getVendors(status?: 'pending' | 'approved' | 'rejected' | 'suspended'): Promise<Vendor[]> {
    if (status) {
      return await db
        .select()
        .from(vendors)
        .where(eq(vendors.status, status))
        .orderBy(desc(vendors.createdAt));
    }
    return await db
      .select()
      .from(vendors)
      .orderBy(desc(vendors.createdAt));
  }

  async updateVendorStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'suspended'): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({ status, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  // Driver operations
  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db
      .insert(drivers)
      .values(driverData)
      .returning();
    return driver;
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, userId));
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
        updatedAt: new Date() 
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

  // Category operations
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
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
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  // Product operations
  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProducts(filters?: { vendorId?: string; categoryId?: string; search?: string; limit?: number }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];

    if (filters?.vendorId) {
      conditions.push(eq(products.vendorId, filters.vendorId));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.description, `%${filters.search}%`)
        )
      );
    }

    let query = db.select().from(products);
    
    let result = db.select().from(products);
    
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      result = result.where(whereCondition);
    }
    
    result = result.orderBy(desc(products.createdAt));
    
    if (filters?.limit) {
      result = result.limit(filters.limit);
    }

    return await result;
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

  async updateProductStock(id: string, quantity: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
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
          updatedAt: new Date() 
        })
        .where(eq(cart.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db
        .insert(cart)
        .values(itemData)
        .returning();
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

    return result.map(row => ({
      ...row.cart,
      product: row.products!
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
    const orderNumber = `ZK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [order] = await db
      .insert(orders)
      .values({ ...orderData, orderNumber })
      .returning();

    // Insert order items
    const orderItemsWithOrderId = items.map(item => ({ ...item, orderId: order.id }));
    await db.insert(orderItems).values(orderItemsWithOrderId);

    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrders(filters?: { customerId?: string; vendorId?: string; driverId?: string; status?: string }): Promise<Order[]> {
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
      conditions.push(eq(orders.status, filters.status as any));
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

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
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
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    return review;
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
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
      .where(and(
        eq(orders.vendorId, vendorId),
        eq(orders.createdAt, monthStart)
      ));

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
      .where(and(
        eq(orders.driverId, driverId),
        eq(orders.createdAt, today)
      ));

    const [deliveriesResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        eq(orders.driverId, driverId),
        eq(orders.status, 'delivered')
      ));

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
      .where(eq(vendors.status, 'approved'));

    const [ordersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.createdAt, today));

    const [revenueResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders);

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
    const [chatRoom] = await db
      .insert(chatRooms)
      .values(chatRoomData)
      .returning();
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
    return rooms.map(room => ({ ...room, unreadCount: room.unreadCount || 0 }));
  }

  async addChatParticipant(participantData: InsertChatParticipant): Promise<ChatParticipant> {
    const [participant] = await db
      .insert(chatParticipants)
      .values(participantData)
      .returning();
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
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    
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
        unreadCount: 0
      })
      .where(and(
        eq(chatParticipants.userId, userId),
        eq(chatParticipants.chatRoomId, chatRoomId)
      ));
  }

  async incrementUnreadCount(chatRoomId: string, excludeUserId: string): Promise<void> {
    const participants = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatRoomId, chatRoomId),
        sql`${chatParticipants.userId} != ${excludeUserId}`
      ));
    
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
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
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
    status: 'pending' | 'completed' | 'failed' | 'refunded', 
    failureReason?: string
  ): Promise<Payment> {
    const updateData: any = { 
      status, 
      updatedAt: new Date(),
      processedAt: status !== 'pending' ? new Date() : null
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
    const updateData: any = {
      transactionId,
      updatedAt: new Date()
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
  async createPhoneVerification(verificationData: InsertPhoneVerification): Promise<PhoneVerification> {
    const [verification] = await db
      .insert(phoneVerifications)
      .values(verificationData)
      .returning();
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
    await db
      .update(phoneVerifications)
      .set({ isUsed: true })
      .where(eq(phoneVerifications.id, id));
  }

  // Email verification operations
  async createEmailVerification(verificationData: InsertEmailVerification): Promise<EmailVerification> {
    const [verification] = await db
      .insert(emailVerifications)
      .values(verificationData)
      .returning();
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
    await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(eq(emailVerifications.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithEmail(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Temporary pending user storage
  async storePendingUser(userData: any): Promise<void> {
    const key = userData.phone || userData.email;
    pendingUsers.set(key, userData);
  }

  async getPendingUser(identifier: string): Promise<any> {
    return pendingUsers.get(identifier);
  }

  async deletePendingUser(identifier: string): Promise<void> {
    pendingUsers.delete(identifier);
  }
}

export const storage = new DatabaseStorage();
