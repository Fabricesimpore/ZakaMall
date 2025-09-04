import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { orderProtection } from "../security/SecurityMiddleware";
import { cacheMiddleware } from "../middleware/cacheMiddleware";
import { cacheService } from "../cache";
import { insertCartSchema } from "@shared/schema";
import { orderNotificationService } from "../notifications/orderNotifications";

/**
 * Cart and Order Routes
 * Handles shopping cart operations and order management
 */
export function setupCartOrderRoutes(app: Express) {
  // ============ CART ROUTES ============

  // Add item to cart
  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = insertCartSchema.parse({ ...req.body, userId });

      const cartItem = await storage.addToCart(cartData);

      // Invalidate cart cache after adding item
      await cacheService.del(`cart:${userId}`);
      console.log(`🗑️ Invalidated cart cache for user: ${userId}`);

      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  // Get user's cart items
  app.get(
    "/api/cart",
    isAuthenticated,
    cacheMiddleware({
      ttl: 180, // 3 minutes - short cache for cart data since it changes frequently
      keyGenerator: (req) => `cart:${(req as any).user.claims.sub}`,
    }),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const cartItems = await storage.getCartItems(userId);
        res.json(cartItems);
      } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Failed to fetch cart" });
      }
    }
  );

  // Update cart item quantity
  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const cartItem = await storage.updateCartItem(id, quantity);

      // Invalidate cart cache after updating item
      const userId = req.user.claims.sub;
      await cacheService.del(`cart:${userId}`);
      console.log(`🗑️ Invalidated cart cache for user: ${userId}`);

      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);

      // Invalidate cart cache after removing item
      const userId = req.user.claims.sub;
      await cacheService.del(`cart:${userId}`);
      console.log(`🗑️ Invalidated cart cache for user: ${userId}`);

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Clear entire cart
  app.delete("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);

      // Invalidate cart cache after clearing
      await cacheService.del(`cart:${userId}`);
      console.log(`🗑️ Invalidated cart cache for user: ${userId}`);

      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // ============ ORDER ROUTES ============

  // Create new order
  app.post("/api/orders", isAuthenticated, orderProtection, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, ...orderData } = req.body;

      const order = await storage.createOrder({ ...orderData, customerId: userId }, items);

      // Clear cart after successful order
      await storage.clearCart(userId);

      // Invalidate user's orders and cart cache after creating order
      await Promise.all([cacheService.del(`orders:${userId}`), cacheService.del(`cart:${userId}`)]);
      console.log(`🗑️ Invalidated orders and cart cache for user: ${userId}`);

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
              vendor: vendorUser,
              items: itemsWithDetails,
            },
          };

          // Send notifications
          await orderNotificationService.sendOrderConfirmationToCustomer(notificationData);
          await orderNotificationService.sendNewOrderNotificationToVendor(notificationData);
        } catch (notificationError) {
          console.error("Error sending order notifications:", notificationError);
        }
      }, 1000);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get orders (admin/vendor view)
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const filters: any = {};

      // Apply filters based on user role
      if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        if (vendor) {
          filters.vendorId = vendor.id;
        }
      } else if (user?.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver) {
          filters.driverId = driver.id;
        }
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get user's orders
  app.get(
    "/api/orders/my-orders",
    isAuthenticated,
    cacheMiddleware({
      ttl: 300, // 5 minutes - orders don't change very frequently
      keyGenerator: (req) => `orders:${(req as any).user.claims.sub}`,
    }),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const orders = await storage.getOrdersWithDetails(userId);
        res.json(orders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    }
  );

  // Get single order details
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

  // Update order status
  app.patch("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify user has permission to update this order
      const user = await storage.getUser(userId);
      let hasPermission = false;

      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === order.vendorId;
      } else if (user?.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        hasPermission = driver?.id === order.driverId;
      }

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to update this order" });
      }

      await storage.updateOrderStatus(id, status);

      // Send status update notification
      setTimeout(async () => {
        try {
          const updatedOrder = await storage.getOrder(id);
          const customer = await storage.getUser(order.customerId);
          const vendor = await storage.getVendor(order.vendorId);
          const vendorUser = vendor ? await storage.getUser(vendor.userId) : null;

          const notificationData = {
            order: {
              ...updatedOrder,
              customer,
              vendor: vendorUser,
            },
          };

          await orderNotificationService.sendOrderStatusUpdateToCustomer(notificationData);
        } catch (notificationError) {
          console.error("Error sending status update notification:", notificationError);
        }
      }, 1000);

      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Assign driver to order
  app.patch("/api/orders/:id/assign-driver", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      const userId = req.user.claims.sub;

      // Verify user has permission (admin or vendor who owns the order)
      const user = await storage.getUser(userId);
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      let hasPermission = false;
      if (user?.role === "admin") {
        hasPermission = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasPermission = vendor?.id === order.vendorId;
      }

      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to assign driver to this order" });
      }

      await storage.assignDriverToOrder(id, driverId);
      res.json({ message: "Driver assigned successfully" });
    } catch (error) {
      console.error("Error assigning driver:", error);
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  // Alternative assign driver endpoint
  app.post("/api/orders/:id/assign-driver", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;

      await storage.assignDriverToOrder(id, driverId);
      res.json({ message: "Driver assigned to order successfully" });
    } catch (error) {
      console.error("Error assigning driver to order:", error);
      res.status(500).json({ message: "Failed to assign driver to order" });
    }
  });

  // Auto-assign available driver
  app.post("/api/orders/auto-assign", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      // Find available drivers
      const availableDrivers = await storage.getAvailableDrivers();

      if (availableDrivers.length === 0) {
        return res.status(404).json({ message: "No available drivers found" });
      }

      // Assign the first available driver
      const driver = availableDrivers[0];
      await storage.assignDriverToOrder(orderId, driver.id);

      res.json({
        message: "Driver auto-assigned successfully",
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone,
        },
      });
    } catch (error) {
      console.error("Error auto-assigning driver:", error);
      res.status(500).json({ message: "Failed to auto-assign driver" });
    }
  });

  // Get order payments
  app.get("/api/orders/:orderId/payments", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user has access to this order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      let hasAccess = false;

      if (user?.role === "admin") {
        hasAccess = true;
      } else if (order.customerId === userId) {
        hasAccess = true;
      } else if (user?.role === "vendor") {
        const vendor = await storage.getVendorByUserId(userId);
        hasAccess = vendor?.id === order.vendorId;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to view payments for this order" });
      }

      const payments = await storage.getOrderPayments(orderId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching order payments:", error);
      res.status(500).json({ message: "Failed to fetch order payments" });
    }
  });
}
