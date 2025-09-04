import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { PaymentServiceFactory } from "../paymentService";

/**
 * Payment Routes
 * Handles payment processing, callbacks, and payment status
 */
export function setupPaymentRoutes(app: Express) {

  // ============ TEST PAYMENT ROUTES ============

  // Test Orange Money payment
  app.post("/api/test/payments/orange-money", async (req, res) => {
    try {
      const { amount, customerPhone } = req.body;
      
      // Simulate Orange Money API
      const mockPayment = {
        id: `test_om_${Date.now()}`,
        amount,
        customerPhone,
        status: "pending",
        provider: "orange-money",
        transactionId: `OM${Date.now()}`,
      };

      console.log("🧪 Test Orange Money payment initiated:", mockPayment);
      res.json(mockPayment);
    } catch (error) {
      console.error("Test Orange Money payment error:", error);
      res.status(500).json({ message: "Payment initiation failed" });
    }
  });

  // Test Moov Money payment
  app.post("/api/test/payments/moov-money", async (req, res) => {
    try {
      const { amount, customerPhone } = req.body;
      
      // Simulate Moov Money API
      const mockPayment = {
        id: `test_mm_${Date.now()}`,
        amount,
        customerPhone,
        status: "pending",
        provider: "moov-money",
        transactionId: `MM${Date.now()}`,
      };

      console.log("🧪 Test Moov Money payment initiated:", mockPayment);
      res.json(mockPayment);
    } catch (error) {
      console.error("Test Moov Money payment error:", error);
      res.status(500).json({ message: "Payment initiation failed" });
    }
  });

  // Test cash on delivery
  app.post("/api/test/payments/cash-on-delivery", async (req, res) => {
    try {
      const { amount, orderId } = req.body;
      
      const mockPayment = {
        id: `test_cod_${Date.now()}`,
        amount,
        orderId,
        status: "confirmed", // COD is always confirmed
        provider: "cash-on-delivery",
        transactionId: `COD${Date.now()}`,
      };

      console.log("🧪 Test COD payment confirmed:", mockPayment);
      res.json(mockPayment);
    } catch (error) {
      console.error("Test COD payment error:", error);
      res.status(500).json({ message: "COD payment failed" });
    }
  });

  // Test payment status
  app.get("/api/test/payments/:paymentId/status", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      // Simulate status check
      const mockStatus = {
        id: paymentId,
        status: Math.random() > 0.5 ? "completed" : "pending",
        updatedAt: new Date().toISOString(),
      };

      console.log("🧪 Test payment status:", mockStatus);
      res.json(mockStatus);
    } catch (error) {
      console.error("Test payment status error:", error);
      res.status(500).json({ message: "Status check failed" });
    }
  });

  // ============ PRODUCTION PAYMENT ROUTES ============

  // Initiate payment
  app.post("/api/payments/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, paymentMethod, customerPhone } = req.body;
      const userId = req.user.claims.sub;

      if (!orderId || !paymentMethod) {
        return res.status(400).json({ message: "Order ID and payment method are required" });
      }

      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ message: "Not authorized for this order" });
      }

      // Get payment service
      const paymentService = PaymentServiceFactory.getService(paymentMethod);
      
      try {
        const paymentResult = await paymentService.initiatePayment({
          orderId,
          amount: parseFloat(order.totalAmount),
          customerPhone,
          currency: order.currency || "XOF",
        });

        // Save payment record
        const payment = await storage.createPayment({
          orderId,
          paymentMethod,
          amount: order.totalAmount,
          currency: order.currency || "XOF",
          status: "pending",
          providerTransactionId: paymentResult.transactionId,
          customerPhone,
        });

        console.log(`💰 Payment initiated: ${paymentMethod} for order ${orderId}`);
        res.json({
          paymentId: payment.id,
          status: payment.status,
          redirectUrl: paymentResult.redirectUrl,
          transactionId: paymentResult.transactionId,
        });
      } catch (providerError: any) {
        console.error(`Payment provider error (${paymentMethod}):`, providerError);
        res.status(500).json({ 
          message: "Payment initiation failed",
          error: providerError.message 
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ message: "Payment initiation failed" });
    }
  });

  // Check payment status
  app.get("/api/payments/:paymentId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.claims.sub;

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Verify user has access to this payment
      const order = await storage.getOrder(payment.orderId);
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ message: "Not authorized for this payment" });
      }

      // Check with payment provider for latest status
      try {
        const paymentService = PaymentServiceFactory.getService(payment.paymentMethod);
        const providerStatus = await paymentService.checkPaymentStatus(payment.providerTransactionId);

        // Update payment status if changed
        if (providerStatus.status !== payment.status) {
          await storage.updatePaymentStatus(paymentId, providerStatus.status);
          
          // Update order status if payment completed
          if (providerStatus.status === "completed") {
            await storage.updateOrderStatus(payment.orderId, "confirmed");
          }
        }

        res.json({
          paymentId,
          status: providerStatus.status,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          updatedAt: providerStatus.updatedAt,
        });
      } catch (providerError) {
        console.error("Payment status check error:", providerError);
        // Return cached status if provider check fails
        res.json({
          paymentId,
          status: payment.status,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
        });
      }
    } catch (error) {
      console.error("Payment status error:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // ============ PAYMENT PROVIDER CALLBACKS ============

  // Orange Money webhook/notification
  app.post("/api/payments/orange-money/notify", async (req, res) => {
    try {
      const { transactionId, status, amount } = req.body;

      console.log("🔔 Orange Money notification:", { transactionId, status, amount });

      // Find payment by provider transaction ID
      const payment = await storage.getPaymentByProviderTxnId(transactionId);
      if (!payment) {
        console.warn(`⚠️ Orange Money notification for unknown transaction: ${transactionId}`);
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update payment status
      await storage.updatePaymentStatus(payment.id, status);

      // Update order status if payment completed
      if (status === "completed") {
        await storage.updateOrderStatus(payment.orderId, "confirmed");
        console.log(`✅ Order ${payment.orderId} confirmed via Orange Money`);
      }

      res.json({ message: "Notification processed" });
    } catch (error) {
      console.error("Orange Money notification error:", error);
      res.status(500).json({ message: "Notification processing failed" });
    }
  });

  // Orange Money success callback
  app.get("/api/payments/orange-money/callback", async (req, res) => {
    try {
      const { transactionId, status } = req.query;
      
      console.log("✅ Orange Money callback:", { transactionId, status });

      // Redirect user to appropriate page
      const redirectUrl = status === "success" 
        ? `/orders/success?transaction=${transactionId}`
        : `/orders/failed?transaction=${transactionId}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Orange Money callback error:", error);
      res.redirect("/orders/failed");
    }
  });

  // Orange Money cancel callback
  app.get("/api/payments/orange-money/cancel", async (req, res) => {
    try {
      const { transactionId } = req.query;
      
      console.log("❌ Orange Money payment cancelled:", transactionId);
      res.redirect(`/orders/cancelled?transaction=${transactionId}`);
    } catch (error) {
      console.error("Orange Money cancel error:", error);
      res.redirect("/orders/failed");
    }
  });

  // Moov Money webhook/callback
  app.post("/api/payments/moov-money/callback", async (req, res) => {
    try {
      const { transactionId, status, amount } = req.body;

      console.log("🔔 Moov Money callback:", { transactionId, status, amount });

      // Find payment by provider transaction ID
      const payment = await storage.getPaymentByProviderTxnId(transactionId);
      if (!payment) {
        console.warn(`⚠️ Moov Money callback for unknown transaction: ${transactionId}`);
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update payment status
      await storage.updatePaymentStatus(payment.id, status);

      // Update order status if payment completed
      if (status === "completed") {
        await storage.updateOrderStatus(payment.orderId, "confirmed");
        console.log(`✅ Order ${payment.orderId} confirmed via Moov Money`);
      }

      res.json({ message: "Callback processed" });
    } catch (error) {
      console.error("Moov Money callback error:", error);
      res.status(500).json({ message: "Callback processing failed" });
    }
  });

  // Duplicate payment initiation endpoint (appears twice in original)
  app.post("/api/payments/initiate", isAuthenticated, async (req: any, res) => {
    // This appears to be a duplicate - keeping for compatibility
    // Implementation would be the same as above
    res.status(501).json({ message: "Duplicate endpoint - use primary payment initiation" });
  });

  // Duplicate payment status endpoint
  app.get("/api/payments/:paymentId/status", isAuthenticated, async (req: any, res) => {
    // This appears to be a duplicate - keeping for compatibility
    res.status(501).json({ message: "Duplicate endpoint - use primary payment status" });
  });

  // Duplicate Orange Money notification endpoint
  app.post("/api/payments/orange-money/notify", async (req, res) => {
    // This appears to be a duplicate - keeping for compatibility
    res.status(501).json({ message: "Duplicate endpoint - use primary Orange Money notification" });
  });

  // Duplicate Moov Money callback endpoint
  app.post("/api/payments/moov-money/callback", async (req, res) => {
    // This appears to be a duplicate - keeping for compatibility
    res.status(501).json({ message: "Duplicate endpoint - use primary Moov Money callback" });
  });
}