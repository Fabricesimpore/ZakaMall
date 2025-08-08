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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, count, avg, sum } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: 'customer' | 'vendor' | 'driver' | 'admin'): Promise<User>;
  
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
  getProducts(filters?: { vendorId?: string; categoryId?: string; search?: string; limit?: number }): Promise<Product[]>;
  getVendorProducts(vendorId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<Product>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    let query = db.select().from(vendors);
    if (status) {
      query = query.where(eq(vendors.status, status));
    }
    return await query.orderBy(desc(vendors.createdAt));
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
    let query = db.select().from(products).where(eq(products.isActive, true));

    if (filters?.vendorId) {
      query = query.where(eq(products.vendorId, filters.vendorId));
    }

    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      query = query.where(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query.orderBy(desc(products.createdAt));
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
    let query = db.select().from(orders);

    if (filters?.customerId) {
      query = query.where(eq(orders.customerId, filters.customerId));
    }

    if (filters?.vendorId) {
      query = query.where(eq(orders.vendorId, filters.vendorId));
    }

    if (filters?.driverId) {
      query = query.where(eq(orders.driverId, filters.driverId));
    }

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status as any));
    }

    return await query.orderBy(desc(orders.createdAt));
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
}

export const storage = new DatabaseStorage();
