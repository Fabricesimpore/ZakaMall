/**
 * Order-specific email notification service
 * Handles transactional emails for order lifecycle events
 */

import { emailService } from "../emailService";
import type { Order, User } from "@shared/schema";
import { formatMoney } from "../utils/money";

export interface OrderNotificationData {
  order: Order & {
    items?: Array<{
      productName: string;
      quantity: number;
      price: string;
      totalPrice: string;
    }>;
    customer?: User;
    vendor?: User & { businessName?: string };
    driver?: User & {
      firstName: string;
      lastName: string;
      vehicleType?: string;
      vehicleColor?: string;
      vehiclePlate?: string;
    };
  };
}

export class OrderNotificationService {
  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(data: OrderNotificationData): Promise<boolean> {
    if (!data.order.customer?.email) {
      console.warn(
        `Cannot send order confirmation: customer email missing for order ${data.order.id}`
      );
      return false;
    }

    const subject = `Confirmation de commande ${data.order.orderNumber} - ZakaMall`;
    const html = this.generateOrderConfirmationTemplate(data);
    const text = this.generateOrderConfirmationText(data);

    try {
      const success = await emailService.sendCustomEmail({
        to: data.order.customer.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(
          `✅ Order confirmation sent to ${data.order.customer.email} for order ${data.order.orderNumber}`
        );
      }

      return success;
    } catch (error) {
      console.error(`Failed to send order confirmation:`, error);
      return false;
    }
  }

  /**
   * Send order status update email to customer
   */
  async sendStatusUpdate(
    data: OrderNotificationData,
    newStatus: string,
    message?: string
  ): Promise<boolean> {
    if (!data.order.customer?.email) {
      console.warn(`Cannot send status update: customer email missing for order ${data.order.id}`);
      return false;
    }

    const statusLabels: Record<string, string> = {
      confirmed: "Confirmée",
      preparing: "En préparation",
      ready_for_pickup: "Prête pour enlèvement",
      in_transit: "En livraison",
      delivered: "Livrée",
      cancelled: "Annulée",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    const subject = `Commande ${data.order.orderNumber} ${statusLabel} - ZakaMall`;
    const html = this.generateStatusUpdateTemplate(data, statusLabel, message);
    const text = this.generateStatusUpdateText(data, statusLabel, message);

    try {
      const success = await emailService.sendCustomEmail({
        to: data.order.customer.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(
          `✅ Status update sent to ${data.order.customer.email} for order ${data.order.orderNumber}: ${statusLabel}`
        );
      }

      return success;
    } catch (error) {
      console.error(`Failed to send status update:`, error);
      return false;
    }
  }

  /**
   * Send driver assignment notification to customer
   */
  async sendDriverAssignmentNotification(data: OrderNotificationData): Promise<boolean> {
    if (!data.order.customer?.email || !data.order.driver) {
      console.warn(
        `Cannot send driver assignment: missing email or driver info for order ${data.order.id}`
      );
      return false;
    }

    const subject = `Livreur assigné pour votre commande ${data.order.orderNumber} - ZakaMall`;
    const html = this.generateDriverAssignmentTemplate(data);
    const text = this.generateDriverAssignmentText(data);

    try {
      const success = await emailService.sendCustomEmail({
        to: data.order.customer.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(
          `✅ Driver assignment sent to ${data.order.customer.email} for order ${data.order.orderNumber}`
        );
      }

      return success;
    } catch (error) {
      console.error(`Failed to send driver assignment notification:`, error);
      return false;
    }
  }

  /**
   * Send new order notification to vendor
   */
  async sendVendorOrderNotification(data: OrderNotificationData): Promise<boolean> {
    if (!data.order.vendor?.email) {
      console.warn(
        `Cannot send vendor notification: vendor email missing for order ${data.order.id}`
      );
      return false;
    }

    const subject = `Nouvelle commande ${data.order.orderNumber} - ZakaMall`;
    const html = this.generateVendorOrderTemplate(data);
    const text = this.generateVendorOrderText(data);

    try {
      const success = await emailService.sendCustomEmail({
        to: data.order.vendor.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(
          `✅ Vendor notification sent to ${data.order.vendor.email} for order ${data.order.orderNumber}`
        );
      }

      return success;
    } catch (error) {
      console.error(`Failed to send vendor notification:`, error);
      return false;
    }
  }

  /**
   * Send low stock alert to vendor
   */
  async sendLowStockAlert(
    vendorEmail: string,
    vendorName: string,
    products: Array<{ name: string; quantity: number; threshold: number }>
  ): Promise<boolean> {
    const subject = `Alerte stock faible - ${products.length} produit(s) - ZakaMall`;
    const html = this.generateLowStockTemplate(vendorName, products);
    const text = this.generateLowStockText(vendorName, products);

    try {
      const success = await emailService.sendCustomEmail({
        to: vendorEmail,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(`✅ Low stock alert sent to ${vendorEmail} for ${products.length} products`);
      }

      return success;
    } catch (error) {
      console.error(`Failed to send low stock alert:`, error);
      return false;
    }
  }

  // Template generators
  private generateOrderConfirmationTemplate(data: OrderNotificationData): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";
    const itemsTotal = order.totalAmount ? parseFloat(order.totalAmount.toString()) : 0;
    const deliveryFee = order.deliveryFee ? parseFloat(order.deliveryFee.toString()) : 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .order-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
          .total { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .status-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #28a745; margin: 0;">ZakaMall</h1>
            <p style="margin: 10px 0 0 0;">Marketplace du Burkina Faso</p>
          </div>
          
          <h2>Confirmation de commande</h2>
          
          <div class="order-info">
            <p><strong>Bonjour ${customerName},</strong></p>
            <p>Merci pour votre commande ! Voici les détails :</p>
            
            <p><strong>Numéro de commande :</strong> <span class="status-badge">${order.orderNumber}</span></p>
            <p><strong>Date :</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}</p>
            <p><strong>Statut :</strong> En attente de confirmation</p>
          </div>

          ${
            order.items && order.items.length > 0
              ? `
          <div class="items">
            <h3>Articles commandés :</h3>
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <div>
                  <strong>${item.productName}</strong><br>
                  <small>Quantité: ${item.quantity}</small>
                </div>
                <div style="text-align: right;">
                  <strong>${formatMoney(item.totalPrice)}</strong><br>
                  <small>${formatMoney(item.price)} × ${item.quantity}</small>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          <div class="total">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Sous-total articles :</span>
              <span>${formatMoney(itemsTotal - deliveryFee)}</span>
            </div>
            ${
              deliveryFee > 0
                ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Frais de livraison :</span>
              <span>${formatMoney(deliveryFee)}</span>
            </div>
            `
                : ""
            }
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; padding-top: 10px;">
              <span>Total :</span>
              <span>${formatMoney(itemsTotal)}</span>
            </div>
          </div>

          ${
            order.deliveryAddress
              ? `
          <div class="order-info">
            <h4>Adresse de livraison :</h4>
            <p>${(() => {
              if (typeof order.deliveryAddress === "string") return order.deliveryAddress;
              if (order.deliveryAddress && typeof order.deliveryAddress === "object") {
                return (order.deliveryAddress as any)?.address || "Adresse non spécifiée";
              }
              return "Adresse non spécifiée";
            })()}</p>
          </div>
          `
              : ""
          }

          <div class="order-info">
            <h4>Prochaines étapes :</h4>
            <p>1. Votre commande va être confirmée par le vendeur</p>
            <p>2. Une fois confirmée, elle sera préparée</p>
            <p>3. Un livreur sera assigné pour la livraison</p>
            <p>4. Vous recevrez une notification à chaque étape</p>
          </div>
          
          <div class="footer">
            <p>Merci d'utiliser ZakaMall - votre marketplace local au Burkina Faso</p>
            <p>Des questions ? Contactez-nous : support@zakamall.bf</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOrderConfirmationText(data: OrderNotificationData): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";

    let text = `Confirmation de commande ZakaMall\\n\\n`;
    text += `Bonjour ${customerName},\\n\\n`;
    text += `Merci pour votre commande ${order.orderNumber} !\\n\\n`;
    text += `Date: ${new Date(order.createdAt || new Date()).toLocaleDateString("fr-FR")}\\n`;
    text += `Total: ${formatMoney(order.totalAmount || 0)}\\n\\n`;

    if (order.items && order.items.length > 0) {
      text += `Articles commandés:\\n`;
      order.items.forEach((item) => {
        text += `- ${item.productName} (x${item.quantity}): ${formatMoney(item.totalPrice)}\\n`;
      });
      text += `\\n`;
    }

    text += `Votre commande va être confirmée par le vendeur.\\n`;
    text += `Vous recevrez une notification à chaque étape.\\n\\n`;
    text += `Merci d'utiliser ZakaMall !`;

    return text;
  }

  private generateStatusUpdateTemplate(
    data: OrderNotificationData,
    statusLabel: string,
    message?: string
  ): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";

    const statusColors: Record<string, string> = {
      Confirmée: "#28a745",
      "En préparation": "#ffc107",
      "Prête pour enlèvement": "#17a2b8",
      "En livraison": "#007bff",
      Livrée: "#28a745",
      Annulée: "#dc3545",
    };

    const color = statusColors[statusLabel] || "#6c757d";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .status-update { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .order-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #007bff; margin: 0;">ZakaMall</h1>
          </div>
          
          <div class="status-update">
            <h2 style="margin: 0 0 10px 0;">Commande ${statusLabel}</h2>
            <p style="margin: 0; font-size: 18px;">${order.orderNumber}</p>
          </div>
          
          <p>Bonjour ${customerName},</p>
          
          <p>Le statut de votre commande a été mis à jour : <strong>${statusLabel}</strong></p>
          
          ${message ? `<div class="order-info"><p><strong>Message :</strong> ${message}</p></div>` : ""}
          
          <div class="order-info">
            <p><strong>Numéro de commande :</strong> ${order.orderNumber}</p>
            <p><strong>Total :</strong> ${formatMoney(order.totalAmount || 0)}</p>
            <p><strong>Date de commande :</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString("fr-FR")}</p>
          </div>

          ${
            statusLabel === "En livraison" && order.driver
              ? `
          <div class="order-info">
            <h4>Informations livreur :</h4>
            <p><strong>Nom :</strong> ${order.driver.firstName} ${order.driver.lastName}</p>
            ${order.driver.vehicleType ? `<p><strong>Véhicule :</strong> ${order.driver.vehicleType} ${order.driver.vehicleColor || ""}</p>` : ""}
            ${order.driver.vehiclePlate ? `<p><strong>Plaque :</strong> ${order.driver.vehiclePlate}</p>` : ""}
          </div>
          `
              : ""
          }
          
          <div class="footer">
            <p>Merci d'utiliser ZakaMall !</p>
            <p>Des questions ? Contactez-nous : support@zakamall.bf</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateStatusUpdateText(
    data: OrderNotificationData,
    statusLabel: string,
    message?: string
  ): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";

    let text = `Mise à jour de commande ZakaMall\\n\\n`;
    text += `Bonjour ${customerName},\\n\\n`;
    text += `Votre commande ${order.orderNumber} est maintenant : ${statusLabel}\\n\\n`;

    if (message) {
      text += `Message: ${message}\\n\\n`;
    }

    if (statusLabel === "En livraison" && order.driver) {
      text += `Informations livreur:\\n`;
      text += `Nom: ${order.driver.firstName} ${order.driver.lastName}\\n`;
      if (order.driver.vehicleType) {
        text += `Véhicule: ${order.driver.vehicleType} ${order.driver.vehicleColor || ""}\\n`;
      }
      text += `\\n`;
    }

    text += `Total: ${formatMoney(order.totalAmount || 0)}\\n\\n`;
    text += `Merci d'utiliser ZakaMall !`;

    return text;
  }

  private generateDriverAssignmentTemplate(data: OrderNotificationData): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Livreur assigné - Commande ${order.orderNumber}</h2>
          
          <p>Bonjour ${customerName},</p>
          
          <p>Bonne nouvelle ! Un livreur a été assigné à votre commande.</p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Informations livreur :</h4>
            <p><strong>Nom :</strong> ${order.driver!.firstName} ${order.driver!.lastName}</p>
            ${order.driver!.vehicleType ? `<p><strong>Véhicule :</strong> ${order.driver!.vehicleType} ${order.driver!.vehicleColor || ""}</p>` : ""}
            ${order.driver!.vehiclePlate ? `<p><strong>Plaque :</strong> ${order.driver!.vehiclePlate}</p>` : ""}
          </div>
          
          <p>Votre commande sera bientôt en route !</p>
          
          <p>Merci d'utiliser ZakaMall !</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateDriverAssignmentText(data: OrderNotificationData): string {
    const { order } = data;
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "Client";

    let text = `Livreur assigné - ZakaMall\\n\\n`;
    text += `Bonjour ${customerName},\\n\\n`;
    text += `Un livreur a été assigné à votre commande ${order.orderNumber}.\\n\\n`;
    text += `Livreur: ${order.driver!.firstName} ${order.driver!.lastName}\\n`;

    if (order.driver!.vehicleType) {
      text += `Véhicule: ${order.driver!.vehicleType} ${order.driver!.vehicleColor || ""}\\n`;
    }

    text += `\\nVotre commande sera bientôt en route !\\n\\n`;
    text += `Merci d'utiliser ZakaMall !`;

    return text;
  }

  private generateVendorOrderTemplate(data: OrderNotificationData): string {
    const { order } = data;
    const vendorName =
      order.vendor?.businessName ||
      `${order.vendor?.firstName} ${order.vendor?.lastName}` ||
      "Vendeur";

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Nouvelle commande - ${order.orderNumber}</h2>
          
          <p>Bonjour ${vendorName},</p>
          
          <p>Vous avez reçu une nouvelle commande !</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Commande :</strong> ${order.orderNumber}</p>
            <p><strong>Client :</strong> ${order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Client"}</p>
            <p><strong>Total :</strong> ${formatMoney(order.totalAmount || 0)}</p>
            <p><strong>Date :</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString("fr-FR")}</p>
          </div>

          ${
            order.items && order.items.length > 0
              ? `
          <h4>Articles commandés :</h4>
          ${order.items
            .map(
              (item) => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
              <strong>${item.productName}</strong> - Quantité: ${item.quantity}<br>
              <small>Prix unitaire: ${formatMoney(item.price)} | Total: ${formatMoney(item.totalPrice)}</small>
            </div>
          `
            )
            .join("")}
          `
              : ""
          }
          
          <p><strong>Action requise :</strong> Veuillez confirmer cette commande dans votre tableau de bord.</p>
          
          <p>Merci d'utiliser ZakaMall !</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateVendorOrderText(data: OrderNotificationData): string {
    const { order } = data;
    const vendorName =
      order.vendor?.businessName ||
      `${order.vendor?.firstName} ${order.vendor?.lastName}` ||
      "Vendeur";

    let text = `Nouvelle commande ZakaMall\\n\\n`;
    text += `Bonjour ${vendorName},\\n\\n`;
    text += `Nouvelle commande: ${order.orderNumber}\\n`;
    text += `Client: ${order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Client"}\\n`;
    text += `Total: ${formatMoney(order.totalAmount || 0)}\\n\\n`;

    if (order.items && order.items.length > 0) {
      text += `Articles:\\n`;
      order.items.forEach((item) => {
        text += `- ${item.productName} (x${item.quantity}): ${formatMoney(item.totalPrice)}\\n`;
      });
      text += `\\n`;
    }

    text += `Veuillez confirmer cette commande dans votre tableau de bord.\\n\\n`;
    text += `Merci d'utiliser ZakaMall !`;

    return text;
  }

  private generateLowStockTemplate(
    vendorName: string,
    products: Array<{ name: string; quantity: number; threshold: number }>
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">Alerte Stock Faible</h2>
          
          <p>Bonjour ${vendorName},</p>
          
          <p>Certains de vos produits ont un stock faible :</p>
          
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            ${products
              .map(
                (product) => `
              <div style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;">
                <strong>${product.name}</strong><br>
                <span style="color: #721c24;">Stock restant: ${product.quantity} unités</span>
              </div>
            `
              )
              .join("")}
          </div>
          
          <p><strong>Action recommandée :</strong> Réapprovisionner ces produits pour éviter les ruptures de stock.</p>
          
          <p>Merci d'utiliser ZakaMall !</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateLowStockText(
    vendorName: string,
    products: Array<{ name: string; quantity: number; threshold: number }>
  ): string {
    let text = `Alerte Stock Faible - ZakaMall\\n\\n`;
    text += `Bonjour ${vendorName},\\n\\n`;
    text += `Stock faible pour ${products.length} produit(s):\\n\\n`;

    products.forEach((product) => {
      text += `- ${product.name}: ${product.quantity} unités restantes\\n`;
    });

    text += `\\nVeuillez réapprovisionner ces produits.\\n\\n`;
    text += `Merci d'utiliser ZakaMall !`;

    return text;
  }
}

export const orderNotificationService = new OrderNotificationService();
